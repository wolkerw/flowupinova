"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";

export interface TikTokConnectionData {
  isConnected: boolean;
  error?: string;
  connectedAt?: any;
  accessToken?: string;
  refreshToken?: string | null;
  openId?: string;
  displayName?: string;
  avatarUrl?: string;
}

const defaultConnection: TikTokConnectionData = {
  isConnected: false,
};

function getTikTokConnectionDocRef(userId: string) {
  return doc(db, `users/${userId}/connections/tiktok`);
}

/**
 * Busca as informações de conexão do TikTok de um usuário específico.
 */
export async function getTikTokConnection(userId: string): Promise<TikTokConnectionData> {
  if (!userId) {
    console.error("getTikTokConnection chamado sem userId.");
    return { isConnected: false, error: "User ID não fornecido." };
  }
  try {
    const docRef = getTikTokConnectionDocRef(userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as TikTokConnectionData;
      return { ...data, isConnected: !!data.isConnected };
    } else {
      await setDoc(doc(db, "users", userId), { createdAt: new Date() }, { merge: true });
      await setDoc(docRef, defaultConnection);
      return defaultConnection;
    }
  } catch (error: any) {
    console.error(`Erro ao buscar conexão do TikTok do usuário ${userId}:`, error);
    return { isConnected: false, error: error.message };
  }
}

/**
 * Atualiza o status e os dados de conexão do TikTok de um usuário.
 */
export async function updateTikTokConnection(
  userId: string,
  connectionData: Partial<TikTokConnectionData>
): Promise<void> {
  if (!userId) {
    throw new Error("User ID é necessário para atualizar a conexão do TikTok.");
  }

  try {
    const docRef = getTikTokConnectionDocRef(userId);

    let dataToSet: { [key: string]: any } = connectionData;

    if (connectionData.isConnected === false) {
      dataToSet = {
        isConnected: false,
        accessToken: deleteField(),
        refreshToken: deleteField(),
        openId: deleteField(),
        displayName: deleteField(),
        avatarUrl: deleteField(),
        connectedAt: deleteField(),
        error: deleteField(),
      };
    } else if (connectionData.isConnected === true) {
      dataToSet.connectedAt = new Date();
    }

    await setDoc(docRef, dataToSet, { merge: true });
    console.log(`Conexão do TikTok atualizada para o usuário ${userId}.`);
  } catch (error: any) {
    console.error(`Erro ao atualizar a conexão do TikTok do usuário ${userId}:`, error);
    throw new Error(`Falha ao atualizar conexão do TikTok. Motivo: ${error.message}`);
  }
}

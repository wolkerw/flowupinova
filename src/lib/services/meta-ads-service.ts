"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";

export interface MetaAdsConnectionData {
  isConnected: boolean;
  error?: string;
  connectedAt?: any;
  accessToken?: string; // Token da página associada com permissões de anúncio
  pageId?: string;
  pageName?: string;
  adAccountId?: string;
  adAccountName?: string;
  userAccessToken?: string; // Token de longa duração do usuário com permissão de anúncio
  pending?: boolean;
}

const defaultConnection: MetaAdsConnectionData = {
  isConnected: false,
};

function getMetaAdsConnectionDocRef(userId: string) {
  return doc(db, `users/${userId}/connections/meta_ads`);
}

/**
 * Busca o status de conexão de anúncios da Meta de um usuário específico.
 */
export async function getMetaAdsConnection(userId: string): Promise<MetaAdsConnectionData> {
  if (!userId) {
    console.error("getMetaAdsConnection chamado sem userId.");
    return { isConnected: false, error: "User ID não fornecido." };
  }
  try {
    const docRef = getMetaAdsConnectionDocRef(userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as MetaAdsConnectionData;
      return { ...data, isConnected: !!data.isConnected };
    } else {
      console.log(`Sem documento de conexão Meta Ads para ${userId}, criando um padrão.`);
      await setDoc(doc(db, "users", userId), { createdAt: new Date() }, { merge: true });
      await setDoc(docRef, defaultConnection);
      return defaultConnection;
    }
  } catch (error: any) {
    console.error(`Erro ao obter conexão Meta Ads para ${userId}:`, error);
    return { isConnected: false, error: error.message };
  }
}

/**
 * Atualiza os dados da conexão de anúncios da Meta para um usuário.
 */
export async function updateMetaAdsConnection(
  userId: string,
  connectionData: Partial<MetaAdsConnectionData>
): Promise<void> {
  if (!userId) {
    throw new Error("User ID é obrigatório para atualizar conexão de anúncios.");
  }

  try {
    const docRef = getMetaAdsConnectionDocRef(userId);
    let dataToSet: { [key: string]: any } = connectionData;

    if (connectionData.isConnected === false && !connectionData.pending) {
      // Desconexão limpa: exclui os campos
      dataToSet = {
        isConnected: false,
        accessToken: deleteField(),
        pageId: deleteField(),
        pageName: deleteField(),
        adAccountId: deleteField(),
        adAccountName: deleteField(),
        connectedAt: deleteField(),
        error: deleteField(),
        pending: deleteField(),
        userAccessToken: deleteField(),
      };
    } else if (connectionData.isConnected === true) {
      dataToSet.connectedAt = new Date();
      dataToSet.pending = false;
    } else if (connectionData.pending === true) {
      dataToSet = {
        isConnected: false,
        pending: true,
        userAccessToken: connectionData.userAccessToken,
      };
    }

    await setDoc(docRef, dataToSet, { merge: true });
    console.log(`Conexão de anúncios Meta Ads atualizada para ${userId}.`);
  } catch (error: any) {
    console.error(`Erro ao salvar conexão Meta Ads para ${userId}:`, error);
    throw new Error(`Falha ao salvar conexão. Razão: ${error.message}`);
  }
}

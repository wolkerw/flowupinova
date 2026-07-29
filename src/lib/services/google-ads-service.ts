"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";

export interface GoogleAdsConnectionData {
  isConnected: boolean;
  error?: string;
  connectedAt?: any;
  accessToken?: string;
  refreshToken?: string | null;
  expiryDate?: number | null;
  adAccountId?: string; // ID da conta selecionada (Customer ID)
  adAccountName?: string; // Nome descritivo da conta
  managerCustomerId?: string;
}

const defaultConnection: GoogleAdsConnectionData = {
  isConnected: false,
};

function getGoogleAdsConnectionDocRef(userId: string) {
  return doc(db, `users/${userId}/connections/google_ads`);
}

/**
 * Busca o status de conexão de anúncios do Google Ads de um usuário específico.
 */
export async function getGoogleAdsConnection(userId: string): Promise<GoogleAdsConnectionData> {
  if (!userId) {
    console.error("[GOOGLE_ADS_SERVICE] getGoogleAdsConnection chamado sem userId.");
    return { isConnected: false, error: "User ID não fornecido." };
  }
  try {
    const docRef = getGoogleAdsConnectionDocRef(userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as GoogleAdsConnectionData;
      return { ...data, isConnected: !!data.isConnected };
    } else {
      console.log(
        `[GOOGLE_ADS_SERVICE] Sem documento de conexão Google Ads para ${userId}, criando um padrão.`
      );
      await setDoc(doc(db, "users", userId), { createdAt: new Date() }, { merge: true });
      await setDoc(docRef, defaultConnection);
      return defaultConnection;
    }
  } catch (error: any) {
    console.error(`[GOOGLE_ADS_SERVICE] Erro ao obter conexão Google Ads para ${userId}:`, error);
    return { isConnected: false, error: error.message };
  }
}

/**
 * Atualiza os dados da conexão de anúncios do Google Ads para um usuário.
 */
export async function updateGoogleAdsConnection(
  userId: string,
  connectionData: Partial<GoogleAdsConnectionData>
): Promise<void> {
  if (!userId) {
    throw new Error("User ID é obrigatório para atualizar conexão de anúncios.");
  }

  try {
    const docRef = getGoogleAdsConnectionDocRef(userId);
    let dataToSet: { [key: string]: any } = connectionData;

    if (connectionData.isConnected === false) {
      // Desconexão limpa: exclui os campos
      dataToSet = {
        isConnected: false,
        accessToken: deleteField(),
        refreshToken: deleteField(),
        expiryDate: deleteField(),
        adAccountId: deleteField(),
        adAccountName: deleteField(),
        connectedAt: deleteField(),
        error: deleteField(),
      };
    } else if (connectionData.isConnected === true) {
      dataToSet.connectedAt = new Date();
    }

    await setDoc(docRef, dataToSet, { merge: true });
    console.log(`[GOOGLE_ADS_SERVICE] Conexão de anúncios Google Ads atualizada para ${userId}.`);
  } catch (error: any) {
    console.error(`[GOOGLE_ADS_SERVICE] Erro ao salvar conexão Google Ads para ${userId}:`, error);
    throw new Error(`Falha ao salvar conexão. Razão: ${error.message}`);
  }
}

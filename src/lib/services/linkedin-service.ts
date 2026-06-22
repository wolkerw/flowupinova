"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";

export interface LinkedInConnectionData {
  isConnected: boolean;
  error?: string;
  connectedAt?: any;
  accessToken?: string;
  refreshToken?: string | null;
  expiryDate?: number | null;
  personUrn?: string;
  personName?: string;
  profilePictureUrl?: string;
  publishTarget?: "person" | "organization";
  selectedOrganizationUrn?: string;
  selectedOrganizationName?: string;
}

const defaultConnection: LinkedInConnectionData = {
  isConnected: false,
};

function getLinkedInConnectionDocRef(userId: string) {
  return doc(db, `users/${userId}/connections/linkedin`);
}

/**
 * Busca as informações de conexão do LinkedIn de um usuário específico.
 */
export async function getLinkedInConnection(userId: string): Promise<LinkedInConnectionData> {
  if (!userId) {
    console.error("getLinkedInConnection chamado sem userId.");
    return { isConnected: false, error: "User ID não fornecido." };
  }
  try {
    const docRef = getLinkedInConnectionDocRef(userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as LinkedInConnectionData;
      return { ...data, isConnected: !!data.isConnected };
    } else {
      await setDoc(doc(db, "users", userId), { createdAt: new Date() }, { merge: true });
      await setDoc(docRef, defaultConnection);
      return defaultConnection;
    }
  } catch (error: any) {
    console.error(`Erro ao buscar conexão do LinkedIn do usuário ${userId}:`, error);
    return { isConnected: false, error: error.message };
  }
}

/**
 * Atualiza o status e os dados de conexão do LinkedIn de um usuário.
 */
export async function updateLinkedInConnection(
  userId: string,
  connectionData: Partial<LinkedInConnectionData>
): Promise<void> {
  if (!userId) {
    throw new Error("User ID é necessário para atualizar a conexão do LinkedIn.");
  }

  try {
    const docRef = getLinkedInConnectionDocRef(userId);

    let dataToSet: { [key: string]: any } = connectionData;

    if (connectionData.isConnected === false) {
      dataToSet = {
        isConnected: false,
        accessToken: deleteField(),
        refreshToken: deleteField(),
        expiryDate: deleteField(),
        personUrn: deleteField(),
        personName: deleteField(),
        profilePictureUrl: deleteField(),
        publishTarget: deleteField(),
        selectedOrganizationUrn: deleteField(),
        selectedOrganizationName: deleteField(),
        connectedAt: deleteField(),
        error: deleteField(),
      };
    } else if (connectionData.isConnected === true) {
      dataToSet.connectedAt = new Date();
    }

    await setDoc(docRef, dataToSet, { merge: true });
    console.log(`Conexão do LinkedIn atualizada para o usuário ${userId}.`);
  } catch (error: any) {
    console.error(`Erro ao atualizar a conexão do LinkedIn do usuário ${userId}:`, error);
    throw new Error(`Falha ao atualizar conexão do LinkedIn. Motivo: ${error.message}`);
  }
}

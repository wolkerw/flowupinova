import { db } from "@/lib/firebase";
import { doc, collection, setDoc, updateDoc } from "firebase/firestore";

export interface CnpjChangeRequest {
  id: string;
  userId: string;
  userEmail: string;
  status: "pending" | "approved" | "rejected";
  currentCnpj: string;
  currentBusinessName: string;
  requestedCnpj: string;
  requestedBusinessName: string;
  reason: string;
  adminNotes?: string;
  createdAt: any;
  updatedAt: any;
}

/**
 * Cria uma solicitação de alteração de CNPJ no Firestore.
 */
export async function createCnpjRequest(
  userId: string,
  userEmail: string,
  currentCnpj: string,
  currentName: string,
  requestedCnpj: string,
  requestedName: string,
  reason: string
): Promise<string> {
  if (!userId) {
    throw new Error("O ID do usuário é obrigatório.");
  }

  try {
    // 1. Criar um ID único para o request
    const requestRef = doc(collection(db, "cnpjChangeRequests"));
    const requestId = requestRef.id;

    const newRequest: Omit<CnpjChangeRequest, "createdAt" | "updatedAt"> & {
      createdAt: Date;
      updatedAt: Date;
    } = {
      id: requestId,
      userId,
      userEmail,
      status: "pending",
      currentCnpj,
      currentBusinessName: currentName,
      requestedCnpj,
      requestedBusinessName: requestedName,
      reason,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 2. Salvar na coleção cnpjChangeRequests
    await setDoc(requestRef, newRequest);

    // 3. Atualizar o documento de onboarding do usuário para sinalizar solicitação pendente
    const onboardingDocRef = doc(db, `users/${userId}/business/onboarding`);
    await updateDoc(onboardingDocRef, {
      hasPendingCnpjRequest: true,
    });

    console.log(`[CNPJ_REQUEST] Solicitação ${requestId} criada para o usuário ${userId}.`);
    return requestId;
  } catch (error: any) {
    console.error("[CNPJ_REQUEST_ERROR] Erro ao criar solicitação de CNPJ:", error);
    throw new Error(`Falha ao registrar a solicitação de alteração: ${error.message}`);
  }
}

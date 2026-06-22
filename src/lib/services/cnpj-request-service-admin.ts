"use server";

import { adminDb } from "@/lib/firebase-admin";

export interface AdminCnpjChangeRequest {
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
  createdAt: string;
  updatedAt: string;
}

/**
 * Obtém todas as solicitações de alteração de CNPJ com status "pending".
 * Retorna objetos planos serializáveis (datas convertidas para string ISO).
 */
export async function listPendingCnpjRequests(): Promise<AdminCnpjChangeRequest[]> {
  try {
    const querySnap = await adminDb
      .collection("cnpjChangeRequests")
      .where("status", "==", "pending")
      .get();

    const requests: AdminCnpjChangeRequest[] = [];
    querySnap.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: data.id,
        userId: data.userId,
        userEmail: data.userEmail,
        status: data.status,
        currentCnpj: data.currentCnpj,
        currentBusinessName: data.currentBusinessName,
        requestedCnpj: data.requestedCnpj,
        requestedBusinessName: data.requestedBusinessName,
        reason: data.reason,
        adminNotes: data.adminNotes || "",
        createdAt: data.createdAt
          ? data.createdAt.toDate().toISOString()
          : new Date().toISOString(),
        updatedAt: data.updatedAt
          ? data.updatedAt.toDate().toISOString()
          : new Date().toISOString(),
      });
    });

    // Ordenar em memória de forma decrescente por data de criação (mais recente primeiro)
    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return requests;
  } catch (error: any) {
    console.error("[CNPJ_REQUEST_ADMIN] Erro ao listar solicitações pendentes:", error);
    throw new Error(`Falha ao buscar solicitações: ${error.message}`);
  }
}

/**
 * Processa a decisão do administrador sobre uma solicitação de CNPJ.
 */
export async function processCnpjRequest(
  requestId: string,
  approve: boolean,
  adminNotes?: string
): Promise<void> {
  if (!requestId) {
    throw new Error("O ID da solicitação é obrigatório.");
  }

  try {
    const requestDocRef = adminDb.collection("cnpjChangeRequests").doc(requestId);
    const requestDocSnap = await requestDocRef.get();

    if (!requestDocSnap.exists) {
      throw new Error("Solicitação de alteração não encontrada.");
    }

    const requestData = requestDocSnap.data()!;
    const { userId, requestedCnpj, requestedBusinessName } = requestData;

    const onboardingDocRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("business")
      .doc("onboarding");

    if (approve) {
      // 1. Caso aprovado, aplicar o novo CNPJ e Nome no perfil de onboarding do usuário,
      //    e destravar o CNPJ (garantindo que fique ativado o bloqueio de edição direta)
      await onboardingDocRef.set(
        {
          cnpj: requestedCnpj,
          name: requestedBusinessName,
          hasPendingCnpjRequest: false,
          cnpjLocked: true,
        },
        { merge: true }
      );

      // 2. Atualizar status da solicitação
      await requestDocRef.update({
        status: "approved",
        adminNotes: adminNotes || "Aprovado pelo administrador.",
        updatedAt: new Date(),
      });

      console.log(
        `[CNPJ_REQUEST_ADMIN] Solicitação ${requestId} APROVADA. Perfil do usuário ${userId} atualizado.`
      );
    } else {
      // 1. Caso rejeitado, apenas remover a flag de pendência do onboarding do usuário
      await onboardingDocRef.set(
        {
          hasPendingCnpjRequest: false,
        },
        { merge: true }
      );

      // 2. Atualizar status da solicitação com as notas do administrador
      await requestDocRef.update({
        status: "rejected",
        adminNotes: adminNotes || "Rejeitado pelo administrador.",
        updatedAt: new Date(),
      });

      console.log(
        `[CNPJ_REQUEST_ADMIN] Solicitação ${requestId} REJEITADA para o usuário ${userId}.`
      );
    }
  } catch (error: any) {
    console.error("[CNPJ_REQUEST_ADMIN] Erro ao processar solicitação de CNPJ:", error);
    throw new Error(`Falha ao salvar decisão administrativa: ${error.message}`);
  }
}

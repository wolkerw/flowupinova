import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export interface ApiUsageLogInput {
  userId: string;
  type:
    | "image_generation"
    | "avatar_generation"
    | "chat"
    | "vision_analysis"
    | "background_removal";
  provider: "falai" | "google_vertex" | "google_gemini";
  model: string;
  costUsd: number;
  tokens?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Registra um log de uso real de API de IA no Firestore para fins de faturamento e auditoria.
 * @param input Dados do log de consumo de API.
 */
export async function logApiUsage(input: ApiUsageLogInput): Promise<void> {
  try {
    const logRef = adminDb.collection("apiUsageLogs").doc();
    await logRef.set({
      id: logRef.id,
      userId: input.userId,
      type: input.type,
      provider: input.provider,
      model: input.model,
      costUsd: input.costUsd,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(input.tokens ? { tokens: input.tokens } : {}),
    });
    console.log(
      `[API_USAGE_LOG] Registrado com sucesso: ${input.type} (${input.model}) para o usuário ${input.userId}. Custo: $${input.costUsd.toFixed(6)}`
    );
  } catch (error) {
    console.error("[API_USAGE_LOG_ERROR] Falha ao registrar log de consumo:", error);
  }
}

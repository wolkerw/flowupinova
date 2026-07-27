"use server";

import { adminDb } from "@/lib/firebase-admin";

export interface GoogleAIStudioModelUsage {
  model: string;
  provider: string;
  type: string;
  requestsCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  costBrl: number;
}

export interface GoogleAIStudioRealStats {
  connected: boolean;
  statusMessage: string;
  availableModelsCount: number;
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalImagesGenerated: number;
  totalCostUsd: number;
  totalCostBrl: number;
  usdToBrlRate: number;
  selectedPeriodDays: number | null;
  modelsUsage: GoogleAIStudioModelUsage[];
}

const USD_TO_BRL_RATE = 5.65;

/**
 * Verifica o status de conexão com o Google AI Studio e calcula o consumo e custo real acumulado por período.
 * @param days Quantidade de dias para filtrar (padrão: 30 dias. Se 0 ou null, calcula para todo o período).
 */
export async function getGoogleAIStudioRealStats(
  days: number | null = 30
): Promise<GoogleAIStudioRealStats> {
  const apiKey = process.env.GEMINI_API_KEY;
  let connected = false;
  let statusMessage = "Chave GEMINI_API_KEY ausente no servidor.";
  let availableModelsCount = 0;

  if (apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { cache: "no-store" }
      );
      if (response.ok) {
        const data = await response.json();
        availableModelsCount = data.models ? data.models.length : 0;
        connected = true;
        statusMessage = `Conectado com sucesso (${availableModelsCount} modelos ativos no Google AI Studio).`;
      } else {
        const errorData = await response.json().catch(() => ({}));
        statusMessage = `Erro na API do Google AI Studio (${response.status}): ${
          errorData.error?.message || response.statusText
        }`;
      }
    } catch (err: any) {
      statusMessage = `Falha ao conectar com o Google AI Studio: ${err.message || String(err)}`;
    }
  }

  // Data limite baseada no parâmetro de dias
  let sinceDate: Date | null = null;
  if (days !== null && days !== undefined && days > 0) {
    sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    sinceDate.setHours(0, 0, 0, 0);
  }

  // Agregação de consumo a partir da coleção apiUsageLogs no Firestore
  let totalRequests = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalImagesGenerated = 0;
  let totalCostUsd = 0;

  const modelMap: Record<string, GoogleAIStudioModelUsage> = {};

  try {
    const usageSnap = await adminDb.collection("apiUsageLogs").get();

    usageSnap.docs.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() as Date | undefined;

      if (sinceDate && createdAt && createdAt < sinceDate) {
        return;
      }

      const provider = data.provider || "google_gemini";
      const model = data.model || "gemini-1.5-flash";
      const type = data.type || "chat";
      const costUsd = Number(data.costUsd || 0);

      const isGoogleAI =
        provider === "google_gemini" ||
        provider === "google_vertex" ||
        model.includes("gemini") ||
        model.includes("imagen");

      if (isGoogleAI) {
        totalRequests++;
        totalCostUsd += costUsd;

        const pTokens = Number(data.tokens?.promptTokens || 0);
        const cTokens = Number(data.tokens?.completionTokens || 0);
        const tTokens = Number(data.tokens?.totalTokens || pTokens + cTokens);

        totalPromptTokens += pTokens;
        totalCompletionTokens += cTokens;
        totalTokens += tTokens;

        if (type === "image_generation" || type === "avatar_generation") {
          totalImagesGenerated++;
        }

        const key = `${model}::${type}`;
        if (!modelMap[key]) {
          modelMap[key] = {
            model,
            provider,
            type,
            requestsCount: 0,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            costUsd: 0,
            costBrl: 0,
          };
        }

        modelMap[key].requestsCount += 1;
        modelMap[key].promptTokens += pTokens;
        modelMap[key].completionTokens += cTokens;
        modelMap[key].totalTokens += tTokens;
        modelMap[key].costUsd += costUsd;
        modelMap[key].costBrl = modelMap[key].costUsd * USD_TO_BRL_RATE;
      }
    });
  } catch (err) {
    console.error("[GOOGLE_AI_STUDIO_SERVICE] Erro ao agrupar logs do Firestore:", err);
  }

  const modelsUsage = Object.values(modelMap).sort((a, b) => b.costUsd - a.costUsd);
  const totalCostBrl = totalCostUsd * USD_TO_BRL_RATE;

  return {
    connected,
    statusMessage,
    availableModelsCount,
    totalRequests,
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
    totalImagesGenerated,
    totalCostUsd,
    totalCostBrl,
    usdToBrlRate: USD_TO_BRL_RATE,
    selectedPeriodDays: days,
    modelsUsage,
  };
}

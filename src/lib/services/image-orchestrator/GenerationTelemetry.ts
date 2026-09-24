import { adminDb } from "@/lib/firebase-admin";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";
import type { GenerationTelemetryRecord } from "./types";

export class GenerationTelemetry {
  public static async record(record: GenerationTelemetryRecord): Promise<void> {
    try {
      // 1. Registrar na coleção de auditoria
      const auditRef = adminDb.collection("aiImageTelemetry").doc(`${record.generationId}_${record.assetId}`);
      await auditRef.set({
        ...record,
        recordedAt: new Date().toISOString(),
      });

      // 2. Bilhetagem e contabilidade de uso de API
      logApiUsage({
        userId: record.userId,
        type: "image_generation",
        provider: record.imageModelUsed.includes("gemini") ? "google_gemini" : "openai",
        model: record.imageModelUsed,
        costUsd: record.imageModelUsed.includes("gpt-image-2") ? 0.04 : 0.03,
      });

      if (record.plannerModelUsed.includes("gpt")) {
        logApiUsage({
          userId: record.userId,
          type: "chat",
          provider: "openai",
          model: record.plannerModelUsed,
          costUsd: 0.01,
        });
      }
    } catch (err) {
      console.warn("[GenerationTelemetry] Aviso ao registrar telemetria:", err);
    }
  }
}

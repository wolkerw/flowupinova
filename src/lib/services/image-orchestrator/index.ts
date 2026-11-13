export * from "./types";
export * from "./BriefNormalizer";
export * from "./BrandContextBuilder";
export * from "./ReferenceContextBuilder";
export * from "./Gpt5PromptPlanner";
export * from "./ImageModelExecutor";
export * from "./ImageResultValidator";
export * from "./BrandLogoApplier";
export * from "./GenerationTelemetry";
export * from "./v2/PromptPlannerV2";
export * from "./v2/art-direction-library";

import { BriefNormalizer } from "./BriefNormalizer";
import { BrandContextBuilder } from "./BrandContextBuilder";
import { ReferenceContextBuilder } from "./ReferenceContextBuilder";
import { Gpt5PromptPlanner } from "./Gpt5PromptPlanner";
import { PromptPlannerV2 } from "./v2/PromptPlannerV2";
import { ImageModelExecutor } from "./ImageModelExecutor";
import { ImageResultValidator } from "./ImageResultValidator";
import { BrandLogoApplier } from "./BrandLogoApplier";
import { GenerationTelemetry } from "./GenerationTelemetry";
import type {
  AIImageFormat,
  AIImageObjective,
  AIImageStyle,
  AIImageTextOverlayMode,
  BrandSnapshot,
} from "@/lib/types/ai-image-general";
import type { OrchestratorPlanResult, ReferenceInput } from "./types";
import { getAIModelsConfig } from "@/lib/services/system-ai-config-service";

export interface OrchestratorRunParams {
  userId: string;
  generationId: string;
  assetId: string;
  rawBrief: string;
  compiledPrompt?: string;
  objective?: AIImageObjective;
  format?: AIImageFormat;
  style?: AIImageStyle;
  useBrandKit?: boolean;
  brandSnapshot?: BrandSnapshot | null;
  textOverlayMode?: AIImageTextOverlayMode;
  productHeadline?: string;
  negativeInstructions?: string;
  logoUrl?: string;
  includeLogo?: boolean;
  sourceAssetUrls?: string[];
  referenceAssetUrls?: string[];
  referenceMode?: "style_only" | "campaign_identity";
  logoPosition?: "top-left" | "top-right" | "top-center" | "bottom-right" | "bottom-left";
  lastLogoPosition?: "top-left" | "top-right" | "top-center" | "bottom-right" | "bottom-left";
  personaId?: string;
  lastPersonaId?: string;
  quality?: string;
  /** Força o motor de prompt (testes A/B). Sem valor, usa settings/aiModels.promptEngineVersion (padrão v1). */
  promptEngine?: "v1" | "v2";
}

export interface OrchestratorRunResult {
  imageBuffer: Buffer;
  width: number;
  height: number;
  plannerModelUsed: string;
  imageModelUsed: string;
  planResult: OrchestratorPlanResult;
  plannerDurationMs: number;
  imageDurationMs: number;
}

export class ImageGenerationOrchestrator {
  public static async execute(params: OrchestratorRunParams): Promise<OrchestratorRunResult> {
    const totalStart = Date.now();
    const format: AIImageFormat = params.format || "portrait";
    const objective: AIImageObjective = params.objective || "commercial";

    // 1. Normalizar Briefing
    const normalized = BriefNormalizer.normalize({
      rawBrief: params.rawBrief,
      objective,
      style: params.style,
      textOverlayMode: params.textOverlayMode,
      productHeadline: params.productHeadline,
      negativeInstructions: params.negativeInstructions,
    });

    // 2. Construir Contexto de Marca (BrandKit)
    const brandContext = await BrandContextBuilder.build(
      params.userId,
      params.useBrandKit ?? true,
      params.brandSnapshot
    );

    // 3. Mapear e carregar referências e logos
    // Se o usuário optou por não incluir logo ou includeLogo for falso, respeitar sem forçar
    const effectiveLogoUrl =
      params.includeLogo === false
        ? undefined
        : params.logoUrl || (params.useBrandKit !== false ? brandContext.logoUrl : undefined);

    const references: ReferenceInput[] = await ReferenceContextBuilder.buildReferences({
      sourceAssetUrls: params.sourceAssetUrls,
      referenceAssetUrls: params.referenceAssetUrls,
      logoUrl: effectiveLogoUrl,
      businessName: brandContext.businessName,
      brief: normalized.cleanedBrief,
    });

    // 4. Carregar Configuração Dinâmica dos Modelos de IA
    const aiConfig = await getAIModelsConfig();

    // 5. Etapa Intermediária: Planejamento Visual com GPT-5 (ou modelo configurado)
    const promptEngine: "v1" | "v2" = params.promptEngine || aiConfig.promptEngineVersion || "v1";
    const planner = promptEngine === "v2" ? PromptPlannerV2 : Gpt5PromptPlanner;
    const planResult = await planner.plan({
      userBrief: normalized.cleanedBrief,
      compiledPrompt: params.compiledPrompt,
      objective: normalized.detectedObjective,
      format,
      width: format === "portrait" ? 1080 : format === "story" ? 1080 : 1080,
      height: format === "portrait" ? 1350 : format === "story" ? 1920 : 1080,
      quantity: 1,
      stylePreference: normalized.detectedStyle,
      useBrandKit: brandContext.enabled,
      brandKit: brandContext,
      logoPosition: params.logoPosition,
      lastLogoPosition: params.lastLogoPosition || brandContext.lastLogoPosition,
      personaId: params.personaId,
      lastPersonaId: params.lastPersonaId || brandContext.lastPersonaId,
      referenceImages: references,
      textOverlayMode: normalized.requestedTextOverlayMode,
      productHeadline: normalized.explicitHeadline,
      negativeInstructions: normalized.negativeDirectives,
      preferredModel: aiConfig.generalPlannerModel,
      referenceMode: params.referenceMode,
    });

    // Memória de direção de arte do cliente (motor v2): evita repetir as últimas direções
    const artDirectionId = (planResult as any).artDirectionId as string | undefined;
    if (promptEngine === "v2" && artDirectionId && params.userId) {
      try {
        const { adminDb } = await import("@/lib/firebase-admin");
        const recent = [artDirectionId, ...(brandContext.lastArtDirectionIds || []).filter((id) => id !== artDirectionId)].slice(0, 5);
        await adminDb.doc(`users/${params.userId}`).set({ lastArtDirectionIds: recent }, { merge: true });
      } catch (err) {
        console.warn("[ImageGenerationOrchestrator] Aviso ao persistir lastArtDirectionIds:", err);
      }
    }

    // 6. Etapa de Renderização: Geração de Imagem com GPT Image 2 (ou modelo configurado)
    const execution = await ImageModelExecutor.execute({
      prompt: planResult.compiledImagePrompt,
      format,
      references,
      preferredModel: aiConfig.generalImageModel,
      fallbackModel: aiConfig.generalFallbackImageModel,
      quality: params.quality || aiConfig.imageQuality,
      referenceMode: params.referenceMode,
      promptEngine,
    });

    // 6. Validação e Padronização de Dimensões (sem cortes destrutivos)
    const validated = await ImageResultValidator.validateAndNormalize(
      execution.imageBuffer,
      format
    );

    // 6.1 Aplicação digital cirúrgica da logomarca oficial do BrandKit via Jimp (canal alfa preservado)
    let finalBuffer = validated.buffer;
    if (effectiveLogoUrl) {
      const chosenLogoPos = planResult.visualPlan?.brandApplication?.logoPosition || params.logoPosition || "auto";
      finalBuffer = await BrandLogoApplier.applyLogo(finalBuffer, effectiveLogoUrl, {
        position: chosenLogoPos,
        avoidCollisions: true,
      });

      // Persistência da Memória de Posição da Logomarca no Firestore do Usuário
      if (chosenLogoPos !== "auto" && params.userId) {
        try {
          const { adminDb } = await import("@/lib/firebase-admin");
          await adminDb.doc(`users/${params.userId}`).set(
            {
              lastLogoPosition: chosenLogoPos,
              lastLogoAppliedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (savePosErr) {
          console.warn("[ImageGenerationOrchestrator] Aviso ao persistir lastLogoPosition:", savePosErr);
        }
      }
    }

    // Persistência da Memória de Persona no Firestore do Usuário
    const appliedPersonaId = (planResult.visualPlan as any)?.personaId;
    if (appliedPersonaId && params.userId) {
      try {
        const { adminDb } = await import("@/lib/firebase-admin");
        await adminDb.doc(`users/${params.userId}`).set(
          {
            lastPersonaId: appliedPersonaId,
            lastPersonaAppliedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (savePersonaErr) {
        console.warn("[ImageGenerationOrchestrator] Aviso ao persistir lastPersonaId:", savePersonaErr);
      }
    }

    // 7. Registro de Telemetria e Auditoria
    await GenerationTelemetry.record({
      generationId: params.generationId,
      assetId: params.assetId,
      userId: params.userId,
      plannerModelUsed: planResult.plannerModelUsed,
      imageModelUsed: execution.modelUsed,
      plannerDurationMs: planResult.plannerDurationMs,
      imageDurationMs: execution.durationMs,
      totalDurationMs: Date.now() - totalStart,
      format,
      dimensions: { width: validated.width, height: validated.height },
      success: true,
      timestamp: new Date().toISOString(),
    });

    return {
      imageBuffer: finalBuffer,
      width: validated.width,
      height: validated.height,
      plannerModelUsed: planResult.plannerModelUsed,
      imageModelUsed: execution.modelUsed,
      planResult,
      plannerDurationMs: planResult.plannerDurationMs,
      imageDurationMs: execution.durationMs,
    };
  }
}

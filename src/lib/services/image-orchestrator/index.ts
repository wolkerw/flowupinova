export * from "./types";
export * from "./BriefNormalizer";
export * from "./BrandContextBuilder";
export * from "./ReferenceContextBuilder";
export * from "./Gpt5PromptPlanner";
export * from "./ImageModelExecutor";
export * from "./ImageResultValidator";
export * from "./GenerationTelemetry";

import { BriefNormalizer } from "./BriefNormalizer";
import { BrandContextBuilder } from "./BrandContextBuilder";
import { ReferenceContextBuilder } from "./ReferenceContextBuilder";
import { Gpt5PromptPlanner } from "./Gpt5PromptPlanner";
import { ImageModelExecutor } from "./ImageModelExecutor";
import { ImageResultValidator } from "./ImageResultValidator";
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
  sourceAssetUrls?: string[];
  referenceAssetUrls?: string[];
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
    const references: ReferenceInput[] = await ReferenceContextBuilder.buildReferences({
      sourceAssetUrls: params.sourceAssetUrls,
      referenceAssetUrls: params.referenceAssetUrls,
      logoUrl: brandContext.logoUrl,
      businessName: brandContext.businessName,
      brief: normalized.cleanedBrief,
    });

    // 4. Carregar Configuração Dinâmica dos Modelos de IA
    const aiConfig = await getAIModelsConfig();

    // 5. Etapa Intermediária: Planejamento Visual com GPT-5 (ou modelo configurado)
    const planResult = await Gpt5PromptPlanner.plan({
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
      referenceImages: references,
      textOverlayMode: normalized.requestedTextOverlayMode,
      productHeadline: normalized.explicitHeadline,
      negativeInstructions: normalized.negativeDirectives,
      preferredModel: aiConfig.generalPlannerModel,
    });

    // 6. Etapa de Renderização: Geração de Imagem com GPT Image 2 (ou modelo configurado)
    const execution = await ImageModelExecutor.execute({
      prompt: planResult.compiledImagePrompt,
      format,
      references,
      preferredModel: aiConfig.generalImageModel,
      fallbackModel: aiConfig.generalFallbackImageModel,
      quality: aiConfig.imageQuality,
    });

    // 6. Validação e Padronização de Dimensões (sem cortes destrutivos)
    const validated = await ImageResultValidator.validateAndNormalize(
      execution.imageBuffer,
      format
    );

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
      imageBuffer: validated.buffer,
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

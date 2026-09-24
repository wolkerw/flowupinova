import type {
  AIImageFormat,
  AIImageObjective,
  AIImageStyle,
  AIImageTextOverlayMode,
  BrandSnapshot,
} from "@/lib/types/ai-image-general";

export interface ReferenceInput {
  url?: string;
  mimeType: string;
  base64: string;
  role: "official_logo" | "product_subject" | "style_reference";
  description?: string;
}

export interface NormalizedBrief {
  originalBrief: string;
  cleanedBrief: string;
  detectedObjective: AIImageObjective;
  detectedSubject: string;
  detectedStyle: AIImageStyle;
  explicitHeadline?: string;
  negativeDirectives?: string;
  requestedTextOverlayMode: AIImageTextOverlayMode;
}

export interface BrandContext {
  enabled: boolean;
  businessName: string;
  segment?: string;
  description?: string;
  audience?: string;
  primaryColors: string[];
  secondaryColors: string[];
  accentColors: string[];
  visualStyle?: string;
  toneOfVoice?: string;
  restrictions?: string[];
  logoUrl?: string;
  hasLocalOfficialLogo: boolean;
}

export interface Gpt5PlannerInput {
  userBrief: string;
  compiledPrompt?: string;
  objective: AIImageObjective;
  format: AIImageFormat;
  width: number;
  height: number;
  quantity: number;
  stylePreference: string;
  useBrandKit: boolean;
  brandKit?: BrandContext;
  referenceImages?: ReferenceInput[];
  userConstraints?: string[];
  textOverlayMode?: AIImageTextOverlayMode;
  productHeadline?: string;
  negativeInstructions?: string;
  preferredModel?: string;
}

export interface Gpt5VisualPlanResponse {
  schemaVersion: "1.0";
  requestType: "generate" | "edit";
  confidence: number;
  needsClarification: boolean;
  clarifyingQuestions?: string[];
  interpretation: {
    goal: string;
    subject: string;
    intendedUse: string;
    audience?: string;
  };
  visualPlan: {
    scene: string;
    composition: string;
    framing: string;
    lighting: string;
    materialsAndTextures: string[];
    colorDirection: string[];
    style: string;
    mood: string;
  };
  brandApplication: {
    enabled: boolean;
    useColors: boolean;
    useLogo: boolean;
    brandElementsToPreserve: string[];
  };
  referenceInstructions?: Array<{
    imageIndex: number;
    purpose: string;
    instruction: string;
  }>;
  textLayers: Array<{
    text: string;
    type: "headline" | "badge" | "subtitle" | "cta";
    position?: string;
  }>;
  imagePrompt: string;
  negativePrompt: string;
  preserve: string[];
  generationParameters: {
    model: "gpt-image-2";
    quality: "low" | "medium" | "high";
    size: string;
    background: "opaque" | "transparent";
    outputFormat: "png";
  };
  accessibility: {
    altText: string;
    suggestedTitle: string;
  };
}

export interface OrchestratorPlanResult {
  plannerModelUsed: string;
  plannerDurationMs: number;
  visualPlan: Gpt5VisualPlanResponse;
  compiledImagePrompt: string;
  compiledNegativePrompt: string;
}

export interface GenerationTelemetryRecord {
  generationId: string;
  assetId: string;
  userId: string;
  plannerModelUsed: string;
  imageModelUsed: string;
  plannerDurationMs: number;
  imageDurationMs: number;
  totalDurationMs: number;
  format: AIImageFormat;
  dimensions: { width: number; height: number };
  success: boolean;
  error?: string;
  timestamp: string;
}

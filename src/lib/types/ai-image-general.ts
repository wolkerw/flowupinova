export type AIImageObjective =
  | "commercial"
  | "social"
  | "ad"
  | "presentation"
  | "concept"
  | "personal";

export type AIImageFormat =
  | "square" // 1:1 (1080x1080)
  | "portrait" // 4:5 (1080x1350)
  | "landscape" // 16:9 (1920x1080)
  | "story" // 9:16 (1080x1920)
  | "banner"; // 1200x630

export type AIImageStyle =
  | "automatic"
  | "photographic"
  | "editorial"
  | "illustration"
  | "3d"
  | "minimalist"
  | "cinematic";

export type AIImageGenerationStatus =
  | "draft"
  | "brief_validating"
  | "visual_direction_ready"
  | "generating"
  | "partial_ready"
  | "ready"
  | "failed"
  | "cancelled";

export type AIImageAssetStatus =
  | "queued"
  | "processing"
  | "ready"
  | "failed"
  | "cancelled";

export interface VisualDirectionTextLayer {
  text: string;
  type?: "headline" | "badge" | "subtitle" | "cta";
  position?: string;
}

export interface VisualDirectionResponse {
  interpretation: string;
  subject: string;
  composition: string;
  lighting: string;
  style: string;
  brandApplication: string;
  textLayers: VisualDirectionTextLayer[];
  avoid: string[];
}

export type AIImageTextOverlayMode = "NONE" | "TITLE_ONLY" | "INFOGRAPHIC" | "BOTH";

export interface AIImageGenerationRequest {
  type: "general_image";
  brief: string;
  objective: AIImageObjective;
  format: AIImageFormat;
  width: number;
  height: number;
  quantity: number;
  style: AIImageStyle;
  useBrandKit: boolean;
  brandKitId?: string;
  referenceAssetIds?: string[];
  referenceAssetUrls?: string[];
  sourceAssetIds?: string[];
  sourceAssetUrls?: string[];
  textMode: "none" | "editable_layers" | "rasterized";
  textOverlayMode?: AIImageTextOverlayMode;
  productHeadline?: string;
  negativeInstructions?: string;
  selectedVisualDirectionIndex?: number;
  visualDirection?: VisualDirectionResponse;
}

export interface BrandSnapshot {
  name: string;
  segment?: string;
  primaryColor?: string;
  secondaryColor?: string;
  visualGuidelines?: string;
  logoUrl?: string;
  fontFamily?: string;
  targetAudience?: string;
  toneOfVoice?: string;
  slogan?: string;
  personas?: any[];
}

export interface AIImageGenerationDoc {
  id: string;
  userId: string;
  status: AIImageGenerationStatus;
  brief: string;
  normalizedPrompt?: string;
  visualDirection?: VisualDirectionResponse;
  visualDirections?: VisualDirectionResponse[];
  objective: AIImageObjective;
  format: AIImageFormat;
  width: number;
  height: number;
  quantity: number;
  style: AIImageStyle;
  useBrandKit: boolean;
  brandKitId?: string;
  brandSnapshot?: BrandSnapshot | null;
  referenceAssetIds?: string[];
  referenceAssetUrls?: string[];
  sourceAssetIds?: string[];
  sourceAssetUrls?: string[];
  textOverlayMode?: AIImageTextOverlayMode;
  productHeadline?: string;
  modelUsed?: string;
  plannerModelUsed?: string;
  visualPlan?: any;
  safetyStatus?: "approved" | "flagged" | "rejected";
  errorCode?: string | null;
  createdAt: any;
  updatedAt: any;
}

export interface AIImageAssetDoc {
  id: string;
  generationId: string;
  userId: string;
  order: number;
  status: AIImageAssetStatus;
  originalUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  modelUsed?: string;
  plannerModelUsed?: string;
  editorState?: any;
  promptMetadata?: {
    fullPrompt?: string;
    modelUsed?: string;
    plannerModelUsed?: string;
    visualPlan?: any;
    seed?: number;
    visualDirection?: VisualDirectionResponse;
  };
  altText?: string;
  galleryAssetId?: string;
  derivedFromAssetId?: string | null;
  error?: string | null;
  createdAt: any;
  updatedAt: any;
}

export const FORMAT_DIMENSIONS: Record<
  AIImageFormat,
  { label: string; width: number; height: number; aspectRatio: string }
> = {
  square: { label: "Quadrado (1:1)", width: 1080, height: 1080, aspectRatio: "1/1" },
  portrait: { label: "Retrato Feed (4:5)", width: 1080, height: 1350, aspectRatio: "4/5" },
  landscape: { label: "Paisagem (16:9)", width: 1920, height: 1080, aspectRatio: "16/9" },
  story: { label: "Story / Reels (9:16)", width: 1080, height: 1920, aspectRatio: "9/16" },
  banner: { label: "Banner Web (1.91:1)", width: 1200, height: 630, aspectRatio: "1200/630" },
};

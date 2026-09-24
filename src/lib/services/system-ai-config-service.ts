import { adminDb } from "@/lib/firebase-admin";

export type OpenAIImageQuality = "auto" | "low" | "medium" | "high" | "xhigh" | "max";

export interface AIModelsConfig {
  generalPlannerModel: string;
  generalImageModel: string;
  generalFallbackImageModel: string;
  imageQuality?: OpenAIImageQuality;
  chatModel: string;
  promptsIdeaModel: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const AVAILABLE_AI_MODELS = {
  planners: [
    { id: "gpt-4o", label: "GPT-4o (OpenAI Vision - Recomendado)", provider: "openai" },
    { id: "gpt-5", label: "GPT-5 (OpenAI - Diretor de Arte)", provider: "openai" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini (OpenAI - Econômico)", provider: "openai" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Google - Rápido)", provider: "google" },
  ],
  imageGenerators: [
    { id: "gpt-image-2.5-sunburst", label: "GPT-Image-2.5 Sunburst (OpenAI - Qualidade Máxima)", provider: "openai" },
    { id: "gpt-image-2.5-flare", label: "GPT-Image-2.5 Flare (OpenAI - Alta Velocidade)", provider: "openai" },
    { id: "gpt-image-2", label: "GPT Image 2 (OpenAI - Alta Fidelidade)", provider: "openai" },
    { id: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image (Google)", provider: "google" },
    { id: "gemini-3-pro-image", label: "Gemini 3 Pro Image (Google Pro)", provider: "google" },
    { id: "dall-e-3", label: "DALL-E 3 (OpenAI Standard)", provider: "openai" },
  ],
  imageQualities: [
    { id: "medium", label: "Média / Medium (~$0,04 - Recomendado para Redes Sociais)" },
    { id: "low", label: "Baixa / Low (~$0,01 - Rascunhos e Economia Máxima)" },
    { id: "high", label: "Alta / High (~$0,18 - Acabamento Fotográfico Premium)" },
    { id: "auto", label: "Automático / Auto (Definido dinamicamente pela OpenAI)" },
    { id: "xhigh", label: "Ultra Alta / xhigh (Exclusivo família 2.5 - Detalhes Extremos)" },
  ],
  chatAssistants: [
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Google - Padrão)", provider: "google" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Google Estável)", provider: "google" },
    { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Google Legado)", provider: "google" },
    { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Google Preview)", provider: "google" },
  ],
  promptGenerators: [
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Google - Padrão)", provider: "google" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Google)", provider: "google" },
    { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Google)", provider: "google" },
    { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Google Preview)", provider: "google" },
  ],
};

export const DEFAULT_AI_MODELS_CONFIG: AIModelsConfig = {
  generalPlannerModel: "gpt-5",
  generalImageModel: "gpt-image-2",
  generalFallbackImageModel: "gemini-2.5-flash-image",
  imageQuality: "medium",
  chatModel: "gemini-2.5-flash",
  promptsIdeaModel: "gemini-2.5-flash",
};

let cachedConfig: AIModelsConfig | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 segundos

/**
 * Recupera a configuração dinâmica de modelos de IA ativa.
 * Usa cache em memória com TTL de 60s para evitar leituras excessivas no Firestore.
 */
export async function getAIModelsConfig(): Promise<AIModelsConfig> {
  const now = Date.now();
  if (cachedConfig && now < cacheExpiry) {
    return cachedConfig;
  }

  try {
    const snap = await adminDb.collection("settings").doc("aiModels").get();
    if (snap.exists) {
      const data = snap.data() as Partial<AIModelsConfig>;
      cachedConfig = {
        ...DEFAULT_AI_MODELS_CONFIG,
        ...data,
      };
    } else {
      cachedConfig = { ...DEFAULT_AI_MODELS_CONFIG };
    }
  } catch (error) {
    console.warn("[AIModelsConfig] Falha ao carregar do Firestore, usando defaults:", error);
    cachedConfig = { ...DEFAULT_AI_MODELS_CONFIG };
  }

  cacheExpiry = now + CACHE_TTL_MS;
  return cachedConfig;
}

/**
 * Atualiza as configurações de modelos de IA no Firestore e invalida o cache.
 */
export async function updateAIModelsConfig(
  newConfig: Partial<AIModelsConfig>,
  adminEmail?: string
): Promise<AIModelsConfig> {
  const updated: AIModelsConfig = {
    ...DEFAULT_AI_MODELS_CONFIG,
    ...(cachedConfig || {}),
    ...newConfig,
    updatedAt: new Date().toISOString(),
    ...(adminEmail ? { updatedBy: adminEmail } : {}),
  };

  await adminDb.collection("settings").doc("aiModels").set(updated, { merge: true });

  // Invalida cache imediato
  cachedConfig = updated;
  cacheExpiry = Date.now() + CACHE_TTL_MS;

  console.log(`[AIModelsConfig] Configuração atualizada por ${adminEmail || "admin"}:`, updated);
  return updated;
}

"use server";

import { adminDb } from "@/lib/firebase-admin";

export interface GlobalSettings {
  generateImagesWebhook: string;
  generateTextWebhook: string;
  chatWebhook: string;
  postManualWebhook: string;
  imgNoLogoWebhook: string;
  imgRefWebhook: string;
  generatePromptsWebhook: string;
  generateImagesFalaiWebhook: string;
  analisarPresencaWebhook: string;
  generateAvatarWebhook: string;
  serverTimeout: string;
}

const DEFAULT_SETTINGS: GlobalSettings = {
  generateImagesWebhook: "https://webhook.flowupinova.com.br/webhook/gerador_de_imagem",
  generateTextWebhook: "https://webhook.flowupinova.com.br/webhook/gerador_de_ideias",
  chatWebhook: "https://webhook.flowupinova.com.br/webhook/chat",
  postManualWebhook: "https://webhook.flowupinova.com.br/webhook/post_manual",
  imgNoLogoWebhook: "https://webhook.flowupinova.com.br/webhook/imagem_sem_logo",
  imgRefWebhook: "https://webhook.flowupinova.com.br/webhook/gerador_imagem_referencia",
  generatePromptsWebhook: "https://webhook.flowupinova.com.br/webhook/gerador-prompts",
  generateImagesFalaiWebhook: "https://n8n.flowupinova.com.br/webhook-test/gerador-imagem-falai",
  analisarPresencaWebhook: "https://webhook.flowupinova.com.br/webhook/analisar-presenca",
  generateAvatarWebhook: "https://webhook.flowupinova.com.br/webhook/gerador_avatar_twin",
  serverTimeout: "300",
};

/**
 * Busca as configurações globais do Firestore (Vault).
 * Se o documento não existir, retorna os valores padrão.
 */
export async function getGlobalSettings(): Promise<GlobalSettings> {
  try {
    const settingsRef = adminDb.collection("settings").doc("global");
    const doc = await settingsRef.get();

    if (!doc.exists) {
      console.log("[SETTINGS_SERVICE] Documento settings/global não encontrado, usando padrões.");
      return DEFAULT_SETTINGS;
    }

    const data = doc.data() as Partial<GlobalSettings>;
    return {
      generateImagesWebhook: data.generateImagesWebhook || DEFAULT_SETTINGS.generateImagesWebhook,
      generateTextWebhook: data.generateTextWebhook || DEFAULT_SETTINGS.generateTextWebhook,
      chatWebhook: data.chatWebhook || DEFAULT_SETTINGS.chatWebhook,
      postManualWebhook: data.postManualWebhook || DEFAULT_SETTINGS.postManualWebhook,
      imgNoLogoWebhook: data.imgNoLogoWebhook || DEFAULT_SETTINGS.imgNoLogoWebhook,
      imgRefWebhook: data.imgRefWebhook || DEFAULT_SETTINGS.imgRefWebhook,
      generatePromptsWebhook:
        data.generatePromptsWebhook || DEFAULT_SETTINGS.generatePromptsWebhook,
      generateImagesFalaiWebhook:
        data.generateImagesFalaiWebhook || DEFAULT_SETTINGS.generateImagesFalaiWebhook,
      analisarPresencaWebhook:
        data.analisarPresencaWebhook || DEFAULT_SETTINGS.analisarPresencaWebhook,
      generateAvatarWebhook:
        data.generateAvatarWebhook || DEFAULT_SETTINGS.generateAvatarWebhook,
      serverTimeout: data.serverTimeout || DEFAULT_SETTINGS.serverTimeout,
    };
  } catch (error) {
    console.warn(
      "[SETTINGS_SERVICE] Falha ao ler configurações do Firestore, usando padrões.",
      error
    );
    return DEFAULT_SETTINGS;
  }
}

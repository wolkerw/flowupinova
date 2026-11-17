import type { InstagramMessage } from "@/lib/types/instagram";
import { isEmojiOnly, isShortReaction } from "@/lib/services/maia-shared";

const SHARE_TYPES = new Set(["share", "ig_reel", "reel", "ig_post", "media_share", "post"]);
const MEDIA_LABELS: Record<string, string> = {
  image: "[Imagem]",
  video: "[Vídeo]",
  audio: "[Áudio]",
  file: "[Arquivo]",
  sticker: "[Figurinha]",
};

export interface ClassifiedInstagramMessage {
  /** Texto salvo no histórico (com contexto, ex.: "[Resposta ao story] ..."). */
  displayText: string;
  /** False quando a Maia não deve responder (reação, emoji, menção em story, mídia sem texto). */
  shouldReply: boolean;
  reason?: string;
  mediaType: InstagramMessage["mediaType"];
}

/**
 * Regra de atendimento do Instagram: não mandar boas-vindas nem resposta automática para quem só
 * reagiu, comentou com emoji ou elogio curto, mencionou a conta num story ou compartilhou um
 * post/reel sem pergunta. A mensagem fica registrada no histórico para a equipe ver.
 */
export function classifyInstagramMessage(message: any): ClassifiedInstagramMessage | null {
  if (!message || message.is_deleted || message.is_unsupported) return null;

  const text = String(message.text || "").trim();
  const attachments: any[] = Array.isArray(message.attachments) ? message.attachments : [];
  const types = attachments.map((a) => String(a?.type || "").toLowerCase());
  const isStoryReply = Boolean(message.reply_to?.story);
  const isStoryMention = types.includes("story_mention");
  const isShare = types.some((t) => SHARE_TYPES.has(t));

  if (isStoryMention) {
    return { displayText: "[Mencionou a NumVapt num story]", shouldReply: false, reason: "story_mention", mediaType: "story_share" };
  }

  if (!text) {
    if (isShare) {
      return { displayText: "[Compartilhou um post/reel]", shouldReply: false, reason: "share_sem_texto", mediaType: "story_share" };
    }
    const label = types.map((t) => MEDIA_LABELS[t]).find(Boolean);
    if (label) {
      const mediaType = types.includes("image") ? "image" : types.includes("video") ? "video" : types.includes("audio") ? "audio" : null;
      return { displayText: label, shouldReply: false, reason: "midia_sem_texto", mediaType };
    }
    return null;
  }

  const prefix = isStoryReply ? "[Resposta ao story] " : isShare ? "[Sobre um post/reel] " : "";
  const displayText = `${prefix}${text}`;
  const mediaType = isStoryReply || isShare ? "story_share" : null;

  if (isEmojiOnly(text)) {
    return { displayText, shouldReply: false, reason: "so_emoji", mediaType };
  }
  if (isShortReaction(text)) {
    return { displayText, shouldReply: false, reason: "reacao_curta", mediaType };
  }
  return { displayText, shouldReply: true, mediaType };
}

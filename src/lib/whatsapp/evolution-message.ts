/**
 * Leitura dos registros de mensagem da Evolution API (Baileys).
 *
 * O WhatsApp embrulha o conteúdo em vários formatos (mensagens temporárias, visualização única,
 * mensagens editadas) e, desde 2025, pode identificar o contato por um LID ("123@lid") em vez do
 * telefone. Estas funções normalizam isso para o webhook da Maia e para o histórico do admin.
 */

export type WhatsAppContentKind =
  | "text"
  | "audio"
  | "image"
  | "video"
  | "document"
  | "sticker"
  | "location"
  | "contact"
  | "reaction"
  | "system"
  | "unknown";

export interface ExtractedWhatsAppContent {
  kind: WhatsAppContentKind;
  /** Texto escrito pelo cliente (ou legenda), sem placeholder. */
  text: string;
  /** Texto para exibir no histórico: o texto ou um placeholder como "[Áudio]". */
  displayText: string;
}

const WRAPPER_KEYS = [
  "ephemeralMessage",
  "viewOnceMessage",
  "viewOnceMessageV2",
  "viewOnceMessageV2Extension",
  "documentWithCaptionMessage",
  "editedMessage",
];

const PLACEHOLDERS: Record<WhatsAppContentKind, string> = {
  text: "",
  audio: "[Áudio]",
  image: "[Imagem]",
  video: "[Vídeo]",
  document: "[Documento]",
  sticker: "[Figurinha]",
  location: "[Localização]",
  contact: "[Contato]",
  reaction: "",
  system: "",
  unknown: "[Mensagem não suportada]",
};

/** Remove as camadas de embrulho (temporária, visualização única, editada). */
export function unwrapMessage(message: any): any {
  let current = message;
  for (let depth = 0; depth < 5 && current && typeof current === "object"; depth++) {
    const key = WRAPPER_KEYS.find((k) => current[k]?.message);
    if (!key) break;
    current = current[key].message;
  }
  return current ?? null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function extractMessageContent(rawMessage: any): ExtractedWhatsAppContent {
  const m = unwrapMessage(rawMessage);
  const build = (kind: WhatsAppContentKind, text = ""): ExtractedWhatsAppContent => {
    const placeholder = PLACEHOLDERS[kind];
    const displayText = text && placeholder ? `${placeholder} ${text}` : text || placeholder;
    return { kind, text, displayText };
  };

  if (!m || typeof m !== "object") return build("unknown");

  const plain = str(m.conversation) || str(m.extendedTextMessage?.text);
  if (plain) return build("text", plain);

  const reply =
    str(m.buttonsResponseMessage?.selectedDisplayText) ||
    str(m.templateButtonReplyMessage?.selectedDisplayText) ||
    str(m.listResponseMessage?.title) ||
    str(m.interactiveResponseMessage?.body?.text);
  if (reply) return build("text", reply);

  if (m.audioMessage || m.pttMessage) return build("audio");
  if (m.imageMessage) return build("image", str(m.imageMessage.caption));
  if (m.videoMessage || m.ptvMessage) return build("video", str(m.videoMessage?.caption));
  if (m.documentMessage) {
    return build("document", str(m.documentMessage.caption) || str(m.documentMessage.fileName));
  }
  if (m.stickerMessage) return build("sticker");
  if (m.locationMessage || m.liveLocationMessage) return build("location");
  if (m.contactMessage || m.contactsArrayMessage) return build("contact");
  if (m.reactionMessage) return build("reaction");
  if (m.protocolMessage || m.senderKeyDistributionMessage || (m.messageContextInfo && Object.keys(m).length === 1)) {
    return build("system");
  }
  return build("unknown");
}

/** Só dígitos de um JID ("5551999@s.whatsapp.net" → "5551999"). */
export function jidToDigits(jid: unknown): string {
  return typeof jid === "string" ? jid.replace(/@.*$/, "").replace(/:\d+$/, "").replace(/\D/g, "") : "";
}

export interface ResolvedWhatsAppContact {
  /** Telefone em dígitos (ou o número do LID, se o telefone não vier no evento). */
  phone: string;
  /** Dígitos do LID, quando o contato chegou identificado por LID. */
  lid: string | null;
}

/**
 * Resolve o telefone real do contato a partir da `key` da Evolution.
 * Com LID, o telefone vem em `remoteJidAlt` (Evolution v2.3+) ou em `senderPn`.
 */
export function resolveContactFromKey(key: any, data?: any): ResolvedWhatsAppContact {
  const remoteJid: string = typeof key?.remoteJid === "string" ? key.remoteJid : "";
  if (remoteJid.endsWith("@lid")) {
    const lid = jidToDigits(remoteJid);
    const alt = [key?.remoteJidAlt, key?.senderPn, data?.senderPn, key?.participantAlt].find(
      (j) => typeof j === "string" && j.includes("@s.whatsapp.net")
    );
    return { phone: jidToDigits(alt) || lid, lid };
  }
  return { phone: jidToDigits(remoteJid), lid: null };
}

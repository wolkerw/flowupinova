export type WhatsAppMessageRole = "user" | "assistant" | "system" | "admin";

export interface WhatsAppMessage {
  id: string;
  role: WhatsAppMessageRole;
  text: string;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: "audio" | "image" | "document" | null;
  senderName?: string;
}

export interface WhatsAppChatSession {
  phone: string;
  cleanPhone: string;
  contactName: string;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;
  aiEnabled: boolean;
  humanTakeover: boolean;
  status: "active" | "waiting_human" | "closed";
  identifiedEmail?: string | null;
  identifiedPlan?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppAIResponse {
  replyText: string;
  needsHumanSupport: boolean;
  suggestedAction?: "checkout_link" | "pix_info" | "plan_details" | "human_transfer" | "faq";
  planMentioned?: "mensal" | "trimestral" | "semestral" | "anual" | null;
}

export type InstagramMessageRole = "user" | "assistant" | "system" | "admin";

export interface InstagramMessage {
  id: string;
  role: InstagramMessageRole;
  text: string;
  timestamp: string;
  senderId: string;
  senderUsername?: string;
  senderName?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio" | "story_share" | null;
}

export interface InstagramChatSession {
  id: string; // instagram_scoped_id do seguidor
  senderId: string;
  username: string;
  contactName: string;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount?: number;
  aiEnabled: boolean;
  humanTakeover: boolean;
  status: "active" | "waiting_human" | "closed";
  profilePicUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstagramAIResponse {
  replyText: string;
  needsHumanSupport: boolean;
  suggestedAction?: "checkout_link" | "plan_details" | "human_transfer" | "faq";
  planMentioned?: "mensal" | "trimestral" | "semestral" | "anual" | null;
}

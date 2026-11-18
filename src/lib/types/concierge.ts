export type ServiceMode = "self_service" | "concierge";

export type ConciergeRole = "creator" | "client_approver";

export interface ClientApproverAccount {
  approverUid: string;
  approverEmail: string;
  approverName: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export type PostApprovalStatus =
  | "not_required"
  | "pending_approval"
  | "pending"
  | "approved"
  | "changes_requested"
  | "rejected";

export interface ManagedServiceConfig {
  serviceMode: ServiceMode;
  assignedOperatorId?: string | null;
  assignedOperatorName?: string | null;
  notifyChannel?: "whatsapp" | "email" | "both";
  clientPhone?: string | null;
  autoScheduleOnApproval?: boolean;
}

export interface PostApprovalData {
  approvalToken?: string;
  tokenExpiresAt?: string; // ISO String
  status: PostApprovalStatus;
  requestedAt?: any;
  requestedBy?: string;
  reviewedAt?: string | null;
  reviewerFeedback?: string | null;
  reviewNotes?: string | null;
  reviewChannel?: "magic_link" | "dashboard" | null;
}

export interface ConciergeApprovalPublicView {
  token: string;
  postId: string;
  userId: string;
  businessName?: string;
  businessLogo?: string | null;
  text: string;
  imageUrls: string[];
  platforms: string[];
  isCarousel: boolean;
  scheduledAt: string;
  status: PostApprovalStatus;
  tokenExpiresAt: string;
  reviewerFeedback?: string | null;
  isExpired: boolean;
}

export interface WeeklyPlanningTopics {
  month: string; // Formato YYYY-MM (ex: "2026-11")
  week1: string; // Assuntos da Semana 1 (Dias 01 a 07)
  week2: string; // Assuntos da Semana 2 (Dias 08 a 14)
  week3: string; // Assuntos da Semana 3 (Dias 15 a 21)
  week4: string; // Assuntos da Semana 4 (Dias 22 a 31)
  notes?: string; // Observações gerais do mês
  updatedAt?: string; // Data ISO da última atualização
  updatedBy?: string; // E-mail ou identificador de quem atualizou
  updatedByRole?: "client_approver" | "creator" | "admin";
}

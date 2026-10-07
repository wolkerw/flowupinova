export type ServiceMode = "self_service" | "concierge";

export type PostApprovalStatus =
  | "not_required"
  | "pending_approval"
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
  approvalToken: string;
  tokenExpiresAt: string; // ISO String
  status: PostApprovalStatus;
  requestedAt?: string;
  reviewedAt?: string | null;
  reviewerFeedback?: string | null;
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

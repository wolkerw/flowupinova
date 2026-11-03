export type CampaignObjective =
  | "engagement"
  | "sales_launch"
  | "authority"
  | "local_social_selling";

export type CampaignFrequency = 2 | 3 | 5;

export type CampaignFormat =
  | "static_ai"
  | "carousel_ai"
  | "reels_organic"
  | "stories_sequence";

export type FunnelStage =
  | "top_attraction"
  | "middle_authority"
  | "bottom_conversion";

export type CampaignItemStatus =
  | "pending"
  | "in_production"
  | "scheduled"
  | "published";

export interface AnalyzedPostSummary {
  id: string;
  caption: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS" | string;
  likes: number;
  comments: number;
  reach: number;
  saved: number;
  totalInteractions: number;
  permalink?: string;
  timestamp?: string;
  thumbnailUrl?: string;
}

export interface SocialMediaAuditMetrics {
  totalAnalyzedPosts: number;
  postsPerWeekLast30Days: number;
  longestGapDays: number;
  avgLikes: number;
  avgComments: number;
  avgReach: number;
  avgSaved: number;
  avgEngagementRate: number;
  formatBreakdown: {
    image: number;
    video: number;
    carousel: number;
  };
  bestPerformingFormat: string;
  bestDaysToPost: string[];
  bestHoursToPost: string[];
  topPosts: AnalyzedPostSummary[];
}

export interface StrategicRecommendation {
  title: string;
  description: string;
  impact: "Alto" | "Médio";
  category: "Frequência" | "Formato" | "Copywriting" | "Bio" | "Conversão";
}

export interface SocialMediaAuditReport {
  id?: string;
  createdAt: string;
  username: string;
  accountName?: string;
  biography?: string;
  website?: string;
  followersCount?: number;
  mediaCount?: number;
  connectedPlatforms: {
    instagram: boolean;
    facebook: boolean;
    linkedin?: boolean;
    tiktok?: boolean;
  };
  overallScore: number;
  scoreClassification: "Crítico" | "Em Evolução" | "Bom" | "Excelente";
  executiveSummary: string;
  metrics: SocialMediaAuditMetrics;
  bioAnalysis: {
    currentStatus: string;
    suggestedBio: string;
    suggestedCta: string;
  };
  strengths: string[];
  bottlenecks: string[];
  strategicRecommendations: StrategicRecommendation[];
  recommendedObjective: CampaignObjective;
  recommendedFrequency: CampaignFrequency;
}

export interface ReelsScript {
  hook: string;
  body: string;
  cta: string;
  visualDirection: string;
  audioSuggestion: string;
  durationSeconds: number;
}

export interface CarouselSlide {
  slideNumber: number;
  headline: string;
  bodyText: string;
  visualHint: string;
}

export interface StoryFrame {
  frameNumber: number;
  type:
    | "opening"
    | "poll_interaction"
    | "value_content"
    | "question_box"
    | "cta_link";
  scriptText: string;
  visualSuggestion: string;
  interactiveSticker: string;
}

export interface DirectSellingScript {
  triggerKeyword: string;
  openingMessage: string;
  qualificationQuestion: string;
  closingCtaMessage: string;
}

export interface OmnichannelAdaptations {
  linkedin?: {
    headline: string;
    postText: string;
  };
  tiktok?: {
    hook: string;
    script: string;
    caption: string;
  };
  facebook?: {
    postText: string;
  };
}

export interface CampaignPostItem {
  id: string;
  dayIndex: number;
  weekNumber: number;
  scheduledDate: string; // YYYY-MM-DD
  suggestedTime: string; // HH:mm
  dayOfWeekLabel: string;
  title: string;
  theme: string;
  funnelStage: FunnelStage;
  format: CampaignFormat;
  caption: string;
  hashtags: string[];
  aiImagePrompt: string;
  reelsScript?: ReelsScript;
  carouselSlides?: CarouselSlide[];
  storiesSequence: StoryFrame[];
  directSellingScript: DirectSellingScript;
  omnichannel?: OmnichannelAdaptations;
  status: CampaignItemStatus;
  linkedPostId?: string;
  generatedImageUrl?: string;
  generatedImageAt?: string;
  generatedAssetId?: string;
}

export interface SocialMediaCampaign {
  id: string;
  name: string;
  objective: CampaignObjective;
  frequencyPerWeek: CampaignFrequency;
  durationWeeks: number;
  preferredDays: string[];
  strategySummary: string;
  editorialPillars: string[];
  posts: CampaignPostItem[];
  createdAt: string;
  updatedAt?: string;
  auditScoreAtCreation?: number;
}

export const CAMPAIGN_OBJECTIVE_LABELS: Record<
  CampaignObjective,
  { label: string; subtitle: string; badgeColor: string }
> = {
  engagement: {
    label: "Aquecimento & Engajamento",
    subtitle: "Recuperar alcance orgânico, comentários, salvamentos e compartilhamentos",
    badgeColor: "bg-pink-100 text-pink-700 border-pink-200",
  },
  sales_launch: {
    label: "Campanha de Vendas & Oferta",
    subtitle: "Jornada de antecipação, prova social, quebra de objeções e conversão",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  authority: {
    label: "Autoridade & Posicionamento",
    subtitle: "Educação de mercado, bastidores, estudos de caso e construção de marca",
    badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  local_social_selling: {
    label: "Atração Local & Social Selling",
    subtitle: "Atrair clientes da região e converter seguidores em conversas no Direct/WhatsApp",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
  },
};

export const CAMPAIGN_FORMAT_LABELS: Record<
  CampaignFormat,
  { label: string; shortLabel: string; color: string }
> = {
  static_ai: {
    label: "Post Estático via IA",
    shortLabel: "Post IA",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  carousel_ai: {
    label: "Carrossel Educativo (IA)",
    shortLabel: "Carrossel",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  reels_organic: {
    label: "Reels / Vídeo Orgânico",
    shortLabel: "Reels",
    color: "bg-rose-100 text-rose-700 border-rose-200",
  },
  stories_sequence: {
    label: "Sequência de Stories",
    shortLabel: "Stories",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
};

export const FUNNEL_STAGE_LABELS: Record<
  FunnelStage,
  { label: string; description: string; color: string }
> = {
  top_attraction: {
    label: "Topo de Funil (Atração)",
    description: "Alcançar novas pessoas que ainda não conhecem a marca",
    color: "bg-sky-50 text-sky-700 border-sky-200",
  },
  middle_authority: {
    label: "Meio de Funil (Autoridade)",
    description: "Gerar confiança, salvamentos e retenção na audiência atual",
    color: "bg-violet-50 text-violet-700 border-violet-200",
  },
  bottom_conversion: {
    label: "Fundo de Funil (Conversão)",
    description: "Estimular tomada de decisão, mensagens no Direct e vendas",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

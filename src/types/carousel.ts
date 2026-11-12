import { z } from "zod";

export type CarouselSlideCount = 5 | 7;

export const CAROUSEL_COVER_IMAGE_MODEL = "gpt-image-2.6-sunburst";

export type CarouselObjective =
  | "educar"
  | "vender"
  | "gerar_comentarios"
  | "apresentar_produto"
  | "contar_historia"
  | "divulgar_oferta";

export type CarouselInternalSlideType =
  | "contexto"
  | "ponto_principal"
  | "complemento"
  | "desenvolvimento"
  | "prova_resumo"
  | "cta";

export type CarouselBackgroundVariant =
  | "solid_from_cover"
  | "blurred_cover_crop"
  | "cover_stripe_geometry";

export type LogoPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export const EXPECTED_SLIDE_TYPES_5: CarouselInternalSlideType[] = [
  "contexto",
  "ponto_principal",
  "complemento",
  "cta",
];

export const EXPECTED_SLIDE_TYPES_7: CarouselInternalSlideType[] = [
  "contexto",
  "desenvolvimento",
  "desenvolvimento",
  "desenvolvimento",
  "prova_resumo",
  "cta",
];

export const CarouselInternalSlideSchema = z
  .object({
    n: z.number().int().min(2).max(7),
    tipo: z.enum([
      "contexto",
      "ponto_principal",
      "complemento",
      "desenvolvimento",
      "prova_resumo",
      "cta",
    ]),
    titulo: z
      .string()
      .trim()
      .min(3, "O título do slide deve ter pelo menos 3 caracteres.")
      .max(45, "O título do slide deve ter no máximo 45 caracteres."),
    texto: z
      .string()
      .trim()
      .max(160, "O texto do slide deve ter no máximo 160 caracteres.")
      .optional()
      .default(""),
    botao: z
      .string()
      .trim()
      .max(36, "O texto do botão CTA deve ter no máximo 36 caracteres.")
      .optional(),
    // --- Campos opcionais da biblioteca de layouts (src/lib/services/carousel/layouts) ---
    /** ID do layout escolhido pelo LLM ou pelo usuário (ex.: "lista-numerada"). */
    layout: z.string().trim().max(40).optional(),
    /** Número ou palavra em destaque (ex.: "73%", "3x", "R$ 0"). */
    destaque: z.string().trim().max(14).optional(),
    /** Itens curtos para listas, checklists, linha do tempo e grade. */
    itens: z.array(z.string().trim().min(1).max(70)).max(5).optional(),
    /** Dois lados de uma comparação (errado × certo, antes × depois). */
    comparacao: z
      .object({
        a: z.object({
          rotulo: z.string().trim().min(1).max(24),
          itens: z.array(z.string().trim().min(1).max(60)).min(1).max(4),
        }),
        b: z.object({
          rotulo: z.string().trim().min(1).max(24),
          itens: z.array(z.string().trim().min(1).max(60)).min(1).max(4),
        }),
      })
      .optional(),
    /** Autor de citação/depoimento. */
    autor: z.string().trim().max(40).optional(),
  })
  .superRefine((slide, ctx) => {
    if (slide.tipo === "cta") {
      if (!slide.botao || slide.botao.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["botao"],
          message: "O slide final de CTA deve informar o texto do botão/canal de ação.",
        });
      }
    } else if (!slide.texto || slide.texto.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["texto"],
        message: "Os slides de conteúdo devem possuir corpo de texto explicativo.",
      });
    }
  });

export const CarouselStoryboardSchema = z
  .object({
    slideCount: z.union([z.literal(5), z.literal(7)]).optional(),
    chamadaCapa: z
      .string()
      .trim()
      .min(5, "A chamada da capa é obrigatória.")
      .max(65, "A chamada da capa deve ter no máximo 65 caracteres."),
    promptImagemCapa: z
      .string()
      .trim()
      .min(15, "O prompt de imagem da capa é obrigatório."),
    legenda: z.string().trim().optional().default(""),
    hashtags: z.array(z.string()).optional().default([]),
    altText: z.string().trim().optional().default(""),
    slides: z.array(CarouselInternalSlideSchema),
  })
  .superRefine((data, ctx) => {
    const inferredCount: CarouselSlideCount | null =
      data.slideCount === 5 || data.slideCount === 7
        ? data.slideCount
        : data.slides.length === 4
          ? 5
          : data.slides.length === 6
            ? 7
            : null;

    if (!inferredCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides"],
        message:
          "O carrossel deve ter exatamente 5 slides (capa + 4 internos) ou 7 slides (capa + 6 internos).",
      });
      return;
    }

    const expectedInternalCount = inferredCount - 1;
    if (data.slides.length !== expectedInternalCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides"],
        message: `Para um carrossel de ${inferredCount} slides, são esperados exatamente ${expectedInternalCount} slides internos (2 a ${inferredCount}).`,
      });
      return;
    }

    const expectedTypes =
      inferredCount === 5 ? EXPECTED_SLIDE_TYPES_5 : EXPECTED_SLIDE_TYPES_7;

    data.slides.forEach((slide, idx) => {
      const expectedN = idx + 2;
      if (slide.n !== expectedN) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["slides", idx, "n"],
          message: `O slide na posição ${idx + 1} deve ter n=${expectedN}, mas recebeu n=${slide.n}.`,
        });
      }
      const expectedType = expectedTypes[idx];
      if (slide.tipo !== expectedType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["slides", idx, "tipo"],
          message: `O slide ${expectedN} em um carrossel de ${inferredCount} slides deve ser do tipo "${expectedType}", mas recebeu "${slide.tipo}".`,
        });
      }
    });
  });

export type CarouselInternalSlide = z.infer<typeof CarouselInternalSlideSchema>;
export type CarouselStoryboard = z.infer<typeof CarouselStoryboardSchema>;

export const CoverDesignTokensSchema = z.object({
  dominantPalette: z.array(z.string()).default(["#0B253A", "#FA6305", "#0083C7"]),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#0B253A"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#0083C7"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FA6305"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  mutedTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#CBD5E1"),
  titleAlignment: z.enum(["left", "center"]).default("left"),
  coverTextPosition: z.enum(["top", "bottom"]).default("top"),
  headingWeight: z.enum(["700", "800", "900", "bold", "extrabold"]).default("800"),
  graphicMotif: z
    .enum(["accent_stripe", "geometric_pill", "editorial_frame", "minimal_bar"])
    .default("accent_stripe"),
  cornerRadius: z.number().int().min(0).max(40).default(8),
  mood: z.string().min(1).default("Executivo moderno e coeso com a capa"),
  headingFont: z.string().min(1).default("Poppins"),
  bodyFont: z.string().min(1).default("Inter"),
  logoUrl: z.string().nullable().default(null),
  palette: z.object({
    backgroundHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    primaryAccentHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondaryAccentHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    textPrimaryHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    textMutedHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  typography: z.object({
    primaryFont: z.string().min(1),
    secondaryFont: z.string().min(1),
    titleAlignment: z.enum(["left", "center"]),
    titleWeight: z.enum(["700", "800", "900"]),
    titlePosition: z.enum(["top-left", "top-center", "center", "bottom-left"]),
  }),
  graphicElements: z.object({
    motif: z.enum(["accent_stripe", "geometric_pill", "editorial_frame", "minimal_bar"]),
    cornerStyle: z.enum(["rounded", "sharp", "pill"]),
    borderRadiusPx: z.number().int().min(0).max(40),
    hasFrame: z.boolean(),
    mood: z.string().min(1),
  }),
  backgroundVariants: z
    .array(z.enum(["solid_from_cover", "blurred_cover_crop", "cover_stripe_geometry"]))
    .min(1),
});

export type CoverDesignTokens = z.infer<typeof CoverDesignTokensSchema>;

export const DEFAULT_COVER_DESIGN_TOKENS: CoverDesignTokens = {
  dominantPalette: ["#0B253A", "#FA6305", "#0083C7"],
  backgroundColor: "#0B253A",
  secondaryColor: "#0083C7",
  accentColor: "#FA6305",
  textColor: "#FFFFFF",
  mutedTextColor: "#CBD5E1",
  titleAlignment: "left",
  coverTextPosition: "top",
  headingWeight: "800",
  graphicMotif: "accent_stripe",
  cornerRadius: 8,
  mood: "Executivo moderno e coeso com a capa",
  headingFont: "Poppins",
  bodyFont: "Inter",
  logoUrl: null,
  palette: {
    backgroundHex: "#0B253A",
    primaryAccentHex: "#FA6305",
    secondaryAccentHex: "#0083C7",
    textPrimaryHex: "#FFFFFF",
    textMutedHex: "#CBD5E1",
  },
  typography: {
    primaryFont: "Poppins",
    secondaryFont: "Inter",
    titleAlignment: "left",
    titleWeight: "800",
    titlePosition: "top-left",
  },
  graphicElements: {
    motif: "accent_stripe",
    cornerStyle: "rounded",
    borderRadiusPx: 8,
    hasFrame: true,
    mood: "Executivo moderno e coeso com a capa",
  },
  backgroundVariants: [
    "solid_from_cover",
    "blurred_cover_crop",
    "cover_stripe_geometry",
  ],
};

export interface CarouselRenderableSlide {
  n: number; // 1 a 5 ou 1 a 7
  isCover: boolean;
  tipo: "capa" | CarouselInternalSlideType;
  titulo: string;
  texto: string;
  botao?: string;
  backgroundVariant: CarouselBackgroundVariant;
  useCoverTextOverlay?: boolean; // Opção de segurança para sobrepor chamadaCapa via Fabric na capa
  renderedDataUrl?: string;
  uploadedUrl?: string;
}

export interface CarouselPostDoc {
  id: string;
  userId: string;
  type: "carousel";
  slideCount: CarouselSlideCount;
  objective: CarouselObjective;
  brief: {
    theme: string;
    audience: string;
    tone: string;
    ctaChannel: string;
    productImageUrl?: string;
  };
  storyboard: CarouselStoryboard;
  coverImageUrl: string;
  designTokens: CoverDesignTokens;
  slides: CarouselRenderableSlide[];
  caption: string;
  hashtags: string[];
  altText: string;
  createdAt: string;
  updatedAt: string;
}

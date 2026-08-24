"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type LayoutStyleId =
  | ""
  | "CLEAN_LUXURY"
  | "CINEMATIC"
  | "STUDIO_CLEAN"
  | "URBAN_LIFESTYLE"
  | "MINIMALIST"
  | "TECH_3D"
  | "MAGAZINE_3D"
  | "PRODUCT_METAAD"
  | "PRODUCT_PREMIUM"
  | "PRODUCT_LIFESTYLE"
  | "PRODUCT_DYNAMIC"
  | "PRODUCT_CATALOG"
  | "PRODUCT_COSMETICS"
  | "PRODUCT_TECH"
  | "PRODUCT_FLATLAY"
  | "PRODUCT_GOURMET"
  | "PRODUCT_RUSTIC";

/** IDs reais dos estilos (sem o AUTO vazio) — usado para sorteio */
export const LAYOUT_STYLE_IDS: LayoutStyleId[] = [
  "CINEMATIC",
  "STUDIO_CLEAN",
  "URBAN_LIFESTYLE",
  "MINIMALIST",
  "TECH_3D",
  "MAGAZINE_3D",
  "PRODUCT_METAAD",
  "PRODUCT_PREMIUM",
  "PRODUCT_LIFESTYLE",
  "PRODUCT_DYNAMIC",
  "PRODUCT_CATALOG",
  "PRODUCT_COSMETICS",
  "PRODUCT_TECH",
  "PRODUCT_FLATLAY",
  "PRODUCT_GOURMET",
  "PRODUCT_RUSTIC",
];

export interface LayoutStyleOption {
  id: LayoutStyleId;
  label: string;
  sublabel: string;
  description: string;
  placeholderGradient: string;
  icon: string;
  image?: string;
  category?: "branding" | "product";
  slashCommand?: string;
}

export const LAYOUT_STYLES: LayoutStyleOption[] = [
  {
    id: "CLEAN_LUXURY",
    label: "Automático",
    sublabel: "IA decide o estilo",
    description: "A IA sorteia estilos diferentes a cada geração para máximo de variedade e surpresa criativa.",
    placeholderGradient: "from-slate-700 via-slate-500 to-slate-400",
    icon: "⚡",
    category: "branding",
  },
  {
    id: "PRODUCT_METAAD",
    label: "Anúncio Meta Ads",
    sublabel: "Alta Conversão / /metaad",
    description: "Layout comercial focado em vendas no Instagram e Facebook, com 45% a 55% de espaço negativo estratégico para títulos, preços e selos.",
    placeholderGradient: "from-blue-600 via-indigo-700 to-purple-800",
    icon: "📢",
    image: "/product-presets/metaad.jpg",
    category: "product",
    slashCommand: "/metaad",
  },
  {
    id: "PRODUCT_PREMIUM",
    label: "Vitrine de Luxo",
    sublabel: "Pedestal / /premiumshowcase",
    description: "Fotografia publicitária de alto luxo, produto sobre pedestal de mármore de Carrara, iluminação de 3 pontos e reflexos cáusticos.",
    placeholderGradient: "from-amber-600 via-yellow-700 to-stone-900",
    icon: "💎",
    image: "/product-presets/premiumshowcase.jpg",
    category: "product",
    slashCommand: "/premiumshowcase",
  },
  {
    id: "PRODUCT_LIFESTYLE",
    label: "Produto em Uso",
    sublabel: "Cenário Real / /lifestylecontext",
    description: "Produto integrado organicamente em ambientes contemporâneos aspiracionais com iluminação solar matinal natural.",
    placeholderGradient: "from-emerald-700 via-teal-800 to-slate-900",
    icon: "🌿",
    image: "/product-presets/lifestylecontext.jpg",
    category: "product",
    slashCommand: "/lifestylecontext",
  },
  {
    id: "PRODUCT_DYNAMIC",
    label: "Ação & Respingos",
    sublabel: "Dinâmico / /dynamicaction",
    description: "Ação e dinamismo comercial com partículas suspensas, gotas de água cristalinas congeladas em alta velocidade (1/8000s).",
    placeholderGradient: "from-cyan-600 via-blue-700 to-sky-900",
    icon: "💧",
    image: "/product-presets/dynamicaction.jpg",
    category: "product",
    slashCommand: "/dynamicaction",
  },
  {
    id: "PRODUCT_CATALOG",
    label: "Catálogo Clean",
    sublabel: "E-commerce / /minimalcatalog",
    description: "Estilo catálogo e e-commerce puro, fundo infinito neutro, luz difusa uniforme e foco nítido de ponta a ponta.",
    placeholderGradient: "from-neutral-200 via-zinc-300 to-slate-400",
    icon: "🏷️",
    image: "/product-presets/minimalcatalog.jpg",
    category: "product",
    slashCommand: "/minimalcatalog",
  },
  {
    id: "PRODUCT_COSMETICS",
    label: "Cosméticos & Skincare",
    sublabel: "Beleza / /luxurycosmetics",
    description: "Bandejas translúcidas onduladas, flores botânicas delicadas, texturas refinadas de sérum e iluminação etérea.",
    placeholderGradient: "from-pink-500 via-rose-600 to-amber-700",
    icon: "🌸",
    image: "/product-presets/luxurycosmetics.jpg",
    category: "product",
    slashCommand: "/luxurycosmetics",
  },
  {
    id: "PRODUCT_TECH",
    label: "Tecnologia 3D",
    sublabel: "Hardware / /techfuturistic",
    description: "Produto em gravidade zero com iluminação de neon ciano/roxo, materiais metálicos e estética futurista.",
    placeholderGradient: "from-violet-900 via-purple-700 to-cyan-500",
    icon: "🔮",
    image: "/product-presets/techfuturistic.jpg",
    category: "product",
    slashCommand: "/techfuturistic",
  },
  {
    id: "PRODUCT_FLATLAY",
    label: "Flat Lay 90°",
    sublabel: "Organização / /flatlayknolling",
    description: "Visão aérea ortogonal (top-down 90°) alinhada geometricamente sobre linho natural com luz difusa equilibrada.",
    placeholderGradient: "from-amber-800 via-stone-700 to-neutral-800",
    icon: "📐",
    image: "/product-presets/flatlayknolling.jpg",
    category: "product",
    slashCommand: "/flatlayknolling",
  },
  {
    id: "PRODUCT_GOURMET",
    label: "Gastronomia",
    sublabel: "Food Commercial / /gourmetculinary",
    description: "Estética publicitária de alimentos com vapor suave, texturas crocantes e iluminação quente de restaurante.",
    placeholderGradient: "from-orange-700 via-amber-800 to-stone-900",
    icon: "🍔",
    image: "/product-presets/gourmetculinary.jpg",
    category: "product",
    slashCommand: "/gourmetculinary",
  },
  {
    id: "PRODUCT_RUSTIC",
    label: "Rústico & Artesanal",
    sublabel: "Botânico / /rusticorganic",
    description: "Madeira nobre crua, ramos de eucalipto, tecidos naturais de linho e luz suave de janela.",
    placeholderGradient: "from-amber-900 via-yellow-900 to-emerald-950",
    icon: "🪵",
    image: "/product-presets/rusticorganic.jpg",
    category: "product",
    slashCommand: "/rusticorganic",
  },
  {
    id: "CINEMATIC",
    label: "Cinematográfico",
    sublabel: "Luz Dramática",
    description: "Fotografia cinematográfica, luz dramática, sombras profundas, lente 85mm f/1.8.",
    placeholderGradient: "from-amber-950 via-red-900 to-stone-900",
    icon: "🎬",
    image: "/layout-styles/cinematic.png",
    category: "branding",
  },
  {
    id: "STUDIO_CLEAN",
    label: "Estúdio Clean",
    sublabel: "Fundo Neutro",
    description: "Fotografia de estúdio, fundo neutro elegante, iluminação suave e uniforme.",
    placeholderGradient: "from-gray-100 via-zinc-200 to-slate-300",
    icon: "📸",
    image: "/layout-styles/clean-luxury.png",
    category: "branding",
  },
  {
    id: "URBAN_LIFESTYLE",
    label: "Urbano / Lifestyle",
    sublabel: "Dia a Dia Real",
    description: "Estilo lifestyle autêntico, ambiente urbano real, luz do dia natural.",
    placeholderGradient: "from-blue-800 via-indigo-600 to-sky-400",
    icon: "🏙️",
    image: "/layout-styles/urban-lifestyle.png",
    category: "branding",
  },
  {
    id: "MINIMALIST",
    label: "Minimalista",
    sublabel: "Espaçoso & Sofisticado",
    description: "Design minimalista, composição espaçosa, estética moderna, sofisticada e limpa.",
    placeholderGradient: "from-neutral-100 via-stone-200 to-zinc-400",
    icon: "✨",
    image: "/layout-styles/minimalist.png",
    category: "branding",
  },
  {
    id: "TECH_3D",
    label: "Tecnologia 3D",
    sublabel: "Octane / Redshift",
    description: "Ilustração 3D premium, renderização estilo Octane/Redshift, cores vibrantes, materiais realistas.",
    placeholderGradient: "from-violet-900 via-purple-700 to-pink-500",
    icon: "🔮",
    image: "/layout-styles/tech-3d.png",
    category: "branding",
  },
  {
    id: "MAGAZINE_3D",
    label: "Magazine 3D",
    sublabel: "Capa de Revista",
    description: "Estilo capa de revista de alta moda, tipografia integrada com profundidade 3D (sujeito sobrepõe parcialmente as letras do título).",
    placeholderGradient: "from-rose-900 via-pink-700 to-orange-500",
    icon: "📰",
    image: "/layout-styles/magazine-3d.png",
    category: "branding",
  },
];

export const LAYOUT_STYLE_TECHNICAL: Record<LayoutStyleId, string> = {
  "": "",
  CLEAN_LUXURY: "",
  PRODUCT_METAAD:
    "LAYOUT STYLE — PRODUCT_METAAD (/metaad): High-conversion Meta/Instagram advertising composition (OpenAI DALL-E & GPT-4o standard). The primary product/subject is the hero, framed with deliberate 45-55% clean negative space (top or side area) reserved for ad copy, headlines, and call-to-actions. High-contrast commercial studio lighting with a soft key light and sharp edge separation rim light. True-to-life product proportions, textures, and vibrant commercial appeal.",
  PRODUCT_PREMIUM:
    "LAYOUT STYLE — PRODUCT_PREMIUM (/premiumshowcase): Ultra-luxury commercial product showcase. The product is elegantly staged on a geometric architectural pedestal (such as polished white Carrara marble, frosted translucent glass, or brushed metal). Three-point studio lighting with a large overhead softbox, subtle caustic reflections, soft contact shadows (ambient occlusion), and an ultra-clean minimalist luxury atmosphere. Shot on Phase One IQ4 150MP, 85mm f/1.4 lens.",
  PRODUCT_LIFESTYLE:
    "LAYOUT STYLE — PRODUCT_LIFESTYLE (/lifestylecontext): Premium lifestyle product placement in an authentic, aspirational real-world setting (e.g. contemporary oak desk in a sunlit architectural studio, luxury spa marble counter, or designer kitchen). Warm natural side lighting from a nearby window, gentle soft-focus depth of field, and organic atmosphere that highlights how the product integrates into daily life.",
  PRODUCT_DYNAMIC:
    "LAYOUT STYLE — PRODUCT_DYNAMIC (/dynamicaction): High-speed commercial advertising photography capturing dynamic action. The product is surrounded by suspended elements: crystal-clear high-speed frozen water droplets, dynamic liquid splashes, floating natural ingredients, or energetic light trails. Studio strobe lighting with 1/8000s shutter freeze effect, creating a fresh, energetic, and visually captivating hero visual.",
  PRODUCT_CATALOG:
    "LAYOUT STYLE — PRODUCT_CATALOG (/minimalcatalog): Pure e-commerce clean catalog aesthetic. The product stands on a seamless infinite solid or subtle light-gray gradient background. Perfectly even diffused light box illumination with zero distracting reflections. Crisp edge-to-edge focus (f/11), hyper-accurate colors and textures, conveying pristine commercial catalog perfection.",
  PRODUCT_COSMETICS:
    "LAYOUT STYLE — PRODUCT_COSMETICS (/luxurycosmetics): Luxury cosmetics and skincare advertising photography. Staged on a translucent acrylic ripple tray, delicate organic floral petals, golden texture droplets, and soft pastel studio backlighting. Refined beauty aesthetic.",
  PRODUCT_TECH:
    "LAYOUT STYLE — PRODUCT_TECH (/techfuturistic): Futuristic tech hardware aesthetic. Levitating in zero gravity with glowing cyan and purple neon rim accents, clean titanium finish, and modern volumetric studio lighting.",
  PRODUCT_FLATLAY:
    "LAYOUT STYLE — PRODUCT_FLATLAY (/flatlayknolling): Precise 90-degree top-down flat lay knolling photography. Geometrically aligned with complementary lifestyle props on textured linen or wooden surface, soft diffused overhead lighting.",
  PRODUCT_GOURMET:
    "LAYOUT STYLE — PRODUCT_GOURMET (/gourmetculinary): Commercial culinary food photography. Appetizing rich textures, delicate rising steam, warm restaurant ambient light, and mouthwatering macro focus.",
  PRODUCT_RUSTIC:
    "LAYOUT STYLE — PRODUCT_RUSTIC (/rusticorganic): Organic artisanal botanical setting. Resting on raw dark wood slab with dried eucalyptus, natural linen texture, and warm gentle sunbeams through a window.",
  CINEMATIC:
    "LAYOUT STYLE — CINEMATIC: Cinematic photography, dramatic lighting, deep cinematic shadows, 85mm f/1.8 lens, shallow depth of field, rich cinematic color grade, atmospheric lighting.",
  STUDIO_CLEAN:
    "LAYOUT STYLE — STUDIO_CLEAN: Professional studio photography, elegant seamless neutral backdrop, soft uniform diffused studio lighting, high-end commercial photo studio aesthetic.",
  URBAN_LIFESTYLE:
    "LAYOUT STYLE — URBAN_LIFESTYLE: Authentic lifestyle photography, real-world outdoor urban setting, natural daylight, candid energetic moment, relatable modern city environment.",
  MINIMALIST:
    "LAYOUT STYLE — MINIMALIST: Minimalist design, spacious composition with generous negative space (50-60%), modern clean aesthetic, sophisticated and quiet luxury feel.",
  TECH_3D:
    "LAYOUT STYLE — TECH_3D: Premium 3D illustration, Octane Render / Redshift render style, vibrant colors, realistic material textures (glass, metallic, polished plastic), futuristic tech aesthetic.",
  MAGAZINE_3D:
    "LAYOUT STYLE — MAGAZINE_3D: High-fashion magazine cover style, integrated typography with 3D depth, subject partially overlaps and breaks through the title letters creating a dramatic 3D parallax effect.",
};

interface LayoutStyleSelectorProps {
  value: string;
  onChange: (style: LayoutStyleId) => void;
  previewImages?: Partial<Record<LayoutStyleId, string>>;
}

export function LayoutStyleSelector({ value, onChange, previewImages }: LayoutStyleSelectorProps) {
  const [activeTab, setActiveTab] = React.useState<"all" | "product" | "branding">("all");

  const filteredStyles = React.useMemo(() => {
    if (activeTab === "all") return LAYOUT_STYLES;
    return LAYOUT_STYLES.filter((s) => s.id === "CLEAN_LUXURY" || s.category === activeTab);
  }, [activeTab]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">Estilo Visual do Layout</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Escolha o estilo de composição que a IA seguirá para criar sua imagem.
          </p>
        </div>

        {/* Abas de Categoria */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Todos ({LAYOUT_STYLES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("product")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-all flex items-center gap-1",
              activeTab === "product"
                ? "bg-white text-[#0083C7] shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <span>🛍️ Produtos</span>
            <span className="rounded-full bg-[#0083C7]/10 px-1.5 py-0.2 text-[10px] text-[#0083C7] font-bold">
              10
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("branding")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
              activeTab === "branding"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            🎨 Branding & Geral
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {filteredStyles.map((style) => {
          const isSelected =
            value === style.id ||
            (style.id === "CLEAN_LUXURY" && (value === "CLEAN_LUXURY" || value === "" || !value));
          const previewImg = previewImages?.[style.id] || style.image;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              title={style.description}
              className={cn(
                "relative flex flex-col rounded-xl border-2 overflow-hidden text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0083C7] group bg-white",
                isSelected
                  ? "border-[#0083C7] shadow-md shadow-[#0083C7]/20 scale-[1.02]"
                  : "border-gray-200 hover:border-[#0083C7]/50 hover:shadow-sm"
              )}
            >
              <div
                className={cn(
                  "w-full aspect-square flex items-center justify-center relative overflow-hidden bg-slate-900",
                  !previewImg ? `bg-gradient-to-br ${style.placeholderGradient}` : ""
                )}
              >
                {previewImg ? (
                  <img
                    src={previewImg}
                    alt={style.label}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span
                    className="text-2xl font-black select-none opacity-80 drop-shadow-sm text-white"
                    aria-hidden="true"
                  >
                    {style.icon}
                  </span>
                )}

                {style.slashCommand && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-mono font-semibold text-white/90">
                    {style.slashCommand}
                  </span>
                )}

                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0083C7] flex items-center justify-center shadow">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="px-2 py-1.5 bg-white flex-1">
                <p
                  className={cn(
                    "text-[11px] font-semibold leading-tight",
                    isSelected ? "text-[#0083C7]" : "text-gray-800"
                  )}
                >
                  {style.label}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5 truncate">
                  {style.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {value && LAYOUT_STYLES.find((s) => s.id === value) && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <span className="font-medium text-gray-700">
            {LAYOUT_STYLES.find((s) => s.id === value)!.label}:
          </span>{" "}
          {LAYOUT_STYLES.find((s) => s.id === value)!.description}
        </p>
      )}
      {!value && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <span className="font-medium text-gray-700">Automático:</span>{" "}
          A IA sorteia estilos comerciais diferentes a cada geração para máximo de variedade e surpresa criativa.
        </p>
      )}
    </div>
  );
}

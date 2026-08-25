"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type ProductPresetId =
  | ""
  | "AUTO"
  | "PRODUCT_BILLBOARD"
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

export interface ProductPresetOption {
  id: ProductPresetId;
  label: string;
  sublabel: string;
  description: string;
  placeholderGradient: string;
  icon: string;
  image?: string;
  slashCommand: string;
  suggestedPromptHint?: string;
}

export const PRODUCT_PRESETS: ProductPresetOption[] = [
  {
    id: "AUTO",
    label: "Automático",
    sublabel: "IA decide o estilo",
    description: "A IA analisa o seu produto e sorteia o estilo comercial mais atraente e impactante para ele.",
    placeholderGradient: "from-slate-700 via-slate-500 to-slate-400",
    icon: "⚡",
    slashCommand: "/auto",
  },
  {
    id: "PRODUCT_BILLBOARD",
    label: "Outdoor 3D",
    sublabel: "Campanha Urbana / /3dbillboard",
    description: "Mega outdoor 3D hiper-realista ao entardecer, com o produto em escala monumental, respingos dinâmicos e iluminação noturna urbana.",
    placeholderGradient: "from-emerald-800 via-teal-900 to-slate-900",
    icon: "🏙️",
    image: "/product-presets/3dbillboard.jpg",
    slashCommand: "/3dbillboard",
    suggestedPromptHint: "/3dbillboard",
  },
  {
    id: "PRODUCT_METAAD",
    label: "Anúncio Meta Ads",
    sublabel: "Alta Conversão",
    description: "Composição comercial com 45% a 55% de espaço negativo estratégico para títulos, preços e selos sem poluir o produto.",
    placeholderGradient: "from-blue-600 via-indigo-700 to-purple-800",
    icon: "📢",
    image: "/product-presets/metaad.jpg",
    slashCommand: "/metaad",
    suggestedPromptHint: "/metaad",
  },
  {
    id: "PRODUCT_PREMIUM",
    label: "Vitrine de Luxo",
    sublabel: "Pedestal de Mármore",
    description: "Produto sobre pódio arquitetônico de mármore de Carrara ou vidro fosco, iluminação suave de 3 pontos de estúdio e reflexos cáusticos.",
    placeholderGradient: "from-amber-600 via-yellow-700 to-stone-900",
    icon: "💎",
    image: "/product-presets/premiumshowcase.jpg",
    slashCommand: "/premiumshowcase",
    suggestedPromptHint: "/premiumshowcase",
  },
  {
    id: "PRODUCT_LIFESTYLE",
    label: "Produto em Uso",
    sublabel: "Cenário Real",
    description: "Produto integrado organicamente em uma residência contemporânea ou escritório sofisticado com luz natural matinal.",
    placeholderGradient: "from-emerald-700 via-teal-800 to-slate-900",
    icon: "🌿",
    image: "/product-presets/lifestylecontext.jpg",
    slashCommand: "/lifestylecontext",
    suggestedPromptHint: "/lifestylecontext",
  },
  {
    id: "PRODUCT_DYNAMIC",
    label: "Ação & Respingos",
    sublabel: "Splash 1/8000s",
    description: "Fotografia em alta velocidade (1/8000s) com gotas de água cristalinas congeladas no ar, gelo e sensação de energia.",
    placeholderGradient: "from-cyan-600 via-blue-700 to-sky-900",
    icon: "💧",
    image: "/product-presets/dynamicaction.jpg",
    slashCommand: "/dynamicaction",
    suggestedPromptHint: "/dynamicaction",
  },
  {
    id: "PRODUCT_CATALOG",
    label: "Catálogo Clean",
    sublabel: "E-commerce Fundo Infinito",
    description: "Fundo infinito claro/neutro, luz difusa sem sombras duras e foco de ponta a ponta (f/11) para marketplaces e e-commerce.",
    placeholderGradient: "from-neutral-200 via-zinc-300 to-slate-400",
    icon: "🏷️",
    image: "/product-presets/minimalcatalog.jpg",
    slashCommand: "/minimalcatalog",
    suggestedPromptHint: "/minimalcatalog",
  },
  {
    id: "PRODUCT_COSMETICS",
    label: "Cosméticos & Skincare",
    sublabel: "Beleza & Pureza",
    description: "Bandeja de acrílico translúcido ondulado, gotas douradas de textura, flores botânicas e estética etérea.",
    placeholderGradient: "from-pink-500 via-rose-600 to-amber-700",
    icon: "🌸",
    image: "/product-presets/luxurycosmetics.jpg",
    slashCommand: "/luxurycosmetics",
    suggestedPromptHint: "/luxurycosmetics",
  },
  {
    id: "PRODUCT_TECH",
    label: "Tecnologia 3D",
    sublabel: "Hardware Futurista",
    description: "Produto levitando em gravidade zero com iluminação de neon ciano/roxo e materiais de titânio escovado.",
    placeholderGradient: "from-violet-900 via-purple-700 to-cyan-500",
    icon: "🔮",
    image: "/product-presets/techfuturistic.jpg",
    slashCommand: "/techfuturistic",
    suggestedPromptHint: "/techfuturistic",
  },
  {
    id: "PRODUCT_FLATLAY",
    label: "Flat Lay 90°",
    sublabel: "Organização Zen",
    description: "Visão aérea ortogonal (top-down 90°) com alinhamento milimétrico e harmonioso sobre linho natural.",
    placeholderGradient: "from-amber-800 via-stone-700 to-neutral-800",
    icon: "📐",
    image: "/product-presets/flatlayknolling.jpg",
    slashCommand: "/flatlayknolling",
    suggestedPromptHint: "/flatlayknolling",
  },
  {
    id: "PRODUCT_GOURMET",
    label: "Gastronomia",
    sublabel: "Food Commercial",
    description: "Estética publicitária de alimentos com vapor suave, texturas crocantes e iluminação quente de restaurante.",
    placeholderGradient: "from-orange-700 via-amber-800 to-stone-900",
    icon: "🍔",
    image: "/product-presets/gourmetculinary.jpg",
    slashCommand: "/gourmetculinary",
    suggestedPromptHint: "/gourmetculinary",
  },
  {
    id: "PRODUCT_RUSTIC",
    label: "Rústico & Artesanal",
    sublabel: "Botânico & Madeira",
    description: "Madeira nobre crua, ramos botânicos de eucalipto, tecidos naturais e luz solar de janela.",
    placeholderGradient: "from-amber-900 via-yellow-900 to-emerald-950",
    icon: "🪵",
    image: "/product-presets/rusticorganic.jpg",
    slashCommand: "/rusticorganic",
    suggestedPromptHint: "/rusticorganic",
  },
];

export const PRODUCT_PRESET_TECHNICAL: Record<ProductPresetId, string> = {
  "": "",
  AUTO: "",
  PRODUCT_TECH:
    "LAYOUT STYLE — PRODUCT_TECH (/techfuturistic): High-conversion sci-fi tech commercial advertising poster / infographic product card. The product is the central hero resting on a futuristic glowing circular podium with ambient neon orange and cyan rim lighting. Sleek dark cyber-tech background with holographic HUD circular elements, benefit feature cards with glowing circular icons detailing specifications, bold high-contrast headline typography, and bottom specification badges. Professional e-commerce advertising grade.",
  PRODUCT_METAAD:
    "LAYOUT STYLE — PRODUCT_METAAD (/metaad): High-conversion Meta/Instagram advertising composition (OpenAI DALL-E & GPT-4o standard). The primary product is the clear hero, framed with deliberate 45-55% clean negative space (top or side area) reserved for ad copy, headlines, and call-to-actions. High-contrast commercial studio lighting with a soft key light and sharp edge separation rim light. True-to-life product proportions, textures, and vibrant commercial appeal.",
  PRODUCT_PREMIUM:
    "LAYOUT STYLE — PRODUCT_PREMIUM (/premiumshowcase): Ultra-luxury commercial product showcase poster. The product is elegantly staged on a geometric architectural pedestal (such as polished white Carrara marble, frosted translucent glass, or brushed metal). Three-point studio lighting with a large overhead softbox, subtle caustic reflections, soft contact shadows (ambient occlusion), and an ultra-clean minimalist luxury atmosphere. Shot on Phase One IQ4 150MP, 85mm f/1.4 lens.",
  PRODUCT_BILLBOARD:
    "LAYOUT STYLE — PRODUCT_BILLBOARD (/3dbillboard): 3D Outdoor Billboard Campaign Poster. A hyper-realistic 3D outdoor billboard at dusk featuring this exact product in monumental scale breaking through the billboard borders, with ambient city glow, dramatic volumetric spotlights, and sharp brand fidelity.",
  PRODUCT_LIFESTYLE:
    "LAYOUT STYLE — PRODUCT_LIFESTYLE (/lifestylecontext): Premium lifestyle product placement in an authentic, aspirational real-world setting (e.g. contemporary oak desk in a sunlit architectural studio, luxury spa marble counter, or designer kitchen). Warm natural side lighting from a nearby window, gentle soft-focus depth of field, and organic atmosphere that highlights how the product integrates into daily life.",
  PRODUCT_DYNAMIC:
    "LAYOUT STYLE — PRODUCT_DYNAMIC (/dynamicaction): High-speed commercial advertising action poster. The product is surrounded by suspended elements: crystal-clear high-speed frozen water droplets, dynamic liquid splashes, floating natural ingredients, or energetic light trails. Studio strobe lighting with 1/8000s shutter freeze effect, creating a fresh, energetic, and visually captivating hero visual.",
  PRODUCT_CATALOG:
    "LAYOUT STYLE — PRODUCT_CATALOG (/minimalcatalog): Pure e-commerce clean catalog aesthetic. The product stands on a seamless infinite solid or subtle light-gray gradient background. Perfectly even diffused light box illumination with zero distracting reflections. Crisp edge-to-edge focus (f/11), hyper-accurate colors and textures, conveying pristine commercial catalog perfection.",
  PRODUCT_COSMETICS:
    "LAYOUT STYLE — PRODUCT_COSMETICS (/luxurycosmetics): Luxury cosmetics and skincare advertising poster. Staged on a translucent acrylic ripple tray, delicate organic floral petals, golden texture droplets, and soft pastel studio backlighting. Refined beauty aesthetic.",
  PRODUCT_FLATLAY:
    "LAYOUT STYLE — PRODUCT_FLATLAY (/flatlayknolling): Precise 90-degree top-down flat lay knolling photography. Geometrically aligned with complementary lifestyle props on textured linen or wooden surface, soft diffused overhead lighting.",
  PRODUCT_GOURMET:
    "LAYOUT STYLE — PRODUCT_GOURMET (/gourmetculinary): Commercial culinary food advertising. Appetizing rich textures, delicate rising steam, warm restaurant ambient light, and mouthwatering macro focus.",
  PRODUCT_RUSTIC:
    "LAYOUT STYLE — PRODUCT_RUSTIC (/rusticorganic): Organic artisanal botanical product staging. Resting on raw dark wood slab with dried eucalyptus, natural linen texture, and warm gentle sunbeams through a window.",
};

interface ProductPresetSelectorProps {
  value: string;
  onChange: (preset: ProductPresetId, suggestedPrompt?: string) => void;
  className?: string;
}

export function ProductPresetSelector({ value, onChange, className }: ProductPresetSelectorProps) {
  const selectedPreset =
    PRODUCT_PRESETS.find(
      (p) => p.id === value || (p.id === "AUTO" && (value === "AUTO" || value === "" || !value))
    ) || PRODUCT_PRESETS[0];

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-sm font-semibold text-gray-800">Preset Visual de Fotografia do Produto</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Escolha o estilo de cenário, iluminação e composição publicitária para o seu produto.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRODUCT_PRESETS.map((preset) => {
          const isSelected =
            value === preset.id ||
            (preset.id === "AUTO" && (value === "AUTO" || value === "" || !value));

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.id, preset.suggestedPromptHint)}
              title={preset.description}
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
                  !preset.image ? `bg-gradient-to-br ${preset.placeholderGradient}` : ""
                )}
              >
                {preset.image ? (
                  <img
                    src={preset.image}
                    alt={preset.label}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span
                    className="text-3xl select-none drop-shadow-md text-white font-bold"
                    aria-hidden="true"
                  >
                    {preset.icon}
                  </span>
                )}

                {/* Tag de comando rápido no card */}
                {preset.slashCommand && preset.slashCommand !== "/auto" && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-mono font-semibold text-white/90">
                    {preset.slashCommand}
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

              <div className="px-2.5 py-2 bg-white flex-1 flex flex-col justify-between">
                <p
                  className={cn(
                    "text-[12px] font-bold leading-tight",
                    isSelected ? "text-[#0083C7]" : "text-gray-800"
                  )}
                >
                  {preset.label}
                </p>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5 truncate">
                  {preset.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Explicação técnica do preset selecionado */}
      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3.5 py-2.5 border border-gray-100 flex items-start gap-2">
        <span className="text-base leading-none mt-0.5">{selectedPreset.icon}</span>
        <p>
          <span className="font-semibold text-gray-800">{selectedPreset.label}:</span>{" "}
          {selectedPreset.description}
        </p>
      </div>
    </div>
  );
}

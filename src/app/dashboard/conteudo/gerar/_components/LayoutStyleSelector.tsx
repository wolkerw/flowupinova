"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type LayoutStyleId =
  | ""
  | "CINEMATIC"
  | "STUDIO_CLEAN"
  | "URBAN_LIFESTYLE"
  | "MINIMALIST"
  | "TECH_3D"
  | "MAGAZINE_3D";

/** IDs reais dos estilos (sem o AUTO vazio) — usado para sorteio */
export const LAYOUT_STYLE_IDS: LayoutStyleId[] = [
  "CINEMATIC",
  "STUDIO_CLEAN",
  "URBAN_LIFESTYLE",
  "MINIMALIST",
  "TECH_3D",
  "MAGAZINE_3D",
];

export interface LayoutStyleOption {
  id: LayoutStyleId;
  label: string;
  sublabel: string;
  description: string;
  placeholderGradient: string;
  icon: string;
  image?: string;
}

export const LAYOUT_STYLES: LayoutStyleOption[] = [
  {
    id: "",
    label: "Automático",
    sublabel: "IA decide o estilo",
    description: "A IA sorteia 2 estilos diferentes a cada geração para máximo de variedade e surpresa criativa.",
    placeholderGradient: "from-slate-700 via-slate-500 to-slate-400",
    icon: "A",
  },
  {
    id: "CINEMATIC",
    label: "Cinematográfico",
    sublabel: "Luz Dramática",
    description: "Fotografia cinematográfica, luz dramática, sombras profundas, lente 85mm f/1.8.",
    placeholderGradient: "from-amber-950 via-red-900 to-stone-900",
    icon: "🎬",
  },
  {
    id: "STUDIO_CLEAN",
    label: "Estúdio Clean",
    sublabel: "Fundo Neutro",
    description: "Fotografia de estúdio, fundo neutro elegante, iluminação suave e uniforme.",
    placeholderGradient: "from-gray-100 via-zinc-200 to-slate-300",
    icon: "📸",
  },
  {
    id: "URBAN_LIFESTYLE",
    label: "Urbano / Lifestyle",
    sublabel: "Dia a Dia Real",
    description: "Estilo lifestyle autêntico, ambiente urbano real, luz do dia natural.",
    placeholderGradient: "from-blue-800 via-indigo-600 to-sky-400",
    icon: "🏙️",
  },
  {
    id: "MINIMALIST",
    label: "Minimalista",
    sublabel: "Espaçoso & Sofisticado",
    description: "Design minimalista, composição espaçosa, estética moderna, sofisticada e limpa.",
    placeholderGradient: "from-neutral-100 via-stone-200 to-zinc-400",
    icon: "✨",
  },
  {
    id: "TECH_3D",
    label: "Tecnologia 3D",
    sublabel: "Octane / Redshift",
    description: "Ilustração 3D premium, renderização estilo Octane/Redshift, cores vibrantes, materiais realistas.",
    placeholderGradient: "from-violet-900 via-purple-700 to-pink-500",
    icon: "💎",
    image: "/layout-styles/tech-3d.png",
  },
  {
    id: "MAGAZINE_3D",
    label: "Magazine 3D",
    sublabel: "Capa de Revista",
    description: "Estilo capa de revista de alta moda, tipografia integrada com profundidade 3D (sujeito sobrepõe parcialmente as letras do título).",
    placeholderGradient: "from-rose-900 via-pink-700 to-orange-500",
    icon: "📰",
    image: "/layout-styles/magazine-3d.png",
  },
];

export const LAYOUT_STYLE_TECHNICAL: Record<LayoutStyleId, string> = {
  "": "",
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
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-800">Estilo Visual do Layout</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Escolha o estilo de composicao que a IA seguira para criar sua imagem.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LAYOUT_STYLES.map((style) => {
          const isSelected = value === style.id;
          const previewImg = previewImages?.[style.id] || style.image;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              title={style.description}
              className={[
                "relative flex flex-col rounded-xl border-2 overflow-hidden text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0083C7] group",
                isSelected
                  ? "border-[#0083C7] shadow-md shadow-[#0083C7]/20 scale-[1.02]"
                  : "border-gray-200 hover:border-[#0083C7]/50 hover:shadow-sm",
              ].join(" ")}
            >
              <div
                className={[
                  "w-full aspect-square flex items-center justify-center relative overflow-hidden",
                  !previewImg ? `bg-gradient-to-br ${style.placeholderGradient}` : "",
                ].join(" ")}
              >
                {previewImg ? (
                  <img
                    src={previewImg}
                    alt={style.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className="text-2xl font-black select-none opacity-80 drop-shadow-sm text-white"
                    aria-hidden="true"
                  >
                    {style.icon}
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
                  className={[
                    "text-[11px] font-semibold leading-tight",
                    isSelected ? "text-[#0083C7]" : "text-gray-800",
                  ].join(" ")}
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
          <span className="font-medium text-gray-700">Automatico:</span>{" "}
          A IA sorteia 2 estilos diferentes a cada geracao para maximo de variedade e surpresa.
        </p>
      )}
    </div>
  );
}

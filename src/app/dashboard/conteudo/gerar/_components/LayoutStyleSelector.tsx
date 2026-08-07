"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type LayoutStyleId =
  | ""
  | "MAGAZINE_3D"
  | "CLEAN_LUXURY"
  | "UGC_CINEMATIC";

/** IDs reais dos estilos (sem o AUTO vazio) — usado para sorteio */
export const LAYOUT_STYLE_IDS: LayoutStyleId[] = [
  "MAGAZINE_3D",
  "CLEAN_LUXURY",
  "UGC_CINEMATIC",
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
    label: "Automatico",
    sublabel: "IA decide o estilo",
    description: "A IA sorteia 2 estilos diferentes a cada geracao para maximo de variedade e surpresa criativa.",
    placeholderGradient: "from-slate-700 via-slate-500 to-slate-400",
    icon: "A",
  },
  {
    id: "MAGAZINE_3D",
    label: "Efeito Capa de Revista",
    sublabel: "Texto em 3D",
    description: "O texto principal fica atras do produto ou da pessoa, criando um efeito de profundidade 3D digno de capa de revista.",
    placeholderGradient: "from-rose-900 via-pink-700 to-orange-500",
    icon: "P",
    image: "/layout-styles/magazine-3d.png",
  },
  {
    id: "CLEAN_LUXURY",
    label: "Minimalista & Sofisticado",
    sublabel: "Espaco Neutro",
    description: "Uma imagem limpa com bastante espaco em branco, iluminacao suave e texto discreto. Ideal para transmitir luxo e exclusividade.",
    placeholderGradient: "from-gray-100 via-stone-200 to-zinc-300",
    icon: "M",
    image: "/layout-styles/clean-luxury.png",
  },
  {
    id: "UGC_CINEMATIC",
    label: "Estilo Vida Real",
    sublabel: "Foto Espontanea",
    description: "Cena natural do dia a dia com iluminacao de cinema. Passa a sensacao de um momento real e autentico capturado na hora.",
    placeholderGradient: "from-amber-800 via-orange-600 to-yellow-500",
    icon: "C",
    image: "/layout-styles/ugc-cinematic.png",
  },
];

export const LAYOUT_STYLE_TECHNICAL: Record<LayoutStyleId, string> = {
  "": "",
  MAGAZINE_3D:
    "LAYOUT STYLE — MAGAZINE_3D: High-fashion depth-of-field, main subject overlaps and breaks through the typographic title plane creating a dramatic 3D parallax effect. Bold editorial serif headlines partially hidden behind the subject. Layered, complex composition. Magazine cover aesthetic.",
  CLEAN_LUXURY:
    "LAYOUT STYLE — CLEAN_LUXURY: Generous negative space dominates the frame (50-60% clean area). Minimalist typography discreetly placed in corners or edges. Soft, diffused ambient light. Understated elegance, ultra-premium feel. No clutter.",
  UGC_CINEMATIC:
    "LAYOUT STYLE — UGC_CINEMATIC: Authentic lifestyle scene captured in a candid, spontaneous moment. Natural volumetric lighting from a window or outdoor source. Subtle, clean text legend overlay at the bottom. Real, human, and relatable atmosphere. Cinematic color grade.",
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

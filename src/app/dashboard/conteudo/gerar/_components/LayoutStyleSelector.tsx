"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type LayoutStyleId =
  | "MAGAZINE_3D"
  | "CLEAN_LUXURY"
  | "UGC_CINEMATIC"
  | "SPLIT_LAYOUT"
  | "GLASSMORPHISM"
  | "TYPOGRAPHIC_HERO"
  | "ENVIRONMENTAL_TEXT"
  | "DARK_SPOTLIGHT";

export interface LayoutStyleOption {
  id: LayoutStyleId;
  label: string;
  sublabel: string;
  description: string;
  placeholderGradient: string;
  icon: string;
}

export const LAYOUT_STYLES: LayoutStyleOption[] = [
  {
    id: "MAGAZINE_3D",
    label: "Efeito Capa de Revista",
    sublabel: "Texto em 3D",
    description: "O texto principal fica atras do produto ou da pessoa, criando um efeito de profundidade 3D digno de capa de revista.",
    placeholderGradient: "from-rose-900 via-pink-700 to-orange-500",
    icon: "P",
  },
  {
    id: "CLEAN_LUXURY",
    label: "Minimalista & Sofisticado",
    sublabel: "Espaco Neutro",
    description: "Uma imagem limpa com bastante espaco em branco, iluminacao suave e texto discreto. Ideal para transmitir luxo e exclusividade.",
    placeholderGradient: "from-gray-100 via-stone-200 to-zinc-300",
    icon: "M",
  },
  {
    id: "UGC_CINEMATIC",
    label: "Estilo Vida Real",
    sublabel: "Foto Espontanea",
    description: "Cena natural do dia a dia com iluminacao de cinema. Passa a sensacao de um momento real e autentico capturado na hora.",
    placeholderGradient: "from-amber-800 via-orange-600 to-yellow-500",
    icon: "C",
  },
  {
    id: "SPLIT_LAYOUT",
    label: "Foto e Cartao de Texto",
    sublabel: "Layout Lado a Lado",
    description: "Divide o post em duas partes: de um lado a foto em destaque, do outro um bloco de cor com o texto super organizado.",
    placeholderGradient: "from-blue-900 via-indigo-700 to-violet-600",
    icon: "S",
  },
  {
    id: "GLASSMORPHISM",
    label: "Painel Moderno de Vidro",
    sublabel: "Efeito Tecnologia",
    description: "O texto fica dentro de um cartao flutuante com efeito de vidro fosco por cima da imagem. Perfeito para inovacao e tecnologia.",
    placeholderGradient: "from-cyan-600 via-teal-500 to-emerald-400",
    icon: "G",
  },
  {
    id: "TYPOGRAPHIC_HERO",
    label: "Frase em Destaque",
    sublabel: "Texto Protagonista",
    description: "Sua frase ou mensagem e a estrela do post com letras grandes e marcantes. A imagem entra em tamanho reduzido no canto.",
    placeholderGradient: "from-fuchsia-900 via-purple-700 to-violet-500",
    icon: "T",
  },
  {
    id: "ENVIRONMENTAL_TEXT",
    label: "Texto Integrado a Foto",
    sublabel: "Projecao Realista",
    description: "O texto parece ter sido gravado, desenhado ou projetado na propria parede, objeto ou cenario ao fundo da foto.",
    placeholderGradient: "from-lime-700 via-green-600 to-emerald-500",
    icon: "E",
  },
  {
    id: "DARK_SPOTLIGHT",
    label: "Efeito Holofote Escuro",
    sublabel: "Modo Noturno Premium",
    description: "Fundo escuro com foco de luz brilhante e direto no produto. Gera um visual forte, elegante e tecnologico.",
    placeholderGradient: "from-gray-950 via-slate-800 to-zinc-700",
    icon: "D",
  },
];

export const LAYOUT_STYLE_TECHNICAL: Record<LayoutStyleId, string> = {
  MAGAZINE_3D:
    "LAYOUT STYLE — MAGAZINE_3D: High-fashion depth-of-field, main subject overlaps and breaks through the typographic title plane creating a dramatic 3D parallax effect. Bold editorial serif headlines partially hidden behind the subject. Layered, complex composition. Magazine cover aesthetic.",
  CLEAN_LUXURY:
    "LAYOUT STYLE — CLEAN_LUXURY: Generous negative space dominates the frame (50-60% clean area). Minimalist typography discreetly placed in corners or edges. Soft, diffused ambient light. Understated elegance, ultra-premium feel. No clutter.",
  UGC_CINEMATIC:
    "LAYOUT STYLE — UGC_CINEMATIC: Authentic lifestyle scene captured in a candid, spontaneous moment. Natural volumetric lighting from a window or outdoor source. Subtle, clean text legend overlay at the bottom. Real, human, and relatable atmosphere. Cinematic color grade.",
  SPLIT_LAYOUT:
    "LAYOUT STYLE — SPLIT_LAYOUT: Geometric hard-edge division splits the frame into two distinct zones — one side contains a crisp high-resolution photo, the other is a solid bold-color container block holding structured typographic information. Sharp, editorial, corporate.",
  GLASSMORPHISM:
    "LAYOUT STYLE — GLASSMORPHISM: A semi-transparent frosted glass card floats in the center of the composition over a softly blurred bokeh backdrop. The text lives inside the glass panel. The background is dreamlike and out-of-focus. Futuristic, tech, modern.",
  TYPOGRAPHIC_HERO:
    "LAYOUT STYLE — TYPOGRAPHIC_HERO: Giant, expressive, bold headline text is the primary visual hero element — it occupies 60-70% of the frame. A small product or illustrative accent is anchored in a corner as a supporting element. Pure typographic power.",
  ENVIRONMENTAL_TEXT:
    "LAYOUT STYLE — ENVIRONMENTAL_TEXT: The text is naturally integrated into the 3D scene environment, appearing as if it was painted, projected, or embossed onto real-world surfaces — walls, floors, windows, or objects. Realistic shadows and perspective distortion applied to text.",
  DARK_SPOTLIGHT:
    "LAYOUT STYLE — DARK_SPOTLIGHT: Dramatic, near-black background. Intense, narrow side-lighting or top-spot creates a theatrical spotlight effect on the product or subject. High-contrast white or luminous typography. Luxurious, powerful, night-premium aesthetic.",
};

interface LayoutStyleSelectorProps {
  value: LayoutStyleId;
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
          const previewImg = previewImages?.[style.id];

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

      {LAYOUT_STYLES.find((s) => s.id === value) && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <span className="font-medium text-gray-700">
            {LAYOUT_STYLES.find((s) => s.id === value)!.label}:
          </span>{" "}
          {LAYOUT_STYLES.find((s) => s.id === value)!.description}
        </p>
      )}
    </div>
  );
}

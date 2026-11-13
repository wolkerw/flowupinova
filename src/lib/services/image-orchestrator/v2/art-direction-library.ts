/**
 * Biblioteca de direções de arte do motor de prompt v2.
 *
 * Cada direção é uma "família" visual de agência, com luz, câmera e composição próprias,
 * para que as artes variem de verdade (e não só de cor). Nenhuma direção usa os clichês
 * típicos de imagem gerada por IA (fitas de neon, cartões de vidro flutuando, objetos
 * levitando, luz azul e laranja, bokeh em tudo).
 *
 * A escolha é por adequação (objetivo, nicho, presença de produto/pessoas) e evita repetir
 * as últimas direções usadas pelo mesmo cliente.
 */

import type { AIImageObjective } from "@/lib/types/ai-image-general";

export type PeoplePolicy = "none" | "optional" | "required";

export interface ArtDirection {
  id: string;
  labelPt: string;
  /** Objetivos da Etapa 3 em que a direção funciona bem. */
  objectives: AIImageObjective[] | string[];
  /** Palavras do nicho/briefing que aumentam a adequação. */
  nicheHints: string[];
  people: PeoplePolicy;
  /** Funciona com foto real de produto enviada pelo cliente. */
  productFriendly: boolean;
  /** Cena e composição (inglês, positivo, 1–2 frases). */
  sceneEn: string;
  lightEn: string;
  cameraEn: string;
  /** Onde o texto respira naturalmente nesta direção. */
  textZoneEn: string;
}

export const ART_DIRECTIONS: ArtDirection[] = [
  {
    id: "seamless_color_still_life",
    labelPt: "Still life editorial em papel colorido",
    objectives: ["commercial", "ad", "social", "flyer"],
    nicheHints: ["cosmético", "beleza", "perfume", "skincare", "bebida", "garrafa", "pote", "embalagem", "produto", "suplemento", "doce", "chocolate"],
    people: "none",
    productFriendly: true,
    sceneEn:
      "Editorial still life: the hero object placed on a simple geometric block on a seamless paper backdrop in a single solid brand color, with one or two supporting props that tell the product's story",
    lightEn: "hard direct flash from the side creating a crisp graphic cast shadow",
    cameraEn: "medium shot at eye level, 70mm lens, everything in sharp focus",
    textZoneEn: "clean solid-color area above or beside the object",
  },
  {
    id: "color_block_set",
    labelPt: "Cenografia em blocos de cor",
    objectives: ["social", "ad", "concept", "creative", "commercial"],
    nicheHints: ["moda", "roupa", "loja", "varejo", "jovem", "app", "tecnologia", "educação", "curso", "evento"],
    people: "optional",
    productFriendly: true,
    sceneEn:
      "Graphic set design built from flat planes of color (arches, steps, cylinders) in the brand palette, the subject placed precisely within the shapes like a sculpture",
    lightEn: "soft even studio light with gentle shadows that reveal the geometry",
    cameraEn: "straight-on frontal view, 50mm lens, symmetrical and orderly",
    textZoneEn: "one of the flat color planes, aligned to the set geometry",
  },
  {
    id: "documentary_real_business",
    labelPt: "Fotografia documental do negócio real",
    objectives: ["social", "presentation", "institutional"],
    nicheHints: ["restaurante", "padaria", "pizzaria", "café", "oficina", "mecânica", "salão", "barbearia", "clínica", "academia", "ateliê", "fábrica", "obra", "construção", "serviço"],
    people: "required",
    productFriendly: false,
    sceneEn:
      "Candid documentary moment inside the real business: the people who work there mid-action, doing the craft, surrounded by the genuine tools and materials of the trade",
    lightEn: "available natural light from windows and practical lamps, honest and warm",
    cameraEn: "35mm lens at working distance, slight film grain, unposed",
    textZoneEn: "a calm, less busy part of the frame such as a wall or the floor",
  },
  {
    id: "environmental_portrait",
    labelPt: "Retrato ambiental do profissional",
    objectives: ["presentation", "institutional", "social"],
    nicheHints: ["consultoria", "advocacia", "advogado", "contador", "contabilidade", "médico", "dentista", "arquiteto", "corretor", "imobiliária", "coach", "psicólogo", "fundador", "dono"],
    people: "required",
    productFriendly: false,
    sceneEn:
      "Environmental portrait of the professional in their own workspace, relaxed and confident, the space telling what they do",
    lightEn: "soft window light from one side with natural falloff into shadow",
    cameraEn: "50mm lens, chest-up to waist-up framing, eye contact with the camera",
    textZoneEn: "the open side of the frame opposite the person",
  },
  {
    id: "direct_flash_editorial",
    labelPt: "Editorial com flash direto",
    objectives: ["social", "ad", "thumbnail"],
    nicheHints: ["moda", "roupa", "acessório", "óculos", "tênis", "festa", "bar", "drink", "música", "jovem"],
    people: "required",
    productFriendly: true,
    sceneEn:
      "Bold fashion-editorial moment with a playful, confident pose and the product clearly featured, against a simple saturated background",
    lightEn: "on-camera direct flash, crisp hard shadows, punchy saturated color",
    cameraEn: "35mm lens, slightly low angle, energetic framing",
    textZoneEn: "the flat background area around the subject",
  },
  {
    id: "macro_texture",
    labelPt: "Macro sensorial de textura",
    objectives: ["concept", "creative", "commercial", "social"],
    nicheHints: ["comida", "café", "chocolate", "pão", "carne", "fruta", "tecido", "madeira", "pele", "cosmético", "creme", "bebida", "artesanal"],
    people: "none",
    productFriendly: false,
    sceneEn:
      "Extreme macro close-up where the material or ingredient itself becomes the image, abstract yet instantly recognizable and appetizing",
    lightEn: "low raking light that sculpts the texture",
    cameraEn: "100mm macro lens, shallow focus plane",
    textZoneEn: "the softer out-of-focus band of the frame",
  },
  {
    id: "single_light_plinth",
    labelPt: "Produto em pedestal com uma luz só",
    objectives: ["commercial", "presentation", "ad"],
    nicheHints: ["joia", "relógio", "perfume", "vinho", "premium", "luxo", "eletrônico", "caixa de som", "equipamento", "cosmético", "embalagem"],
    people: "none",
    productFriendly: true,
    sceneEn:
      "Quiet-luxury product portrait: the object alone on a stone or wood plinth with generous negative space around it",
    lightEn: "a single directional light source, deep soft shadows, restrained and elegant",
    cameraEn: "85mm lens, slightly low angle that gives the product presence",
    textZoneEn: "the large negative space above the plinth",
  },
  {
    id: "swiss_typographic_poster",
    labelPt: "Pôster tipográfico de grid suíço",
    objectives: ["ad", "social", "flyer", "thumbnail", "concept"],
    nicheHints: ["promoção", "oferta", "desconto", "evento", "lançamento", "curso", "palestra", "serviço", "tecnologia", "app"],
    people: "optional",
    productFriendly: true,
    sceneEn:
      "Design-led poster: a solid brand-color field organized on a strict asymmetric grid, a cut-out photo of the subject, the headline set large as the main graphic element",
    lightEn: "clean studio light on the cut-out subject",
    cameraEn: "flat graphic layout, no perspective distortion",
    textZoneEn: "the dominant grid column, set large and flush left",
  },
  {
    id: "flat_lay_grid",
    labelPt: "Flat lay organizado em grade",
    objectives: ["commercial", "social", "flyer"],
    nicheHints: ["kit", "combo", "papelaria", "ferramenta", "cosmético", "acessório", "comida", "ingrediente", "material", "loja"],
    people: "none",
    productFriendly: true,
    sceneEn:
      "Overhead flat lay with the items arranged in a precise grid (knolling) on a solid colored surface, the hero item slightly larger at the visual center",
    lightEn: "soft top light with short, clean shadows",
    cameraEn: "top-down 90-degree view, 50mm lens",
    textZoneEn: "an empty cell of the grid",
  },
  {
    id: "architectural_shadow",
    labelPt: "Sombras arquitetônicas de sol",
    objectives: ["social", "presentation", "commercial", "institutional"],
    nicheHints: ["imobiliária", "imóvel", "arquitetura", "decoração", "móveis", "cosmético", "moda", "spa", "bem-estar", "verão"],
    people: "optional",
    productFriendly: true,
    sceneEn:
      "Sunlit scene where hard shadows of window blinds, plants or architecture fall across the subject and wall, creating rhythm and atmosphere",
    lightEn: "strong late-afternoon sun with crisp patterned shadows",
    cameraEn: "50mm lens, calm balanced composition",
    textZoneEn: "a sunlit plain wall area",
  },
  {
    id: "visual_metaphor",
    labelPt: "Metáfora visual / trocadilho visual",
    objectives: ["concept", "creative", "ad", "social"],
    nicheHints: ["serviço", "seguro", "finanças", "consultoria", "tecnologia", "app", "marketing", "educação", "saúde"],
    people: "optional",
    productFriendly: false,
    sceneEn:
      "A single clever visual metaphor that turns the main benefit into one unexpected, simple image, staged with real objects on a minimal set",
    lightEn: "clean soft studio light that keeps the idea readable",
    cameraEn: "50mm lens, centered and simple, nothing competing with the idea",
    textZoneEn: "the empty space around the central idea",
  },
  {
    id: "analog_film_lifestyle",
    labelPt: "Lifestyle em filme analógico",
    objectives: ["social", "commercial"],
    nicheHints: ["café", "restaurante", "viagem", "turismo", "moda", "pet", "família", "casa", "bem-estar", "esporte"],
    people: "required",
    productFriendly: true,
    sceneEn:
      "Real customers enjoying the product or service in an everyday moment, spontaneous and warm, nobody looking at the camera",
    lightEn: "natural daylight, gentle and slightly warm",
    cameraEn: "medium-format film look, muted natural tones, fine grain",
    textZoneEn: "the quieter side of the frame",
  },
  {
    id: "mixed_media_collage",
    labelPt: "Colagem mista",
    objectives: ["concept", "creative", "social"],
    nicheHints: ["arte", "cultura", "educação", "evento", "música", "moda", "criativo", "agência", "jovem"],
    people: "optional",
    productFriendly: true,
    sceneEn:
      "Mixed-media collage: cut-out photographs, torn paper textures and hand-drawn marks in the brand colors, composed with editorial rhythm",
    lightEn: "even flat light as on a scanned artwork",
    cameraEn: "flat artwork, frontal",
    textZoneEn: "a paper strip or block within the collage",
  },
  {
    id: "dark_glossy_hero",
    labelPt: "Produto herói em superfície escura e brilhante",
    objectives: ["ad", "commercial", "thumbnail"],
    nicheHints: ["eletrônico", "carro", "automotivo", "bebida", "cerveja", "perfume", "tecnologia", "equipamento", "caixa de som", "relógio"],
    people: "none",
    productFriendly: true,
    sceneEn:
      "Low-angle hero shot of the product on a dark glossy surface with a clean mirror reflection, nothing else in the frame",
    lightEn: "long soft strip lights tracing the product's contours, controlled highlights",
    cameraEn: "90mm lens, low angle, product fills the center third",
    textZoneEn: "the dark area above the product",
  },
];

export interface DirectionSelectionInput {
  objective?: string;
  segment?: string;
  brief?: string;
  hasProductReference?: boolean;
  /** Últimas direções usadas por este cliente (mais recente primeiro). */
  recentIds?: string[];
  /** Quantas direções recentes evitar. */
  avoidLast?: number;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Pontua as direções por adequação e devolve as melhores candidatas, sem repetir as recentes.
 * Determinística para a mesma entrada (facilita testes e comparação v1 x v2).
 */
export function selectArtDirections(input: DirectionSelectionInput, count = 3): ArtDirection[] {
  const objective = (input.objective || "commercial").toLowerCase();
  const haystack = normalize(`${input.segment || ""} ${input.brief || ""}`);
  const avoid = new Set((input.recentIds || []).slice(0, input.avoidLast ?? 3));

  const scored = ART_DIRECTIONS.map((d, index) => {
    let score = 0;
    if ((d.objectives as string[]).includes(objective)) score += 3;
    for (const hint of d.nicheHints) {
      if (haystack.includes(normalize(hint))) score += 2;
    }
    if (input.hasProductReference) score += d.productFriendly ? 2 : -4;
    if (avoid.has(d.id)) score -= 10;
    return { d, score, index };
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, count).map((s) => s.d);
}

export function getArtDirection(id: string | undefined): ArtDirection | undefined {
  return ART_DIRECTIONS.find((d) => d.id === id);
}

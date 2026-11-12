/**
 * Biblioteca de layouts dos slides internos do carrossel NumVapt.
 *
 * Os 22 layouts reproduzem os padrões mais recorrentes nos templates gratuitos
 * de carrossel para Instagram da Figma Community (lista numerada, número em
 * destaque, citação, comparação, passo a passo, checklist, CTA...). São
 * desenhos originais da NumVapt: nenhum arquivo de terceiros foi copiado, então
 * não há atribuição ou licença a cumprir.
 *
 * Grid: canvas 1080×1350 (4:5), margem de segurança 80px, área útil de texto
 * entre y≈170 e y≈1180 (o topo e o rodapé ficam com numeração, logo e "arraste").
 * Todas as cores são tokens extraídos da capa — trocar a capa recolore tudo.
 */

import type { CarouselLayout, TextStyle } from "./types";

const W = 1080;
const M = 80;
const CW = W - M * 2; // 920
const CONTENT_BOTTOM = 1180;

const TITLE: TextStyle = {
  font: "heading",
  weight: "token",
  maxSize: 84,
  minSize: 40,
  lineHeight: 1.12,
  color: "text",
};

const BODY: TextStyle = {
  font: "body",
  weight: "400",
  maxSize: 46,
  minSize: 26,
  lineHeight: 1.38,
  color: "muted",
};

const KICKER: TextStyle = {
  font: "heading",
  weight: "700",
  maxSize: 28,
  minSize: 22,
  lineHeight: 1.2,
  color: "accent",
  uppercase: true,
  letterSpacing: 4,
};

const DEFAULT_CHROME = {
  counter: "pill",
  counterPos: "top-left",
  swipe: "pill",
  logo: "bottom-left",
} as const;

export const CAROUSEL_LAYOUTS: CarouselLayout[] = [
  // ---------------------------------------------------------------- TEXTO --
  {
    id: "classico-barra",
    name: "Clássico com barra",
    description: "Título com barra vertical de destaque e texto de apoio. Funciona em qualquer slide.",
    category: "texto",
    pattern: "Editorial left-aligned (título + corpo)",
    tipos: ["contexto", "ponto_principal", "complemento", "desenvolvimento", "prova_resumo"],
    requires: [],
    background: "bg",
    chrome: DEFAULT_CHROME,
    nodes: [
      { kind: "rect", box: { x: M, y: 300, w: 10, h: 10 }, fill: "accent", radius: 5, wrap: { id: "t", padX: 0, padY: 8, axis: "y" } },
      { kind: "text", id: "t", box: { x: M + 34, y: 300, w: CW - 34, h: 320 }, text: "{{titulo}}", ...TITLE },
      { kind: "text", id: "b", box: { x: M + 34, y: 0, w: CW - 34, h: CONTENT_BOTTOM }, stackAfter: { id: "t", gap: 48 }, text: "{{texto}}", ...BODY },
    ],
  },
  {
    id: "titulo-gigante",
    name: "Título gigante",
    description: "Uma frase de impacto ocupando o slide, com fio de destaque e apoio curto.",
    category: "texto",
    pattern: "Big statement / bold typography",
    tipos: ["contexto", "ponto_principal", "complemento"],
    requires: [],
    background: "bg",
    chrome: { ...DEFAULT_CHROME, counter: "text", counterPos: "top-right" },
    nodes: [
      { kind: "text", id: "t", box: { x: M, y: 220, w: CW, h: 560 }, text: "{{titulo}}", ...TITLE, weight: "900", maxSize: 112, minSize: 52, lineHeight: 1.04, align: "center", valign: "middle" },
      { kind: "rect", id: "fio", box: { x: W / 2 - 60, y: 0, w: 120, h: 10 }, stackAfter: { id: "t", gap: 44 }, fill: "accent", radius: 5 },
      { kind: "text", box: { x: M + 40, y: 0, w: CW - 80, h: CONTENT_BOTTOM }, stackAfter: { id: "fio", gap: 44 }, text: "{{texto}}", ...BODY, maxSize: 42, align: "center" },
    ],
  },
  {
    id: "marca-texto",
    name: "Marca-texto",
    description: "Título com marca-texto na cor de destaque atrás de cada linha e grafismo de pontos.",
    category: "texto",
    pattern: "Highlighted headline",
    tipos: ["contexto", "ponto_principal", "complemento", "desenvolvimento"],
    requires: [],
    background: "bg",
    chrome: DEFAULT_CHROME,
    nodes: [
      { kind: "dots", box: { x: 700, y: 880, w: 300, h: 260 }, spacing: 36, radius: 5, fill: "secondary", opacity: 0.45 },
      { kind: "text", id: "t", box: { x: M + 16, y: 290, w: CW - 32, h: 380 }, text: "{{titulo}}", ...TITLE, weight: "800", color: "onAccent", lineHeight: 1.32, highlight: { color: "accent", padX: 16, padY: 4 } },
      { kind: "text", box: { x: M, y: 0, w: CW - 120, h: CONTENT_BOTTOM - 60 }, stackAfter: { id: "t", gap: 56 }, text: "{{texto}}", ...BODY },
    ],
  },
  {
    id: "faixa-diagonal",
    name: "Faixa diagonal",
    description: "Faixa inclinada na cor de destaque com o título; texto de apoio abaixo.",
    category: "texto",
    pattern: "Diagonal band / dynamic stripe",
    tipos: ["contexto", "ponto_principal", "desenvolvimento"],
    requires: [],
    background: "bg",
    chrome: DEFAULT_CHROME,
    nodes: [
      { kind: "polygon", points: [[0, 380], [W, 250], [W, 570], [0, 700]], fill: "accent" },
      { kind: "text", box: { x: M, y: 395, w: CW, h: 160 }, text: "{{titulo}}", ...TITLE, color: "onAccent", maxSize: 60, minSize: 32, lineHeight: 1.08, valign: "middle" },
      { kind: "text", box: { x: M, y: 780, w: CW, h: CONTENT_BOTTOM - 780 }, text: "{{texto}}", ...BODY },
    ],
  },
  {
    id: "moldura-editorial",
    name: "Moldura editorial",
    description: "Moldura fina, rótulo do tipo de slide e texto centralizado, estilo revista.",
    category: "texto",
    pattern: "Editorial frame / magazine",
    tipos: ["contexto", "ponto_principal", "complemento", "prova_resumo"],
    requires: [],
    background: "bg",
    chrome: { counter: "text", counterPos: "bottom-center", swipe: "none", logo: "none" },
    nodes: [
      { kind: "rect", box: { x: 48, y: 48, w: W - 96, h: 1254 }, stroke: "text", strokeWidth: 2, radius: 0, opacity: 0.4 },
      { kind: "text", id: "k", box: { x: M, y: 250, w: CW, h: 40 }, text: "{{rotuloTipo}}", ...KICKER, align: "center" },
      { kind: "text", id: "t", box: { x: M + 30, y: 0, w: CW - 60, h: 760 }, stackAfter: { id: "k", gap: 48 }, text: "{{titulo}}", ...TITLE, maxSize: 74, align: "center" },
      { kind: "line", id: "fio", points: [[W / 2 - 50, 0], [W / 2 + 50, 0]], stackAfter: { id: "t", gap: 48 }, stroke: "accent", strokeWidth: 4 },
      { kind: "text", box: { x: M + 60, y: 0, w: CW - 120, h: 1150 }, stackAfter: { id: "fio", gap: 48 }, text: "{{texto}}", ...BODY, maxSize: 42, align: "center" },
    ],
  },
  {
    id: "card-central",
    name: "Cartão central",
    description: "Conteúdo dentro de um cartão com cantos da capa e selo numerado.",
    category: "texto",
    pattern: "Card UI / floating panel",
    tipos: ["contexto", "ponto_principal", "complemento", "desenvolvimento", "prova_resumo"],
    requires: [],
    background: "bg",
    chrome: DEFAULT_CHROME,
    nodes: [
      { kind: "rect", box: { x: M, y: 190, w: CW, h: 960 }, fill: "surface", radius: { token: 16 } },
      { kind: "ellipse", box: { x: M + 56, y: 250, w: 96, h: 96 }, fill: "accent" },
      { kind: "text", box: { x: M + 56, y: 250, w: 96, h: 96 }, text: "{{n}}", font: "heading", weight: "800", maxSize: 44, minSize: 30, color: "onAccent", align: "center", valign: "middle" },
      { kind: "text", id: "t", box: { x: M + 56, y: 400, w: CW - 112, h: 320 }, text: "{{titulo}}", ...TITLE, maxSize: 72 },
      { kind: "text", box: { x: M + 56, y: 0, w: CW - 112, h: 1100 }, stackAfter: { id: "t", gap: 40 }, text: "{{texto}}", ...BODY },
    ],
  },
  {
    id: "pergunta-resposta",
    name: "Pergunta e resposta",
    description: "Título como pergunta em destaque e resposta dentro de um bloco colorido.",
    category: "texto",
    pattern: "Q&A / FAQ slide",
    tipos: ["contexto", "ponto_principal", "complemento"],
    requires: [],
    background: "bg",
    chrome: DEFAULT_CHROME,
    nodes: [
      { kind: "text", box: { x: 640, y: 20, w: 400, h: 540 }, text: "?", font: "heading", weight: "900", maxSize: 520, minSize: 520, lineHeight: 1, color: "accent", opacity: 0.12, align: "right" },
      { kind: "text", id: "t", box: { x: M, y: 230, w: CW, h: 400 }, text: "{{titulo}}", ...TITLE, weight: "900", maxSize: 76 },
      { kind: "rect", box: { x: M, y: 0, w: CW, h: 10 }, fill: "accent", radius: "token", wrap: { id: "b", padX: 48, padY: 44 } },
      { kind: "text", id: "b", box: { x: M + 48, y: 0, w: CW - 96, h: 1130 }, stackAfter: { id: "t", gap: 104 }, text: "{{texto}}", ...BODY, color: "onAccent", maxSize: 38 },
    ],
  },
  {
    id: "passo-a-passo",
    name: "Passo a passo",
    description: "Número do passo gigante vazado, rótulo \"Passo N\" e explicação.",
    category: "lista",
    pattern: "Step-by-step tutorial",
    tipos: ["desenvolvimento", "ponto_principal", "complemento"],
    requires: [],
    background: "bg",
    chrome: { ...DEFAULT_CHROME, counter: "bar" },
    nodes: [
      { kind: "text", box: { x: 480, y: 120, w: 560, h: 400 }, text: "{{passo2}}", font: "heading", weight: "900", maxSize: 380, minSize: 380, lineHeight: 1, color: "accent", align: "right", outline: { color: "accent", width: 4 }, opacity: 0.55 },
      { kind: "rect", box: { x: M, y: 352, w: 56, h: 8 }, fill: "accent", radius: 4 },
      { kind: "text", box: { x: M + 76, y: 336, w: 600, h: 40 }, text: "Passo {{passo}}", ...KICKER },
      { kind: "text", id: "t", box: { x: M, y: 420, w: CW, h: 320 }, text: "{{titulo}}", ...TITLE },
      { kind: "text", box: { x: M, y: 0, w: CW, h: CONTENT_BOTTOM }, stackAfter: { id: "t", gap: 40 }, text: "{{texto}}", ...BODY },
    ],
  },

  // ---------------------------------------------------------------- DADOS --
  {
    id: "numero-destaque",
    name: "Número em destaque",
    description: "Estatística ou número gigante na cor de destaque, com título e contexto.",
    category: "dados",
    pattern: "Big number / stat highlight",
    tipos: ["contexto", "ponto_principal", "complemento", "desenvolvimento", "prova_resumo"],
    requires: ["destaque"],
    background: "bg",
    chrome: DEFAULT_CHROME,
    nodes: [
      { kind: "ellipse", box: { x: 600, y: -160, w: 640, h: 640 }, fill: "secondary", opacity: 0.14 },
      { kind: "text", id: "d", box: { x: M, y: 220, w: CW, h: 340 }, text: "{{destaque}}", font: "heading", weight: "900", maxSize: 260, minSize: 110, lineHeight: 1, color: "accent" },
      { kind: "text", id: "t", box: { x: M, y: 0, w: CW, h: 860 }, stackAfter: { id: "d", gap: 36 }, text: "{{titulo}}", ...TITLE, maxSize: 66 },
      { kind: "text", box: { x: M, y: 0, w: CW, h: CONTENT_BOTTOM }, stackAfter: { id: "t", gap: 32 }, text: "{{texto}}", ...BODY },
    ],
  },
  {
    id: "dado-em-cartao",
    name: "Dado em cartão",
    description: "Número dentro de um cartão colorido à esquerda e explicação ao lado/abaixo.",
    category: "dados",
    pattern: "KPI card",
    tipos: ["contexto", "ponto_principal", "prova_resumo", "complemento"],
    requires: ["destaque"],
    background: "bg",
    chrome: DEFAULT_CHROME,
    nodes: [
      { kind: "text", box: { x: M, y: 180, w: CW, h: 260 }, text: "{{titulo}}", ...TITLE, maxSize: 70, valign: "bottom" },
      { kind: "rect", box: { x: M, y: 480, w: CW, h: 380 }, fill: "accent", radius: { token: 12 } },
      { kind: "ellipse", box: { x: M + CW - 300, y: 560, w: 220, h: 220 }, stroke: "onAccent", strokeWidth: 3, opacity: 0.3 },
      { kind: "text", box: { x: M + 56, y: 520, w: CW - 112, h: 300 }, text: "{{destaque}}", font: "heading", weight: "900", maxSize: 220, minSize: 100, lineHeight: 1, color: "onAccent", valign: "middle" },
      { kind: "text", box: { x: M, y: 910, w: CW, h: CONTENT_BOTTOM - 910 }, text: "{{texto}}", ...BODY },
    ],
  },

  // ---------------------------------------------------------------- LISTAS --
  {
    id: "lista-numerada",
    name: "Lista numerada",
    description: "Título e até 5 itens com marcadores numerados circulares.",
    category: "lista",
    pattern: "Numbered list / tips",
    tipos: ["desenvolvimento", "ponto_principal", "complemento", "prova_resumo"],
    requires: ["itens"],
    background: "bg",
    chrome: DEFAULT_CHROME,
    nodes: [
      { kind: "text", id: "t", box: { x: M, y: 190, w: CW, h: 240 }, text: "{{titulo}}", ...TITLE, maxSize: 72 },
      { kind: "text", id: "b", when: "texto", box: { x: M, y: 0, w: CW, h: 620 }, stackAfter: { id: "t", gap: 20 }, text: "{{texto}}", ...BODY, maxSize: 34, minSize: 22 },
      { kind: "list", box: { x: M, y: 0, w: CW, h: CONTENT_BOTTOM }, stackAfter: { id: "b", gap: 48 }, field: "itens", marker: "number", markerShape: "circle", markerSize: 64, markerFill: "accent", markerColor: "onAccent", gap: 30, font: "body", weight: "500", maxSize: 50, minSize: 26, lineHeight: 1.26, color: "text" },
    ],
  },
  {
    id: "checklist",
    name: "Checklist",
    description: "Cartão com lista de verificação e divisórias — ótimo para \"salve este post\".",
    category: "lista",
    pattern: "Checklist / save-worthy",
    tipos: ["prova_resumo", "complemento", "desenvolvimento"],
    requires: ["itens"],
    background: "bg",
    chrome: DEFAULT_CHROME,
    nodes: [
      { kind: "rect", box: { x: 60, y: 160, w: W - 120, h: 1020 }, fill: "surface", radius: { token: 16 } },
      { kind: "text", id: "t", box: { x: 120, y: 220, w: W - 240, h: 220 }, text: "{{titulo}}", ...TITLE, maxSize: 66 },
      { kind: "list", box: { x: 120, y: 0, w: W - 240, h: 1130 }, stackAfter: { id: "t", gap: 52 }, field: "itens", marker: "check", markerShape: "square", markerSize: 52, markerFill: "accent", markerColor: "onAccent", gap: 32, dividers: "muted", font: "body", weight: "500", maxSize: 48, minSize: 24, lineHeight: 1.26, color: "text" },
    ],
  },
  {
    id: "linha-do-tempo",
    name: "Linha do tempo",
    description: "Itens conectados por uma linha vertical — jornada, etapas ou cronologia.",
    category: "lista",
    pattern: "Timeline / roadmap",
    tipos: ["desenvolvimento", "prova_resumo", "complemento"],
    requires: ["itens"],
    background: "bg",
    chrome: DEFAULT_CHROME,
    nodes: [
      { kind: "text", id: "t", box: { x: M, y: 190, w: CW, h: 240 }, text: "{{titulo}}", ...TITLE, maxSize: 72 },
      { kind: "list", box: { x: M, y: 0, w: CW, h: CONTENT_BOTTOM }, stackAfter: { id: "t", gap: 64 }, field: "itens", marker: "dot", markerShape: "circle", markerSize: 34, markerFill: "accent", markerColor: "accent", connector: "accent", gap: 44, font: "body", weight: "500", maxSize: 48, minSize: 24, lineHeight: 1.26, color: "text" },
    ],
  },
  {
    id: "grade-resumo",
    name: "Grade de resumo",
    description: "Itens em grade 2×2 com índice — resumo visual do carrossel.",
    category: "lista",
    pattern: "Bento grid / summary",
    tipos: ["prova_resumo", "complemento", "ponto_principal"],
    requires: ["itens"],
    background: "bg",
    chrome: DEFAULT_CHROME,
    nodes: [
      { kind: "text", id: "t", box: { x: M, y: 180, w: CW, h: 200 }, text: "{{titulo}}", ...TITLE, maxSize: 68 },
      { kind: "grid", box: { x: M, y: 0, w: CW, h: CONTENT_BOTTOM }, stackAfter: { id: "t", gap: 48 }, field: "itens", cols: 2, gap: 28, cellFill: "surface", cellRadius: { token: 8 }, indexColor: "accent", indexSize: 44, font: "body", weight: "500", maxSize: 40, minSize: 22, lineHeight: 1.28, color: "text" },
    ],
  },

  // ----------------------------------------------------------- COMPARAÇÃO --
  {
    id: "comparacao-colunas",
    name: "Comparação em colunas",
    description: "Dois cartões lado a lado (errado × certo, antes × depois, eles × nós) com selo VS.",
    category: "comparacao",
    pattern: "Versus / do & don't",
    tipos: ["contexto", "ponto_principal", "complemento", "prova_resumo"],
    requires: ["comparacao"],
    background: "bg",
    chrome: DEFAULT_CHROME,
    nodes: [
      { kind: "text", box: { x: M, y: 170, w: CW, h: 190 }, text: "{{titulo}}", ...TITLE, maxSize: 62, align: "center", valign: "middle" },
      { kind: "rect", box: { x: M, y: 400, w: 444, h: 770 }, fill: "surface", radius: { token: 12 } },
      { kind: "rect", box: { x: M + 476, y: 400, w: 444, h: 770 }, fill: "accent", radius: { token: 12 } },
      { kind: "text", box: { x: M + 36, y: 440, w: 372, h: 80 }, text: "{{rotuloA}}", ...KICKER, color: "muted", maxSize: 30 },
      { kind: "text", box: { x: M + 512, y: 440, w: 372, h: 80 }, text: "{{rotuloB}}", ...KICKER, color: "onAccent", maxSize: 30 },
      { kind: "list", box: { x: M + 36, y: 550, w: 372, h: 590 }, field: "comparacao.a.itens", maxItems: 4, marker: "cross", markerShape: "none", markerSize: 34, markerColor: "muted", gap: 30, font: "body", weight: "500", maxSize: 36, minSize: 20, lineHeight: 1.3, color: "text" },
      { kind: "list", box: { x: M + 512, y: 550, w: 372, h: 590 }, field: "comparacao.b.itens", maxItems: 4, marker: "check", markerShape: "none", markerSize: 34, markerColor: "onAccent", gap: 30, font: "body", weight: "600", maxSize: 36, minSize: 20, lineHeight: 1.3, color: "onAccent" },
      { kind: "ellipse", box: { x: W / 2 - 50, y: 350, w: 100, h: 100 }, fill: "bg", stroke: "accent", strokeWidth: 4 },
      { kind: "text", box: { x: W / 2 - 50, y: 350, w: 100, h: 100 }, text: "VS", font: "heading", weight: "900", maxSize: 34, minSize: 34, color: "text", align: "center", valign: "middle" },
    ],
  },
  {
    id: "antes-depois",
    name: "Antes e depois",
    description: "Dois blocos empilhados com seta de transformação entre eles.",
    category: "comparacao",
    pattern: "Before / after transformation",
    tipos: ["complemento", "prova_resumo", "ponto_principal"],
    requires: ["comparacao"],
    background: "bg",
    chrome: { counter: "none", counterPos: "top-left", swipe: "arrow", logo: "none" },
    nodes: [
      { kind: "text", box: { x: M, y: 80, w: CW, h: 90 }, text: "{{titulo}}", ...TITLE, maxSize: 46, minSize: 30, valign: "middle" },
      { kind: "rect", box: { x: M, y: 200, w: CW, h: 450 }, fill: "surface", radius: { token: 12 } },
      { kind: "rect", box: { x: M, y: 700, w: CW, h: 450 }, fill: "accent", radius: { token: 12 } },
      { kind: "text", box: { x: M + 48, y: 236, w: CW - 96, h: 50 }, text: "{{rotuloA}}", ...KICKER, color: "muted" },
      { kind: "text", box: { x: M + 48, y: 736, w: CW - 96, h: 50 }, text: "{{rotuloB}}", ...KICKER, color: "onAccent" },
      { kind: "list", box: { x: M + 48, y: 310, w: CW - 96, h: 310 }, field: "comparacao.a.itens", maxItems: 3, marker: "dot", markerShape: "none", markerSize: 26, markerColor: "muted", gap: 22, font: "body", weight: "500", maxSize: 34, minSize: 22, lineHeight: 1.3, color: "text" },
      { kind: "list", box: { x: M + 48, y: 810, w: CW - 96, h: 310 }, field: "comparacao.b.itens", maxItems: 3, marker: "dot", markerShape: "none", markerSize: 26, markerColor: "onAccent", gap: 22, font: "body", weight: "600", maxSize: 34, minSize: 22, lineHeight: 1.3, color: "onAccent" },
      { kind: "ellipse", box: { x: W / 2 - 48, y: 627, w: 96, h: 96 }, fill: "bg", stroke: "accent", strokeWidth: 4 },
      { kind: "line", points: [[W / 2, 652], [W / 2, 698]], stroke: "accent", strokeWidth: 6 },
      { kind: "line", points: [[W / 2 - 16, 682], [W / 2, 700], [W / 2 + 16, 682]], stroke: "accent", strokeWidth: 6 },
    ],
  },

  // -------------------------------------------------------------- CITAÇÃO --
  {
    id: "citacao",
    name: "Citação / depoimento",
    description: "Aspas gigantes, texto como citação e autor — prova social ou frase de efeito.",
    category: "citacao",
    pattern: "Testimonial / quote",
    tipos: ["prova_resumo", "complemento", "contexto"],
    requires: [],
    background: "bg",
    chrome: DEFAULT_CHROME,
    nodes: [
      { kind: "text", box: { x: M, y: 170, w: CW, h: 44 }, text: "{{titulo}}", ...KICKER },
      { kind: "text", box: { x: M - 10, y: 200, w: 400, h: 380 }, text: "“", font: "heading", weight: "900", maxSize: 360, minSize: 360, lineHeight: 1, color: "accent" },
      { kind: "text", id: "q", box: { x: M, y: 470, w: CW, h: 560 }, text: "{{texto}}", font: "heading", weight: "600", italic: true, maxSize: 54, minSize: 30, lineHeight: 1.28, color: "text" },
      { kind: "line", id: "fio", when: "autor", points: [[M, 0], [M + 60, 0]], stackAfter: { id: "q", gap: 48 }, stroke: "accent", strokeWidth: 4 },
      { kind: "text", when: "autor", box: { x: M + 84, y: 0, w: CW - 84, h: CONTENT_BOTTOM }, stackAfter: { id: "q", gap: 30 }, text: "{{autor}}", font: "body", weight: "600", maxSize: 30, minSize: 22, color: "muted" },
    ],
  },

  // --------------------------------------------------------------- IMAGEM --
  {
    id: "imagem-dividida",
    name: "Imagem dividida",
    description: "Metade superior com recorte da capa (custo zero) e texto na metade inferior.",
    category: "imagem",
    pattern: "Split image / photo + text",
    tipos: ["contexto", "ponto_principal", "complemento", "desenvolvimento", "prova_resumo"],
    requires: ["cover"],
    background: "bg",
    ownsBackground: true,
    chrome: { ...DEFAULT_CHROME, counter: "none" }, // contador próprio sobre a divisa
    nodes: [
      { kind: "image", box: { x: 0, y: 0, w: W, h: 600 }, source: "cover", fit: "cover", tint: { color: "bg", opacity: 0.25 }, fallback: "secondary" },
      { kind: "rect", box: { x: M, y: 568, w: 160, h: 64 }, fill: "accent", radius: 32 },
      { kind: "text", box: { x: M, y: 568, w: 160, h: 64 }, text: "{{n}}/{{total}}", font: "heading", weight: "800", maxSize: 28, minSize: 22, color: "onAccent", align: "center", valign: "middle" },
      { kind: "text", id: "t", box: { x: M, y: 680, w: CW, h: 240 }, text: "{{titulo}}", ...TITLE, maxSize: 68 },
      { kind: "text", box: { x: M, y: 0, w: CW, h: CONTENT_BOTTOM }, stackAfter: { id: "t", gap: 32 }, text: "{{texto}}", ...BODY, maxSize: 40 },
    ],
  },
  {
    id: "imagem-circular",
    name: "Recorte circular",
    description: "Detalhe da capa recortado em círculo com anel de destaque, texto ao lado.",
    category: "imagem",
    pattern: "Circle mask / portrait spotlight",
    tipos: ["contexto", "complemento", "prova_resumo"],
    requires: ["cover"],
    background: "bg",
    chrome: DEFAULT_CHROME,
    nodes: [
      { kind: "ellipse", box: { x: 516, y: 136, w: 520, h: 520 }, stroke: "accent", strokeWidth: 8 },
      { kind: "image", box: { x: 540, y: 160, w: 472, h: 472 }, source: "cover", fit: "cover", mask: "circle", fallback: "secondary" },
      { kind: "dots", box: { x: M, y: 200, w: 340, h: 300 }, spacing: 40, radius: 5, fill: "accent", opacity: 0.4 },
      { kind: "text", id: "t", box: { x: M, y: 720, w: CW, h: 240 }, text: "{{titulo}}", ...TITLE, maxSize: 72 },
      { kind: "text", box: { x: M, y: 0, w: CW, h: CONTENT_BOTTOM }, stackAfter: { id: "t", gap: 32 }, text: "{{texto}}", ...BODY, maxSize: 40 },
    ],
  },

  // ------------------------------------------------------------------ CTA --
  {
    id: "cta-botao",
    name: "CTA com botão",
    description: "Chamada final centralizada, anéis decorativos e botão para o canal real.",
    category: "cta",
    pattern: "Closing CTA / button",
    tipos: ["cta"],
    requires: [],
    background: "bg",
    chrome: { counter: "pill", counterPos: "top-left", swipe: "none", logo: "bottom-center" },
    nodes: [
      { kind: "ellipse", box: { x: -260, y: -260, w: 720, h: 720 }, stroke: "accent", strokeWidth: 3, opacity: 0.3 },
      { kind: "ellipse", box: { x: -160, y: -160, w: 520, h: 520 }, stroke: "accent", strokeWidth: 3, opacity: 0.2 },
      { kind: "ellipse", box: { x: 720, y: 980, w: 560, h: 560 }, fill: "secondary", opacity: 0.18 },
      { kind: "text", id: "t", box: { x: M, y: 300, w: CW, h: 340 }, text: "{{titulo}}", ...TITLE, weight: "900", maxSize: 78, align: "center", valign: "bottom" },
      { kind: "text", id: "b", box: { x: M + 40, y: 0, w: CW - 80, h: 940 }, stackAfter: { id: "t", gap: 40 }, text: "{{texto}}", ...BODY, maxSize: 42, align: "center" },
      { kind: "button", box: { x: W / 2 - 360, y: 0, w: 720, h: 108 }, stackAfter: { id: "b", gap: 64 }, text: "{{botao}}", fill: "accent", color: "onAccent", radius: "pill", maxSize: 36, minSize: 22, arrow: true },
    ],
  },
  {
    id: "cta-engajamento",
    name: "CTA de engajamento",
    description: "Pede curtida, salvamento e compartilhamento antes do botão do canal.",
    category: "cta",
    pattern: "Save & share CTA",
    tipos: ["cta"],
    requires: [],
    background: "bg",
    chrome: { counter: "pill", counterPos: "top-left", swipe: "none", logo: "bottom-left" },
    nodes: [
      { kind: "text", id: "k", box: { x: M, y: 230, w: CW, h: 40 }, text: "Gostou do conteúdo?", ...KICKER, align: "center" },
      { kind: "text", id: "t", box: { x: M, y: 0, w: CW, h: 600 }, stackAfter: { id: "k", gap: 32 }, text: "{{titulo}}", ...TITLE, weight: "900", maxSize: 70, align: "center" },
      { kind: "text", id: "b", box: { x: M + 40, y: 0, w: CW - 80, h: 820 }, stackAfter: { id: "t", gap: 32 }, text: "{{texto}}", ...BODY, maxSize: 40, align: "center" },
      { kind: "chips", id: "c", box: { x: M, y: 0, w: CW, h: 76 }, stackAfter: { id: "b", gap: 56 }, items: ["Curta", "Salve", "Compartilhe"], fill: "surface", color: "text", size: 28, gap: 20 },
      { kind: "button", box: { x: M, y: 0, w: CW, h: 108 }, stackAfter: { id: "c", gap: 40 }, text: "{{botao}}", fill: "accent", color: "onAccent", radius: "token", maxSize: 36, minSize: 22, arrow: true },
    ],
  },
  {
    id: "cta-cartao",
    name: "CTA em cartão",
    description: "Cartão inteiro na cor de destaque com botão invertido — o fechamento mais forte.",
    category: "cta",
    pattern: "Full-bleed card CTA",
    tipos: ["cta"],
    requires: [],
    background: "bg",
    chrome: { counter: "none", counterPos: "top-left", swipe: "none", logo: "bottom-center" },
    nodes: [
      { kind: "rect", box: { x: M, y: 150, w: CW, h: 1000 }, fill: "accent", radius: { token: 24 } },
      { kind: "dots", box: { x: M + 600, y: 190, w: 280, h: 200 }, spacing: 36, radius: 5, fill: "onAccent", opacity: 0.3 },
      { kind: "text", id: "t", box: { x: M + 64, y: 400, w: CW - 128, h: 340 }, text: "{{titulo}}", ...TITLE, weight: "900", maxSize: 76, color: "onAccent" },
      { kind: "text", id: "b", box: { x: M + 64, y: 0, w: CW - 128, h: 960 }, stackAfter: { id: "t", gap: 36 }, text: "{{texto}}", ...BODY, maxSize: 42, color: "onAccent", opacity: 0.88 },
      { kind: "button", box: { x: M + 64, y: 980, w: CW - 128, h: 108 }, text: "{{botao}}", fill: "bg", color: "text", radius: "token", maxSize: 36, minSize: 22, arrow: true },
    ],
  },
];

export const CAROUSEL_LAYOUT_IDS = CAROUSEL_LAYOUTS.map((l) => l.id);

export const DEFAULT_LAYOUT_ID = "classico-barra";
export const DEFAULT_CTA_LAYOUT_ID = "cta-botao";

export function getCarouselLayout(id: string | undefined | null): CarouselLayout | undefined {
  if (!id) return undefined;
  return CAROUSEL_LAYOUTS.find((l) => l.id === id);
}

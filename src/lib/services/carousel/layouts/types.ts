/**
 * Formato declarativo da biblioteca de layouts dos slides internos (2..N).
 *
 * Cada layout é um JSON puro (sem funções): uma lista de nós posicionados no
 * canvas de 1080×1350 cujas cores apontam para tokens da capa ("accent", "bg"...)
 * e cujos textos usam variáveis ({{titulo}}, {{texto}}...). O resolvedor
 * transforma layout + conteúdo + tokens em operações de desenho concretas,
 * que viram PNG (Canvas 2D) ou objetos editáveis do Fabric.js.
 *
 * Nenhum layout chama IA: o custo de imagem dos slides internos é sempre zero.
 */

import type { CarouselInternalSlideType } from "@/types/carousel";

/** Cor ligada a um token da capa, ou hex fixo. */
export type ColorRef =
  | "bg"
  | "surface"
  | "accent"
  | "secondary"
  | "text"
  | "muted"
  | "onAccent"
  | "onSecondary"
  | `#${string}`;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Campos de conteúdo que um layout pode exigir. */
export type LayoutSlot = "itens" | "destaque" | "comparacao" | "autor" | "cover";

/**
 * Empilha o nó logo abaixo do fundo real de outro nó.
 * - text/list/grid: `box.y + box.h` vira o LIMITE INFERIOR da área (use y: 0, h: limite).
 * - rect/ellipse/button/chips/line: o nó é deslocado para baixo e mantém `box.h`.
 * Se o nó âncora não foi desenhado (campo vazio), herda a âncora dele.
 */
export interface StackAfter {
  id: string;
  gap: number;
}

interface NodeBase {
  id?: string;
  opacity?: number;
  stackAfter?: StackAfter;
  /** Só desenha o nó quando o campo de conteúdo existir e não estiver vazio. */
  when?: "texto" | "autor" | "destaque" | "botao" | "cover" | "logo";
}

export interface RectNode extends NodeBase {
  kind: "rect";
  box: Box;
  fill?: ColorRef;
  stroke?: ColorRef;
  strokeWidth?: number;
  /** Número em px ou "token" (raio de canto extraído da capa) com acréscimo opcional. */
  radius?: number | "token" | { token: number };
  /** Envolve a área real de outro nó (ex.: cartão que cresce com o texto). */
  wrap?: { id: string; padX: number; padY: number; axis?: "both" | "y" };
}

export interface EllipseNode extends NodeBase {
  kind: "ellipse";
  box: Box;
  fill?: ColorRef;
  stroke?: ColorRef;
  strokeWidth?: number;
}

export interface PolygonNode extends NodeBase {
  kind: "polygon";
  points: Array<[number, number]>;
  fill: ColorRef;
}

export interface LineNode extends NodeBase {
  kind: "line";
  points: Array<[number, number]>;
  stroke: ColorRef;
  strokeWidth: number;
}

export interface DotsNode extends NodeBase {
  kind: "dots";
  box: Box;
  spacing: number;
  radius: number;
  fill: ColorRef;
}

export type TextAlign = "left" | "center" | "right" | "token";

export interface TextStyle {
  font: "heading" | "body";
  weight: "400" | "500" | "600" | "700" | "800" | "900" | "token";
  maxSize: number;
  minSize: number;
  lineHeight?: number;
  color: ColorRef;
  uppercase?: boolean;
  letterSpacing?: number;
  italic?: boolean;
}

export interface TextNode extends NodeBase, TextStyle {
  kind: "text";
  box: Box;
  /** Template com variáveis {{titulo}}, {{texto}}, {{destaque}}, {{autor}}, {{botao}}, {{n}}, {{total}}, {{passo}}, {{passo2}}, {{rotuloTipo}}, {{rotuloA}}, {{rotuloB}}. */
  text: string;
  align?: TextAlign;
  valign?: "top" | "middle" | "bottom";
  /** Marca-texto atrás de cada linha. */
  highlight?: { color: ColorRef; padX: number; padY: number };
  /** Desenha só o contorno do texto (números gigantes vazados). */
  outline?: { color: ColorRef; width: number };
}

export type ListField = "itens" | "comparacao.a.itens" | "comparacao.b.itens";
export type ListMarker = "number" | "check" | "cross" | "dot" | "arrow";

export interface ListNode extends NodeBase, TextStyle {
  kind: "list";
  box: Box;
  field: ListField;
  maxItems?: number;
  marker: ListMarker;
  markerShape: "circle" | "square" | "none";
  markerSize: number;
  markerFill?: ColorRef;
  markerColor: ColorRef;
  gap: number;
  dividers?: ColorRef;
  /** Linha vertical ligando os marcadores (linha do tempo). */
  connector?: ColorRef;
}

export interface GridNode extends NodeBase, TextStyle {
  kind: "grid";
  box: Box;
  field: "itens";
  cols: number;
  gap: number;
  cellFill: ColorRef;
  cellRadius: number | "token" | { token: number };
  indexColor: ColorRef;
  indexSize: number;
}

export interface ButtonNode extends NodeBase {
  kind: "button";
  box: Box;
  text: string;
  fill: ColorRef;
  color: ColorRef;
  radius: number | "token" | "pill";
  maxSize: number;
  minSize: number;
  /** Seta desenhada à direita do texto. */
  arrow?: boolean;
}

export interface ChipsNode extends NodeBase {
  kind: "chips";
  box: Box;
  items: string[];
  fill: ColorRef;
  color: ColorRef;
  size: number;
  gap: number;
}

export interface ImageNode extends NodeBase {
  kind: "image";
  box: Box;
  source: "cover";
  fit: "cover" | "contain";
  radius?: number | "token";
  mask?: "rect" | "circle";
  /** Camada de cor por cima da imagem (duotone / leitura). */
  tint?: { color: ColorRef; opacity: number };
  /** Cor de reserva quando não existe imagem de capa. */
  fallback: ColorRef;
}

export type LayoutNode =
  | RectNode
  | EllipseNode
  | PolygonNode
  | LineNode
  | DotsNode
  | TextNode
  | ListNode
  | GridNode
  | ButtonNode
  | ChipsNode
  | ImageNode;

export type CounterStyle = "pill" | "text" | "bar" | "none";
export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom-center";

export interface LayoutChrome {
  counter: CounterStyle;
  counterPos: Corner;
  /** "pill" = pílula "Arraste →", "arrow" = seta circular, "none" = oculto. */
  swipe: "pill" | "arrow" | "none";
  logo: Corner | "none";
  /** Cor do texto/elementos do chrome quando o fundo local não é o "bg". */
  tone?: "default" | "onAccent";
}

export type LayoutCategory =
  | "texto"
  | "dados"
  | "lista"
  | "comparacao"
  | "citacao"
  | "imagem"
  | "cta";

export interface CarouselLayout {
  id: string;
  name: string;
  description: string;
  category: LayoutCategory;
  /** Padrão de carrossel que inspirou o layout (referência de mercado, não cópia). */
  pattern: string;
  /** Tipos de slide em que o layout faz sentido narrativo. */
  tipos: CarouselInternalSlideType[];
  /** Campos obrigatórios além de título/texto. */
  requires: LayoutSlot[];
  background: ColorRef;
  /** Se true, ignora a variação de fundo escolhida (o próprio layout já define o fundo). */
  ownsBackground?: boolean;
  chrome: LayoutChrome;
  nodes: LayoutNode[];
}

// -----------------------------------------------------------------------------
// Operações de desenho resolvidas (saída do resolvedor, entrada dos renderers)
// -----------------------------------------------------------------------------

export type DrawOp =
  | {
      op: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      radius: number;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity: number;
    }
  | {
      op: "ellipse";
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity: number;
    }
  | {
      op: "path";
      points: Array<[number, number]>;
      closed: boolean;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity: number;
    }
  | {
      op: "text";
      lines: string[];
      /** Âncora horizontal (depende do align) e topo do bloco. */
      x: number;
      y: number;
      width: number;
      align: "left" | "center" | "right";
      fontFamily: string;
      fontWeight: string;
      fontSize: number;
      italic: boolean;
      lineHeightPx: number;
      letterSpacing: number;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      /** Marca-texto medido no momento do desenho (largura real da linha). */
      highlight?: { color: string; padX: number; padY: number };
      opacity: number;
    }
  | {
      op: "image";
      source: "cover" | "logo";
      x: number;
      y: number;
      w: number;
      h: number;
      fit: "cover" | "contain";
      radius: number;
      mask: "rect" | "circle";
      blur: number;
      opacity: number;
      /** Alinhamento horizontal quando fit = "contain" (padrão: centro). */
      anchor?: "left" | "center" | "right";
    };

export interface ResolvedSlide {
  layoutId: string;
  width: number;
  height: number;
  ops: DrawOp[];
  /** Avisos de ajuste (ex.: texto truncado no tamanho mínimo). */
  warnings: string[];
}

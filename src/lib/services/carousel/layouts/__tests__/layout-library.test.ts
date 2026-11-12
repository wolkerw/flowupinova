import { describe, it, expect } from "vitest";
import type { CarouselInternalSlide, CarouselInternalSlideType } from "@/types/carousel";
import { CarouselInternalSlideSchema, DEFAULT_COVER_DESIGN_TOKENS } from "@/types/carousel";
import {
  CAROUSEL_LAYOUTS,
  CAROUSEL_LAYOUT_IDS,
  assignLayouts,
  buildLayoutCatalogForPrompt,
  contrastRatio,
  getCarouselLayout,
  isLayoutCompatible,
  listCompatibleLayouts,
  readableOn,
  resolveCarouselSlide,
  resolveLayoutForSlide,
  sanitizeSlideLayoutExtras,
  type DrawOp,
} from "..";
import { resolveInternalSlide } from "../../fabric-slide-renderer";

const W = 1080;
const H = 1350;

function richSlide(n: number, tipo: CarouselInternalSlideType, long = false): CarouselInternalSlide {
  const t = long ? "Título bem longo que testa o limite de quarenta e" : "Três erros que travam suas vendas";
  const body = long
    ? "Texto de apoio propositalmente longo para garantir que o ajuste automático de fonte reduza o tamanho e nunca deixe o conteúdo ultrapassar a área útil."
    : "Pequenos ajustes no atendimento mudam o resultado do mês.";
  const item = long ? "Item comprido para testar a quebra de linha dentro da lista sem vazar" : "Responder rápido";
  return {
    n,
    tipo,
    titulo: t.slice(0, 45),
    texto: body.slice(0, 160),
    botao: tipo === "cta" ? (long ? "Chame agora no WhatsApp da loja!!" : "Chame no WhatsApp") : undefined,
    destaque: long ? "R$ 1.250.000" : "73%",
    itens: long ? [item, item, item, item, item] : [item, "Preço com contexto", "Post com chamada"],
    comparacao: {
      a: { rotulo: long ? "Sem método definido" : "Sem método", itens: long ? [item.slice(0, 60), item.slice(0, 60), item.slice(0, 60), item.slice(0, 60)] : ["Improviso", "Retrabalho"] },
      b: { rotulo: long ? "Com método definido" : "Com método", itens: long ? [item.slice(0, 60), item.slice(0, 60), item.slice(0, 60), item.slice(0, 60)] : ["Previsível", "Escalável"] },
    },
    autor: long ? "Maria Aparecida dos Santos Oliveira" : "Ana, cliente",
  };
}

function bounds(op: DrawOp): { x0: number; y0: number; x1: number; y1: number } | null {
  switch (op.op) {
    case "rect":
    case "image":
      return { x0: op.x, y0: op.y, x1: op.x + op.w, y1: op.y + op.h };
    case "ellipse":
      return { x0: op.cx - op.rx, y0: op.cy - op.ry, x1: op.cx + op.rx, y1: op.cy + op.ry };
    case "path": {
      const xs = op.points.map((p) => p[0]);
      const ys = op.points.map((p) => p[1]);
      return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    }
    case "text":
      return { x0: op.x, y0: op.y, x1: op.x, y1: op.y + op.lines.length * op.lineHeightPx };
  }
}

describe("biblioteca de layouts do carrossel", () => {
  it("tem pelo menos 20 layouts com ids únicos e campos completos", () => {
    expect(CAROUSEL_LAYOUTS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(CAROUSEL_LAYOUT_IDS).size).toBe(CAROUSEL_LAYOUT_IDS.length);
    for (const l of CAROUSEL_LAYOUTS) {
      expect(l.id).toMatch(/^[a-z0-9-]+$/);
      expect(l.name.length).toBeGreaterThan(3);
      expect(l.tipos.length).toBeGreaterThan(0);
      expect(l.nodes.length).toBeGreaterThan(0);
    }
  });

  it("é JSON puro (serializável sem perda)", () => {
    expect(JSON.parse(JSON.stringify(CAROUSEL_LAYOUTS))).toEqual(CAROUSEL_LAYOUTS);
  });

  it("todo tipo de slide tem ao menos 2 layouts, inclusive sem conteúdo extra", () => {
    const tipos: CarouselInternalSlideType[] = ["contexto", "ponto_principal", "complemento", "desenvolvimento", "prova_resumo", "cta"];
    for (const tipo of tipos) {
      const plain: CarouselInternalSlide = { n: 3, tipo, titulo: "Título simples", texto: "Texto de apoio simples.", botao: tipo === "cta" ? "WhatsApp" : undefined };
      const options = listCompatibleLayouts(plain, { hasCoverImage: false });
      expect(options.length, tipo).toBeGreaterThanOrEqual(2);
    }
  });

  it("referências stackAfter/wrap apontam para nós existentes declarados antes (stackAfter)", () => {
    for (const l of CAROUSEL_LAYOUTS) {
      const seen = new Set<string>();
      const ids = new Set(l.nodes.map((n) => n.id).filter(Boolean));
      for (const node of l.nodes) {
        if (node.stackAfter) expect(seen.has(node.stackAfter.id), `${l.id} -> ${node.stackAfter.id}`).toBe(true);
        if (node.kind === "rect" && node.wrap) expect(ids.has(node.wrap.id), `${l.id} wrap`).toBe(true);
        if (node.id) seen.add(node.id);
      }
    }
  });

  describe.each(CAROUSEL_LAYOUTS.map((l) => [l.id]))("layout %s", (id) => {
    const layout = getCarouselLayout(id)!;
    const tipo = layout.tipos[0];
    const totals = [5, 7] as const;

    it.each([false, true])("resolve dentro do canvas e sem texto transbordando (texto longo: %s)", (long) => {
      for (const total of totals) {
        const slide = richSlide(Math.min(3, total), tipo, long);
        if (tipo === "cta") slide.n = total;
        const resolved = resolveCarouselSlide({ layout, slide, totalSlides: total, hasCoverImage: true, hasLogo: true });
        expect(resolved.layoutId).toBe(id);
        expect(resolved.ops.length).toBeGreaterThan(3);

        for (const op of resolved.ops) {
          if (op.op === "text") {
            expect(op.lines.length).toBeGreaterThan(0);
            expect(op.fontSize).toBeGreaterThanOrEqual(12);
            const b = bounds(op)!;
            expect(b.y0, `${id} topo "${op.lines[0]}"`).toBeGreaterThanOrEqual(0);
            expect(b.y1, `${id} base "${op.lines[0]}"`).toBeLessThanOrEqual(H);
          }
        }
        const texts = resolved.ops.filter((o): o is Extract<DrawOp, { op: "text" }> => o.op === "text");
        const content = texts.flatMap((t) => t.lines).join(" ");
        // O título sempre aparece (exceto layouts que usam o título como rótulo em caixa alta)
        expect(content.toLowerCase()).toContain(slide.titulo.split(" ")[0].toLowerCase());
        // Conteúdo principal (texto ou lista) não deve ser truncado com o texto curto
        if (!long) expect(resolved.warnings, `${id}: ${resolved.warnings.join("; ")}`).toEqual([]);
      }
    });

    it("textos de conteúdo ficam acima da faixa do rodapé (logo/arraste)", () => {
      const slide = richSlide(3, tipo, true);
      if (tipo === "cta") slide.n = 5;
      const resolved = resolveCarouselSlide({ layout, slide, totalSlides: 5, hasCoverImage: true, hasLogo: true });
      const contentTexts = resolved.ops.filter(
        (o): o is Extract<DrawOp, { op: "text" }> =>
          o.op === "text" && !["Arraste →"].includes(o.lines[0]) && !/^\d+ ?\/ ?\d+$/.test(o.lines[0].replace(/0(\d)/g, "$1"))
      );
      for (const t of contentTexts) {
        expect(t.y + t.lines.length * t.lineHeightPx, `${id} "${t.lines[0]}"`).toBeLessThanOrEqual(1215);
      }
    });
  });

  it("cores de texto sobre o destaque têm contraste legível", () => {
    for (const accent of ["#FA6305", "#FFD400", "#0083C7", "#111111", "#F5F5F5"]) {
      expect(contrastRatio(accent, readableOn(accent))).toBeGreaterThanOrEqual(3);
    }
  });

  it("sem capa, layouts que exigem imagem não são oferecidos", () => {
    const slide = richSlide(3, "contexto");
    const ids = listCompatibleLayouts(slide, { hasCoverImage: false }).map((l) => l.id);
    expect(ids).not.toContain("imagem-dividida");
    expect(ids).not.toContain("imagem-circular");
    expect(listCompatibleLayouts(slide, { hasCoverImage: true }).map((l) => l.id)).toContain("imagem-dividida");
  });

  it("slide CTA só recebe layouts de CTA e slides comuns nunca recebem", () => {
    const cta = richSlide(5, "cta");
    expect(listCompatibleLayouts(cta, { hasCoverImage: true }).every((l) => l.category === "cta")).toBe(true);
    const ctx = richSlide(2, "contexto");
    expect(listCompatibleLayouts(ctx, { hasCoverImage: true }).some((l) => l.category === "cta")).toBe(false);
  });

  it("assignLayouts respeita o layout explícito compatível e ignora o incompatível", () => {
    const slides: CarouselInternalSlide[] = [
      { n: 2, tipo: "contexto", titulo: "Abc def", texto: "Texto de apoio.", layout: "titulo-gigante" },
      { n: 3, tipo: "ponto_principal", titulo: "Abc def", texto: "Texto de apoio.", layout: "lista-numerada" },
      { n: 4, tipo: "complemento", titulo: "Abc def", texto: "Texto de apoio.", layout: "inexistente" },
      { n: 5, tipo: "cta", titulo: "Abc def", texto: "Texto de apoio.", botao: "WhatsApp", layout: "lista-numerada" },
    ];
    const result = assignLayouts(slides, { hasCoverImage: false });
    expect(result[2]).toBe("titulo-gigante");
    expect(result[3]).not.toBe("lista-numerada"); // sem itens => incompatível
    expect(getCarouselLayout(result[4])).toBeDefined();
    expect(getCarouselLayout(result[5])!.category).toBe("cta");
  });

  it("assignLayouts prefere layouts que usam o conteúdo estruturado e varia entre slides", () => {
    const slides: CarouselInternalSlide[] = [
      { n: 2, tipo: "contexto", titulo: "Abc def", texto: "Texto de apoio.", destaque: "73%" },
      { n: 3, tipo: "desenvolvimento", titulo: "Abc def", texto: "Texto de apoio.", itens: ["Um item", "Outro item", "Mais um"] },
      { n: 4, tipo: "desenvolvimento", titulo: "Abc def", texto: "Texto de apoio." },
      { n: 5, tipo: "desenvolvimento", titulo: "Abc def", texto: "Texto de apoio." },
      { n: 6, tipo: "prova_resumo", titulo: "Abc def", texto: "Texto de apoio." },
      { n: 7, tipo: "cta", titulo: "Abc def", texto: "Texto de apoio.", botao: "WhatsApp" },
    ];
    const result = assignLayouts(slides, { hasCoverImage: true });
    expect(getCarouselLayout(result[2])!.requires).toContain("destaque");
    expect(getCarouselLayout(result[3])!.requires).toContain("itens");
    expect(result[4]).not.toBe(result[5]);
    // determinístico
    expect(assignLayouts(slides, { hasCoverImage: true })).toEqual(result);
  });

  it("sanitizeSlideLayoutExtras corta, valida e descarta lixo do LLM", () => {
    const extras = sanitizeSlideLayoutExtras({
      layout: "lista-numerada",
      destaque: "1234567890123456789",
      itens: ["  a ", "", 42, null, "b", "c", "d", "e", "f"],
      comparacao: { a: { rotulo: "Antes", itens: ["x"] }, b: { rotulo: "", itens: ["y"] } },
      autor: "   ",
    });
    expect(extras.layout).toBe("lista-numerada");
    expect(extras.destaque!.length).toBeLessThanOrEqual(14);
    expect(extras.itens).toEqual(["a", "42", "b", "c", "d"]);
    expect(extras.comparacao).toBeUndefined();
    expect(extras.autor).toBeUndefined();
    expect(sanitizeSlideLayoutExtras({ layout: "nao-existe" }).layout).toBeUndefined();
    expect(sanitizeSlideLayoutExtras(null)).toEqual({});
  });

  it("schema do slide aceita os campos extras e rejeita fora do limite", () => {
    const ok = CarouselInternalSlideSchema.safeParse({ ...richSlide(3, "desenvolvimento"), botao: undefined });
    expect(ok.success).toBe(true);
    const bad = CarouselInternalSlideSchema.safeParse({ n: 3, tipo: "desenvolvimento", titulo: "Título", texto: "Texto de apoio.", itens: ["1", "2", "3", "4", "5", "6"] });
    expect(bad.success).toBe(false);
  });

  it("catálogo do prompt lista todos os layouts", () => {
    const catalog = buildLayoutCatalogForPrompt();
    for (const id of CAROUSEL_LAYOUT_IDS) expect(catalog).toContain(`"${id}"`);
  });

  it("resolveInternalSlide usa a biblioteca e nunca gera operação de imagem por IA", () => {
    const slide = richSlide(3, "desenvolvimento");
    const resolved = resolveInternalSlide({ slide, totalSlides: 5, tokens: DEFAULT_COVER_DESIGN_TOKENS, coverImageUrl: "https://example.com/capa.png" });
    expect(CAROUSEL_LAYOUT_IDS).toContain(resolved.layoutId);
    // Imagens só podem ser recortes da capa já gerada ou o logo — nunca uma nova geração
    for (const op of resolved.ops) {
      if (op.op === "image") expect(["cover", "logo"]).toContain(op.source);
    }
    expect(resolveLayoutForSlide(slide, { hasCoverImage: false }, "checklist").id).toBe("checklist");
  });

  it("isLayoutCompatible exige comparação completa", () => {
    const layout = getCarouselLayout("comparacao-colunas")!;
    const slide: CarouselInternalSlide = { n: 3, tipo: "ponto_principal", titulo: "Abc def", texto: "Texto de apoio." };
    expect(isLayoutCompatible(layout, slide, { hasCoverImage: true })).toBe(false);
    expect(isLayoutCompatible(layout, richSlide(3, "ponto_principal"), { hasCoverImage: true })).toBe(true);
  });
});

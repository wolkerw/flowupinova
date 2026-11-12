import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WhatsAppKnowledgeTopic } from "@/lib/types/whatsapp-knowledge";

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));
vi.mock("@/lib/firebase-admin", () => ({
  adminDb: { collection: vi.fn(() => ({ get: mockGet })) },
}));

import {
  buildChannelKnowledge,
  formatTopicsForPrompt,
  isTopicExpired,
  sanitizeKnowledgeForExternalChannel,
  selectTopicsForChannel,
} from "../knowledge-base-service";
import { getPlatformKnowledgeForChannel } from "@/lib/constants/platform-knowledge";

function topic(over: Partial<WhatsAppKnowledgeTopic>): WhatsAppKnowledgeTopic {
  return {
    id: over.id || "t",
    category: "outros",
    title: "Título",
    content: "Conteúdo",
    isActive: true,
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...over,
  };
}

const NOW = new Date("2026-11-12T12:00:00-03:00");

describe("selectTopicsForChannel", () => {
  it("filtra por canal, status, validade e pendências, ordenando por order", () => {
    const topics = [
      topic({ id: "ambos", order: 3 }),
      topic({ id: "so-insta", channel: "instagram", order: 1 }),
      topic({ id: "so-whats", channel: "whatsapp", order: 2 }),
      topic({ id: "inativo", isActive: false }),
      topic({ id: "vencido", expiresAt: "2026-11-11" }),
      topic({ id: "vence-hoje", expiresAt: "2026-11-12", order: 4 }),
      topic({ id: "pendente", content: "[PREENCHER] algo" }),
    ];
    expect(selectTopicsForChannel(topics, "whatsapp", NOW).map((t) => t.id)).toEqual([
      "so-whats",
      "ambos",
      "vence-hoje",
    ]);
    expect(selectTopicsForChannel(topics, "instagram", NOW).map((t) => t.id)).toEqual([
      "so-insta",
      "ambos",
      "vence-hoje",
    ]);
  });

  it("isTopicExpired considera o dia de validade inteiro", () => {
    expect(isTopicExpired({ expiresAt: "2026-11-12" }, NOW)).toBe(false);
    expect(isTopicExpired({ expiresAt: "2026-11-11" }, NOW)).toBe(true);
    expect(isTopicExpired({ expiresAt: null }, NOW)).toBe(false);
  });
});

describe("formatTopicsForPrompt", () => {
  it("indica o público do tópico no título", () => {
    const text = formatTopicsForPrompt([
      topic({ title: "Objeções", audience: "lead" }),
      topic({ title: "Problemas", audience: "cliente" }),
      topic({ title: "Planos" }),
    ]);
    expect(text).toContain("### OBJEÇÕES (PÚBLICO: quem ainda não é cliente)");
    expect(text).toContain("### PROBLEMAS (PÚBLICO: clientes que já assinam)");
    expect(text).toContain("### PLANOS\n");
  });
});

describe("sanitizeKnowledgeForExternalChannel", () => {
  it("remove códigos internos e linhas técnicas, preservando links", () => {
    const input = [
      "* **Trava Anatômica de Mãos (/handlock)**: Proteção contra distorções.",
      "* **Liberdade de Títulos (/typolayout + /fontlock)**: prioriza as fontes da marca.",
      "- **Regra /identylock**: mantém o rosto original.",
      "* Roteiro em 1 chamada de LLM de texto (`gemini-2.5-flash`).",
      "* Capa gerada com `GPT-image-2.6 Sunburst`.",
      "Acesse *Posts* (https://numvapt.com.br/dashboard/posts) para criar.",
    ].join("\n");
    const out = sanitizeKnowledgeForExternalChannel(input);
    expect(out).not.toMatch(/\/handlock|\/typolayout|\/fontlock|\/identylock/);
    expect(out).not.toMatch(/gemini|GPT-image|LLM/i);
    expect(out).toContain("Trava Anatômica de Mãos");
    expect(out).toContain("Regra**: mantém o rosto original.");
    expect(out).toContain("https://numvapt.com.br/dashboard/posts");
  });

  it("aplicado ao conhecimento real da plataforma não deixa vazar detalhes internos", () => {
    for (const channel of ["whatsapp", "instagram"] as const) {
      const raw = getPlatformKnowledgeForChannel(channel);
      const out = sanitizeKnowledgeForExternalChannel(raw);
      expect(out).not.toMatch(/(^|[\s(])\/[a-z]+lock\b/im);
      expect(out).not.toMatch(/gemini-|gpt-image|fabric\.js|firestore/i);
      expect(out).toContain("https://numvapt.com.br/dashboard/posts");
      // continua com o essencial: a maior parte do conteúdo permanece
      expect(out.length).toBeGreaterThan(raw.length * 0.5);
    }
  });
});

describe("buildChannelKnowledge", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("usa os tópicos padrão quando o Firestore está vazio, sem incluir os pendentes", async () => {
    mockGet.mockResolvedValue({ docs: [] });
    const { centralKnowledge } = await buildChannelKnowledge("whatsapp", NOW);
    expect(centralKnowledge).toContain("ANÚNCIOS NA META E NO GOOGLE");
    expect(centralKnowledge).not.toContain("[PREENCHER]");
    expect(centralKnowledge).not.toContain("TESTE GRÁTIS");
  });

  it("usa os tópicos do Firestore filtrados pelo canal", async () => {
    mockGet.mockResolvedValue({
      docs: [
        { id: "a", data: () => topic({ title: "Promo Insta", channel: "instagram" }) },
        { id: "b", data: () => topic({ title: "Promo Whats", channel: "whatsapp" }) },
      ],
    });
    const { centralKnowledge } = await buildChannelKnowledge("instagram", NOW);
    expect(centralKnowledge).toContain("PROMO INSTA");
    expect(centralKnowledge).not.toContain("PROMO WHATS");
  });

  it("cai para os padrões se o Firestore falhar", async () => {
    mockGet.mockImplementation(async () => {
      throw new Error("offline");
    });
    const { centralKnowledge } = await buildChannelKnowledge("instagram", NOW);
    expect(centralKnowledge).toContain("ANÚNCIOS NA META E NO GOOGLE");
    expect(centralKnowledge).toContain("R$ 490,00");
  });
});

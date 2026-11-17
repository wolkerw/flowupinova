import { describe, it, expect, vi, beforeEach } from "vitest";

// O token de verificação não tem mais valor padrão no código: definido via ambiente.
const h = vi.hoisted(() => {
  process.env.INSTAGRAM_VERIFY_TOKEN = "numvapt_instagram_verify_token";
  const state = {
    chatData: { aiEnabled: true, humanTakeover: false, username: "teste_user" } as Record<string, any>,
    recentDocs: [] as any[],
    messageExists: false,
  };
  const chatSet = vi.fn().mockResolvedValue({});
  const messageSet = vi.fn().mockResolvedValue({});
  const chatRef = {
    get: vi.fn(async () => ({ exists: true, data: () => state.chatData })),
    set: chatSet,
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({ set: messageSet, get: vi.fn(async () => ({ exists: state.messageExists })) })),
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(async () => ({ docs: state.recentDocs.map((d) => ({ data: () => d })) })),
        })),
      })),
    })),
  };
  return { state, chatSet, messageSet, chatRef };
});

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: { collection: vi.fn(() => ({ doc: vi.fn(() => h.chatRef) })) },
}));

vi.mock("@/lib/services/instagram-ai-service", () => ({
  INSTAGRAM_HISTORY_LIMIT: 12,
  generateInstagramAIResponse: vi.fn().mockResolvedValue({
    replyText: "O plano Mensal custa R$ 490,00/mês.",
    needsHumanSupport: false,
  }),
}));

import { GET, POST } from "../route";
import { NextRequest } from "next/server";
import { generateInstagramAIResponse } from "@/lib/services/instagram-ai-service";

function igPost(payload: unknown) {
  return POST(
    new NextRequest("http://localhost:3000/api/webhooks/instagram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

function dm(message: Record<string, any>, extra: Record<string, any> = {}) {
  return {
    object: "instagram",
    entry: [
      {
        id: "page_123",
        messaging: [
          {
            sender: { id: "user_456" },
            recipient: { id: "page_123" },
            timestamp: Date.now(),
            message: { mid: `mid_${Math.random()}`, ...message },
            ...extra,
          },
        ],
      },
    ],
  };
}

describe("Instagram Webhook Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.state.chatData = { aiEnabled: true, humanTakeover: false, username: "teste_user" };
    h.state.recentDocs = [];
    h.state.messageExists = false;
  });

  it("GET valida o webhook da Meta quando token está correto", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=numvapt_instagram_verify_token&hub.challenge=1158201244"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("1158201244");
  });

  it("GET rejeita o webhook se o token for incorreto (403)", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=errado&hub.challenge=1"
    );
    const res = await GET(req);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain("inválido");
  });

  it("POST responde pergunta recebida no Direct", async () => {
    const res = await igPost(dm({ text: "Quanto custa o plano da NumVapt?" }));
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("EVENT_RECEIVED");
    expect(generateInstagramAIResponse).toHaveBeenCalledWith(
      expect.objectContaining({ pendingMessages: ["Quanto custa o plano da NumVapt?"] })
    );
  });

  it("POST ignora evento que não seja de instagram", async () => {
    const res = await igPost({ object: "unknown" });
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("ignored");
  });

  it("não responde (nem dá boas-vindas) a reação só com emoji, mas registra no histórico", async () => {
    await igPost(dm({ text: "🔥🔥❤️", reply_to: { story: { id: "s1", url: "https://x" } } }));
    expect(generateInstagramAIResponse).not.toHaveBeenCalled();
    expect(h.messageSet).toHaveBeenCalledWith(
      expect.objectContaining({ text: "[Resposta ao story] 🔥🔥❤️", noReply: true, noReplyReason: "so_emoji" })
    );
    // não marca como última pergunta, para não cancelar a resposta de uma pergunta anterior
    expect(h.chatSet.mock.calls[0][0].lastUserMessageId).toBeUndefined();
  });

  it("não responde elogio curto sobre post ou reel", async () => {
    await igPost(dm({ text: "Amei!!", attachments: [{ type: "ig_reel", payload: {} }] }));
    expect(generateInstagramAIResponse).not.toHaveBeenCalled();
  });

  it("não responde menção em story nem compartilhamento sem texto", async () => {
    await igPost(dm({ attachments: [{ type: "story_mention", payload: {} }] }));
    await igPost(dm({ attachments: [{ type: "share", payload: {} }] }));
    expect(generateInstagramAIResponse).not.toHaveBeenCalled();
    expect(h.messageSet).toHaveBeenCalledTimes(2);
  });

  it("ignora eventos de reação e de comentários em posts", async () => {
    await igPost(dm({}, { reaction: { mid: "m1", action: "react", emoji: "❤️" } }));
    await igPost({
      object: "instagram",
      entry: [{ id: "page_123", changes: [{ field: "comments", value: { text: "🔥", from: { id: "u1" } } }] }],
    });
    expect(generateInstagramAIResponse).not.toHaveBeenCalled();
    expect(h.messageSet).not.toHaveBeenCalled();
  });

  it("responde pergunta feita em resposta a um story, com o contexto", async () => {
    await igPost(dm({ text: "isso funciona pra loja de roupa?", reply_to: { story: { id: "s1" } } }));
    expect(generateInstagramAIResponse).toHaveBeenCalledWith(
      expect.objectContaining({ incomingMessage: "[Resposta ao story] isso funciona pra loja de roupa?" })
    );
  });

  it("não processa duas vezes o mesmo evento reenviado pela Meta", async () => {
    h.state.messageExists = true;
    await igPost(dm({ text: "Quanto custa?" }));
    expect(generateInstagramAIResponse).not.toHaveBeenCalled();
  });
});

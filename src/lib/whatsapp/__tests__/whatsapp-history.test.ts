import { describe, it, expect } from "vitest";
import { extractMessageContent, resolveContactFromKey } from "../evolution-message";
import { cutAtCompleteBoundary, evolutionRecordToMessage, mergeHistory } from "../history-merge";
import type { WhatsAppMessage } from "@/lib/types/whatsapp";

describe("extractMessageContent", () => {
  it("lê texto simples, estendido e temporário", () => {
    expect(extractMessageContent({ conversation: "oi" }).text).toBe("oi");
    expect(extractMessageContent({ extendedTextMessage: { text: "olá" } }).text).toBe("olá");
    expect(
      extractMessageContent({ ephemeralMessage: { message: { conversation: "sumindo" } } }).text
    ).toBe("sumindo");
  });

  it("usa placeholder para mídia sem texto e mantém a legenda", () => {
    expect(extractMessageContent({ audioMessage: {} }).displayText).toBe("[Áudio]");
    expect(extractMessageContent({ stickerMessage: {} }).displayText).toBe("[Figurinha]");
    expect(extractMessageContent({ imageMessage: { caption: "meu logo" } }).displayText).toBe("[Imagem] meu logo");
  });

  it("marca reações e eventos de sistema", () => {
    expect(extractMessageContent({ reactionMessage: { text: "👍" } }).kind).toBe("reaction");
    expect(extractMessageContent({ protocolMessage: { type: 0 } }).kind).toBe("system");
  });
});

describe("resolveContactFromKey", () => {
  it("usa o telefone alternativo quando o contato vem por LID", () => {
    expect(
      resolveContactFromKey({ remoteJid: "999@lid", remoteJidAlt: "5551988887777@s.whatsapp.net" })
    ).toEqual({ phone: "5551988887777", lid: "999" });
    expect(resolveContactFromKey({ remoteJid: "999@lid" }, { senderPn: "5551911112222@s.whatsapp.net" })).toEqual({
      phone: "5551911112222",
      lid: "999",
    });
  });

  it("mantém o telefone normal", () => {
    expect(resolveContactFromKey({ remoteJid: "5551977776666@s.whatsapp.net" })).toEqual({
      phone: "5551977776666",
      lid: null,
    });
  });
});

describe("mergeHistory", () => {
  const fs = (id: string, role: WhatsAppMessage["role"], text: string, iso: string): WhatsAppMessage => ({
    id,
    role,
    text,
    timestamp: iso,
  });

  it("não duplica mensagens que existem no Firestore e na Evolution e mantém as do cliente", () => {
    const firestore = [
      fs("u1", "user", "quanto custa?", "2026-11-17T10:00:00.000Z"),
      fs("a1", "assistant", "R$ 490,00/mês", "2026-11-17T10:00:08.000Z"),
    ];
    const evolution = [
      evolutionRecordToMessage({ key: { id: "E1", fromMe: false }, messageTimestamp: 1794909600, message: { conversation: "quanto custa?" } }),
      evolutionRecordToMessage({ key: { id: "E2", fromMe: true }, messageTimestamp: 1794909609, message: { conversation: "R$ 490,00/mês" } }),
      evolutionRecordToMessage({ key: { id: "E3", fromMe: false }, messageTimestamp: 1794909700, message: { audioMessage: {} }, pushName: "Ana" }),
    ].filter(Boolean) as any[];

    const merged = mergeHistory(firestore, evolution);
    expect(merged.map((m) => m.text)).toEqual(["quanto custa?", "R$ 490,00/mês", "[Áudio]"]);
    expect(merged[2]).toMatchObject({ role: "user", senderName: "Ana" });
  });
});

describe("cutAtCompleteBoundary", () => {
  it("corta onde a fonte com página cheia termina e indica que há mais", () => {
    const merged: WhatsAppMessage[] = [
      { id: "1", role: "user", text: "a", timestamp: "2026-11-10T00:00:00.000Z" },
      { id: "2", role: "user", text: "b", timestamp: "2026-11-15T00:00:00.000Z" },
      { id: "3", role: "user", text: "c", timestamp: "2026-11-17T00:00:00.000Z" },
    ];
    const res = cutAtCompleteBoundary(merged, [
      { full: false, oldest: "2026-11-10T00:00:00.000Z" },
      { full: true, oldest: "2026-11-15T00:00:00.000Z" },
    ]);
    expect(res.messages.map((m) => m.id)).toEqual(["2", "3"]);
    expect(res.hasMore).toBe(true);
    expect(res.oldest).toBe("2026-11-15T00:00:00.000Z");
  });

  it("sem página cheia, devolve tudo e hasMore false", () => {
    const res = cutAtCompleteBoundary([], [{ full: false, oldest: null }]);
    expect(res.hasMore).toBe(false);
  });
});

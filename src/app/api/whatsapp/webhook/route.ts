import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySharedSecret } from "@/lib/webhook-auth";
import {
  generateWhatsAppAIResponse,
  transcribeWhatsAppAudio,
  WHATSAPP_HISTORY_LIMIT,
} from "@/lib/services/whatsapp-ai-service";
import type { WhatsAppMessage } from "@/lib/types/whatsapp";
import { extractMessageContent, resolveContactFromKey, type WhatsAppContentKind } from "@/lib/whatsapp/evolution-message";
import { getEvolutionMediaBase64 } from "@/lib/whatsapp/evolution-client";

/**
 * Tempo de espera antes de responder. Se o cliente mandar outra mensagem nesse intervalo, esta
 * requisição desiste e a mais recente responde todas juntas (evita respostas fora de ordem).
 * Lembre de manter o timeout do n8n acima de debounce + tempo da IA (recomendado: 60 s).
 */
function getDebounceMs(): number {
  const fromEnv = Number(process.env.WHATSAPP_REPLY_DEBOUNCE_MS);
  if (Number.isFinite(fromEnv) && fromEnv >= 0) return fromEnv;
  return process.env.NODE_ENV === "test" ? 0 : 6000;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Tipos que não disparam resposta da IA (ela não vê o arquivo); ficam só registrados no histórico. */
const SILENT_KINDS: WhatsAppContentKind[] = ["sticker", "location", "contact"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "numvapt_whatsapp_webhook_2026";

  if (mode === "subscribe" && token === expectedToken) {
    return new Response(challenge ?? "OK", { status: 200 });
  }

  return NextResponse.json({
    status: "active",
    service: "NumVapt WhatsApp AI Webhook",
    whatsappNumber: "(51) 92004-4035",
    internationalFormat: "+5551920044035",
    timestamp: new Date().toISOString(),
  });
}

interface ParsedInbound {
  rawPhone: string;
  lid: string | null;
  senderName: string;
  messageText: string;
  displayText: string;
  kind: WhatsAppContentKind;
  isFromMe: boolean;
  isGroup: boolean;
  audioBase64: string;
  audioMimeType: string;
  externalId: string | null;
  evolutionKey: any;
  evolutionData: any;
}

function parseInbound(body: any): ParsedInbound {
  const out: ParsedInbound = {
    rawPhone: "",
    lid: null,
    senderName: "Cliente",
    messageText: "",
    displayText: "",
    kind: "text",
    isFromMe: false,
    isGroup: false,
    audioBase64: "",
    audioMimeType: "",
    externalId: null,
    evolutionKey: null,
    evolutionData: null,
  };

  // 1. Formato direto (n8n / payload simplificado)
  if (body.phone || body.sender) {
    out.rawPhone = String(body.phone || body.sender || "");
    out.senderName = body.senderName || body.name || "Cliente";
    out.messageText = typeof body.message === "string" ? body.message : typeof body.text === "string" ? body.text : body.text?.message || "";
    out.isFromMe = Boolean(body.fromMe);
    out.audioBase64 = body.audioBase64 || "";
    out.audioMimeType = body.audioMimeType || "";
    out.kind = out.audioBase64 && !out.messageText ? "audio" : "text";
    out.externalId = body.messageId ? String(body.messageId) : null;
  }
  // 2. Formato Evolution API (também quando o n8n repassa o corpo original)
  else if (body.data?.key) {
    const data = body.data;
    const key = data.key;
    out.isFromMe = Boolean(key.fromMe);
    out.isGroup = String(key.remoteJid || "").endsWith("@g.us");
    const contact = resolveContactFromKey(key, data);
    out.rawPhone = contact.phone;
    out.lid = contact.lid;
    out.senderName = data.pushName || "Cliente";
    const content = extractMessageContent(data.message);
    out.kind = content.kind;
    out.messageText = content.text;
    out.displayText = content.displayText;
    out.externalId = key.id ? String(key.id) : null;
    out.evolutionKey = key;
    out.evolutionData = data;
    if (content.kind === "audio") {
      // Com "Webhook Base64" ligado na Evolution, a mídia já vem no evento.
      out.audioBase64 = data.message?.base64 || data.base64 || "";
      out.audioMimeType = data.message?.audioMessage?.mimetype || "audio/ogg";
    }
  }
  // 3. Formato Meta Cloud API
  else if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
    const value = body.entry[0].changes[0].value;
    const msg = value.messages[0];
    out.rawPhone = msg.from || "";
    out.senderName = value.contacts?.[0]?.profile?.name || "Cliente";
    out.messageText = msg.text?.body || "";
    out.externalId = msg.id ? String(msg.id) : null;
  }

  if (!out.displayText) out.displayText = out.messageText || (out.audioBase64 ? "[Áudio]" : "");
  return out;
}

export async function POST(request: NextRequest) {
  if (!verifySharedSecret(request, "WHATSAPP_WEBHOOK_SECRET")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const inbound = parseInbound(body);

    // Ignora mensagens enviadas pelo próprio número, grupos e status
    if (
      inbound.isFromMe ||
      inbound.isGroup ||
      inbound.rawPhone.includes("-") ||
      inbound.rawPhone.includes("status@broadcast")
    ) {
      return NextResponse.json({ ignored: true, reason: "Mensagem do próprio bot ou grupo" }, { status: 200 });
    }

    const cleanPhone = inbound.rawPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      return NextResponse.json({ error: "Número de telefone inválido." }, { status: 400 });
    }

    if (inbound.kind === "reaction" || inbound.kind === "system") {
      return NextResponse.json({ ignored: true, reason: "Reação ou evento de sistema." }, { status: 200 });
    }

    // Áudio: baixa (se não veio no evento) e transcreve já, para o texto entrar no histórico
    if (inbound.kind === "audio") {
      if (!inbound.audioBase64 && inbound.evolutionKey) {
        const media = await getEvolutionMediaBase64(inbound.evolutionKey);
        if (media) {
          inbound.audioBase64 = media.base64;
          inbound.audioMimeType = media.mimetype;
        }
      }
      if (inbound.audioBase64) {
        const transcript = await transcribeWhatsAppAudio(inbound.audioBase64, inbound.audioMimeType);
        inbound.displayText = transcript ? `[Áudio] ${transcript}` : "[Áudio]";
      } else {
        inbound.displayText = "[Áudio]";
      }
      if (inbound.messageText) inbound.displayText += `\n${inbound.messageText}`;
    }

    if (!inbound.displayText.trim()) {
      return NextResponse.json({ ignored: true, reason: "Mensagem vazia." }, { status: 200 });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const chatRef = adminDb.collection("whatsapp_chats").doc(cleanPhone);
    const chatDoc = await chatRef.get();
    const chatData = chatDoc.data();

    // Se o atendimento humano assumiu e desativou a IA para este chat
    const isAiEnabled = chatData ? chatData.aiEnabled !== false : true;

    const userMessageId = inbound.externalId
      ? `msg_user_${inbound.externalId.replace(/[^\w-]/g, "")}`
      : `msg_user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userMessage: WhatsAppMessage = {
      id: userMessageId,
      role: "user",
      text: inbound.displayText,
      timestamp: nowIso,
      senderName: inbound.senderName,
    };
    if (inbound.kind !== "text") {
      userMessage.mediaType = inbound.kind === "audio" || inbound.kind === "image" || inbound.kind === "document" ? inbound.kind : null;
    }

    // Reentrega do mesmo evento (retry da Evolution/n8n): não responde duas vezes
    if (inbound.externalId) {
      const existing = await chatRef.collection("messages").doc(userMessageId).get();
      if (existing.exists) {
        return NextResponse.json({ ignored: true, reason: "Mensagem já processada." }, { status: 200 });
      }
    }

    // Salva mensagem do cliente e atualiza o resumo do chat
    await chatRef.collection("messages").doc(userMessageId).set(userMessage);
    await chatRef.set(
      {
        phone: cleanPhone,
        cleanPhone,
        ...(inbound.lid ? { lid: inbound.lid } : {}),
        contactName: inbound.senderName,
        lastMessageText: inbound.displayText,
        lastMessageAt: nowIso,
        lastUserMessageId: userMessageId,
        updatedAt: nowIso,
        ...(isAiEnabled ? {} : { status: "waiting_human", humanTakeover: true }),
      },
      { merge: true }
    );

    // Se a IA estiver desativada pelo administrador, apenas registra e aguarda resposta humana
    if (!isAiEnabled) {
      return NextResponse.json({
        handled: true,
        aiResponse: null,
        message: "IA desativada para este contato. Aguardando atendimento humano.",
      });
    }

    if (SILENT_KINDS.includes(inbound.kind)) {
      return NextResponse.json({ handled: true, replyText: null, reason: "Mídia registrada sem resposta automática." });
    }

    // Espera mensagens seguidas; só a requisição da última mensagem responde
    const debounceMs = getDebounceMs();
    if (debounceMs > 0) {
      await sleep(debounceMs);
      const latest = (await chatRef.get()).data();
      if (latest?.lastUserMessageId && latest.lastUserMessageId !== userMessageId) {
        return NextResponse.json({ handled: true, aggregated: true, phone: cleanPhone, replyText: null });
      }
      if (latest?.aiEnabled === false) {
        return NextResponse.json({ handled: true, replyText: null, reason: "IA desativada durante a espera." });
      }
    }

    // Histórico recente: separa as mensagens do cliente ainda sem resposta do que já foi conversado
    const historySnap = await chatRef
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(WHATSAPP_HISTORY_LIMIT + 10)
      .get();

    const recent: WhatsAppMessage[] = historySnap.docs
      .map((d: any) => d.data() as WhatsAppMessage)
      .filter((m: WhatsAppMessage) => m && typeof m.text === "string")
      .reverse();

    let splitAt = recent.length;
    while (splitAt > 0 && recent[splitAt - 1].role === "user") splitAt--;
    const history = recent.slice(0, splitAt).slice(-WHATSAPP_HISTORY_LIMIT);
    const pendingMessages = recent.slice(splitAt).map((m) => m.text);
    if (!pendingMessages.includes(inbound.displayText)) pendingMessages.push(inbound.displayText);

    const aiResult = await generateWhatsAppAIResponse({
      incomingMessage: inbound.displayText,
      pendingMessages,
      history,
      senderName: inbound.senderName,
      clientPhone: cleanPhone,
    });

    // Salva a resposta da assistente no Firestore
    const assistantMessageId = `msg_ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const replyAt = new Date().toISOString();
    const assistantMessage: WhatsAppMessage = {
      id: assistantMessageId,
      role: "assistant",
      text: aiResult.replyText,
      timestamp: replyAt,
      senderName: "Maia (NumVapt IA)",
    };

    await chatRef.collection("messages").doc(assistantMessageId).set(assistantMessage);

    await chatRef.set(
      {
        phone: cleanPhone,
        cleanPhone,
        contactName: inbound.senderName,
        lastMessageText: aiResult.replyText,
        lastMessageAt: replyAt,
        aiEnabled: !aiResult.needsHumanSupport,
        humanTakeover: aiResult.needsHumanSupport,
        status: aiResult.needsHumanSupport ? "waiting_human" : "active",
        suggestedAction: aiResult.suggestedAction || null,
        planMentioned: aiResult.planMentioned || null,
        updatedAt: replyAt,
      },
      { merge: true }
    );

    return NextResponse.json(
      {
        handled: true,
        phone: cleanPhone,
        senderName: inbound.senderName,
        replyText: aiResult.replyText,
        needsHumanSupport: aiResult.needsHumanSupport,
        suggestedAction: aiResult.suggestedAction,
        planMentioned: aiResult.planMentioned,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[WHATSAPP_WEBHOOK_ERROR]:", err);
    return NextResponse.json({ error: "Falha interna no webhook de WhatsApp." }, { status: 500 });
  }
}

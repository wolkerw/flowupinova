import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { generateWhatsAppAIResponse } from "@/lib/services/whatsapp-ai-service";
import type { WhatsAppMessage } from "@/lib/types/whatsapp";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extração normalizada de dados para suportar n8n, Evolution API, Z-API ou Meta Cloud API
    let rawPhone = "";
    let senderName = "Cliente";
    let messageText = "";
    let isFromMe = false;
    let audioBase64 = "";
    let audioMimeType = "";

    // 1. Formato direto (n8n / payload simplificado)
    if (body.phone || body.sender) {
      rawPhone = String(body.phone || body.sender || "");
      senderName = body.senderName || body.name || "Cliente";
      messageText = body.message || body.text || "";
      isFromMe = Boolean(body.fromMe);
      audioBase64 = body.audioBase64 || "";
      audioMimeType = body.audioMimeType || "";
    }
    // 2. Formato Evolution API
    else if (body.data?.key) {
      const key = body.data.key;
      isFromMe = Boolean(key.fromMe);
      rawPhone = key.remoteJid?.replace(/@.*$/, "") || "";
      senderName = body.data.pushName || "Cliente";
      messageText =
        body.data.message?.conversation ||
        body.data.message?.extendedTextMessage?.text ||
        body.data.message?.imageMessage?.caption ||
        "";
    }
    // 3. Formato Z-API
    else if (body.phone && body.text) {
      rawPhone = body.phone;
      senderName = body.senderName || "Cliente";
      messageText = body.text.message || "";
      isFromMe = Boolean(body.fromMe);
    }
    // 4. Formato Meta Cloud API
    else if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msg = body.entry[0].changes[0].value.messages[0];
      rawPhone = msg.from || "";
      const contact = body.entry[0].changes[0].value.contacts?.[0];
      senderName = contact?.profile?.name || "Cliente";
      messageText = msg.text?.body || "";
      isFromMe = false;
    }

    // Ignora mensagens enviadas pelo próprio bot ou grupos
    if (isFromMe || rawPhone.includes("-") || rawPhone.includes("status@broadcast")) {
      return NextResponse.json({ ignored: true, reason: "Mensagem do próprio bot ou grupo" }, { status: 200 });
    }

    const cleanPhone = rawPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      return NextResponse.json({ error: "Número de telefone inválido." }, { status: 400 });
    }

    if (!messageText && !audioBase64) {
      return NextResponse.json({ ignored: true, reason: "Mensagem vazia." }, { status: 200 });
    }

    const now = new Date();
    const chatRef = adminDb.collection("whatsapp_chats").doc(cleanPhone);
    const chatDoc = await chatRef.get();
    const chatData = chatDoc.data();

    // Se o atendimento humano assumiu e desativou a IA para este chat
    const isAiEnabled = chatData ? chatData.aiEnabled !== false : true;

    const userMessageId = `msg_user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userMessage: WhatsAppMessage = {
      id: userMessageId,
      role: "user",
      text: messageText || "[Áudio]",
      timestamp: now.toISOString(),
      senderName,
    };

    // Salva mensagem do usuário
    await chatRef.collection("messages").doc(userMessageId).set(userMessage);

    // Se a IA estiver desativada pelo administrador, apenas registra e aguarda resposta humana
    if (!isAiEnabled) {
      await chatRef.set(
        {
          phone: cleanPhone,
          cleanPhone,
          contactName: senderName,
          lastMessageText: messageText || "[Áudio]",
          lastMessageAt: now.toISOString(),
          status: "waiting_human",
          humanTakeover: true,
          updatedAt: now.toISOString(),
        },
        { merge: true }
      );

      return NextResponse.json({
        handled: true,
        aiResponse: null,
        message: "IA desativada para este contato. Aguardando atendimento humano.",
      });
    }

    // Busca histórico recente para contexto do Gemini (últimas 6 mensagens)
    const historySnap = await chatRef
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(6)
      .get();

    const history: WhatsAppMessage[] = historySnap.docs
      .map((d) => d.data() as WhatsAppMessage)
      .reverse();

    // Gera resposta inteligente com o Google Gemini
    const aiResult = await generateWhatsAppAIResponse({
      incomingMessage: messageText,
      history,
      senderName,
      clientPhone: cleanPhone,
      audioBase64,
      audioMimeType,
    });

    // Salva a resposta da assistente no Firestore
    const assistantMessageId = `msg_ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const assistantMessage: WhatsAppMessage = {
      id: assistantMessageId,
      role: "assistant",
      text: aiResult.replyText,
      timestamp: new Date().toISOString(),
      senderName: "Maia (NumVapt IA)",
    };

    await chatRef.collection("messages").doc(assistantMessageId).set(assistantMessage);

    // Atualiza o documento principal do chat
    await chatRef.set(
      {
        phone: cleanPhone,
        cleanPhone,
        contactName: senderName,
        lastMessageText: aiResult.replyText,
        lastMessageAt: new Date().toISOString(),
        aiEnabled: !aiResult.needsHumanSupport,
        humanTakeover: aiResult.needsHumanSupport,
        status: aiResult.needsHumanSupport ? "waiting_human" : "active",
        suggestedAction: aiResult.suggestedAction || null,
        planMentioned: aiResult.planMentioned || null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json(
      {
        handled: true,
        phone: cleanPhone,
        senderName,
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

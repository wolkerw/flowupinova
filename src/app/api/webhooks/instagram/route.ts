import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { InstagramMessage, InstagramChatSession } from "@/lib/types/instagram";
import { generateInstagramAIResponse } from "@/lib/services/instagram-ai-service";

const INSTAGRAM_VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || "numvapt_instagram_verify_token";
const INSTAGRAM_PAGE_ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || "";

/**
 * Envia uma mensagem de texto de volta ao seguidor usando a API Oficial da Meta (Instagram Graph API)
 */
async function sendInstagramDirectMessage(recipientId: string, text: string): Promise<boolean> {
  if (!INSTAGRAM_PAGE_ACCESS_TOKEN) {
    console.warn("[INSTAGRAM_WEBHOOK] INSTAGRAM_PAGE_ACCESS_TOKEN não configurado no .env");
    return false;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/me/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INSTAGRAM_PAGE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[INSTAGRAM_GRAPH_API_ERROR]", res.status, errBody);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[INSTAGRAM_SEND_ERROR]", error);
    return false;
  }
}

/**
 * GET: Validação do Webhook pelo Meta for Developers
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === INSTAGRAM_VERIFY_TOKEN) {
    console.log("[INSTAGRAM_WEBHOOK_VERIFIED] Webhook validado com sucesso pela Meta.");
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Token de verificação inválido." }, { status: 403 });
}

/**
 * POST: Recebimento de Mensagens Diretas em tempo real
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Valida se o evento é do tipo Instagram
    if (body.object !== "instagram" && body.object !== "page") {
      return NextResponse.json({ status: "ignored", reason: "not an instagram event" }, { status: 200 });
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      const messagingList = entry.messaging || [];
      for (const event of messagingList) {
        // Ignora eventos que não sejam mensagens de texto recebidas
        if (!event.message || !event.sender || !event.sender.id) continue;
        if (event.message.is_echo) continue; // Evita loop se for eco da própria página

        const senderId = String(event.sender.id);
        const text = String(event.message.text || "").trim();
        if (!text) continue;

        const messageId = event.message.mid || `ig_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date(event.timestamp || Date.now()).toISOString();

        // 1. Consulta ou cria a sessão no Firestore
        const chatDocRef = adminDb.collection("instagram_chats").doc(senderId);
        const chatSnap = await chatDocRef.get();
        const existingData = chatSnap.exists ? (chatSnap.data() as Partial<InstagramChatSession>) : null;

        const contactName = existingData?.contactName || existingData?.username || `Seguidor (${senderId.slice(-4)})`;
        const aiEnabled = existingData?.aiEnabled !== false;
        const humanTakeover = existingData?.humanTakeover === true;

        // 2. Registra a mensagem do usuário
        const userMessage: InstagramMessage = {
          id: messageId,
          role: "user",
          text,
          timestamp: now,
          senderId,
          senderName: contactName,
        };

        await chatDocRef.collection("messages").doc(messageId).set(userMessage);

        // 3. Atualiza o status da sessão
        await chatDocRef.set(
          {
            id: senderId,
            senderId,
            contactName,
            username: existingData?.username || senderId,
            lastMessageText: text,
            lastMessageAt: now,
            aiEnabled,
            humanTakeover,
            status: humanTakeover ? "waiting_human" : "active",
            updatedAt: now,
            createdAt: existingData?.createdAt || now,
          },
          { merge: true }
        );

        // 4. Se a IA estiver ativa e não houver intervenção humana, gera e envia resposta
        if (aiEnabled && !humanTakeover) {
          // Busca últimas mensagens para contexto de conversa
          const historySnap = await chatDocRef
            .collection("messages")
            .orderBy("timestamp", "desc")
            .limit(6)
            .get();

          const history: InstagramMessage[] = historySnap.docs
            .map((d) => d.data() as InstagramMessage)
            .reverse();

          const aiResponse = await generateInstagramAIResponse({
            incomingMessage: text,
            history,
            senderName: contactName,
            senderId,
          });

          const aiReplyText = aiResponse.replyText;
          await sendInstagramDirectMessage(senderId, aiReplyText);

          const aiMsgId = `ig_ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const aiNow = new Date().toISOString();
          const aiMessage: InstagramMessage = {
            id: aiMsgId,
            role: "assistant",
            text: aiReplyText,
            timestamp: aiNow,
            senderId: "numvapt_bot",
            senderName: "Maia (NumVapt IA)",
          };

          await chatDocRef.collection("messages").doc(aiMsgId).set(aiMessage);
          await chatDocRef.set(
            {
              lastMessageText: aiReplyText,
              lastMessageAt: aiNow,
              humanTakeover: Boolean(aiResponse.needsHumanSupport),
              status: aiResponse.needsHumanSupport ? "waiting_human" : "active",
              updatedAt: aiNow,
            },
            { merge: true }
          );
        }
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error: any) {
    console.error("[INSTAGRAM_WEBHOOK_POST_ERROR]", error);
    return NextResponse.json({ error: "Erro interno no webhook do Instagram." }, { status: 500 });
  }
}

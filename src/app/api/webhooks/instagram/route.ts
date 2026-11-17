import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { InstagramMessage, InstagramChatSession } from "@/lib/types/instagram";
import { generateInstagramAIResponse, INSTAGRAM_HISTORY_LIMIT } from "@/lib/services/instagram-ai-service";
import { classifyInstagramMessage } from "@/lib/instagram/classify-message";
import { verifyMetaSignature } from "@/lib/webhook-auth";

// SEGURANÇA: sem valor padrão no código; defina INSTAGRAM_VERIFY_TOKEN no ambiente.
const INSTAGRAM_VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || "";
const INSTAGRAM_PAGE_ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || "";

/**
 * Envia uma mensagem de texto de volta ao seguidor usando a API Oficial da Meta (Instagram Graph API)
 */
async function sendInstagramDirectMessage(recipientId: string, text: string): Promise<boolean> {
  if (!INSTAGRAM_PAGE_ACCESS_TOKEN) {
    console.warn("[INSTAGRAM_WEBHOOK] INSTAGRAM_PAGE_ACCESS_TOKEN não configurado no .env");
    return false;
  }

  // Tokens da Instagram Business API (iniciando com IG) usam graph.instagram.com
  const endpoints = INSTAGRAM_PAGE_ACCESS_TOKEN.startsWith("IG")
    ? [
        `https://graph.instagram.com/v21.0/me/messages`,
        `https://graph.facebook.com/v21.0/me/messages`,
      ]
    : [
        `https://graph.facebook.com/v21.0/me/messages`,
        `https://graph.instagram.com/v21.0/me/messages`,
      ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
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

      if (res.ok) {
        console.log(`[INSTAGRAM_SEND_SUCCESS] Mensagem enviada com sucesso via ${url}`);
        return true;
      }

      const errBody = await res.text();
      console.warn(`[INSTAGRAM_GRAPH_API_FAIL] Status ${res.status} em ${url}:`, errBody);
    } catch (error) {
      console.error(`[INSTAGRAM_SEND_ERROR] Erro na requisição para ${url}:`, error);
    }
  }

  return false;
}

/**
 * Consulta o perfil do seguidor no Instagram Graph API para obter o nome e username reais
 */
async function fetchInstagramUserProfile(senderId: string): Promise<{ name?: string; username?: string }> {
  if (!INSTAGRAM_PAGE_ACCESS_TOKEN) return {};

  const urls = INSTAGRAM_PAGE_ACCESS_TOKEN.startsWith("IG")
    ? [
        `https://graph.instagram.com/v21.0/${senderId}?fields=name,username&access_token=${INSTAGRAM_PAGE_ACCESS_TOKEN}`,
        `https://graph.facebook.com/v21.0/${senderId}?fields=name,username&access_token=${INSTAGRAM_PAGE_ACCESS_TOKEN}`,
      ]
    : [
        `https://graph.facebook.com/v21.0/${senderId}?fields=name,username&access_token=${INSTAGRAM_PAGE_ACCESS_TOKEN}`,
        `https://graph.instagram.com/v21.0/${senderId}?fields=name,username&access_token=${INSTAGRAM_PAGE_ACCESS_TOKEN}`,
      ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.name || data.username)) {
          return {
            name: data.name || data.username,
            username: data.username || data.name,
          };
        }
      }
    } catch (err) {
      console.warn("[INSTAGRAM_PROFILE_FETCH_FAIL]", err);
    }
  }

  return {};
}

/**
 * GET: Validação do Webhook pelo Meta for Developers
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && INSTAGRAM_VERIFY_TOKEN && token === INSTAGRAM_VERIFY_TOKEN) {
    console.log("[INSTAGRAM_WEBHOOK_VERIFIED] Webhook validado com sucesso pela Meta.");
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Token de verificação inválido." }, { status: 403 });
}

function getDebounceMs(): number {
  const fromEnv = Number(process.env.INSTAGRAM_REPLY_DEBOUNCE_MS);
  if (Number.isFinite(fromEnv) && fromEnv >= 0) return fromEnv;
  // A Meta espera o 200 em até ~20 s: espera curta para juntar mensagens seguidas.
  return process.env.NODE_ENV === "test" ? 0 : 4000;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * POST: Recebimento de Mensagens Diretas em tempo real
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
      console.warn("[INSTAGRAM_WEBHOOK] Assinatura inválida: evento rejeitado.");
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
    }
    const body = JSON.parse(rawBody);

    // Valida se o evento é do tipo Instagram
    if (body.object !== "instagram" && body.object !== "page") {
      return NextResponse.json({ status: "ignored", reason: "not an instagram event" }, { status: 200 });
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      // Comentários e menções em posts/reels (entry.changes) nunca recebem resposta automática da Maia.
      if (Array.isArray(entry.changes) && entry.changes.length > 0) {
        const fields = entry.changes.map((c: any) => c?.field).filter(Boolean).join(",");
        console.log(`[INSTAGRAM_WEBHOOK] Evento de ${fields || "changes"} ignorado (sem resposta automática a comentários).`);
      }

      const messagingList = entry.messaging || [];
      for (const event of messagingList) {
        // Reações (curtir/emoji numa mensagem) não são mensagens: nunca respondem
        if (event.reaction || !event.message || !event.sender || !event.sender.id) continue;
        if (event.message.is_echo) continue; // Evita loop se for eco da própria página

        const classified = classifyInstagramMessage(event.message);
        if (!classified) continue;

        const senderId = String(event.sender.id);
        const messageId = event.message.mid || `ig_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date(event.timestamp || Date.now()).toISOString();

        const chatDocRef = adminDb.collection("instagram_chats").doc(senderId);
        const messageRef = chatDocRef.collection("messages").doc(messageId);

        // Reentrega do mesmo evento pela Meta: não processa duas vezes
        if (event.message.mid && (await messageRef.get()).exists) continue;

        // 1. Consulta ou cria a sessão no Firestore
        const chatSnap = await chatDocRef.get();
        const existingData = chatSnap.exists ? (chatSnap.data() as Partial<InstagramChatSession>) : null;

        let contactName = existingData?.contactName;
        let username = existingData?.username;

        if (!contactName || contactName.startsWith("Seguidor (") || !username) {
          const profile = await fetchInstagramUserProfile(senderId);
          if (profile.name) contactName = profile.name;
          if (profile.username) username = profile.username;
        }

        if (!contactName) contactName = `Seguidor (${senderId.slice(-4)})`;
        if (!username) username = senderId;

        const aiEnabled = existingData?.aiEnabled !== false;
        const humanTakeover = existingData?.humanTakeover === true;

        // 2. Registra a mensagem do usuário (inclusive reações e emojis, para a equipe ver)
        const userMessage: InstagramMessage & { noReply?: boolean; noReplyReason?: string } = {
          id: messageId,
          role: "user",
          text: classified.displayText,
          timestamp: now,
          senderId,
          senderName: contactName,
          mediaType: classified.mediaType ?? null,
          ...(classified.shouldReply ? {} : { noReply: true, noReplyReason: classified.reason }),
        };

        await messageRef.set(userMessage);

        // 3. Atualiza a sessão. Mensagens sem resposta não mudam lastUserMessageId, para não
        // cancelar a resposta de uma pergunta enviada logo antes.
        await chatDocRef.set(
          {
            id: senderId,
            senderId,
            contactName,
            username: existingData?.username || username,
            lastMessageText: classified.displayText,
            lastMessageAt: now,
            aiEnabled,
            humanTakeover,
            status: humanTakeover ? "waiting_human" : "active",
            updatedAt: now,
            createdAt: existingData?.createdAt || now,
            ...(classified.shouldReply ? { lastUserMessageId: messageId } : {}),
          },
          { merge: true }
        );

        if (!classified.shouldReply) {
          console.log(`[INSTAGRAM_WEBHOOK] Sem resposta automática (${classified.reason}).`);
          continue;
        }

        // 4. Só responde com a IA ativa e sem intervenção humana
        if (!aiEnabled || humanTakeover) continue;

        // Espera mensagens seguidas; só a última responde, juntando todas
        const debounceMs = getDebounceMs();
        if (debounceMs > 0) {
          await sleep(debounceMs);
          const latest = (await chatDocRef.get()).data() as any;
          if (latest?.lastUserMessageId && latest.lastUserMessageId !== messageId) continue;
          if (latest?.aiEnabled === false || latest?.humanTakeover === true) continue;
        }

        const historySnap = await chatDocRef
          .collection("messages")
          .orderBy("timestamp", "desc")
          .limit(INSTAGRAM_HISTORY_LIMIT + 10)
          .get();

        const recent = historySnap.docs
          .map((d: any) => d.data() as InstagramMessage & { noReply?: boolean })
          .filter((m: any) => m && typeof m.text === "string" && !m.noReply)
          .reverse();

        let splitAt = recent.length;
        while (splitAt > 0 && recent[splitAt - 1].role === "user") splitAt--;
        const history = recent.slice(0, splitAt).slice(-INSTAGRAM_HISTORY_LIMIT);
        const pendingMessages = recent.slice(splitAt).map((m: InstagramMessage) => m.text);
        if (!pendingMessages.includes(classified.displayText)) pendingMessages.push(classified.displayText);

        const aiResponse = await generateInstagramAIResponse({
          incomingMessage: classified.displayText,
          pendingMessages,
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

    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error: any) {
    console.error("[INSTAGRAM_WEBHOOK_POST_ERROR]", error);
    return NextResponse.json({ error: "Erro interno no webhook do Instagram." }, { status: 500 });
  }
}

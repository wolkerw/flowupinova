import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import type { InstagramMessage, InstagramChatSession } from "@/lib/types/instagram";

const INSTAGRAM_PAGE_ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || "";

/**
 * Envia uma mensagem manual via Instagram Graph API
 */
async function sendInstagramDirectMessage(recipientId: string, text: string): Promise<boolean> {
  if (!INSTAGRAM_PAGE_ACCESS_TOKEN) {
    console.warn("[ADMIN_INSTAGRAM] INSTAGRAM_PAGE_ACCESS_TOKEN não configurado no .env");
    return false;
  }

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
        console.log(`[ADMIN_INSTAGRAM_SEND_SUCCESS] Mensagem enviada via ${url}`);
        return true;
      }

      const errBody = await res.text();
      console.warn(`[ADMIN_INSTAGRAM_SEND_FAIL] Status ${res.status} em ${url}:`, errBody);
    } catch (error) {
      console.error(`[ADMIN_INSTAGRAM_FETCH_ERROR] Erro em ${url}:`, error);
    }
  }

  return false;
}

/**
 * GET: Lista de conversas ou mensagens de um chat específico
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const senderId = searchParams.get("senderId");

  try {
    // 1. Mensagens de uma conversa específica
    if (senderId) {
      const messagesSnap = await adminDb
        .collection(`instagram_chats/${senderId}/messages`)
        .orderBy("timestamp", "asc")
        .limit(100)
        .get();

      const messages: InstagramMessage[] = messagesSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      return NextResponse.json({ messages }, { status: 200 });
    }

    // 2. Lista geral de conversas
    const chatsSnap = await adminDb
      .collection("instagram_chats")
      .orderBy("lastMessageAt", "desc")
      .limit(50)
      .get();

    const chats: InstagramChatSession[] = chatsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        senderId: data.senderId || d.id,
        username: data.username || d.id,
        contactName: data.contactName || data.username || `Seguidor (${d.id.slice(-4)})`,
        lastMessageText: data.lastMessageText || data.lastMessage || "",
        lastMessageAt: data.lastMessageAt || new Date().toISOString(),
        aiEnabled: data.aiEnabled !== false,
        humanTakeover: Boolean(data.humanTakeover),
        status: data.humanTakeover ? "waiting_human" : "active",
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    });

    return NextResponse.json({ chats }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_INSTAGRAM_GET_ERROR]:", err);
    return NextResponse.json({ error: "Falha ao buscar dados do Instagram." }, { status: 500 });
  }
}

/**
 * PUT: Ativar ou pausar a Inteligência Artificial para um chat
 */
export async function PUT(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { senderId, aiEnabled } = body;

    if (!senderId) {
      return NextResponse.json({ error: "ID do remetente (senderId) obrigatório." }, { status: 400 });
    }

    const now = new Date().toISOString();
    await adminDb.collection("instagram_chats").doc(senderId).set(
      {
        aiEnabled: Boolean(aiEnabled),
        humanTakeover: !aiEnabled,
        status: aiEnabled ? "active" : "waiting_human",
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, aiEnabled: Boolean(aiEnabled) }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_INSTAGRAM_PUT_ERROR]:", err);
    return NextResponse.json({ error: "Falha ao atualizar modo de IA do Instagram." }, { status: 500 });
  }
}

/**
 * POST: Enviar mensagem manual de atendente humano pelo Direct
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { senderId, message, text } = body;
    const messageContent = (message || text || "").trim();

    if (!senderId || !messageContent) {
      return NextResponse.json({ error: "Remetente e mensagem são obrigatórios." }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 1. Tenta entregar a mensagem pelo Direct oficial da Meta
    await sendInstagramDirectMessage(senderId, messageContent);

    // 2. Registra no Firestore como mensagem de operador humano
    const messageId = `ig_admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const adminMessage: InstagramMessage = {
      id: messageId,
      role: "admin",
      text: messageContent,
      timestamp: now,
      senderId: "numvapt_admin",
      senderName: "Atendente Humano",
    };

    const chatRef = adminDb.collection("instagram_chats").doc(senderId);
    await chatRef.collection("messages").doc(messageId).set(adminMessage);

    // 3. Atualiza o chat, pausando a IA para permitir a conversa humana
    await chatRef.set(
      {
        lastMessageText: messageContent,
        lastMessageAt: now,
        humanTakeover: true,
        aiEnabled: false,
        status: "waiting_human",
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, message: adminMessage }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_INSTAGRAM_POST_ERROR]:", err);
    return NextResponse.json({ error: "Falha ao enviar mensagem manual pelo Instagram." }, { status: 500 });
  }
}

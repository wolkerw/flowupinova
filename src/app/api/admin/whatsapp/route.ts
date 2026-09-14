import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import type { WhatsAppMessage, WhatsAppChatSession } from "@/lib/types/whatsapp";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "https://evolution-api.flowupinova.com.br";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "8869f3644b0923bb1c982dc2a3c10241";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "numvapt-atendimento";

async function fetchFromEvolution(endpoint: string, body: any = {}) {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("[EVOLUTION_API_SYNC_ERROR]:", err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  try {
    // 1. Mensagens de um chat específico
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      const jid = cleanPhone.includes("@") ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

      // Busca mensagens no Firestore
      const messagesSnap = await adminDb
        .collection(`whatsapp_chats/${cleanPhone}/messages`)
        .orderBy("timestamp", "asc")
        .limit(100)
        .get();

      const firestoreMessages: WhatsAppMessage[] = messagesSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      // Busca mensagens na Evolution API
      const evolutionData = await fetchFromEvolution(`/chat/findMessages/${EVOLUTION_INSTANCE}`, {
        where: {
          key: {
            remoteJid: jid,
          },
        },
      });

      const evolutionRecords = evolutionData?.messages?.records || [];
      const evolutionMessages: WhatsAppMessage[] = evolutionRecords.map((rec: any) => {
        const text =
          rec.message?.conversation ||
          rec.message?.extendedTextMessage?.text ||
          rec.message?.imageMessage?.caption ||
          "";

        const isMe = Boolean(rec.key?.fromMe);
        const timestamp = rec.messageTimestamp
          ? new Date(Number(rec.messageTimestamp) * 1000).toISOString()
          : new Date().toISOString();

        return {
          id: rec.key?.id || rec.id,
          role: isMe ? "assistant" : "user",
          text,
          timestamp,
          senderName: isMe ? "Maia (NumVapt IA)" : rec.pushName || "Cliente",
        };
      });

      // Mescla mensagens sem duplicar
      const map = new Map<string, WhatsAppMessage>();
      for (const m of firestoreMessages) {
        if (m.text?.trim()) map.set(m.id, m);
      }
      for (const m of evolutionMessages) {
        if (m.text?.trim()) map.set(m.id, m);
      }

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      return NextResponse.json({ messages: merged }, { status: 200 });
    }

    // 2. Lista geral de conversas
    // Busca chats no Firestore
    const chatsSnap = await adminDb
      .collection("whatsapp_chats")
      .orderBy("lastMessageAt", "desc")
      .limit(50)
      .get();

    const firestoreChats: Record<string, any> = {};
    chatsSnap.docs.forEach((d) => {
      firestoreChats[d.id] = d.data();
    });

    // Busca chats na Evolution API
    const evolutionChatsRaw = (await fetchFromEvolution(`/chat/findChats/${EVOLUTION_INSTANCE}`)) || [];
    const chatsMap = new Map<string, WhatsAppChatSession>();

    // Processa chats da Evolution API
    if (Array.isArray(evolutionChatsRaw)) {
      for (const c of evolutionChatsRaw) {
        const rawJid = c.remoteJid || "";
        if (rawJid.includes("@g.us") || rawJid.includes("broadcast")) continue;

        const clean = rawJid.replace(/@.*$/, "").replace(/\D/g, "");
        if (!clean) continue;

        const firestoreConfig = firestoreChats[clean] || {};
        const lastMsgText =
          c.lastMessage?.message?.conversation ||
          c.lastMessage?.message?.extendedTextMessage?.text ||
          firestoreConfig.lastMessageText ||
          firestoreConfig.lastMessage ||
          "";

        const contactName = c.pushName || firestoreConfig.senderName || firestoreConfig.contactName || clean;

        chatsMap.set(clean, {
          id: clean,
          phone: clean,
          cleanPhone: clean,
          senderName: contactName,
          contactName: contactName,
          lastMessage: lastMsgText,
          lastMessageText: lastMsgText,
          lastMessageAt: c.updatedAt || firestoreConfig.lastMessageAt || new Date().toISOString(),
          aiEnabled: firestoreConfig.aiEnabled !== false,
          status: firestoreConfig.aiEnabled === false ? "waiting_human" : "active",
        });
      }
    }

    // Inclui chats que estejam no Firestore mas não retornaram na Evolution
    for (const [clean, fData] of Object.entries(firestoreChats)) {
      if (!chatsMap.has(clean)) {
        chatsMap.set(clean, {
          id: clean,
          phone: fData.phone || clean,
          cleanPhone: clean,
          senderName: fData.senderName || fData.contactName || clean,
          contactName: fData.contactName || fData.senderName || clean,
          lastMessage: fData.lastMessage || fData.lastMessageText || "",
          lastMessageText: fData.lastMessageText || fData.lastMessage || "",
          lastMessageAt: fData.lastMessageAt || new Date().toISOString(),
          aiEnabled: fData.aiEnabled !== false,
          status: fData.aiEnabled === false ? "waiting_human" : "active",
        });
      }
    }

    const chatsList = Array.from(chatsMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
    );

    return NextResponse.json({ chats: chatsList }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_WHATSAPP_GET_ERROR]:", err);
    return NextResponse.json({ error: "Falha ao buscar dados de WhatsApp." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { phone, aiEnabled } = body;

    if (!phone) {
      return NextResponse.json({ error: "Telefone obrigatório." }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    await adminDb.collection("whatsapp_chats").doc(cleanPhone).set(
      {
        aiEnabled: Boolean(aiEnabled),
        humanTakeover: !aiEnabled,
        status: aiEnabled ? "active" : "waiting_human",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, aiEnabled: Boolean(aiEnabled) }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_WHATSAPP_PUT_ERROR]:", err);
    return NextResponse.json({ error: "Falha ao atualizar modo IA." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { phone, message, text } = body;
    const messageContent = (message || text || "").trim();

    if (!phone || !messageContent) {
      return NextResponse.json({ error: "Telefone e mensagem são obrigatórios." }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    const now = new Date().toISOString();

    // 1. Dispara a mensagem para a Evolution API para entregar no WhatsApp real do cliente
    await fetchFromEvolution(`/message/sendText/${EVOLUTION_INSTANCE}`, {
      number: cleanPhone,
      text: messageContent,
    });

    // 2. Registra no Firestore como mensagem do Atendente Humano
    const messageId = `msg_admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const adminMessage: WhatsAppMessage = {
      id: messageId,
      role: "admin",
      text: messageContent,
      timestamp: now,
      senderName: "Atendente Humano",
    };

    const chatRef = adminDb.collection("whatsapp_chats").doc(cleanPhone);
    await chatRef.collection("messages").doc(messageId).set(adminMessage);

    await chatRef.set(
      {
        phone: cleanPhone,
        cleanPhone: cleanPhone,
        lastMessage: messageContent,
        lastMessageText: messageContent,
        lastMessageAt: now,
        humanTakeover: true,
        aiEnabled: false, // Desativa IA temporariamente quando o atendente humano responde
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, message: adminMessage }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_WHATSAPP_POST_ERROR]:", err);
    return NextResponse.json({ error: "Falha ao enviar mensagem manual." }, { status: 500 });
  }
}

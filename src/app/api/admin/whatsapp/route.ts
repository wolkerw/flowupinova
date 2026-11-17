import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import type { WhatsAppMessage } from "@/lib/types/whatsapp";
import {
  findEvolutionChats,
  findEvolutionMessages,
  sendEvolutionText,
} from "@/lib/whatsapp/evolution-client";
import { extractMessageContent, jidToDigits, resolveContactFromKey } from "@/lib/whatsapp/evolution-message";
import {
  cutAtCompleteBoundary,
  evolutionRecordToMessage,
  mergeHistory,
  type EvolutionHistoryMessage,
} from "@/lib/whatsapp/history-merge";

const PAGE_SIZE = 50;

function onlyDigits(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

async function loadFirestorePage(docId: string, before: string | null) {
  let query = adminDb.collection(`whatsapp_chats/${docId}/messages`).orderBy("timestamp", "desc");
  if (before) query = query.where("timestamp", "<", before);
  const snap = await query.limit(PAGE_SIZE).get();
  const messages = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as WhatsAppMessage[];
  return {
    messages,
    full: messages.length === PAGE_SIZE,
    oldest: messages.length ? messages[messages.length - 1].timestamp : null,
  };
}

async function loadEvolutionPage(remoteJid: string, before: string | null) {
  const page = await findEvolutionMessages(remoteJid, { before, pageSize: PAGE_SIZE });
  const beforeMs = before ? new Date(before).getTime() : Infinity;
  const messages = page.records
    .map(evolutionRecordToMessage)
    .filter((m): m is EvolutionHistoryMessage => !!m && new Date(m.timestamp).getTime() < beforeMs);
  const oldest = messages.reduce<string | null>(
    (acc, m) => (!acc || m.timestamp < acc ? m.timestamp : acc),
    null
  );
  // Página cheia = pode haver mais mensagens antigas nessa fonte.
  return { messages, full: page.records.length >= PAGE_SIZE && messages.length > 0, oldest };
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
    // 1. Mensagens de um chat (página mais recente, ou anteriores a `before`)
    if (phone) {
      const cleanPhone = onlyDigits(phone);
      const before = searchParams.get("before");
      const beforeIso = before && !Number.isNaN(Date.parse(before)) ? new Date(before).toISOString() : null;

      const chatDoc = await adminDb.collection("whatsapp_chats").doc(cleanPhone).get();
      const lid = onlyDigits(searchParams.get("lid")) || onlyDigits(chatDoc.data()?.lid) || "";

      // Firestore: documento do telefone e, se o contato veio por LID antes da correção, o do LID.
      const firestoreDocIds = Array.from(new Set([cleanPhone, lid].filter(Boolean)));
      const evolutionJids = [`${cleanPhone}@s.whatsapp.net`, ...(lid ? [`${lid}@lid`] : [])];

      const [firestorePages, evolutionPages] = await Promise.all([
        Promise.all(firestoreDocIds.map((id) => loadFirestorePage(id, beforeIso))),
        Promise.all(evolutionJids.map((jid) => loadEvolutionPage(jid, beforeIso))),
      ]);

      const merged = mergeHistory(
        firestorePages.flatMap((p) => p.messages),
        evolutionPages.flatMap((p) => p.messages)
      );
      const { messages, hasMore, oldest } = cutAtCompleteBoundary(merged, [
        ...firestorePages,
        ...evolutionPages,
      ]);

      return NextResponse.json({ messages, hasMore, oldest }, { status: 200 });
    }

    // 2. Lista geral de conversas
    const chatsSnap = await adminDb
      .collection("whatsapp_chats")
      .orderBy("lastMessageAt", "desc")
      .limit(100)
      .get();

    const firestoreChats: Record<string, any> = {};
    const lidToPhone = new Map<string, string>();
    chatsSnap.docs.forEach((d) => {
      const data = d.data();
      firestoreChats[d.id] = data;
      const lid = onlyDigits(data?.lid);
      if (lid && lid !== d.id) lidToPhone.set(lid, d.id);
    });

    const evolutionChatsRaw = await findEvolutionChats();
    const chatsMap = new Map<string, any>();

    for (const c of evolutionChatsRaw) {
      const rawJid: string = c.remoteJid || "";
      if (!rawJid || rawJid.includes("@g.us") || rawJid.includes("broadcast") || rawJid.includes("@newsletter")) {
        continue;
      }

      let clean = jidToDigits(rawJid);
      let lid: string | null = null;
      if (rawJid.endsWith("@lid")) {
        lid = clean;
        const fromKey = resolveContactFromKey(c.lastMessage?.key ?? { remoteJid: rawJid }, c.lastMessage);
        clean = lidToPhone.get(lid) || (fromKey.phone !== lid ? fromKey.phone : "") || lid;
      }
      if (!clean) continue;

      const firestoreConfig = firestoreChats[clean] || {};
      const evoLast = c.lastMessage?.message ? extractMessageContent(c.lastMessage.message).displayText : "";
      const evoAt = c.updatedAt || (c.lastMessage?.messageTimestamp ? new Date(Number(c.lastMessage.messageTimestamp) * 1000).toISOString() : "");
      const fsAt = firestoreConfig.lastMessageAt || "";
      const useFirestore = fsAt && (!evoAt || fsAt >= evoAt);
      const lastMsgText = (useFirestore ? firestoreConfig.lastMessageText || firestoreConfig.lastMessage : evoLast) || evoLast || firestoreConfig.lastMessageText || "";
      const contactName = firestoreConfig.contactName || firestoreConfig.senderName || c.pushName || clean;

      const existing = chatsMap.get(clean);
      const lastMessageAt = [existing?.lastMessageAt, evoAt, fsAt].filter(Boolean).sort().pop() || new Date().toISOString();

      chatsMap.set(clean, {
        id: clean,
        phone: clean,
        cleanPhone: clean,
        lid: lid || existing?.lid || firestoreConfig.lid || null,
        senderName: existing?.senderName && existing.senderName !== clean ? existing.senderName : contactName,
        contactName: existing?.contactName && existing.contactName !== clean ? existing.contactName : contactName,
        lastMessage: existing && existing.lastMessageAt > (useFirestore ? fsAt : evoAt) ? existing.lastMessage : lastMsgText,
        lastMessageText: existing && existing.lastMessageAt > (useFirestore ? fsAt : evoAt) ? existing.lastMessageText : lastMsgText,
        lastMessageAt,
        aiEnabled: firestoreConfig.aiEnabled !== false,
        status: firestoreConfig.aiEnabled === false ? "waiting_human" : "active",
      });
    }

    // Chats que estão no Firestore mas não vieram da Evolution (ignora docs antigos salvos pelo LID já mapeado)
    for (const [clean, fData] of Object.entries(firestoreChats)) {
      if (chatsMap.has(clean) || lidToPhone.has(clean)) continue;
      chatsMap.set(clean, {
        id: clean,
        phone: fData.phone || clean,
        cleanPhone: clean,
        lid: fData.lid || null,
        senderName: fData.senderName || fData.contactName || clean,
        contactName: fData.contactName || fData.senderName || clean,
        lastMessage: fData.lastMessage || fData.lastMessageText || "",
        lastMessageText: fData.lastMessageText || fData.lastMessage || "",
        lastMessageAt: fData.lastMessageAt || new Date().toISOString(),
        aiEnabled: fData.aiEnabled !== false,
        status: fData.aiEnabled === false ? "waiting_human" : "active",
      });
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

    const cleanPhone = onlyDigits(phone);
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
    const messageContent = String(message || text || "").trim();

    if (!phone || !messageContent) {
      return NextResponse.json({ error: "Telefone e mensagem são obrigatórios." }, { status: 400 });
    }

    const cleanPhone = onlyDigits(phone);
    const now = new Date().toISOString();

    // 1. Entrega a mensagem no WhatsApp real do cliente
    const sent = await sendEvolutionText(cleanPhone, messageContent);
    if (!sent) {
      return NextResponse.json(
        { error: "A Evolution API não confirmou o envio. A mensagem não foi entregue." },
        { status: 502 }
      );
    }

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
        aiEnabled: false, // Desativa IA quando o atendente humano responde
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

import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import type { WhatsAppMessage } from "@/lib/types/whatsapp";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  try {
    // Se solicitou as mensagens de um chat específico
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      const messagesSnap = await adminDb
        .collection(`whatsapp_chats/${cleanPhone}/messages`)
        .orderBy("timestamp", "asc")
        .limit(100)
        .get();

      const messages: WhatsAppMessage[] = messagesSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      return NextResponse.json({ messages }, { status: 200 });
    }

    // Caso contrário, lista todas as conversas
    const chatsSnap = await adminDb
      .collection("whatsapp_chats")
      .orderBy("lastMessageAt", "desc")
      .limit(50)
      .get();

    const chats = chatsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ chats }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_WHATSAPP_GET_ERROR]:", err);
    return NextResponse.json({ error: "Falha ao buscar dados de WhatsApp." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { phone, aiEnabled, status } = body;

    if (!phone) {
      return NextResponse.json({ error: "Telefone obrigatório." }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof aiEnabled === "boolean") {
      updates.aiEnabled = aiEnabled;
      updates.humanTakeover = !aiEnabled;
      if (!aiEnabled) {
        updates.status = "waiting_human";
      }
    }

    if (status) {
      updates.status = status;
    }

    await adminDb.collection("whatsapp_chats").doc(cleanPhone).set(updates, { merge: true });

    return NextResponse.json({ success: true, updates }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_WHATSAPP_PATCH_ERROR]:", err);
    return NextResponse.json({ error: "Falha ao atualizar chat." }, { status: 500 });
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
    const { phone, text } = body;

    if (!phone || !text?.trim()) {
      return NextResponse.json({ error: "Telefone e mensagem são obrigatórios." }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    const now = new Date().toISOString();

    const messageId = `msg_admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const adminMessage: WhatsAppMessage = {
      id: messageId,
      role: "admin",
      text: text.trim(),
      timestamp: now,
      senderName: "Atendente Humano (NumVapt)",
    };

    const chatRef = adminDb.collection("whatsapp_chats").doc(cleanPhone);
    await chatRef.collection("messages").doc(messageId).set(adminMessage);

    await chatRef.set(
      {
        phone: cleanPhone,
        lastMessageText: text.trim(),
        lastMessageAt: now,
        humanTakeover: true,
        aiEnabled: false, // Desativa IA temporariamente quando o humano responde
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

import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { generateWhatsAppAIResponse } from "@/lib/services/whatsapp-ai-service";
import { generateInstagramAIResponse } from "@/lib/services/instagram-ai-service";

export const maxDuration = 60;

/**
 * Simula a resposta da Maia para uma pergunta, usando a Central de Informações atual.
 * Nada é enviado ao cliente nem gravado: serve só para o admin conferir antes de publicar.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const { channel, message } = await request.json();
    const text = String(message || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Digite uma pergunta para testar." }, { status: 400 });
    }
    if (text.length > 1000) {
      return NextResponse.json({ error: "Pergunta muito longa (máximo de 1000 caracteres)." }, { status: 400 });
    }

    const result =
      channel === "instagram"
        ? await generateInstagramAIResponse({ incomingMessage: text, senderName: "Teste do admin" })
        : await generateWhatsAppAIResponse({ incomingMessage: text, senderName: "Teste do admin" });

    return NextResponse.json(
      {
        channel: channel === "instagram" ? "instagram" : "whatsapp",
        replyText: result.replyText,
        needsHumanSupport: result.needsHumanSupport,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao testar resposta da Maia:", error);
    return NextResponse.json({ error: "Falha ao gerar a resposta de teste." }, { status: 500 });
  }
}

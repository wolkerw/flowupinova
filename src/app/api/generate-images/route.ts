import { NextResponse } from "next/server";
import { getGlobalSettings } from "@/lib/services/settings-service-admin";

export const maxDuration = 300;

export async function POST(request: Request) {
  const settings = await getGlobalSettings();
  const webhookUrl = settings.generateImagesWebhook;

  try {
    const payload = await request.json();
    const webhookPayload = payload.publicacoes ? payload : { publicacoes: payload };

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Server-Timeout": settings.serverTimeout,
      },
      body: JSON.stringify(webhookPayload),
    });

    const responseText = await webhookResponse.text();

    if (!webhookResponse.ok) {
      console.error("[API_GENERATE_IMAGES] Webhook error:", webhookResponse.status, responseText);
      let errorDetails = `O serviço de geração de imagens retornou um erro (HTTP ${webhookResponse.status}).`;
      try {
        const errorJson = JSON.parse(responseText);
        errorDetails = errorJson.detail || errorJson.error || JSON.stringify(errorJson);
      } catch (e) {
        if (responseText.toLowerCase().includes("<html>")) {
          errorDetails =
            "O serviço de geração de imagens demorou muito para responder (timeout). Tente novamente.";
        } else {
          errorDetails = responseText.substring(0, 200);
        }
      }
      return NextResponse.json(
        {
          success: false,
          error: "Falha ao comunicar com o webhook de geração de imagem.",
          details: errorDetails,
        },
        { status: webhookResponse.status }
      );
    }

    if (!responseText) {
      return NextResponse.json(
        { success: false, error: "O webhook de imagem retornou uma resposta vazia." },
        { status: 500 }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("[API_GENERATE_IMAGES] JSON.parse error on webhook response:", responseText);
      return NextResponse.json(
        {
          success: false,
          error: "Formato de resposta do webhook de imagem inesperado (não é JSON).",
          details: responseText,
        },
        { status: 500 }
      );
    }

    if (!Array.isArray(data)) {
      console.error(
        "[API_GENERATE_IMAGES] Formato de resposta do webhook de imagem inesperado (não é um array):",
        data
      );
      return NextResponse.json(
        {
          success: false,
          error: "Formato de resposta do webhook de imagem inesperado (não é um array).",
          details: JSON.stringify(data, null, 2),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data });
  } catch (error: any) {
    console.error("[API_GENERATE_IMAGES] Internal server error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor ao processar a geração de imagens.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

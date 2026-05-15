import { NextResponse, type NextRequest } from "next/server";
import { getGlobalSettings } from "@/lib/services/settings-service-admin";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const settings = await getGlobalSettings();
  const target = request.nextUrl.searchParams.get("target");
  let webhookUrl = "";

  if (target === "post_manual") {
    webhookUrl = settings.postManualWebhook;
  } else if (target === "analisar_presenca") {
    webhookUrl = settings.analisarPresencaWebhook;
  } else if (target === "imagem_sem_logo") {
    webhookUrl = settings.imgNoLogoWebhook;
  } else if (target === "gerador_link_referencia") {
    webhookUrl = "https://webhook.flowupinova.com.br/webhook/link-referência";
  } else if (target === "gerador_imagem_referencia") {
    webhookUrl = settings.imgRefWebhook;
  } else {
    webhookUrl = settings.postManualWebhook;
  }

  try {
    const formData = await request.formData();

    const webhookFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        webhookFormData.append(key, value, value.name);
      } else {
        webhookFormData.append(key, value);
      }
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "X-Server-Timeout": settings.serverTimeout,
      },
      body: webhookFormData,
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Erro no webhook externo:", errorText);
      return NextResponse.json(
        { error: "Falha ao comunicar com o webhook de upload.", details: errorText },
        { status: webhookResponse.status }
      );
    }

    const data = await webhookResponse.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro interno na API proxy:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor no proxy.", details: error.message },
      { status: 500 }
    );
  }
}

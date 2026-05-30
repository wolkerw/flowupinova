import { NextResponse, type NextRequest } from "next/server";
import { getGlobalSettings } from "@/lib/services/settings-service-admin";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("target");
  let webhookUrl = "";

  if (target === "gerador_imagem_referencia") {
    webhookUrl = `${request.nextUrl.origin}/api/conteudo/gerar-referencia`;
  } else if (target === "gerador_link_referencia") {
    webhookUrl = `${request.nextUrl.origin}/api/conteudo/gerar-referencia?action=generate-ideas`;
  } else {
    try {
      const settings = await getGlobalSettings();
      if (target === "post_manual") {
        webhookUrl = settings.postManualWebhook;
      } else if (target === "analisar_presenca") {
        webhookUrl = settings.analisarPresencaWebhook;
      } else if (target === "imagem_sem_logo") {
        webhookUrl = settings.imgNoLogoWebhook;
      } else {
        webhookUrl = settings.postManualWebhook;
      }
    } catch (e) {
      // Fallback estático
      const DEFAULT_POST_MANUAL = "https://webhook.flowupinova.com.br/webhook/post_manual";
      const DEFAULT_IMG_NO_LOGO = "https://webhook.flowupinova.com.br/webhook/imagem_sem_logo";
      const DEFAULT_ANALISAR_PRESENCA = "https://webhook.flowupinova.com.br/webhook/analisar-presenca";
      if (target === "post_manual") webhookUrl = DEFAULT_POST_MANUAL;
      else if (target === "imagem_sem_logo") webhookUrl = DEFAULT_IMG_NO_LOGO;
      else if (target === "analisar_presenca") webhookUrl = DEFAULT_ANALISAR_PRESENCA;
      else webhookUrl = DEFAULT_POST_MANUAL;
    }
  }

  const serverTimeout = "300";

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
        "X-Server-Timeout": serverTimeout,
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

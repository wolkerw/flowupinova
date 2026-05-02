import { NextResponse } from "next/server";
import { getGlobalSettings } from "@/lib/services/settings-service-admin";

export const maxDuration = 300;

export async function POST(request: Request) {
  const settings = await getGlobalSettings();
  const webhookUrl = settings.generatePromptsWebhook;

  console.log(`[API_GENERATE_PROMPTS] Chamando webhook: ${webhookUrl}`);

  try {
    const payload = await request.json();

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Server-Timeout": settings.serverTimeout,
      },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error(
        `[API_GENERATE_PROMPTS] Erro no webhook externo (${webhookResponse.status}):`,
        errorText
      );

      // Repassa o erro do webhook externo para o frontend com contexto
      return NextResponse.json(
        {
          success: false,
          error: `O webhook externo retornou erro ${webhookResponse.status}`,
          source: "external-webhook",
          details: errorText,
        },
        { status: webhookResponse.status }
      );
    }

    const data = await webhookResponse.json();
    console.log("[API_GENERATE_PROMPTS] Sucesso ao receber prompts.");
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API_GENERATE_PROMPTS] Erro interno na API Route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao processar a geração de prompts.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

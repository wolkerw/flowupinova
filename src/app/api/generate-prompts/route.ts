
import { NextResponse } from 'next/server';
import { getGlobalSettings } from '@/lib/services/settings-service-admin';

export const maxDuration = 300;

export async function POST(request: Request) {
  const settings = await getGlobalSettings();
  const webhookUrl = settings.generatePromptsWebhook;

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
      console.error("[API_GENERATE_PROMPTS] Webhook error:", webhookResponse.status, errorText);
      return NextResponse.json({ success: false, error: "Falha ao gerar prompts.", details: errorText }, { status: webhookResponse.status });
    }

    const data = await webhookResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("[API_GENERATE_PROMPTS] Internal error:", error);
    return NextResponse.json({ success: false, error: "Erro interno ao gerar prompts.", details: error.message }, { status: 500 });
  }
}

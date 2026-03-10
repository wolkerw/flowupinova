
import { NextResponse } from 'next/server';
import { getGlobalSettings } from '@/lib/services/settings-service-admin';

export const maxDuration = 300;

export async function POST(request: Request) {
  const settings = await getGlobalSettings();
  const webhookUrl = settings.generateImagesFalaiWebhook;

  console.log(`[API_FALAI_IMAGE] Chamando webhook: ${webhookUrl}`);

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

    const responseText = await webhookResponse.text();

    if (!webhookResponse.ok) {
      console.error(`[API_FALAI_IMAGE] Erro no webhook Falai (${webhookResponse.status}):`, responseText);
      return NextResponse.json({ 
        success: false, 
        error: `O serviço Falai retornou erro ${webhookResponse.status}`, 
        source: "external-falai",
        details: responseText 
      }, { status: webhookResponse.status });
    }

    try {
      const data = JSON.parse(responseText);
      console.log("[API_FALAI_IMAGE] Sucesso ao gerar imagem (JSON).");
      return NextResponse.json(data);
    } catch (e) {
      console.log("[API_FALAI_IMAGE] Sucesso ao gerar imagem (Raw).");
      return NextResponse.json({ success: true, data: responseText });
    }

  } catch (error: any) {
    console.error("[API_FALAI_IMAGE] Erro interno na API Route:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Erro interno ao gerar imagem.", 
      details: error.message 
    }, { status: 500 });
  }
}

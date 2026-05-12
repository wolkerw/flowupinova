import { NextResponse, type NextRequest } from "next/server";

// Aumenta o tempo máximo de execução desta rota para 300 segundos (5 minutos).
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // O URL do webhook agora vem de um parâmetro de busca, ex: /api/proxy-webhook?target=post_manual
  const targetWebhookName = request.nextUrl.searchParams.get("target");

  let webhookUrl = "";

  if (targetWebhookName === "post_manual") {
    webhookUrl = "https://webhook.flowupinova.com.br/webhook/post_manual";
  } else if (targetWebhookName === "imagem_sem_logo") {
    webhookUrl = "https://webhook.flowupinova.com.br/webhook/imagem_sem_logo";
  } else if (targetWebhookName === "gerador_imagem_referencia") {
    webhookUrl = "https://webhook.flowupinova.com.br/webhook/gerador_imagem_referencia";
  } else if (targetWebhookName === "analisar_presenca" || targetWebhookName === "analisar-presenca") {
    // Tenta primeiro a URL de teste se o usuário estiver em ambiente de desenvolvimento, 
    // ou apenas a de produção se preferir. 
    // Dica: Se o n8n não estiver "Ativo", ele só responde na URL /webhook-test/
    webhookUrl = "https://webhook.flowupinova.com.br/webhook/analisar-presenca";
  } else {
    return NextResponse.json(
      { error: "Webhook de destino não especificado ou inválido." },
      { status: 400 }
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any;

    if (contentType.includes("application/json")) {
      body = JSON.stringify(await request.json());
    } else {
      const formData = await request.formData();
      const webhookFormData = new FormData();
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          webhookFormData.append(key, value, value.name);
        } else {
          webhookFormData.append(key, value);
        }
      }
      body = webhookFormData;
    }

    console.log(`Proxy: Chamando webhook ${webhookUrl}...`);

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "X-Server-Timeout": "300",
        ...(contentType.includes("application/json") ? { "Content-Type": "application/json" } : {}),
      },
      body: body,
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error(`Erro no webhook ${webhookUrl}:`, webhookResponse.status, errorText);
      
      // Se deu 404 na produção, pode ser que o usuário queira a de teste
      if (webhookResponse.status === 404 && webhookUrl.includes("/webhook/")) {
        const testUrl = webhookUrl.replace("/webhook/", "/webhook-test/");
        console.log(`Tentando URL de teste: ${testUrl}`);
        const testResponse = await fetch(testUrl, {
          method: "POST",
          headers: {
            "X-Server-Timeout": "300",
            ...(contentType.includes("application/json") ? { "Content-Type": "application/json" } : {}),
          },
          body: body,
        });

        if (testResponse.ok) {
          const data = await testResponse.json();
          return NextResponse.json(data);
        }
      }

      return NextResponse.json(
        { error: "Falha ao comunicar com o webhook externo.", details: errorText },
        { status: webhookResponse.status }
      );
    }

    const data = await webhookResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro interno na API proxy:", error.message);
    return NextResponse.json(
      { error: "Erro interno do servidor no proxy.", details: error.message },
      { status: 500 }
    );
  }
}

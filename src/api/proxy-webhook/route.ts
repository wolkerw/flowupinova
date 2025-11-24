
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const webhookUrl = "https://n8n.flowupinova.com.br/webhook-test/URL_imagem_sem_logo";

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    // Recria o FormData no servidor para enviar ao webhook externo.
    const webhookFormData = new FormData();
    webhookFormData.append('file', file, file.name);
    
    // O `fetch` nativo definirá o Content-Type para `multipart/form-data` com o boundary correto.
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      body: webhookFormData,
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Erro no webhook externo:", webhookResponse.status, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json({ error: "Falha ao comunicar com o webhook de upload.", details: errorJson.message || errorJson }, { status: webhookResponse.status });
      } catch (e) {
        return NextResponse.json({ error: "Falha ao comunicar com o webhook de upload.", details: errorText }, { status: webhookResponse.status });
      }
    }

    const data = await webhookResponse.json();
    
    // Retorna a resposta do webhook para o cliente.
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Erro interno na API proxy:", error.message);
    // Se o erro for sobre Content-Type, é porque o cliente não enviou FormData
    if (error.message.includes("Content-Type")) {
         return NextResponse.json({ error: "Erro de formato da requisição.", details: "A requisição deve ser do tipo 'multipart/form-data'." }, { status: 415 });
    }
    return NextResponse.json({ error: "Erro interno do servidor no proxy.", details: error.message }, { status: 500 });
  }
}

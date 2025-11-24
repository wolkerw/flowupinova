
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const webhookUrl = "https://n8n.flowupinova.com.br/webhook-test/URL_imagem_sem_logo";

  try {
    // A solução robusta é fazer o streaming do corpo da requisição original
    // diretamente para o webhook externo, em vez de tentar recriar o FormData.
    // Isso preserva todos os headers, boundaries e o conteúdo exatamente como vieram do cliente.

    // Pegamos os headers da requisição original que são relevantes para o corpo (Content-Type)
    const headers = new Headers();
    const contentType = request.headers.get('Content-Type');
    if (contentType) {
        headers.set('Content-Type', contentType);
    }
    
    // Fazemos o fetch para o webhook externo passando o corpo e os headers da requisição original.
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: headers,
      body: request.body,
      // A propriedade 'duplex' é necessária para streaming de corpos de requisição no Node.js
      // @ts-ignore
      duplex: 'half'
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Erro no webhook externo:", errorText);
      return NextResponse.json({ error: "Falha ao comunicar com o webhook de upload.", details: errorText }, { status: webhookResponse.status });
    }

    const data = await webhookResponse.json();
    
    // Retorna a resposta do webhook para o cliente.
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Erro interno na API proxy:", error);
    return NextResponse.json({ error: "Erro interno do servidor no proxy.", details: error.message }, { status: 500 });
  }
}

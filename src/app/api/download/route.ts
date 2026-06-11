import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return new Response("URL ausente", { status: 400 });
    }

    console.log(`[DOWNLOAD_PROXY] Iniciando download de: ${url}`);
    
    // Buscar a imagem na CDN/Firebase Storage pelo servidor
    const response = await fetch(url);
    if (!response.ok) {
      return new Response("Falha ao obter imagem da fonte", { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Configurar os headers para forçar o download no navegador
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="numvapt-media-${Date.now()}.jpg"`);
    // Permitir CORS de mesma origem
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(buffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("[DOWNLOAD_PROXY_ERROR] Erro interno:", error);
    return new Response("Erro interno no processamento do download", { status: 500 });
  }
}

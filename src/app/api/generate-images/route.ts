import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { prompt, postId, fileName, userId, content } = await request.json();

    if (!prompt || !postId || !fileName || !userId) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes: prompt, postId, fileName, userId" },
        { status: 400 }
      );
    }

    console.log(`[GENERATE_IMAGES_NATIVE] Disparando geração via proxy n8n (Google Imagen) para o post ${postId} (Arquivo: ${fileName})...`);

    // 1. Chamar o webhook de geração de imagem no n8n de forma assíncrona (segundo plano)
    // para evitar o limite de 10s da Vercel Hobby e contornar o bloqueio de rede.
    fetch("https://webhook.flowupinova.com.br/webhook/gerador-imagem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        postId: postId,
        fileName: fileName,
        content: content || {},
      }),
    }).catch(err => {
      console.error(`[GENERATE_IMAGES_NATIVE_ASYNC_ERROR] Erro ao disparar geração de imagem ${fileName}:`, err);
    });

    const imageUrlFromSupabase = `https://wlsmvzahqkilggnovxde.supabase.co/storage/v1/object/public/FlowUp/posts/${postId}/${fileName}.png`;

    console.log(`[GENERATE_IMAGES_NATIVE] Retornando link estimado do Supabase imediatamente: ${imageUrlFromSupabase}`);

    return NextResponse.json({
      success: true,
      imageUrl: imageUrlFromSupabase,
      fileName: fileName
    });

  } catch (error: any) {
    console.error("[GENERATE_IMAGES_NATIVE_ERROR] Erro no processamento da imagem:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar a geração de imagem.", details: error.message },
      { status: 500 }
    );
  }
}

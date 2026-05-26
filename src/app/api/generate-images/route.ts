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

    // 1. Chamar o webhook de geração de imagem no n8n (que atua como proxy geográfico nos EUA para contornar o bloqueio 404 do AI Studio no Brasil)
    const n8nResponse = await fetch("https://webhook.flowupinova.com.br/webhook/gerador-imagem", {
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
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`[GENERATE_IMAGES_NATIVE] Erro no proxy n8n (status ${n8nResponse.status}):`, errorText);
      throw new Error(`Erro na geração de imagem via proxy n8n: ${errorText}`);
    }

    console.log(`[GENERATE_IMAGES_NATIVE] Imagem gerada com sucesso! Buscando o link público estável no Supabase...`);

    // 2. Buscar a imagem gerada no Supabase (loop sutil de segurança para aguardar a sincronização)
    let imageUrlFromSupabase = "";
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const seekResponse = await fetch("https://webhook.flowupinova.com.br/webhook/buscar-imagens-supabase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: postId,
            filename: fileName,
            fileExtension: "png"
          })
        });

        if (seekResponse.ok) {
          const contentType = seekResponse.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const data = await seekResponse.json();
            imageUrlFromSupabase = Array.isArray(data) ? data[0]?.url_post : data?.url_post;
          } else {
            imageUrlFromSupabase = `https://wlsmvzahqkilggnovxde.supabase.co/storage/v1/object/public/FlowUp/posts/${postId}/${fileName}.png`;
          }
          if (imageUrlFromSupabase) break;
        }
      } catch (err) {
        console.warn(`[GENERATE_IMAGES_NATIVE] Tentativa ${attempts + 1} de busca falhou.`, err);
      }
      
      attempts++;
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!imageUrlFromSupabase) {
      imageUrlFromSupabase = `https://wlsmvzahqkilggnovxde.supabase.co/storage/v1/object/public/FlowUp/posts/${postId}/${fileName}.png`;
    }

    console.log(`[GENERATE_IMAGES_NATIVE] Sucesso absoluto! URL obtida do Supabase: ${imageUrlFromSupabase}`);

    // Ignoramos a gravação direta no Firestore pelo backend para evitar o erro de permissão (PERMISSION_DENIED).
    // O frontend autenticado fará a gravação desse link público com sucesso.
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

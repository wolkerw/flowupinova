import { NextResponse, type NextRequest } from "next/server";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const maxDuration = 300; // Define timeout de até 5 minutos no Vercel

export async function POST(request: NextRequest) {
  try {
    const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;

    if (!falKey) {
      console.error("[GERAR_REFERENCIA_ERROR] Chave FAL_KEY ou FAL_API_KEY não encontrada no .env.local");
      return NextResponse.json(
        { error: "Configuração do servidor ausente: Chave do Fal.ai não configurada." },
        { status: 500 }
      );
    }

    // Garante que o prefixo "Key " esteja presente se não estiver
    const formattedFalKey = falKey.trim().startsWith("Key ") ? falKey.trim() : `Key ${formattedFalKeyPrefix(falKey.trim())}`;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const description = formData.get("description") as string;
    const postId = formData.get("postId") as string;

    if (!file) {
      return NextResponse.json({ error: "Arquivo do produto (imagem) não fornecido." }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: "Descrição do cenário ou modelo não fornecida." }, { status: 400 });
    }

    console.log(`[GERAR_REFERENCIA] Iniciando processamento do post ${postId || "sem_id"}...`);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Nome do arquivo seguro
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    
    // 1. Iniciar o upload no Fal.ai CDN para obter uma URL assinada temporária (S3/CDN)
    console.log(`[GERAR_REFERENCIA] Iniciando upload do produto para o Fal.ai CDN...`);
    
    const initiateResponse = await fetch("https://rest.alpha.fal.ai/storage/upload/initiate", {
      method: "POST",
      headers: {
        Authorization: formattedFalKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file_name: sanitizedFileName,
        content_type: file.type || "image/jpeg",
      }),
    });

    if (!initiateResponse.ok) {
      const initiateErrorText = await initiateResponse.text();
      console.error("[GERAR_REFERENCIA_ERROR] Falha ao iniciar upload no Fal.ai CDN:", initiateErrorText);
      throw new Error(`Falha ao iniciar upload no Fal.ai CDN: ${initiateErrorText}`);
    }

    const initiateData = await initiateResponse.json();
    const { upload_url, file_url } = initiateData;

    if (!upload_url || !file_url) {
      throw new Error("Falha ao obter URL de upload do Fal.ai CDN.");
    }

    console.log(`[GERAR_REFERENCIA] Fazendo upload do binário para a URL assinada...`);
    const uploadBinaryResponse = await fetch(upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "image/jpeg",
      },
      body: fileBuffer,
    });

    if (!uploadBinaryResponse.ok) {
      const uploadBinaryErrorText = await uploadBinaryResponse.text();
      console.error("[GERAR_REFERENCIA_ERROR] Falha no upload do binário para S3:", uploadBinaryErrorText);
      throw new Error(`Falha no upload do binário para S3: ${uploadBinaryErrorText}`);
    }

    const garmentPublicUrl = file_url;

    if (!garmentPublicUrl) {
      throw new Error("Falha ao obter URL pública da imagem do produto do Fal.ai CDN.");
    }
    console.log("[GERAR_REFERENCIA] Imagem do produto pública no Fal.ai CDN em:", garmentPublicUrl);

    // 2. Chamar o Flux Schnell para gerar a modelo base no cenário do usuário
    console.log("[GERAR_REFERENCIA] Gerando modelo base no Fal.ai (Flux Schnell)...");
    const fluxPrompt = `A professional fashion model, ${description}, wearing a simple solid grey t-shirt, high fidelity catalog shot, highly detailed skin texture, raw photo, UGC style, square format, optimized for Instagram feed`;
    
    const fluxResponse = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        Authorization: formattedFalKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: fluxPrompt,
        image_size: "square_hd",
        num_inference_steps: 4,
        sync_mode: true,
      }),
    });

    if (!fluxResponse.ok) {
      const errorText = await fluxResponse.text();
      console.error("[GERAR_REFERENCIA_ERROR] Erro no Flux Schnell:", errorText);
      throw new Error(`Falha ao gerar modelo base: ${errorText}`);
    }

    const fluxData = await fluxResponse.json();
    const modelImageUrl = fluxData?.images?.[0]?.url;

    if (!modelImageUrl) {
      throw new Error("Flux Schnell não retornou URL da imagem da modelo.");
    }
    console.log("[GERAR_REFERENCIA] Modelo base gerada com sucesso:", modelImageUrl);

    // 3. Chamar a API de Virtual Try-On (IDM-VTON) para vestir a roupa na modelo
    console.log("[GERAR_REFERENCIA] Iniciando Virtual Try-On no Fal.ai (IDM-VTON)...");
    const vtonResponse = await fetch("https://queue.fal.run/fal-ai/idm-vton", {
      method: "POST",
      headers: {
        Authorization: formattedFalKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category: "upper_body", // "upper_body" é o padrão para camisas/casacos
        garment_image_url: garmentPublicUrl,
        human_image_url: modelImageUrl,
        prompt: `A beautiful model, ${description}, wearing the garment perfectly, high fidelity, catalog photography`,
      }),
    });

    if (!vtonResponse.ok) {
      const errorText = await vtonResponse.text();
      console.error("[GERAR_REFERENCIA_ERROR] Erro no IDM-VTON:", errorText);
      throw new Error(`Falha no Virtual Try-On: ${errorText}`);
    }

    const vtonData = await vtonResponse.json();
    const finalImageUrl = vtonData?.image?.url;

    if (!finalImageUrl) {
      throw new Error("IDM-VTON não retornou URL da imagem vestida.");
    }
    console.log("[GERAR_REFERENCIA] Virtual Try-On concluído com sucesso:", finalImageUrl);

    // 4. Salvar a imagem final de forma definitiva (Tenta no Firebase Storage, com fallback para a URL direta do Fal.ai)
    let outputUrl = finalImageUrl;

    try {
      console.log("[GERAR_REFERENCIA] Baixando imagem final do Fal.ai para persistência...");
      const downloadResponse = await fetch(finalImageUrl);
      if (downloadResponse.ok) {
        const finalBuffer = Buffer.from(await downloadResponse.arrayBuffer());
        const finalPath = `posts/${postId || "geral"}/${Date.now()}_resultado.jpg`;
        const finalRef = ref(storage, finalPath);

        console.log(`[GERAR_REFERENCIA] Tentando salvar imagem final no Firebase Storage em: ${finalPath}...`);
        await uploadBytes(finalRef, finalBuffer, {
          contentType: "image/jpeg",
        });

        const finalStorageUrl = await getDownloadURL(finalRef);
        console.log("[GERAR_REFERENCIA] Imagem final salva com sucesso no Firebase Storage em:", finalStorageUrl);
        outputUrl = finalStorageUrl;
      } else {
        console.warn("[GERAR_REFERENCIA_WARNING] Falha ao baixar imagem do Fal.ai, usando a URL original da API.");
      }
    } catch (storageError: any) {
      console.warn(
        "[GERAR_REFERENCIA_WARNING] Falha ao salvar a imagem no Firebase Storage. Usando URL pública do Fal.ai como fallback.",
        storageError.message || storageError
      );
    }

    // Retorna no mesmo padrão esperado pelo frontend
    return NextResponse.json({
      success: true,
      url_post: outputUrl,
    });
  } catch (error: any) {
    console.error("[GERAR_REFERENCIA_ERROR] Erro crítico no processamento:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a imagem por IA.", details: error.message },
      { status: 500 }
    );
  }
}

// Auxiliar para formatar a chave do Fal.ai
function formattedFalKeyPrefix(key: string): string {
  return key;
}

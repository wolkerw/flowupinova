import { NextResponse, type NextRequest } from "next/server";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { fal } from "@fal-ai/client";

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
    const formattedFalKey = falKey.trim().startsWith("Key ") ? falKey.trim() : `Key ${falKey.trim()}`;

    // Configura o cliente do fal.ai com a chave formatada
    fal.config({
      credentials: formattedFalKey,
    });

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

    // 1. Iniciar o upload no Fal.ai CDN usando a SDK oficial
    console.log(`[GERAR_REFERENCIA] Fazendo upload do produto para o Fal.ai CDN...`);
    const garmentPublicUrl = await fal.storage.upload(file);
    
    if (!garmentPublicUrl) {
      throw new Error("Falha ao obter URL pública da imagem do produto do Fal.ai CDN.");
    }
    console.log("[GERAR_REFERENCIA] Imagem do produto pública no Fal.ai CDN em:", garmentPublicUrl);

    // 2. Chamar o Flux Schnell para gerar a modelo base no cenário do usuário
    console.log("[GERAR_REFERENCIA] Gerando modelo base no Fal.ai (Flux Schnell)...");
    const fluxPrompt = `A professional fashion model, ${description}, wearing a simple solid grey t-shirt, high fidelity catalog shot, highly detailed skin texture, raw photo, UGC style, square format, optimized for Instagram feed`;
    
    const fluxResult: any = await fal.run("fal-ai/flux/schnell", {
      input: {
        prompt: fluxPrompt,
        image_size: "square_hd",
        num_inference_steps: 4,
      },
    });

    const modelImageUrl = fluxResult?.images?.[0]?.url;

    if (!modelImageUrl) {
      throw new Error("Flux Schnell não retornou URL da imagem da modelo.");
    }
    console.log("[GERAR_REFERENCIA] Modelo base gerada com sucesso:", modelImageUrl);

    // 3. Chamar a API de Virtual Try-On (IDM-VTON) para vestir a roupa na modelo
    console.log("[GERAR_REFERENCIA] Iniciando Virtual Try-On no Fal.ai (IDM-VTON)...");
    
    const vtonResult: any = await fal.run("fal-ai/idm-vton", {
      input: {
        category: "upper_body", // "upper_body" é o padrão para camisas/casacos
        garment_image_url: garmentPublicUrl,
        human_image_url: modelImageUrl,
        prompt: `A beautiful model, ${description}, wearing the garment perfectly, high fidelity, catalog photography`,
      },
    });

    const finalImageUrl = vtonResult?.image?.url;

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

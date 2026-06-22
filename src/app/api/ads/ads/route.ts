import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getMetaConnectionAdmin } from "@/lib/services/meta-service-admin";

export async function POST(request: NextRequest) {
  try {
    const uid = await getUidFromCookie();
    const metaConnection = await getMetaConnectionAdmin(uid);

    if (!metaConnection.isConnected || !metaConnection.accessToken) {
      return NextResponse.json(
        { success: false, error: "Conta da Meta não conectada." },
        { status: 403 }
      );
    }

    const adAccountId = metaConnection.adAccountId;
    const pageId = metaConnection.pageId;

    if (!adAccountId) {
      return NextResponse.json(
        { success: false, error: "Conta de anúncios da Meta não configurada." },
        { status: 400 }
      );
    }

    if (!pageId) {
      return NextResponse.json(
        { success: false, error: "Página do Facebook não vinculada à sua conexão Meta." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, adset_id, creative } = body;
    const { headline, bodyText, imageUrl, ctaType, ctaLink } = creative || {};

    if (!name || !adset_id || !creative || !imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Os campos name, adset_id, creative e creative.imageUrl são obrigatórios.",
        },
        { status: 400 }
      );
    }

    // 1. FAZER UPLOAD DA IMAGEM PARA A META
    console.log(`[API_ADS_POST] Iniciando upload de imagem para Meta: ${imageUrl}`);
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error(`Falha ao obter imagem do post no endereço fornecido.`);
    }
    const imageBlob = await imageRes.blob();

    const uploadFormData = new FormData();
    uploadFormData.append("filename", imageBlob, "ad_image.jpg");
    uploadFormData.append("access_token", metaConnection.accessToken);

    const uploadUrl = `https://graph.facebook.com/v24.0/act_${adAccountId}/adimages`;
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: uploadFormData,
    });

    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok) {
      console.error("[API_ADS_POST] Erro no upload da imagem na Meta:", uploadData.error);
      throw new Error(
        uploadData.error?.message || "Falha ao enviar criativo de imagem para a Meta."
      );
    }

    // O retorno possui a chave 'images' contendo o hash da imagem carregada
    const imageHash = (Object.values(uploadData.images)?.[0] as any)?.hash;
    if (!imageHash) {
      throw new Error("Não foi possível gerar o hash de imagem da Meta.");
    }
    console.log(`[API_ADS_POST] Imagem carregada na Meta com sucesso! Hash: ${imageHash}`);

    // 2. CRIAR O AD CREATIVE (CRIATIVO DO ANÚNCIO)
    console.log("[API_ADS_POST] Criando Ad Creative na Meta...");
    const creativeUrl = `https://graph.facebook.com/v24.0/act_${adAccountId}/adcreatives`;

    // Configura o Call To Action
    let metaCtaType = "LEARN_MORE";
    if (
      ["SEND_MESSAGE", "LEARN_MORE", "CALL_NOW", "GET_DIRECTIONS", "SHOP_NOW"].includes(ctaType)
    ) {
      metaCtaType = ctaType;
    }

    const objectStorySpec = {
      page_id: pageId,
      link_data: {
        image_hash: imageHash,
        link: ctaLink || "https://wa.me/555199922177",
        message: bodyText,
        name: headline,
        call_to_action: {
          type: metaCtaType,
          value: {
            link: ctaLink || "https://wa.me/555199922177",
          },
        },
      },
    };

    const creativeParams = new URLSearchParams({
      name: `${name} - Criativo`,
      object_story_spec: JSON.stringify(objectStorySpec),
      access_token: metaConnection.accessToken,
    });

    const creativeResponse = await fetch(creativeUrl, {
      method: "POST",
      body: creativeParams,
    });

    const creativeData = await creativeResponse.json();
    if (!creativeResponse.ok) {
      console.error("[API_ADS_POST] Erro na criação de Criativo na Meta:", creativeData.error);
      throw new Error(
        creativeData.error?.error_user_msg ||
          creativeData.error?.message ||
          "Falha ao criar o criativo do anúncio."
      );
    }

    const creativeId = creativeData.id;
    console.log(`[API_ADS_POST] Criativo criado com sucesso! ID: ${creativeId}`);

    // 3. CRIAR O ANÚNCIO (AD) VINCULADO AO ADSET
    console.log("[API_ADS_POST] Criando anúncio final na Meta...");
    const adUrl = `https://graph.facebook.com/v24.0/act_${adAccountId}/ads`;

    const adParams = new URLSearchParams({
      name: name,
      adset_id: adset_id,
      creative: JSON.stringify({ creative_id: creativeId }),
      status: "ACTIVE", // Iniciando direto no ar, mas controlado pelo orçamento definido no adset
      access_token: metaConnection.accessToken,
    });

    const adResponse = await fetch(adUrl, {
      method: "POST",
      body: adParams,
    });

    const adData = await adResponse.json();
    if (!adResponse.ok) {
      console.error("[API_ADS_POST] Erro na criação do Anúncio final na Meta:", adData.error);
      throw new Error(
        adData.error?.error_user_msg ||
          adData.error?.message ||
          "Falha ao publicar anúncio final na Meta."
      );
    }

    console.log(`[API_ADS_POST] Anúncio publicado com sucesso! ID: ${adData.id}`);

    return NextResponse.json({
      success: true,
      adId: adData.id,
      creativeId: creativeId,
    });
  } catch (error: any) {
    console.error("[API_ADS_POST] Erro geral na criação do anúncio:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro desconhecido ao processar criativo de anúncio.",
      },
      { status: 500 }
    );
  }
}

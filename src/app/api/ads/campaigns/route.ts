
// src/app/api/ads/campaigns/route.ts

import { getMetaConnection } from "@/lib/services/meta-service";
import { NextResponse, type NextRequest } from "next/server";

const GRAPH_API_VERSION = "v20.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Função para fazer o upload de uma imagem e obter o hash
async function uploadImage(adAccountId: string, accessToken: string, imageUrl: string) {
  const adImagesUrl = `${GRAPH_API_URL}/${adAccountId}/adimages`;
  const formData = new FormData();
  formData.append('access_token', accessToken);

  try {
    // A API da Meta espera que a imagem seja buscada e enviada como um blob
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error('Falha ao buscar a imagem da URL fornecida.');
    const imageBlob = await imageResponse.blob();
    formData.append('source', imageBlob);

    const response = await fetch(adImagesUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (data.error || !data.images?.['source']?.hash) {
      console.error('[API_ERROR] Image Upload Failed:', data.error || 'Nenhum hash de imagem retornado.');
      throw new Error(`Falha no upload da imagem: ${data.error?.message || 'Erro desconhecido'}`);
    }

    console.log('[API_SUCCESS] Image uploaded, hash:', data.images['source'].hash);
    return data.images['source'].hash;
  } catch (error: any) {
    console.error('[API_FATAL] Erro catastrófico no upload da imagem:', error);
    throw error;
  }
}

// Função para criar o Ad Creative
async function createAdCreative(adAccountId: string, accessToken: string, pageId: string, message: string, link: string, imageHash: string) {
    const adCreativeUrl = `${GRAPH_API_URL}/${adAccountId}/adcreatives`;
    const objectStorySpec = {
        page_id: pageId,
        link_data: {
            link: link,
            message: message,
            image_hash: imageHash,
        },
    };

    const creativeBody = new URLSearchParams({
        name: `Criativo - ${new Date().toISOString()}`,
        object_story_spec: JSON.stringify(objectStorySpec),
        access_token: accessToken
    });

    const response = await fetch(adCreativeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: creativeBody.toString()
    });

    const data = await response.json();
    if (data.error || !data.id) {
        console.error('[API_ERROR] Ad Creative Failed:', data.error);
        throw new Error(`Falha ao criar o criativo: ${data.error?.message || 'Erro desconhecido'}`);
    }

    console.log('[API_SUCCESS] Ad Creative created, ID:', data.id);
    return data.id;
}


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const objective = formData.get('objective') as string;
    const audience = JSON.parse(formData.get('audience') as string);
    const creative = JSON.parse(formData.get('creative') as string);
    const budget = JSON.parse(formData.get('budget') as string);
    const imageFile = formData.get('image') as File | null;
    
    const adAccountId = process.env.META_AD_ACCOUNT_ID;
    if (!adAccountId) {
      throw new Error("ID da Conta de Anúncios (META_AD_ACCOUNT_ID) não configurado no servidor.");
    }
    
    const metaConnection = await getMetaConnection();
    if (!metaConnection.isConnected || !metaConnection.pageToken || !metaConnection.facebookPageId) {
      throw new Error("Conexão com a Meta não está ativa ou o ID da Página não está disponível.");
    }
    const accessToken = metaConnection.pageToken;
    const pageId = metaConnection.facebookPageId;

    if (!imageFile) {
      return NextResponse.json({ success: false, error: "Nenhuma imagem foi enviada." }, { status: 400 });
    }

    // Convertendo o File para uma URL local temporária para o upload
    const imageUrl = URL.createObjectURL(imageFile);

    // ETAPA 1: Fazer o upload da imagem para obter o hash
    const imageHash = await uploadImage(`act_${adAccountId}`, accessToken, imageUrl);
    URL.revokeObjectURL(imageUrl); // Limpar a URL temporária

    // ETAPA 2: Criar o Ad Creative
    const creativeId = await createAdCreative(`act_${adAccountId}`, accessToken, pageId, creative.message, creative.link, imageHash);
    
    // ETAPAS FUTURAS: Criar Campanha, Ad Set e Ad
    // ... lógica a ser implementada

    return NextResponse.json({
      success: true,
      message: "Criativo do anúncio criado com sucesso! Próximas etapas pendentes.",
      creativeId: creativeId,
    });

  } catch (error: any) {
    console.error("[CAMPAIGN_API_ERROR]", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

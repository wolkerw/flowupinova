
// src/app/api/ads/campaigns/route.ts

import { getMetaConnection, fetchGraphAPI } from "@/lib/services/meta-service";
import { NextResponse, type NextRequest } from "next/server";
import { createCampaign, createAdSet, createAdCreative, createAd, publishAd } from "@/lib/services/ads-service";


// Função para fazer o upload de uma imagem e obter o hash
async function uploadImage(adAccountId: string, accessToken: string, imageFile: File) {
  const adImagesUrl = `https://graph.facebook.com/v20.0/${adAccountId}/adimages`;
  const formData = new FormData();
  formData.append('access_token', accessToken);
  formData.append('source', imageFile);

  try {
    const response = await fetch(adImagesUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (data.error || !data.images?.[imageFile.name]?.hash) {
      console.error('[API_ERROR] Image Upload Failed:', data.error || 'Nenhum hash de imagem retornado.');
      const errorMessage = data.error?.message || 'Erro desconhecido durante o upload da imagem.';
      throw new Error(`Falha no upload da imagem: ${errorMessage}`);
    }

    console.log('[API_SUCCESS] Image uploaded, hash:', data.images[imageFile.name].hash);
    return data.images[imageFile.name].hash;
  } catch (error: any) {
    console.error('[API_FATAL] Erro catastrófico no upload da imagem:', error);
    throw error;
  }
}


export async function POST(request: NextRequest) {
  const formData = await request.formData();
  
  const adAccountId = formData.get('adAccountId') as string;
  const objective = formData.get('objective') as string;
  const audience = JSON.parse(formData.get('audience') as string);
  const creative = JSON.parse(formData.get('creative') as string);
  const budget = JSON.parse(formData.get('budget') as string);
  const imageFile = formData.get('image') as File | null;
  
  if (!adAccountId) {
    return NextResponse.json({ success: false, error: "ID da Conta de Anúncios não foi fornecido." }, { status: 400 });
  }
  if (!imageFile) {
    return NextResponse.json({ success: false, error: "Nenhuma imagem foi enviada." }, { status: 400 });
  }

  try {
    const metaConnection = await getMetaConnection();
    const accessToken = metaConnection.userAccessToken;

    if (!metaConnection.isConnected || !accessToken || !metaConnection.facebookPageId) {
      throw new Error("Conexão com a Meta não está ativa, o token de acesso ou o ID da Página não estão disponíveis.");
    }
    const pageId = metaConnection.facebookPageId;

    // ETAPA 1: Criar a Campanha
    const campaignId = await createCampaign(adAccountId, accessToken, objective);

    // ETAPA 2: Criar o Ad Set
    const adSetId = await createAdSet(adAccountId, accessToken, campaignId, budget, audience, objective);

    // ETAPA 3: Fazer o upload da imagem para obter o hash
    const imageHash = await uploadImage(adAccountId, accessToken, imageFile);

    // ETAPA 4: Criar o Ad Creative
    const creativeId = await createAdCreative(adAccountId, accessToken, pageId, creative.message, creative.link, imageHash);
    
    // ETAPA 5: Criar o Anúncio
    const adId = await createAd(adAccountId, accessToken, adSetId, creativeId);

    // ETAPA 6: Publicar o Anúncio
    await publishAd(adId, accessToken);

    return NextResponse.json({
      success: true,
      message: "Campanha publicada com sucesso!",
      campaignId: campaignId,
      adId: adId,
    });

  } catch (error: any) {
    console.error("[CAMPAIGN_API_ERROR]", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

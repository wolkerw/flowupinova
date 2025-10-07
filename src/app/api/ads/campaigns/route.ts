
// src/app/api/ads/campaigns/route.ts

import { getMetaConnection, fetchGraphAPI } from "@/lib/services/meta-service";
import { NextResponse, type NextRequest } from "next/server";
import { createCampaign, createAdSet, createAdCreative, createAd, publishCampaign } from "@/lib/services/ads-service";

// Função para fazer o upload de uma imagem e obter o hash
async function uploadImage(adAccountId: string, accessToken: string, imageFile: File) {
  const adImagesUrl = `https://graph.facebook.com/v20.0/${adAccountId.replace('act_', '')}/adimages`;
  
  const formData = new FormData();
  formData.append('source', imageFile as Blob, imageFile.name);

  // Usa o fetchGraphAPI para o upload, que já lida com o token
  const data = await fetchGraphAPI(adImagesUrl, accessToken, "Image Upload", 'POST', formData);

  if (!data.images?.[imageFile.name]?.hash) {
    const errorMessage = data.error?.message || 'Nenhum hash de imagem retornado.';
    throw new Error(`Falha no upload da imagem: ${errorMessage}`);
  }

  console.log('[API_SUCCESS] Image uploaded, hash:', data.images[imageFile.name].hash);
  return data.images[imageFile.name].hash;
}

// GET - Listar Campanhas e Métricas
export async function GET(request: NextRequest) {
    const adAccountId = request.nextUrl.searchParams.get('adAccountId');

    if (!adAccountId) {
        return NextResponse.json({ success: false, error: "ID da Conta de Anúncios não foi fornecido." }, { status: 400 });
    }

    try {
        const metaConnection = await getMetaConnection();
        const accessToken = metaConnection.userAccessToken;

        if (!metaConnection.isConnected || !accessToken) {
            throw new Error("Conexão com a Meta não está ativa ou o token de acesso de usuário não está disponível.");
        }

        const campaignsUrl = `https://graph.facebook.com/v20.0/${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,budget_remaining`;
        const campaignsData = await fetchGraphAPI(campaignsUrl, accessToken, "List Campaigns");
        
        const campaigns = campaignsData.data || [];

        const campaignsWithInsights = await Promise.all(campaigns.map(async (campaign: any) => {
            const insightsUrl = `https://graph.facebook.com/v20.0/${campaign.id}/insights?fields=impressions,clicks,spend,actions,action_values&date_preset=maximum`;
            const insightsData = await fetchGraphAPI(insightsUrl, accessToken, `Fetch Insights for Campaign ${campaign.id}`);
            const insights = insightsData.data?.[0] || {};
            
            // Calcula conversões de compra (exemplo)
            const conversions = (insights.actions || [])
                .filter((a: any) => /purchase|offsite_conversion/i.test(a.action_type))
                .reduce((sum: number, a: any) => sum + Number(a.value || 0), 0);

            return {
                ...campaign,
                insights: {
                    impressions: insights.impressions || "0",
                    clicks: insights.clicks || "0",
                    spend: insights.spend || "0",
                    conversions: conversions || 0,
                }
            };
        }));
        
        return NextResponse.json({ success: true, campaigns: campaignsWithInsights });

    } catch (error: any) {
        console.error("[CAMPAIGNS_API_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
    const pageId = metaConnection.facebookPageId; 

    if (!metaConnection.isConnected || !accessToken || !pageId) {
      throw new Error("Conexão com a Meta não está ativa, o token de acesso de usuário ou o ID da Página não estão disponíveis.");
    }
    
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

    // ETAPA 6: Publicar a Campanha (que ativa os adsets e ads filhos se configurados para herdar)
    await publishCampaign(campaignId, accessToken);

    return NextResponse.json({
      success: true,
      message: "Campanha publicada com sucesso!",
      campaignId: campaignId,
      adId: adId,
    });

  } catch (error: any) {
    console.error("[CAMPAIGN_API_ERROR]", error.message, error.stack);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

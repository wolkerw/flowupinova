import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getMetaConnectionAdmin } from "@/lib/services/meta-service-admin";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// =========================================================================
// GET: BUSCA TODAS AS CAMPANHAS REAIS DIRETAMENTE DA CONTA DE ANÚNCIOS DA META
// =========================================================================
export async function GET(request: NextRequest) {
  try {
    const uid = await getUidFromCookie();
    const metaConnection = await getMetaConnectionAdmin(uid);

    if (!metaConnection.isConnected || !metaConnection.accessToken) {
      return NextResponse.json(
        { success: false, error: "Conexão Meta não ativa." },
        { status: 403 }
      );
    }

    const accessToken = metaConnection.accessToken;
    const adAccountId = metaConnection.adAccountId;

    if (!adAccountId) {
      return NextResponse.json(
        { success: false, error: "Nenhuma conta de anúncios selecionada nas configurações." },
        { status: 400 }
      );
    }

    const cleanAdAccountId = adAccountId.replace("act_", "");

    // 1. Buscar todas as campanhas da conta de anúncios na Meta (limite de 100 itens)
    const campaignsUrl = `https://graph.facebook.com/v24.0/act_${cleanAdAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,created_time,start_time,stop_time&limit=100&access_token=${accessToken}`;
    const campaignsRes = await fetch(campaignsUrl);
    const campaignsData = await campaignsRes.json();

    if (!campaignsRes.ok) {
      console.error(
        "[API_ADS_CAMPAIGNS_GET] Erro ao buscar campanhas na Meta:",
        campaignsData.error
      );
      throw new Error(
        campaignsData.error?.message || "Falha ao consultar campanhas na Meta Ads API."
      );
    }

    const rawMetaCampaigns = campaignsData.data || [];

    // 2. Buscar insights agregados por campanha nos últimos 30 dias para alimentar os relatórios de performance
    const insightsUrl = `https://graph.facebook.com/v24.0/act_${cleanAdAccountId}/insights?level=campaign&fields=campaign_id,impressions,clicks,spend,actions&date_preset=last_30d&limit=100&access_token=${accessToken}`;
    const insightsRes = await fetch(insightsUrl);
    const insightsData = await insightsRes.json();

    const insightsList = insightsRes.ok && insightsData.data ? insightsData.data : [];
    const insightsMap = new Map();
    insightsList.forEach((ins: any) => {
      insightsMap.set(ins.campaign_id, ins);
    });

    // 3. Buscar os metadados locais salvos no Firestore (imagens criativas, CTA, raio e endereço formatado)
    const adsRef = adminDb.collection("users").doc(uid).collection("ads");
    const firestoreSnapshot = await adsRef.get();
    const localCampaignsMap = new Map();
    firestoreSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.metaCampaignId) {
        localCampaignsMap.set(data.metaCampaignId, { ...data, firestoreId: doc.id });
      }
    });

    // 4. Mesclar campanhas reais da Meta com dados locais e de insights
    const campaigns = rawMetaCampaigns
      .map((metaCamp: any) => {
        const firestoreData = localCampaignsMap.get(metaCamp.id);
        if (!firestoreData) return null; // Filter out campaigns not created by NumVapt

        const insight = insightsMap.get(metaCamp.id);

        // Métricas reais da Meta Ads
        const impressions = parseInt(insight?.impressions || "0");
        const clicks = parseInt(insight?.clicks || "0");
        const spend = parseFloat(insight?.spend || "0");

        let actions = clicks;
        if (insight?.actions) {
          const linkClicksAction = insight.actions.find(
            (act: any) => act.action_type === "link_click"
          );
          if (linkClicksAction) {
            actions = parseInt(linkClicksAction.value || "0");
          }
        }

        // Orçamento real configurado (conversão de centavos)
        let budgetAmount = 0;
        if (metaCamp.daily_budget) {
          budgetAmount = Number(metaCamp.daily_budget) / 100;
        } else if (metaCamp.lifetime_budget) {
          budgetAmount = Number(metaCamp.lifetime_budget) / 100;
        } else {
          budgetAmount = firestoreData.budget?.amount || 15;
        }

        const totalDays = firestoreData.durationDays || 7;

        return {
          id: firestoreData.firestoreId || metaCamp.id,
          metaCampaignId: metaCamp.id,
          name: firestoreData.name || metaCamp.name,
          status: metaCamp.status.toLowerCase(), // 'active', 'paused', etc.
          budget: {
            amount: budgetAmount,
          },
          durationDays: totalDays,
          creative: {
            imageUrl: firestoreData.creative?.imageUrl || "",
            ctaType: firestoreData.creative?.ctaType || "NONE",
            ctaLink: firestoreData.creative?.ctaLink || "",
          },
          targeting: {
            radiusKm: firestoreData.targeting?.radiusKm || 5,
            address: firestoreData.targeting?.address || "Região Selecionada",
          },
          metrics: {
            impressions,
            clicks,
            actions,
            amountSpent: spend,
          },
          createdAt: firestoreData.createdAt
            ? firestoreData.createdAt.toDate
              ? firestoreData.createdAt.toDate().toISOString()
              : firestoreData.createdAt
            : metaCamp.created_time,
        };
      })
      .filter((c: any) => c !== null);

    return NextResponse.json({ success: true, campaigns });
  } catch (error: any) {
    console.error("[API_ADS_CAMPAIGNS_GET] Erro geral:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// =========================================================================
// POST: CRIA CAMPANHA NA META ADS API (MANTIDO PARA FLUXO DE PUBLICAÇÃO)
// =========================================================================
export async function POST(request: NextRequest) {
  try {
    const uid = await getUidFromCookie();
    const metaConnection = await getMetaConnectionAdmin(uid);

    if (!metaConnection.isConnected || !metaConnection.accessToken) {
      return NextResponse.json(
        { success: false, error: "Meta account not connected." },
        { status: 403 }
      );
    }

    const adAccountId = metaConnection.adAccountId;
    if (!adAccountId) {
      return NextResponse.json(
        { success: false, error: "Meta ad account is not configured." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, objective } = body;

    if (!name || !objective) {
      return NextResponse.json(
        { success: false, error: "Name and objective are required." },
        { status: 400 }
      );
    }

    const url = `https://graph.facebook.com/v24.0/act_${adAccountId.replace("act_", "")}/campaigns`;
    const params = new URLSearchParams({
      name,
      objective,
      status: "PAUSED",
      special_ad_categories: "[]",
      access_token: metaConnection.accessToken,
    });

    const response = await fetch(url, {
      method: "POST",
      body: params,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[API_ADS_CAMPAIGNS_POST] Meta API Error:", data.error);
      throw new Error(
        data.error?.error_user_msg || data.error?.message || "Failed to create campaign."
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error("[API_ADS_CAMPAIGNS_POST] Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// =========================================================================
// PUT: ALTERA STATUS (ATIVAR / PAUSAR) DE UMA CAMPANHA REAL NA META ADS API
// =========================================================================
export async function PUT(request: NextRequest) {
  try {
    const uid = await getUidFromCookie();
    const metaConnection = await getMetaConnectionAdmin(uid);

    if (!metaConnection.isConnected || !metaConnection.accessToken) {
      return NextResponse.json(
        { success: false, error: "Conexão Meta não ativa." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { campaignId, metaCampaignId, status } = body; // 'active' ou 'paused'

    if (!metaCampaignId || !status) {
      return NextResponse.json(
        { success: false, error: "metaCampaignId e status são obrigatórios." },
        { status: 400 }
      );
    }

    const metaStatus = status.toUpperCase(); // 'ACTIVE' ou 'PAUSED'

    // 1. Atualizar na Meta Ads API
    const url = `https://graph.facebook.com/v24.0/${metaCampaignId}`;
    const params = new URLSearchParams({
      status: metaStatus,
      access_token: metaConnection.accessToken,
    });

    const res = await fetch(url, {
      method: "POST",
      body: params,
    });

    const resData = await res.json();
    if (!res.ok) {
      console.error("[API_ADS_CAMPAIGNS_PUT] Meta Ads error:", resData.error);
      throw new Error(resData.error?.message || "Falha ao atualizar status na Meta Ads API.");
    }

    // 2. Se a campanha existir localmente no Firestore, atualiza seu status também
    if (campaignId && campaignId.length > 5) {
      const campaignRef = adminDb.collection("users").doc(uid).collection("ads").doc(campaignId);
      await campaignRef.update({
        status: status.toLowerCase(),
        updatedAt: Timestamp.now(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API_ADS_CAMPAIGNS_PUT] Erro geral:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// =========================================================================
// DELETE: EXCLUI UMA CAMPANHA TANTO DA META ADS API QUANTO DO FIRESTORE
// =========================================================================
export async function DELETE(request: NextRequest) {
  try {
    const uid = await getUidFromCookie();
    const metaConnection = await getMetaConnectionAdmin(uid);

    if (!metaConnection.isConnected || !metaConnection.accessToken) {
      return NextResponse.json(
        { success: false, error: "Conexão Meta não ativa." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const metaCampaignId = searchParams.get("metaCampaignId");

    if (!metaCampaignId) {
      return NextResponse.json(
        { success: false, error: "metaCampaignId é obrigatório." },
        { status: 400 }
      );
    }

    // 1. Excluir na Meta Ads API
    const url = `https://graph.facebook.com/v24.0/${metaCampaignId}?access_token=${metaConnection.accessToken}`;
    const res = await fetch(url, { method: "DELETE" });
    const resData = await res.json();

    if (!res.ok) {
      console.error("[API_ADS_CAMPAIGNS_DELETE] Meta Ads error:", resData.error);
      // Alguns anúncios legados ou arquivados podem dar erro na remoção; apenas registramos se já estiver arquivado/deletado
    }

    // 2. Se a campanha existir localmente no Firestore, deleta do histórico
    if (campaignId && campaignId.length > 5 && campaignId !== metaCampaignId) {
      const campaignRef = adminDb.collection("users").doc(uid).collection("ads").doc(campaignId);
      await campaignRef.delete();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API_ADS_CAMPAIGNS_DELETE] Erro geral:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

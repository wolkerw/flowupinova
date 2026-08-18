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

    const period = request.nextUrl.searchParams.get("period") || "30";
    let datePreset = "last_30d";
    if (period === "7") datePreset = "last_7d";
    if (period === "14") datePreset = "last_14d";
    if (period === "90") datePreset = "last_90d";

    // 2. Buscar insights agregados por campanha no período selecionado
    const insightsUrl = `https://graph.facebook.com/v24.0/act_${cleanAdAccountId}/insights?level=campaign&fields=campaign_id,impressions,clicks,spend,actions,reach,frequency,cpc,cpm,ctr&date_preset=${datePreset}&limit=100&access_token=${accessToken}`;
    const platformsUrl = `https://graph.facebook.com/v24.0/act_${cleanAdAccountId}/insights?breakdowns=publisher_platform&fields=impressions,clicks,spend&date_preset=${datePreset}&access_token=${accessToken}`;
    const devicesUrl = `https://graph.facebook.com/v24.0/act_${cleanAdAccountId}/insights?breakdowns=device_platform&fields=impressions,clicks,spend&date_preset=${datePreset}&access_token=${accessToken}`;

    const [insightsRes, platformsRes, devicesRes] = await Promise.allSettled([
      fetch(insightsUrl).then((r) => r.json()),
      fetch(platformsUrl).then((r) => r.json()),
      fetch(devicesUrl).then((r) => r.json()),
    ]);

    const insightsData =
      insightsRes.status === "fulfilled" && insightsRes.value?.data ? insightsRes.value.data : [];
    const platformsData =
      platformsRes.status === "fulfilled" && platformsRes.value?.data ? platformsRes.value.data : [];
    const devicesData =
      devicesRes.status === "fulfilled" && devicesRes.value?.data ? devicesRes.value.data : [];

    const insightsMap = new Map();
    insightsData.forEach((ins: any) => {
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

    // 4. Mesclar todas as campanhas reais da conta Meta com dados locais e insights
    const campaigns = rawMetaCampaigns.map((metaCamp: any) => {
      const firestoreData = localCampaignsMap.get(metaCamp.id);
      const insight = insightsMap.get(metaCamp.id);

      // Métricas reais da Meta Ads
      const impressions = parseInt(insight?.impressions || "0");
      const clicks = parseInt(insight?.clicks || "0");
      const spend = parseFloat(insight?.spend || "0");
      const reach = parseInt(insight?.reach || "0") || impressions;
      const frequency = parseFloat(insight?.frequency || "1");
      const cpm = parseFloat(insight?.cpm || "0") || (impressions > 0 ? (spend / impressions) * 1000 : 0);
      const cpc = parseFloat(insight?.cpc || "0") || (clicks > 0 ? spend / clicks : 0);
      const ctr = parseFloat(insight?.ctr || "0") || (impressions > 0 ? (clicks / impressions) * 100 : 0);

      let messagesCount = 0;
      let leadsCount = 0;
      let salesCount = 0;
      let videoViewsCount = 0;
      let postEngagementCount = 0;
      let appInstallsCount = 0;
      let linkClicksCount = 0;

      if (Array.isArray(insight?.actions)) {
        // 1. Leads: Meta retorna múltiplos aliases ('onsite_conversion.lead_grouped', 'lead', 'offsite_conversion.fb_pixel_lead')
        const onsiteLead = insight.actions.find((a: any) => a.action_type === "onsite_conversion.lead_grouped");
        const standardLead = insight.actions.find((a: any) => a.action_type === "lead");
        const pixelLead = insight.actions.find((a: any) => a.action_type === "offsite_conversion.fb_pixel_lead");
        if (onsiteLead) {
          leadsCount = parseInt(onsiteLead.value || "0");
        } else if (standardLead) {
          leadsCount = parseInt(standardLead.value || "0");
        } else if (pixelLead) {
          leadsCount = parseInt(pixelLead.value || "0");
        }

        // 2. Mensagens / Conversas iniciadas (WhatsApp / Direct / Messenger / Leads via Mensagem)
        const msgStarted = insight.actions.find((a: any) =>
          a.action_type === "onsite_conversion.messaging_conversation_started_7d" ||
          a.action_type === "messaging_conversation_started_7d" ||
          a.action_type?.includes("messaging_conversation_started") ||
          a.action_type?.includes("lead_generation_messaging")
        );
        const generalMsg = insight.actions.find((a: any) =>
          a.action_type === "messages" ||
          a.action_type === "onsite_conversion.messaging_first_reply" ||
          a.action_type === "contact_total"
        );
        if (msgStarted) {
          messagesCount = parseInt(msgStarted.value || "0");
        } else if (generalMsg) {
          messagesCount = parseInt(generalMsg.value || "0");
        }

        // 3. Vendas / Compras
        const omniPurchase = insight.actions.find((a: any) => a.action_type === "omni_purchase");
        const stdPurchase = insight.actions.find((a: any) => a.action_type === "purchase");
        const pixelPurchase = insight.actions.find((a: any) => a.action_type === "offsite_conversion.fb_pixel_purchase");
        if (omniPurchase) {
          salesCount = parseInt(omniPurchase.value || "0");
        } else if (stdPurchase) {
          salesCount = parseInt(stdPurchase.value || "0");
        } else if (pixelPurchase) {
          salesCount = parseInt(pixelPurchase.value || "0");
        }

        // 4. Cliques no link
        const linkClickAction = insight.actions.find((a: any) => a.action_type === "link_click");
        if (linkClickAction) {
          linkClicksCount = parseInt(linkClickAction.value || "0");
        }

        // 5. Visualizações de vídeo
        const videoViewAction = insight.actions.find((a: any) => a.action_type === "video_view");
        if (videoViewAction) {
          videoViewsCount = parseInt(videoViewAction.value || "0");
        }

        // 6. Engajamento no post
        const postEngagementAction = insight.actions.find((a: any) => a.action_type === "post_engagement");
        if (postEngagementAction) {
          postEngagementCount = parseInt(postEngagementAction.value || "0");
        }

        // 7. Instalações de app
        const appInstallAction = insight.actions.find((a: any) =>
          a.action_type === "app_custom_event.fb_mobile_activate_app" ||
          a.action_type === "mobile_app_install"
        );
        if (appInstallAction) {
          appInstallsCount = parseInt(appInstallAction.value || "0");
        }
      }

      let actions = linkClicksCount || clicks;

      // Orçamento real configurado (conversão de centavos)
      let budgetAmount = 0;
      if (metaCamp.daily_budget) {
        budgetAmount = Number(metaCamp.daily_budget) / 100;
      } else if (metaCamp.lifetime_budget) {
        budgetAmount = Number(metaCamp.lifetime_budget) / 100;
      } else if (firestoreData?.budget?.amount) {
        budgetAmount = firestoreData.budget.amount;
      }

      const totalDays = firestoreData?.durationDays || 7;

      return {
        id: firestoreData?.firestoreId || metaCamp.id,
        metaCampaignId: metaCamp.id,
        name: metaCamp.name || firestoreData?.name || "Campanha Meta Ads",
        status: metaCamp.status ? metaCamp.status.toLowerCase() : "active",
        objective: metaCamp.objective || "OUTCOME_TRAFFIC",
        budget: {
          amount: budgetAmount,
        },
        durationDays: totalDays,
        creative: {
          imageUrl: firestoreData?.creative?.imageUrl || "",
          ctaType: firestoreData?.creative?.ctaType || "NONE",
          ctaLink: firestoreData?.creative?.ctaLink || "",
        },
        targeting: {
          radiusKm: firestoreData?.targeting?.radiusKm || null,
          address: firestoreData?.targeting?.address || "",
        },
        metrics: {
          impressions,
          clicks,
          actions,
          messagesCount,
          leadsCount,
          salesCount,
          videoViewsCount,
          postEngagementCount,
          appInstallsCount,
          linkClicksCount,
          amountSpent: spend,
          reach,
          frequency,
          cpm,
          cpc,
          ctr,
        },
        createdAt: metaCamp.created_time || (firestoreData?.createdAt
          ? firestoreData.createdAt.toDate
            ? firestoreData.createdAt.toDate().toISOString()
            : firestoreData.createdAt
          : new Date().toISOString()),
      };
    });

    return NextResponse.json({
      success: true,
      campaigns,
      breakdowns: {
        platforms: platformsData,
        devices: devicesData,
      },
    });
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

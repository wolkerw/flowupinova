"use server";

import { adminDb } from "@/lib/firebase-admin";
import { google } from "googleapis";
import type { GoogleAdsConnectionData } from "./google-ads-service";

const DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "TEST_DEVELOPER_TOKEN";
const GOOGLE_ADS_API_VERSION = "v24";

const GEO_TARGET_BRAZIL_REGIONS: Record<string, string> = {
  "20067": "São Paulo",
  "20068": "Rio de Janeiro",
  "20069": "Minas Gerais",
  "20070": "Paraná",
  "20071": "Rio Grande do Sul",
  "20072": "Santa Catarina",
  "20073": "Bahia",
  "20074": "Distrito Federal",
  "20075": "Goiás",
  "20076": "Pernambuco",
  "20077": "Ceará",
  "20078": "Espírito Santo",
  "20079": "Mato Grosso",
  "20080": "Mato Grosso do Sul",
  "20081": "Amazonas",
  "20082": "Paraíba",
  "20083": "Rio Grande do Norte",
  "20084": "Alagoas",
  "20085": "Piauí",
  "20086": "Maranhão",
  "20087": "Pará",
  "20088": "Sergipe",
  "20089": "Rondônia",
  "20090": "Tocantins",
  "20091": "Acre",
  "20092": "Amapá",
  "20093": "Roraima",
};

const GEO_TARGET_BRAZIL_CITIES: Record<string, string> = {
  "1001773": "São Paulo",
  "1001772": "Rio de Janeiro",
  "1001533": "Belém",
  "1001650": "Curitiba",
  "1001538": "Belo Horizonte",
  "1001625": "Brasília",
  "1001768": "Porto Alegre",
  "1001780": "Salvador",
  "1001658": "Fortaleza",
  "1001769": "Recife",
  "1001672": "Goiânia",
  "1001652": "Florianópolis",
  "1001594": "Campinas",
  "1001676": "Guarulhos",
  "1001784": "Santos",
  "1001764": "Ribeirão Preto",
  "1001646": "Cuiabá",
  "1001584": "Campo Grande",
  "1001726": "Manaus",
  "1001740": "Natal",
  "1001704": "João Pessoa",
  "1001718": "Maceió",
  "1001524": "Aracaju",
  "1001804": "Teresina",
  "1001782": "São Luís",
  "1001758": "Porto Velho",
  "1001736": "Palmas",
  "1001750": "Macapá",
  "1001532": "Boa Vista",
  "1001756": "Rio Branco",
  "1001519": "Anápolis",
  "1001527": "Bauru",
  "1001537": "Betim",
  "1001540": "Blumenau",
  "1001570": "Caxias do Sul",
  "1001587": "Contagem",
  "1001618": "Feira de Santana",
  "1001659": "Foz do Iguaçu",
  "1001679": "Joinville",
  "1001691": "Londrina",
  "1001706": "Maringá",
  "1001728": "Niterói",
  "1001733": "Osasco",
  "1001765": "Santo André",
  "1001766": "São Bernardo do Campo",
  "1001774": "São José dos Campos",
  "1001777": "Sorocaba",
  "1001792": "Uberlândia",
  "1001799": "Vila Velha",
  "1001800": "Vitória",
};

/**
 * Retorna os headers padrões para requisições na API do Google Ads
 */
function getGoogleAdsHeaders(accessToken: string, managerCustomerId?: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": DEVELOPER_TOKEN,
    "Content-Type": "application/json",
  };
  if (managerCustomerId) {
    headers["login-customer-id"] = managerCustomerId.replace(/-/g, "");
  }
  return headers;
}

/**
 * Recupera os dados da conexão do Google Ads do banco (Firestore admin)
 */
async function getGoogleAdsConnectionAdmin(userId: string): Promise<GoogleAdsConnectionData> {
  const connDoc = await adminDb
    .collection("users")
    .doc(userId)
    .collection("connections")
    .doc("google_ads")
    .get();

  if (!connDoc.exists) {
    throw new Error("Conexão com o Google Ads não encontrada. Por favor, conecte sua conta.");
  }
  return connDoc.data() as GoogleAdsConnectionData;
}

/**
 * Retorna o cliente Google OAuth2 autenticado
 */
export async function getAuthenticatedGoogleAdsClient(userId: string) {
  if (!userId) {
    throw new Error("UserID é necessário para autenticar com o Google.");
  }

  const connectionData = await getGoogleAdsConnectionAdmin(userId);
  if (!connectionData.refreshToken && !connectionData.accessToken) {
    throw new Error(
      "Token de acesso do Google Ads não encontrado. Por favor, conecte ou reconecte sua conta."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: connectionData.accessToken,
    refresh_token: connectionData.refreshToken,
  });

  return oauth2Client;
}

/**
 * Lista as contas acessíveis do Google Ads
 */
export async function listGoogleAdsCustomers(
  userId: string
): Promise<Array<{ id: string; name: string }>> {
  try {
    const oauth2Client = await getAuthenticatedGoogleAdsClient(userId);
    const tokenInfo = await oauth2Client.getAccessToken();
    const accessToken = tokenInfo.token;

    if (!accessToken) {
      throw new Error("Falha ao recuperar token de acesso do Google.");
    }

    // Chamada oficial listAccessibleCustomers
    const response = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers:listAccessibleCustomers`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": DEVELOPER_TOKEN,
        },
      }
    );

    const rawText = await response.text();
    if (!response.ok) {
      console.warn(
        `[GOOGLE_ADS_ADMIN] Erro HTTP ${response.status} (${response.statusText}) ao listar contas:`,
        rawText
      );
      let parsedError: any = {};
      try {
        parsedError = JSON.parse(rawText);
      } catch {}
      const detailMsg =
        parsedError.error?.details?.[0]?.errors?.[0]?.message ||
        parsedError.error?.message ||
        `Erro ${response.status} na API do Google Ads: ${rawText.substring(0, 100)}`;
      throw new Error(detailMsg);
    }

    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {}
    const resourceNames: string[] = data.resourceNames || [];
    const accounts: Array<{ id: string; name: string; managerCustomerId?: string }> = [];

    // Para cada conta encontrada, busca o nome amigável
    for (const resName of resourceNames) {
      const customerId = resName.replace("customers/", "");
      try {
        const detailResponse = await fetch(
          `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:search`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "developer-token": DEVELOPER_TOKEN,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: "SELECT customer.id, customer.descriptive_name, customer.manager FROM customer LIMIT 1",
            }),
          }
        );

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          const customerInfo = detailData.results?.[0]?.customer;
          const isManager = customerInfo?.manager || false;
          const name = customerInfo?.descriptiveName || `Conta Google Ads (${customerId})`;

          if (isManager) {
            console.log(`[GOOGLE_ADS_ADMIN] Conta ${customerId} é administradora (MCC). Buscando subcontas de clientes...`);
            const childResponse = await fetch(
              `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:search`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "developer-token": DEVELOPER_TOKEN,
                  "Content-Type": "application/json",
                  "login-customer-id": customerId.replace(/-/g, ""),
                },
                body: JSON.stringify({
                  query: `
                    SELECT 
                      customer_client.client_customer, 
                      customer_client.descriptive_name, 
                      customer_client.manager 
                    FROM customer_client 
                    WHERE customer_client.manager = false
                  `,
                }),
              }
            );

            if (childResponse.ok) {
              const childData = await childResponse.json();
              const childResults = childData.results || [];
              console.log(`[GOOGLE_ADS_ADMIN] Encontradas ${childResults.length} subcontas vinculadas.`);
              for (const childItem of childResults) {
                const childInfo = childItem.customerClient;
                if (childInfo && childInfo.clientCustomer) {
                  const childId = childInfo.clientCustomer.replace("customers/", "").replace(/-/g, "");
                  accounts.push({
                    id: childId,
                    name: childInfo.descriptiveName || `Conta Google Ads (${childId})`,
                    managerCustomerId: customerId.replace(/-/g, ""),
                  });
                }
              }
            } else {
              console.warn(
                `[GOOGLE_ADS_ADMIN] Falha ao obter subcontas de ${customerId}:`,
                await childResponse.text().catch(() => "")
              );
            }
          } else {
            accounts.push({ id: customerId.replace(/-/g, ""), name });
          }
        } else {
          accounts.push({
            id: customerId.replace(/-/g, ""),
            name: `Conta Google Ads (${customerId})`,
          });
        }
      } catch (innerErr) {
        console.warn(
          `[GOOGLE_ADS_ADMIN] Erro ao buscar detalhes da conta ${customerId}:`,
          innerErr
        );
        accounts.push({
          id: customerId.replace(/-/g, ""),
          name: `Conta Google Ads (${customerId})`,
        });
      }
    }

    // Deduplicação estrita de contas por ID
    const uniqueAccountsMap = new Map<string, { id: string; name: string; managerCustomerId?: string }>();

    for (const acc of accounts) {
      const cleanId = String(acc.id || "").replace(/-/g, "").trim();
      if (!cleanId) continue;

      if (!uniqueAccountsMap.has(cleanId)) {
        uniqueAccountsMap.set(cleanId, {
          ...acc,
          id: cleanId,
        });
      } else {
        const existing = uniqueAccountsMap.get(cleanId)!;
        // Priorizar managerCustomerId se disponível (para autenticação correta via MCC)
        const bestManagerId = existing.managerCustomerId || acc.managerCustomerId;
        // Priorizar nome amigável descritivo ao invés de fallback "Conta Google Ads (XXX)"
        const isExistingFallback = existing.name.startsWith("Conta Google Ads (");
        const isNewFallback = acc.name.startsWith("Conta Google Ads (");
        const bestName = isExistingFallback && !isNewFallback ? acc.name : existing.name;

        uniqueAccountsMap.set(cleanId, {
          id: cleanId,
          name: bestName,
          ...(bestManagerId ? { managerCustomerId: bestManagerId } : {}),
        });
      }
    }

    return Array.from(uniqueAccountsMap.values());
  } catch (error: any) {
    console.error("[GOOGLE_ADS_ADMIN] Falha no fluxo listGoogleAdsCustomers:", error.message || error);
    throw error;
  }
}

/**
 * Consulta campanhas e métricas do Google Ads
 */
export async function getGoogleAdsCampaigns(
  userId: string,
  customerId: string,
  periodDays: string = "30"
) {
  try {
    const oauth2Client = await getAuthenticatedGoogleAdsClient(userId);
    const connectionData = await getGoogleAdsConnectionAdmin(userId);
    let accessToken: string | null | undefined = null;
    try {
      const tokenInfo = await oauth2Client.getAccessToken();
      accessToken = tokenInfo?.token;
    } catch (e) {
      console.warn("[GOOGLE_ADS_ADMIN] Erro ao obter token via oauth2Client, usando accessToken direto:", e);
    }
    if (!accessToken) {
      accessToken = connectionData.accessToken;
    }

    if (!accessToken) {
      throw new Error("Não foi possível gerar token de acesso do Google Ads. Por favor, reconecte sua conta.");
    }

    const headers = getGoogleAdsHeaders(accessToken, connectionData.managerCustomerId);

    const cleanCustomerId = customerId.replace(/-/g, "");

    let dateClause = "DURING LAST_30_DAYS";
    if (periodDays === "7") {
      dateClause = "DURING LAST_7_DAYS";
    } else if (periodDays === "14") {
      dateClause = "DURING LAST_14_DAYS";
    } else if (periodDays === "90") {
      dateClause = "DURING LAST_30_DAYS"; // Google Ads API core standard range
    }

    const campaignQuery = `
      SELECT 
        campaign.id, 
        campaign.name, 
        campaign.status, 
        campaign.advertising_channel_type,
        campaign.advertising_channel_sub_type,
        campaign.bidding_strategy_type,
        campaign_budget.amount_micros, 
        metrics.impressions, 
        metrics.clicks, 
        metrics.cost_micros, 
        metrics.ctr, 
        metrics.average_cpc, 
        metrics.conversions, 
        metrics.cost_per_conversion
      FROM campaign
      WHERE segments.date ${dateClause}
      ORDER BY campaign.id DESC
      LIMIT 50
    `;

    const adQuery = `
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.ad.type,
        ad_group_ad.status,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.ad.responsive_search_ad.path1,
        ad_group_ad.ad.responsive_search_ad.path2,
        ad_group_ad.ad.final_urls,
        campaign.id,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM ad_group_ad
      WHERE segments.date ${dateClause}
      ORDER BY metrics.impressions DESC
      LIMIT 100
    `;

    const keywordQuery = `
      SELECT
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        campaign.id,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM keyword_view
      WHERE segments.date ${dateClause}
      ORDER BY metrics.clicks DESC
      LIMIT 50
    `;

    const deviceQuery = `
      SELECT
        campaign.id,
        segments.device,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date ${dateClause}
      LIMIT 100
    `;

    const searchTermQuery = `
      SELECT
        search_term_view.search_term,
        campaign.id,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM search_term_view
      WHERE segments.date ${dateClause}
      ORDER BY metrics.clicks DESC
      LIMIT 50
    `;

    const geoQuery = `
      SELECT
        geographic_view.country_criterion_id,
        geographic_view.location_type,
        segments.geo_target_region,
        segments.geo_target_city,
        campaign.id,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM geographic_view
      WHERE segments.date ${dateClause}
      ORDER BY metrics.impressions DESC
      LIMIT 50
    `;

    const safeGoogleAdsSearch = async (query: string, label: string) => {
      try {
        const res = await fetch(
          `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${cleanCustomerId}/googleAds:search`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ query }),
          }
        );
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          if (json.error) {
            console.warn(`[GOOGLE_ADS_ADMIN] Erro retornado na query (${label}):`, JSON.stringify(json.error, null, 2));
          }
          return json;
        } catch {
          console.warn(`[GOOGLE_ADS_ADMIN] Resposta não-JSON recebida na query (${label}) - Status ${res.status}:`, text.slice(0, 300));
          return { error: { message: `HTTP ${res.status}: ${text.slice(0, 200)}` } };
        }
      } catch (e: any) {
        console.warn(`[GOOGLE_ADS_ADMIN] Falha de rede na query (${label}):`, e.message || e);
        return { error: { message: e.message || "Network error" } };
      }
    };

    const [campaignsRes, adsRes, keywordsRes, devicesRes, searchTermsRes, geoRes] = await Promise.allSettled([
      safeGoogleAdsSearch(campaignQuery, "campaignQuery"),
      safeGoogleAdsSearch(adQuery, "adQuery"),
      safeGoogleAdsSearch(keywordQuery, "keywordQuery"),
      safeGoogleAdsSearch(deviceQuery, "deviceQuery"),
      safeGoogleAdsSearch(searchTermQuery, "searchTermQuery"),
      safeGoogleAdsSearch(geoQuery, "geoQuery"),
    ]);

    let campaignResults =
      campaignsRes.status === "fulfilled" && campaignsRes.value?.results
        ? campaignsRes.value.results
        : [];
    let adsResults =
      adsRes.status === "fulfilled" && adsRes.value?.results
        ? adsRes.value.results
        : [];

    // Se nenhuma campanha com métricas no período exato foi retornada, buscar todas as campanhas ativas/pausadas da conta
    if (campaignResults.length === 0) {
      const fallbackCampaignQuery = `
        SELECT 
          campaign.id, 
          campaign.name, 
          campaign.status, 
          campaign.advertising_channel_type,
          campaign.advertising_channel_sub_type,
          campaign.bidding_strategy_type,
          campaign_budget.amount_micros, 
          metrics.impressions, 
          metrics.clicks, 
          metrics.cost_micros, 
          metrics.ctr, 
          metrics.average_cpc, 
          metrics.conversions, 
          metrics.cost_per_conversion
        FROM campaign
        WHERE campaign.status != 'REMOVED'
        ORDER BY campaign.id DESC
        LIMIT 50
      `;
      const fallbackRes = await safeGoogleAdsSearch(fallbackCampaignQuery, "fallbackCampaignQuery");
      if (fallbackRes?.results) {
        campaignResults = fallbackRes.results;
      }
    }

    if (adsResults.length === 0) {
      const fallbackAdQuery = `
        SELECT
          ad_group_ad.ad.id,
          ad_group_ad.ad.name,
          ad_group_ad.ad.type,
          ad_group_ad.status,
          ad_group_ad.ad.responsive_search_ad.headlines,
          ad_group_ad.ad.responsive_search_ad.descriptions,
          ad_group_ad.ad.responsive_search_ad.path1,
          ad_group_ad.ad.responsive_search_ad.path2,
          ad_group_ad.ad.final_urls,
          campaign.id,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr,
          metrics.average_cpc
        FROM ad_group_ad
        WHERE ad_group_ad.status != 'REMOVED'
        ORDER BY ad_group_ad.ad.id DESC
        LIMIT 100
      `;
      const fallbackAdsRes = await safeGoogleAdsSearch(fallbackAdQuery, "fallbackAdQuery");
      if (fallbackAdsRes?.results) {
        adsResults = fallbackAdsRes.results;
      }
    }
    const keywordsResults =
      keywordsRes.status === "fulfilled" && keywordsRes.value?.results
        ? keywordsRes.value.results
        : [];
    const devicesResults =
      devicesRes.status === "fulfilled" && devicesRes.value?.results
        ? devicesRes.value.results
        : [];
    const searchTermsResults =
      searchTermsRes.status === "fulfilled" && searchTermsRes.value?.results
        ? searchTermsRes.value.results
        : [];

    // Mapear anúncios individuais por campanha
    const adsByCampaignMap = new Map<string, any[]>();
    adsResults.forEach((item: any) => {
      const campId = String(item.campaign?.id || "");
      if (!campId) return;

      const spentMicros = Number(item.metrics?.costMicros || 0);
      const avgCpcMicros = Number(item.metrics?.averageCpc || 0);
      const avgCpvMicros = Number(item.metrics?.averageCpv || 0);
      const rawStatus = item.adGroupAd?.status?.toLowerCase();
      const status = rawStatus === "enabled" ? "active" : rawStatus;

      const rsa = item.adGroupAd?.ad?.responsiveSearchAd;
      const headlines = rsa?.headlines?.map((h: any) => h.text).filter(Boolean) || [];
      const descriptions = rsa?.descriptions?.map((d: any) => d.text).filter(Boolean) || [];
      const path1 = rsa?.path1 || "";
      const path2 = rsa?.path2 || "";
      const finalUrls = item.adGroupAd?.ad?.finalUrls || [];

      const currentList = adsByCampaignMap.get(campId) || [];
      currentList.push({
        id: item.adGroupAd?.ad?.id,
        name: item.adGroupAd?.ad?.name,
        status,
        type: item.adGroupAd?.ad?.type || "RESPONSIVE_SEARCH_AD",
        headlines,
        descriptions,
        path1,
        path2,
        finalUrls,
        metrics: {
          impressions: Number(item.metrics?.impressions || 0),
          clicks: Number(item.metrics?.clicks || 0),
          amountSpent: spentMicros / 1_000_000,
          spent: spentMicros / 1_000_000,
          ctr: Number(item.metrics?.ctr || 0) * 100,
          averageCpc: avgCpcMicros / 1_000_000,
          averageCpv: avgCpvMicros / 1_000_000,
          conversions: Number(item.metrics?.conversions || 0),
          videoViews: Number(item.metrics?.videoViews || 0),
        },
      });
      adsByCampaignMap.set(campId, currentList);
    });

    // Mapear palavras-chave por campanha
    const keywordsByCampaignMap = new Map<string, any[]>();
    keywordsResults.forEach((item: any) => {
      const campId = String(item.campaign?.id || "");
      if (!campId) return;

      const spentMicros = Number(item.metrics?.costMicros || 0);
      const avgCpcMicros = Number(item.metrics?.averageCpc || 0);

      const currentList = keywordsByCampaignMap.get(campId) || [];
      currentList.push({
        text: item.adGroupCriterion?.keyword?.text,
        matchType: item.adGroupCriterion?.keyword?.matchType || "BROAD",
        impressions: Number(item.metrics?.impressions || 0),
        clicks: Number(item.metrics?.clicks || 0),
        amountSpent: spentMicros / 1_000_000,
        spent: spentMicros / 1_000_000,
        ctr: Number(item.metrics?.ctr || 0) * 100,
        averageCpc: avgCpcMicros / 1_000_000,
        conversions: Number(item.metrics?.conversions || 0),
      });
      keywordsByCampaignMap.set(campId, currentList);
    });

    // Mapear termos de pesquisa reais
    const searchTermsByCampaignMap = new Map<string, any[]>();
    searchTermsResults.forEach((item: any) => {
      const campId = String(item.campaign?.id || "");
      if (!campId) return;
      const spentMicros = Number(item.metrics?.costMicros || 0);
      const currentList = searchTermsByCampaignMap.get(campId) || [];
      currentList.push({
        text: item.searchTermView?.searchTerm || "",
        impressions: Number(item.metrics?.impressions || 0),
        clicks: Number(item.metrics?.clicks || 0),
        amountSpent: spentMicros / 1_000_000,
        spent: spentMicros / 1_000_000,
        conversions: Number(item.metrics?.conversions || 0),
      });
      searchTermsByCampaignMap.set(campId, currentList);
    });

    // Mapear distribuição por dispositivo
    const devicesByCampaignMap = new Map<string, any[]>();
    devicesResults.forEach((item: any) => {
      const campId = String(item.campaign?.id || "");
      if (!campId) return;
      const spentMicros = Number(item.metrics?.costMicros || 0);
      const currentList = devicesByCampaignMap.get(campId) || [];
      currentList.push({
        device: item.segments?.device || "UNKNOWN",
        impressions: Number(item.metrics?.impressions || 0),
        clicks: Number(item.metrics?.clicks || 0),
        amountSpent: spentMicros / 1_000_000,
        spent: spentMicros / 1_000_000,
      });
      devicesByCampaignMap.set(campId, currentList);
    });

    const geoResults =
      geoRes.status === "fulfilled" && geoRes.value?.results
        ? geoRes.value.results
        : [];

    // Mapear regiões geográficas (Estados e Cidades separados)
    const geoByCampaignMap = new Map<string, any[]>();
    const citiesByCampaignMap = new Map<string, any[]>();

    geoResults.forEach((item: any) => {
      const campId = String(item.campaign?.id || "");
      if (!campId) return;

      const spentMicros = Number(item.metrics?.costMicros || 0);
      const imp = Number(item.metrics?.impressions || 0);
      const clicks = Number(item.metrics?.clicks || 0);
      const spent = spentMicros / 1_000_000;

      // 1. Estados (apenas estados reconhecidos pelo ID do Brasil)
      const rawGeoId = (item.segments?.geoTargetRegion || "").replace("geoTargetConstants/", "");
      const regionName = GEO_TARGET_BRAZIL_REGIONS[rawGeoId];
      if (regionName) {
        const currentRegions = geoByCampaignMap.get(campId) || [];
        currentRegions.push({
          region: regionName,
          impressions: imp,
          clicks,
          amountSpent: spent,
          spent,
        });
        geoByCampaignMap.set(campId, currentRegions);
      }

      // 2. Cidades (cidades reconhecidas pelo ID da API)
      const rawCityId = (item.segments?.geoTargetCity || "").replace("geoTargetConstants/", "");
      const cityName = GEO_TARGET_BRAZIL_CITIES[rawCityId];
      if (cityName) {
        const currentCities = citiesByCampaignMap.get(campId) || [];
        currentCities.push({
          city: cityName,
          impressions: imp,
          clicks,
          amountSpent: spent,
          spent,
        });
        citiesByCampaignMap.set(campId, currentCities);
      }
    });

    return campaignResults.map((item: any) => {
      const campId = String(item.campaign?.id || "");
      const budgetMicros = Number(item.campaignBudget?.amountMicros || 0);
      const spentMicros = Number(item.metrics?.costMicros || 0);
      const avgCpcMicros = Number(item.metrics?.averageCpc || 0);
      const costPerConvMicros = Number(item.metrics?.costPerConversion || 0);

      const rawStatus = item.campaign?.status?.toLowerCase();
      const status = rawStatus === "enabled" ? "active" : rawStatus;

      const rawChannelType = (item.campaign?.advertisingChannelType || "").toUpperCase();
      const rawSubType = (item.campaign?.advertisingChannelSubType || "").toUpperCase();
      const campName = (item.campaign?.name || "").toLowerCase();

      let channelType = rawChannelType || "SEARCH";
      if (
        rawChannelType === "VIDEO" ||
        rawSubType.includes("VIDEO") ||
        campName.includes("youtube") ||
        campName.includes("video") ||
        campName.includes("vídeo")
      ) {
        channelType = "VIDEO";
      } else if (rawChannelType.includes("PERFORMANCE_MAX")) {
        channelType = "PERFORMANCE_MAX";
      } else if (rawChannelType.includes("DISPLAY")) {
        channelType = "DISPLAY";
      } else if (rawChannelType.includes("SHOPPING")) {
        channelType = "SHOPPING";
      } else if (rawChannelType.includes("SEARCH")) {
        channelType = "SEARCH";
      }

      return {
        id: item.campaign?.id,
        name: item.campaign?.name,
        status,
        channelType,
        channelSubType: rawSubType,
        biddingStrategy: item.campaign?.biddingStrategyType || "",
        budgetAmount: budgetMicros / 1_000_000,
        metrics: {
          impressions: Number(item.metrics?.impressions || 0),
          clicks: Number(item.metrics?.clicks || 0),
          amountSpent: spentMicros / 1_000_000,
          spent: spentMicros / 1_000_000,
          ctr: Number(item.metrics?.ctr || 0) * 100,
          averageCpc: avgCpcMicros / 1_000_000,
          conversions: Number(item.metrics?.conversions || 0),
          costPerConversion: costPerConvMicros / 1_000_000,
        },
        ads: adsByCampaignMap.get(campId) || [],
        keywords: keywordsByCampaignMap.get(campId) || [],
        searchTerms: searchTermsByCampaignMap.get(campId) || [],
        deviceBreakdown: devicesByCampaignMap.get(campId) || [],
        regions: geoByCampaignMap.get(campId) || [],
        cities: citiesByCampaignMap.get(campId) || [],
        topImpressionPercentage: Number(item.metrics?.topImpressionPercentage || 0) * 100,
        absoluteTopImpressionPercentage: Number(item.metrics?.absoluteTopImpressionPercentage || 0) * 100,
      };
    });
  } catch (error: any) {
    console.error(`[GOOGLE_ADS_ADMIN] Erro ao buscar campanhas para ${customerId}:`, error);
    return [];
  }
}

/**
 * Altera status de uma campanha (ex: ENABLED, PAUSED)
 */
export async function updateGoogleAdsCampaignStatus(
  userId: string,
  customerId: string,
  campaignId: string,
  newStatus: "ENABLED" | "PAUSED"
) {
  try {
    const oauth2Client = await getAuthenticatedGoogleAdsClient(userId);
    const tokenInfo = await oauth2Client.getAccessToken();
    const accessToken = tokenInfo.token;

    if (!accessToken) {
      throw new Error("Não foi possível gerar token de acesso.");
    }

    const connectionData = await getGoogleAdsConnectionAdmin(userId);
    const headers = getGoogleAdsHeaders(accessToken, connectionData.managerCustomerId);

    const cleanCustomerId = customerId.replace(/-/g, "");

    const payload = {
      operations: [
        {
          update: {
            resourceName: `customers/${cleanCustomerId}/campaigns/${campaignId}`,
            status: newStatus,
          },
          updateMask: "status",
        },
      ],
    };

    const response = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${cleanCustomerId}/campaigns:mutate`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || "Erro ao atualizar status da campanha.");
    }

    return { success: true };
  } catch (error: any) {
    console.error(`[GOOGLE_ADS_ADMIN] Erro ao atualizar campanha ${campaignId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Extrai detalhes específicos de falha retornados pela API do Google Ads (GoogleAdsFailure)
 */
function parseGoogleAdsError(err: any, defaultMsg: string): string {
  if (err?.error?.details) {
    for (const detail of err.error.details) {
      if (detail.errors && Array.isArray(detail.errors)) {
        const messages = detail.errors.map((e: any) => {
          let msg = e.message;
          if (e.trigger?.stringValue) {
            msg += ` (Valor: "${e.trigger.stringValue}")`;
          }
          if (e.policyFindingDetails?.policyTopicEntries) {
            const topics = e.policyFindingDetails.policyTopicEntries
              .map((t: any) => t.topicName)
              .join(", ");
            msg += ` [Políticas violadas: ${topics}]`;
          }
          return msg;
        });
        return messages.join(" | ");
      }
    }
  }
  return err?.error?.message || defaultMsg;
}

/**
 * Remove uma campanha do Google Ads em caso de falha no meio do fluxo para garantir atomicidade.
 */
async function rollbackGoogleAdsCampaign(
  cleanCustomerId: string,
  headers: Record<string, string>,
  campaignResourceName: string
) {
  try {
    console.warn(
      `[GOOGLE_ADS_ADMIN] Executando rollback para remover campanha incompleta: ${campaignResourceName}`
    );
    await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${cleanCustomerId}/campaigns:mutate`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          operations: [
            {
              remove: campaignResourceName,
            },
          ],
        }),
      }
    );
  } catch (rollbackErr) {
    console.error("[GOOGLE_ADS_ADMIN] Erro ao executar rollback de campanha:", rollbackErr);
  }
}

/**
 * Cria a estrutura completa de uma campanha no Google Ads (Orçamento, Campanha, Grupo e Anúncio)
 */
export async function createGoogleAdsCampaign(
  userId: string,
  customerId: string,
  campaignData: {
    name: string;
    dailyBudget: number;
    headline1: string;
    headline2: string;
    headline3: string;
    description1: string;
    description2: string;
    keywords: string[];
    finalUrl?: string;
  }
) {
  let createdCampaignResourceName: string | null = null;
  let cleanCustomerId = customerId.replace(/-/g, "");
  let headers: Record<string, string> = {};

  try {
    const oauth2Client = await getAuthenticatedGoogleAdsClient(userId);
    const tokenInfo = await oauth2Client.getAccessToken();
    const accessToken = tokenInfo.token;

    if (!accessToken) {
      throw new Error("Não foi possível gerar token de acesso.");
    }

    const connectionData = await getGoogleAdsConnectionAdmin(userId);
    headers = getGoogleAdsHeaders(accessToken, connectionData.managerCustomerId);

    const budgetMicros = Math.round(campaignData.dailyBudget * 1_000_000);

    // 1. Cria Orçamento de Campanha (Campaign Budget)
    const budgetPayload = {
      operations: [
        {
          create: {
            name: `Orçamento: ${campaignData.name} - ${Date.now()}`,
            deliveryMethod: "STANDARD",
            amountMicros: budgetMicros,
          },
        },
      ],
    };

    const budgetRes = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${cleanCustomerId}/campaignBudgets:mutate`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(budgetPayload),
      }
    );

    if (!budgetRes.ok) {
      const err = await budgetRes.json().catch(() => ({}));
      throw new Error(parseGoogleAdsError(err, "Falha ao criar orçamento no Google Ads."));
    }

    const budgetData = await budgetRes.json();
    const budgetResourceName = budgetData.results?.[0]?.resourceName;

    if (!budgetResourceName) {
      throw new Error("Recurso de orçamento não retornado pelo Google.");
    }

    // 2. Cria Campanha de Pesquisa (Campaign)
    const campaignPayload = {
      operations: [
        {
          create: {
            name: campaignData.name,
            advertisingChannelType: "SEARCH",
            status: "ENABLED",
            campaignBudget: budgetResourceName,
            manualCpc: {},
            containsEuPoliticalAdvertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
            networkSettings: {
              targetGoogleSearch: true,
              targetSearchNetwork: true,
              targetContentNetwork: false,
              targetPartnerSearchNetwork: false,
            },
          },
        },
      ],
    };

    const campaignRes = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${cleanCustomerId}/campaigns:mutate`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(campaignPayload),
      }
    );

    if (!campaignRes.ok) {
      const err = await campaignRes.json().catch(() => ({}));
      throw new Error(parseGoogleAdsError(err, "Falha ao criar campanha no Google Ads."));
    }

    const campaignResult = await campaignRes.json();
    const campaignResourceName = campaignResult.results?.[0]?.resourceName;

    if (!campaignResourceName) {
      throw new Error("Recurso de campanha não retornado pelo Google.");
    }

    createdCampaignResourceName = campaignResourceName;
    const campaignId = campaignResourceName.split("/").pop();

    // 3. Cria Grupo de Anúncios (Ad Group)
    const adGroupPayload = {
      operations: [
        {
          create: {
            name: `Grupo: ${campaignData.name}`,
            campaign: campaignResourceName,
            status: "ENABLED",
            type: "SEARCH_STANDARD",
            cpcBidMicros: Math.min(Math.max(Math.round(campaignData.dailyBudget * 0.1 * 1_000_000), 1_000_000), 5_000_000),
          },
        },
      ],
    };

    const adGroupRes = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${cleanCustomerId}/adGroups:mutate`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(adGroupPayload),
      }
    );

    if (!adGroupRes.ok) {
      const err = await adGroupRes.json().catch(() => ({}));
      throw new Error(parseGoogleAdsError(err, "Falha ao criar grupo de anúncios no Google Ads."));
    }

    const adGroupResult = await adGroupRes.json();
    const adGroupResourceName = adGroupResult.results?.[0]?.resourceName;

    if (!adGroupResourceName) {
      throw new Error("Recurso de grupo de anúncios não retornado pelo Google.");
    }

    // 4. Cria Anúncio de Pesquisa Responsivo (Responsive Search Ad)
    const headlines = [
      { text: campaignData.headline1 },
      { text: campaignData.headline2 },
      { text: campaignData.headline3 },
    ].filter((h) => !!h.text);

    const descriptions = [
      { text: campaignData.description1 },
      { text: campaignData.description2 },
    ].filter((d) => !!d.text);

    let finalUrl = campaignData.finalUrl || process.env.NEXT_PUBLIC_APP_URL || "https://numvapt.com";
    if (finalUrl.includes("localhost") || finalUrl.includes("127.0.0.1")) {
      finalUrl = "https://numvapt.com";
    }

    const adGroupAdPayload = {
      operations: [
        {
          create: {
            adGroup: adGroupResourceName,
            status: "ENABLED",
            ad: {
              responsiveSearchAd: {
                headlines,
                descriptions,
              },
              finalUrls: [finalUrl],
            },
          },
        },
      ],
    };

    const adRes = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${cleanCustomerId}/adGroupAds:mutate`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(adGroupAdPayload),
      }
    );

    if (!adRes.ok) {
      const err = await adRes.json().catch(() => ({}));
      throw new Error(parseGoogleAdsError(err, "Falha ao criar anúncio de pesquisa no Google Ads."));
    }

    // 5. Cria Palavras-chave (Keywords Criteria)
    if (campaignData.keywords && campaignData.keywords.length > 0) {
      const keywordOperations = campaignData.keywords.map((kw) => ({
        create: {
          adGroup: adGroupResourceName,
          status: "ENABLED",
          keyword: {
            text: kw,
            matchType: "PHRASE",
          },
        },
      }));

      const keywordRes = await fetch(
        `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${cleanCustomerId}/adGroupCriteria:mutate`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ operations: keywordOperations }),
        }
      );

      if (!keywordRes.ok) {
        const err = await keywordRes.json().catch(() => ({}));
        throw new Error(parseGoogleAdsError(err, "Falha ao associar palavras-chave no Google Ads."));
      }
    }

    return { success: true, campaignId };
  } catch (error: any) {
    console.error("[GOOGLE_ADS_ADMIN] Falha no fluxo de criação de campanha no Google Ads:", error);
    
    // Se a campanha já tinha sido criada mas um passo posterior falhou, executa Rollback imediato no Google Ads
    if (createdCampaignResourceName) {
      await rollbackGoogleAdsCampaign(cleanCustomerId, headers, createdCampaignResourceName);
    }

    throw error;
  }
}

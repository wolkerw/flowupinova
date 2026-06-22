import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie, adminDb } from "@/lib/firebase-admin";
import { getMetaConnectionAdmin } from "@/lib/services/meta-service-admin";

export async function POST(request: NextRequest) {
  let createdCampaignId: string | null = null;
  let createdAdSetId: string | null = null;
  let createdCreativeId: string | null = null;
  let createdAdId: string | null = null;

  try {
    const uid = await getUidFromCookie();
    const metaConnection = await getMetaConnectionAdmin(uid);

    if (!metaConnection.isConnected || !metaConnection.accessToken) {
      return NextResponse.json(
        { success: false, error: "Sua conta Meta não está conectada." },
        { status: 403 }
      );
    }

    const adAccountId = metaConnection.adAccountId;
    const pageId = metaConnection.pageId;

    if (!adAccountId) {
      return NextResponse.json(
        { success: false, error: "Nenhuma conta de anúncios selecionada nas configurações." },
        { status: 400 }
      );
    }

    const cleanAdAccountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

    if (!pageId) {
      return NextResponse.json(
        { success: false, error: "Nenhuma página do Facebook vinculada ao perfil da Meta." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, postId, campaignObjective, creative, budget, durationDays, targeting } = body;
    const { headline, bodyText, imageUrl, ctaType, ctaLink } = creative || {};
    const {
      address,
      radiusKm,
      ageMin,
      ageMax,
      gender,
      latitude: inputLat,
      longitude: inputLng,
      locType,
      locKey,
      locations,
      interests,
    } = targeting || {};

    if (!name || !creative || !imageUrl || !budget || !durationDays || !targeting) {
      return NextResponse.json(
        { success: false, error: "Faltam parâmetros obrigatórios na requisição." },
        { status: 400 }
      );
    }

    // Buscar endereço do perfil oficial do negócio para fallback seguro de geocodificação
    const profileDoc = await adminDb
      .collection("users")
      .doc(uid)
      .collection("business")
      .doc("profile")
      .get();
    const profileData = profileDoc.exists ? profileDoc.data() : null;
    const profileAddress = profileData?.address || "";

    let instagramActorId: string | null = null;
    const metaToken = metaConnection.accessToken;

    // 1. Tentar buscar o ID da conta do Instagram conectada diretamente na Página do Facebook (API da Meta)
    if (pageId && metaToken) {
      try {
        const pageInstaRes = await fetch(
          `https://graph.facebook.com/v24.0/${pageId}?fields=instagram_business_account&access_token=${metaToken}`
        );
        if (pageInstaRes.ok) {
          const pageInstaData = await pageInstaRes.json();
          if (pageInstaData?.instagram_business_account?.id) {
            instagramActorId = pageInstaData.instagram_business_account.id;
            console.log(
              `[ORQUESTRADOR] Instagram Actor ID obtido da Página no Graph API: ${instagramActorId}`
            );
          }
        }
      } catch (err: any) {
        console.warn(
          "[ORQUESTRADOR] Falha ao consultar instagram_business_account da página:",
          err.message
        );
      }
    }

    // 2. Fallback: Se não conseguiu via Graph API, busca no Firestore
    if (!instagramActorId) {
      const instagramDoc = await adminDb
        .collection("users")
        .doc(uid)
        .collection("connections")
        .doc("instagram")
        .get();
      const instagramData = instagramDoc.exists ? instagramDoc.data() : null;
      const dbInstaId = instagramData?.isConnected ? instagramData?.instagramId : null;

      // Valida se o ID tem o formato esperado de uma conta empresarial do Instagram (normalmente começa com 1784 e tem 17 dígitos)
      if (dbInstaId && dbInstaId.startsWith("1784") && dbInstaId.length === 17) {
        instagramActorId = dbInstaId;
        console.log(
          `[ORQUESTRADOR] Instagram Actor ID obtido do Firestore (válido): ${instagramActorId}`
        );
      } else if (dbInstaId) {
        console.warn(
          `[ORQUESTRADOR] ID do Instagram no Firestore ignorado por formato inválido para anúncios: ${dbInstaId}`
        );
      }
    }

    console.log(`[ORQUESTRADOR] Iniciando publicação na Meta para Ad Account: ${cleanAdAccountId}`);
    if (instagramActorId) {
      console.log(`[ORQUESTRADOR] Instagram Actor ID ativo para anúncio: ${instagramActorId}`);
    } else {
      console.log("[ORQUESTRADOR] Nenhum Instagram Actor ID ativo configurado para esta campanha.");
    }

    // Nomenclatura Dinâmica
    const postStart = bodyText
      ? bodyText.replace(/[\n\r]+/g, " ").length > 25
        ? `${bodyText.replace(/[\n\r]+/g, " ").substring(0, 25)}...`
        : bodyText.replace(/[\n\r]+/g, " ")
      : "Sem descrição";
    let campaignName = name ? name.trim().replace(/[\n\r]+/g, " ") : `[NUMVAPT] ${postStart}`;
    if (campaignName && !campaignName.startsWith("[NUMVAPT]")) {
      campaignName = `[NUMVAPT] ${campaignName}`;
    }
    const adSetName = `${campaignName} - Grupo Local`;
    const adNameText = `${campaignName} - Anúncio`;

    // ==========================================
    // ETAPA 1: CRIAR CAMPANHA NA META
    // ==========================================
    console.log("[ORQUESTRADOR] Passo 1: Criando campanha com nome dinâmico...");
    const campaignUrl = `https://graph.facebook.com/v24.0/${cleanAdAccountId}/campaigns`;

    // Mapeamento de objetivos da campanha na Meta
    const isTraffic = campaignObjective === "TRAFFIC";
    const isWhatsApp = campaignObjective === "WHATSAPP";
    // WhatsApp (Click-to-WhatsApp) exige OUTCOME_ENGAGEMENT, não OUTCOME_TRAFFIC.
    // OUTCOME_TRAFFIC exige URL de site externo e não aceita destination_type WHATSAPP.
    const metaObjective = isWhatsApp
      ? "OUTCOME_ENGAGEMENT"
      : isTraffic
        ? "OUTCOME_TRAFFIC"
        : "OUTCOME_AWARENESS";

    const campaignParams = new URLSearchParams({
      name: campaignName,
      objective: metaObjective,
      status: "PAUSED", // Cria pausada para montar as subestruturas com segurança
      special_ad_categories: "[]",
      is_adset_budget_sharing_enabled: "false",
      access_token: metaConnection.accessToken,
    });

    const campaignResponse = await fetch(campaignUrl, {
      method: "POST",
      body: campaignParams,
    });

    const campaignData = await campaignResponse.json();
    if (!campaignResponse.ok) {
      console.error("[ORQUESTRADOR] Erro na campanha:", campaignData.error);
      throw new Error(
        campaignData.error?.error_user_msg ||
          campaignData.error?.message ||
          "Erro ao criar campanha na Meta."
      );
    }

    createdCampaignId = campaignData.id;
    console.log(`[ORQUESTRADOR] Campanha criada: ${createdCampaignId}`);

    // ==========================================
    // ETAPA 2: GEOCODIFICAR ENDEREÇO & CRIAR AD SET
    // ==========================================
    console.log("[ORQUESTRADOR] Passo 2: Geocodificando endereço e criando Ad Set...");

    let latitude: number | null = typeof inputLat === "number" ? inputLat : null;
    let longitude: number | null = typeof inputLng === "number" ? inputLng : null;

    // Helper de Geocodificação confinada no Brasil
    async function geocodeAddress(addr: string): Promise<{ lat: number; lon: number } | null> {
      if (!addr) return null;
      let query = addr;
      // Garante confinamento de busca no Brasil
      if (!query.toLowerCase().includes("brasil") && !query.toLowerCase().includes("brazil")) {
        query += ", Brasil";
      }
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`,
          {
            headers: {
              "User-Agent": "NumVaptAdsApp/1.0",
            },
          }
        );
        if (res.ok) {
          const geoData = await res.json();
          if (geoData && geoData.length > 0) {
            return {
              lat: parseFloat(geoData[0].lat),
              lon: parseFloat(geoData[0].lon),
            };
          }
        }
      } catch (err) {
        console.warn(`[ORQUESTRADOR] Falha na busca Nominatim para "${query}":`, err);
      }
      return null;
    }

    if (latitude !== null && longitude !== null) {
      console.log(
        `[ORQUESTRADOR] Utilizando coordenadas pré-selecionadas pelo autocomplete: Lat: ${latitude}, Lng: ${longitude}`
      );
    } else {
      // 1. Tenta geocodificar o endereço customizado enviado
      let coords = await geocodeAddress(address);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lon;
        console.log(
          `[ORQUESTRADOR] Geocodificação customizada com sucesso: ${address} -> Lat: ${latitude}, Lng: ${longitude}`
        );
      } else {
        // 2. Se falhar e o endereço oficial do perfil for diferente, tenta o endereço oficial
        if (profileAddress && profileAddress !== address) {
          console.log(
            `[ORQUESTRADOR] Falha no endereço customizado. Tentando endereço oficial do perfil: ${profileAddress}`
          );
          coords = await geocodeAddress(profileAddress);
          if (coords) {
            latitude = coords.lat;
            longitude = coords.lon;
            console.log(
              `[ORQUESTRADOR] Geocodificação de fallback do perfil com sucesso -> Lat: ${latitude}, Lng: ${longitude}`
            );
          }
        }
      }
    }

    const hasLocationsArray = locations && Array.isArray(locations) && locations.length > 0;
    const isAreaTarget =
      locType === "País" ||
      locType === "Estado" ||
      (hasLocationsArray && locations.some((l: any) => l.type === "País" || l.type === "Estado"));

    if (hasLocationsArray) {
      const hasValidTarget = locations.some(
        (l: any) =>
          l.type === "País" ||
          l.type === "Estado" ||
          (typeof l.latitude === "number" && typeof l.longitude === "number")
      );
      if (!hasValidTarget) {
        throw new Error(
          "Nenhuma das localizações selecionadas possui coordenadas ou região válida."
        );
      }
    } else if (!isAreaTarget && (latitude === null || longitude === null)) {
      throw new Error(
        "Não conseguimos localizar o endereço de referência no mapa. Por favor, forneça um endereço mais detalhado contendo cidade e estado (Ex: Av. Paulista, 1000, São Paulo - SP)."
      );
    }

    // Configura a segmentação de geo-locations da Meta dinamicamente
    let geoLocations: any = {};

    if (hasLocationsArray) {
      const countries: string[] = [];
      const regions: { key: string }[] = [];
      const customLocations: any[] = [];

      for (const loc of locations) {
        const cleanKey = loc.key ? loc.key.replace(/^meta_\d+_\s*/, "") : "";
        if (loc.type === "País") {
          countries.push(cleanKey || "BR");
        } else if (loc.type === "Estado") {
          let stateKey = cleanKey;
          if (!stateKey || stateKey.startsWith("nom_") || stateKey.startsWith("nom_client_")) {
            const getMetaRegionKey = (stateName: string): string | null => {
              const normalized = stateName
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
              const stateMap: Record<string, string> = {
                acre: "480",
                ac: "480",
                alagoas: "481",
                al: "481",
                amazonas: "482",
                am: "482",
                amapa: "483",
                ap: "483",
                bahia: "484",
                ba: "484",
                ceara: "485",
                ce: "485",
                "distrito federal": "486",
                df: "486",
                "espirito santo": "487",
                es: "487",
                goias: "488",
                go: "488",
                maranhao: "489",
                ma: "489",
                "minas gerais": "490",
                mg: "490",
                "mato grosso do sul": "491",
                ms: "491",
                "mato grosso": "492",
                mt: "492",
                para: "493",
                pa: "493",
                paraiba: "494",
                pb: "494",
                pernambuco: "495",
                pe: "495",
                piaui: "496",
                pi: "496",
                parana: "497",
                pr: "497",
                "rio de janeiro": "498",
                rj: "498",
                "rio grande do norte": "499",
                rn: "499",
                rondonia: "500",
                ro: "500",
                roraima: "501",
                rr: "501",
                "rio grande do sul": "456",
                rs: "456",
                "santa catarina": "502",
                sc: "502",
                sergipe: "503",
                se: "503",
                "sao paulo": "504",
                sp: "504",
                tocantins: "505",
                to: "505",
              };
              for (const [key, value] of Object.entries(stateMap)) {
                if (normalized.includes(key)) return value;
              }
              return null;
            };
            stateKey = getMetaRegionKey(loc.name || "") || "456"; // default para RS se falhar
          }
          regions.push({ key: stateKey });
        } else {
          // Cidades, bairros, ruas e endereços entram como custom_locations (lat/lng + raio)
          if (typeof loc.latitude === "number" && typeof loc.longitude === "number") {
            customLocations.push({
              latitude: loc.latitude,
              longitude: loc.longitude,
              radius: loc.radiusKm || loc.radius || radiusKm || 5,
              distance_unit: "kilometer",
            });
          }
        }
      }

      if (countries.length > 0) geoLocations.countries = countries;
      if (regions.length > 0) geoLocations.regions = regions;
      if (customLocations.length > 0) geoLocations.custom_locations = customLocations;
    } else {
      // Fallback para comportamento de localização única (compatibilidade anterior)
      const cleanKey = locKey ? locKey.replace(/^meta_\d+_\s*/, "") : "";
      if (locType === "País") {
        geoLocations = {
          countries: [cleanKey || "BR"],
        };
      } else if (locType === "Estado") {
        let stateKey = cleanKey;
        if (!stateKey || stateKey.startsWith("nom_") || stateKey.startsWith("nom_client_")) {
          const getMetaRegionKey = (stateName: string): string | null => {
            const normalized = stateName
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            const stateMap: Record<string, string> = {
              acre: "480",
              ac: "480",
              alagoas: "481",
              al: "481",
              amazonas: "482",
              am: "482",
              amapa: "483",
              ap: "483",
              bahia: "484",
              ba: "484",
              ceara: "485",
              ce: "485",
              "distrito federal": "486",
              df: "486",
              "espirito santo": "487",
              es: "487",
              goias: "488",
              go: "488",
              maranhao: "489",
              ma: "489",
              "minas gerais": "490",
              mg: "490",
              "mato grosso do sul": "491",
              ms: "491",
              "mato grosso": "492",
              mt: "492",
              para: "493",
              pa: "493",
              paraiba: "494",
              pb: "494",
              pernambuco: "495",
              pe: "495",
              piaui: "496",
              pi: "496",
              parana: "497",
              pr: "497",
              "rio de janeiro": "498",
              rj: "498",
              "rio grande do norte": "499",
              rn: "499",
              rondonia: "500",
              ro: "500",
              roraima: "501",
              rr: "501",
              "rio grande do sul": "456",
              rs: "456",
              "santa catarina": "502",
              sc: "502",
              sergipe: "503",
              se: "503",
              "sao paulo": "504",
              sp: "504",
              tocantins: "505",
              to: "505",
            };
            for (const [key, value] of Object.entries(stateMap)) {
              if (normalized.includes(key)) return value;
            }
            return null;
          };
          stateKey = getMetaRegionKey(address || "") || "456";
        }
        geoLocations = {
          regions: [
            {
              key: stateKey,
            },
          ],
        };
      } else {
        if (latitude !== null && longitude !== null) {
          geoLocations = {
            custom_locations: [
              {
                latitude: latitude,
                longitude: longitude,
                radius: radiusKm || 5,
                distance_unit: "kilometer",
              },
            ],
          };
        }
      }
    }

    // Configura a segmentação da Meta
    const metaTargeting: any = {
      geo_locations: geoLocations,
      age_min: ageMin || 18,
      age_max: ageMax || 65,
      genders: gender === "male" ? [1] : gender === "female" ? [2] : [1, 2],
      targeting_automation: {
        advantage_audience: 0,
      },
    };

    if (interests && Array.isArray(interests) && interests.length > 0) {
      const flexibleGroup: any = {};

      interests.forEach((item: any) => {
        let key = "interests";
        const itemType = String(item.type || "").toLowerCase();

        if (itemType.includes("comportamento") || itemType.includes("behavior")) {
          key = "behaviors";
        } else if (
          itemType.includes("demográfico") ||
          itemType.includes("demographic") ||
          itemType === "demografia" ||
          itemType === "dados demográficos"
        ) {
          key = "demographics";
        } else if (itemType.includes("relevante") || itemType.includes("life_event")) {
          key = "life_events";
        }

        if (!flexibleGroup[key]) {
          flexibleGroup[key] = [];
        }

        flexibleGroup[key].push({
          id: item.id,
          name: item.name,
        });
      });

      metaTargeting.flexible_spec = [flexibleGroup];
    }

    const adSetUrl = `https://graph.facebook.com/v24.0/${cleanAdAccountId}/adsets`;

    // Orçamento diário na Meta é em centavos (mínimo R$ 6 por dia)
    const dailyBudgetCents = Math.round(budget.amount * 100);

    // Configura datas de duração da campanha para capping automático de verba e segurança do usuário
    const days = parseInt(durationDays) || 7;
    const startTime = new Date(Date.now() + 60000 * 2); // Inicia em 2 minutos
    const endTime = new Date(startTime.getTime() + days * 24 * 60 * 60 * 1000);
    const startTimeStr = startTime.toISOString();
    const endTimeStr = endTime.toISOString();

    // WhatsApp usa CONVERSATIONS como goal (otimiza para iniciar conversas).
    // Tráfego usa LINK_CLICKS, Alcance usa REACH.
    const optimizationGoal = isWhatsApp ? "CONVERSATIONS" : isTraffic ? "LINK_CLICKS" : "REACH";

    const adSetParamsObj: Record<string, string> = {
      name: adSetName,
      campaign_id: createdCampaignId!,
      daily_budget: dailyBudgetCents.toString(),
      billing_event: "IMPRESSIONS",
      optimization_goal: optimizationGoal,
      bid_strategy: "LOWEST_COST_WITHOUT_CAP", // Força lance automático sem limite
      start_time: startTimeStr,
      end_time: endTimeStr,
      targeting: JSON.stringify(metaTargeting),
      status: "PAUSED",
      access_token: metaConnection.accessToken,
    };

    // Para campanhas de Tráfego ou WhatsApp, configuramos o destination_type e promoted_object correspondente
    if (isTraffic) {
      adSetParamsObj.destination_type = "WEBSITE";
    } else if (isWhatsApp) {
      adSetParamsObj.destination_type = "WHATSAPP";
      adSetParamsObj.promoted_object = JSON.stringify({
        page_id: pageId,
      });
    }

    const adSetParams = new URLSearchParams(adSetParamsObj);

    const adSetResponse = await fetch(adSetUrl, {
      method: "POST",
      body: adSetParams,
    });

    const adSetData = await adSetResponse.json();
    if (!adSetResponse.ok) {
      console.error("[ORQUESTRADOR] Erro no Ad Set:", adSetData.error);
      throw new Error(
        adSetData.error?.error_user_msg ||
          adSetData.error?.message ||
          "Erro ao criar conjunto de anúncios na Meta."
      );
    }

    createdAdSetId = adSetData.id;
    console.log(`[ORQUESTRADOR] Ad Set criado: ${createdAdSetId}`);

    // ==========================================
    // ETAPA 3: UPLOAD DA IMAGEM PARA A META
    // ==========================================
    console.log("[ORQUESTRADOR] Passo 3: Fazendo upload do criativo de imagem...");
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error("Não foi possível transferir a imagem do post para carregar na Meta.");
    }
    const imageBlob = await imageRes.blob();

    const uploadFormData = new FormData();
    uploadFormData.append("filename", imageBlob, "ad_image.jpg");
    uploadFormData.append("access_token", metaConnection.accessToken);

    const uploadUrl = `https://graph.facebook.com/v24.0/${cleanAdAccountId}/adimages`;
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: uploadFormData,
    });

    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok) {
      console.error("[ORQUESTRADOR] Erro no upload da imagem:", uploadData.error);
      throw new Error(uploadData.error?.message || "Erro no upload do criativo de imagem na Meta.");
    }

    const imageHash = (Object.values(uploadData.images)?.[0] as any)?.hash;
    if (!imageHash) {
      throw new Error("O hash da imagem carregada não foi gerado pela Meta.");
    }
    console.log(`[ORQUESTRADOR] Hash da imagem gerado: ${imageHash}`);

    // ==========================================
    // ETAPA 4: CRIAR CRIATIVO DE ANÚNCIO (AD CREATIVE)
    // ==========================================
    console.log("[ORQUESTRADOR] Passo 4: Criando Ad Creative estruturado...");
    const creativeUrl = `https://graph.facebook.com/v24.0/${cleanAdAccountId}/adcreatives`;

    let callToAction: any = null;
    let creativeLink = ctaLink || `https://facebook.com/${pageId}`;

    // Configura o Call to Action com base nas regras rígidas de objetivos e faturamento da Meta
    if (isWhatsApp) {
      // Click-to-WhatsApp: usa CTA tipo WHATSAPP_MESSAGE com app_destination WHATSAPP.
      // O link obrigatório deve ser https://api.whatsapp.com/send (exigência da Meta).
      // O número de WhatsApp usado é o que está vinculado à Página automaticamente.
      callToAction = {
        type: "WHATSAPP_MESSAGE",
        value: {
          app_destination: "WHATSAPP",
        },
      };
      creativeLink = "https://api.whatsapp.com/send";
    } else if (ctaType === "CALL_NOW") {
      // Regra de CALL_NOW da Meta:
      // O link de CTA no CALL_NOW não aceita URL no value.link, deve ser configurado apenas phone_number.
      // E o link_data.link geral da imagem deve ser uma URL de fallback válida.
      let formattedPhone = ctaLink || profileData?.phone || "";
      formattedPhone = formattedPhone.replace(/\D/g, "");

      // Garante formatação internacional com DDI brasileiro (+55)
      if (formattedPhone) {
        if (formattedPhone.startsWith("55")) {
          formattedPhone = `+${formattedPhone}`;
        } else {
          formattedPhone = `+55${formattedPhone}`;
        }
      } else {
        formattedPhone = "+555199922177";
      }

      callToAction = {
        type: "CALL_NOW",
        value: {
          phone_number: formattedPhone,
        },
      };
      // Link de fallback da imagem no anúncio de ligar
      creativeLink = profileData?.website || `https://facebook.com/${pageId}`;
    } else if (ctaType === "GET_DIRECTIONS") {
      // Regra de GET_DIRECTIONS:
      // Redireciona diretamente para o endereço geocodificado no Google Maps
      const mapAddress = address || profileAddress || "Centro Comercial Local, Brasil";
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}`;

      callToAction = {
        type: "GET_DIRECTIONS",
        value: {
          link: mapUrl,
        },
      };
      creativeLink = mapUrl;
    } else if (ctaType && ctaType !== "NONE") {
      // Regra padrão de links (LEARN_MORE / SHOP_NOW etc.)
      callToAction = {
        type: ctaType || "LEARN_MORE",
        value: {
          link: creativeLink,
        },
      };
    }

    // Estrutura do post com base na existência de CTA / Link de destino
    const objectStorySpec: any = {
      page_id: pageId,
    };

    // Inclui Instagram Actor ID para exibir o anúncio no Instagram
    if (instagramActorId) {
      objectStorySpec.instagram_actor_id = instagramActorId;
    }

    if (ctaType === "NONE" && !isWhatsApp) {
      // Post de Imagem puro (Sem botão, sem link de destino na Meta)
      // WhatsApp NUNCA entra aqui — sempre precisa de link_data com CTA
      objectStorySpec.photo_data = {
        image_hash: imageHash,
        caption: bodyText || "",
      };
    } else {
      // Post de Link padrão (Com botão e link de destino)
      objectStorySpec.link_data = {
        image_hash: imageHash,
        link: creativeLink,
        message: bodyText,
      };

      // Inclui headline se fornecido
      if (headline) {
        objectStorySpec.link_data.name = headline;
      }

      if (callToAction) {
        objectStorySpec.link_data.call_to_action = callToAction;
      }
    }

    const creativeParams = new URLSearchParams({
      name: `${adNameText} - Criativo`,
      object_story_spec: JSON.stringify(objectStorySpec),
      access_token: metaConnection.accessToken,
    });

    let creativeResponse = await fetch(creativeUrl, {
      method: "POST",
      body: creativeParams,
    });

    let creativeData = await creativeResponse.json();

    // Resiliência para erro de instagram_actor_id
    if (!creativeResponse.ok && creativeData.error?.message?.includes("instagram_actor_id")) {
      console.warn(
        "[ORQUESTRADOR] Falha devido a instagram_actor_id. Tentando publicação de fallback sem vincular ID do Instagram..."
      );

      // Remove instagram_actor_id e tenta novamente
      if (objectStorySpec.instagram_actor_id) {
        delete objectStorySpec.instagram_actor_id;

        const retryParams = new URLSearchParams({
          name: `${adNameText} - Criativo (Fallback)`,
          object_story_spec: JSON.stringify(objectStorySpec),
          access_token: metaConnection.accessToken,
        });

        creativeResponse = await fetch(creativeUrl, {
          method: "POST",
          body: retryParams,
        });

        creativeData = await creativeResponse.json();
      }
    }

    if (!creativeResponse.ok) {
      console.error("[ORQUESTRADOR] Erro no Creative:", creativeData.error);
      throw new Error(
        creativeData.error?.error_user_msg ||
          creativeData.error?.message ||
          "Erro ao criar criativo do anúncio na Meta."
      );
    }

    createdCreativeId = creativeData.id;
    console.log(`[ORQUESTRADOR] Ad Creative criado: ${createdCreativeId}`);

    // ==========================================
    // ETAPA 5: CRIAR ANÚNCIO FINAL (AD)
    // ==========================================
    console.log("[ORQUESTRADOR] Passo 5: Criando anúncio final...");
    const adUrl = `https://graph.facebook.com/v24.0/${cleanAdAccountId}/ads`;

    const adParams = new URLSearchParams({
      name: adNameText,
      adset_id: createdAdSetId!,
      creative: JSON.stringify({ creative_id: createdCreativeId! }),
      status: "ACTIVE", // Cria o anúncio ativado dentro das estruturas
      access_token: metaConnection.accessToken,
    });

    const adResponse = await fetch(adUrl, {
      method: "POST",
      body: adParams,
    });

    const adData = await adResponse.json();
    if (!adResponse.ok) {
      console.error("[ORQUESTRADOR] Erro no anúncio final:", adData.error);
      throw new Error(
        adData.error?.error_user_msg || adData.error?.message || "Erro ao publicar anúncio na Meta."
      );
    }

    createdAdId = adData.id;
    console.log(`[ORQUESTRADOR] Anúncio publicado com ID: ${createdAdId}`);

    // ==========================================
    // ETAPA 6: COLOCAR CONJUNTO E CAMPANHA NO AR!
    // ==========================================
    console.log("[ORQUESTRADOR] Passo 6: Ativando campanha e conjunto de anúncios...");

    // Ativa o AdSet
    await fetch(`https://graph.facebook.com/v24.0/${createdAdSetId}`, {
      method: "POST",
      body: new URLSearchParams({
        status: "ACTIVE",
        access_token: metaConnection.accessToken,
      }),
    });

    // Ativa a Campanha
    await fetch(`https://graph.facebook.com/v24.0/${createdCampaignId}`, {
      method: "POST",
      body: new URLSearchParams({
        status: "ACTIVE",
        access_token: metaConnection.accessToken,
      }),
    });

    console.log("[ORQUESTRADOR] Publicação completa ativada e no ar!");

    return NextResponse.json({
      success: true,
      metaCampaignId: createdCampaignId,
      metaAdSetId: createdAdSetId,
      metaAdId: createdAdId,
      metaCreativeId: createdCreativeId,
      adAccountId: adAccountId,
    });
  } catch (error: any) {
    console.error("[ORQUESTRADOR] Erro geral na publicação, iniciando rollback...", error.message);

    // Rollback para evitar que estruturas órfãs gerem cobranças
    const metaConnection = await getMetaConnectionAdmin(await getUidFromCookie()).catch(() => null);
    if (metaConnection?.accessToken) {
      const token = metaConnection.accessToken;
      if (createdAdId) {
        await fetch(`https://graph.facebook.com/v24.0/${createdAdId}?access_token=${token}`, {
          method: "DELETE",
        }).catch(() => null);
      }
      if (createdAdSetId) {
        await fetch(`https://graph.facebook.com/v24.0/${createdAdSetId}?access_token=${token}`, {
          method: "DELETE",
        }).catch(() => null);
      }
      if (createdCampaignId) {
        await fetch(`https://graph.facebook.com/v24.0/${createdCampaignId}?access_token=${token}`, {
          method: "DELETE",
        }).catch(() => null);
      }
    }

    return NextResponse.json(
      { success: false, error: error.message || "Erro inesperado ao criar estrutura do anúncio." },
      { status: 500 }
    );
  }
}

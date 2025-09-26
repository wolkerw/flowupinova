'use server';

import { fetchGraphAPI } from "./meta-service";

const GRAPH_API_VERSION = "v20.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;


// 1. Criar Campanha
export async function createCampaign(adAccountId: string, accessToken: string, objective: string): Promise<string> {
    const url = `${GRAPH_API_URL}/${adAccountId}/campaigns`;
    const body = new URLSearchParams({
        name: `Campanha FlowUp - ${objective} - ${new Date().toLocaleDateString()}`,
        objective: objective,
        status: 'PAUSED', // Começa pausada para configurar o resto
        special_ad_categories: '[]'
    });

    const data = await fetchGraphAPI(url, accessToken, 'Criar Campanha', 'POST', body);
    if (!data.id) throw new Error('Falha ao obter o ID da campanha.');
    console.log(`[ADS_SERVICE] Campanha criada: ${data.id}`);
    return data.id;
}

// 2. Criar Ad Set
export async function createAdSet(adAccountId: string, accessToken: string, campaignId: string, budget: any, audience: any, campaignObjective: string): Promise<string> {
    const url = `${GRAPH_API_URL}/${adAccountId}/adsets`;
    
    const targeting = {
        geo_locations: { countries: [audience.location || 'BR'] },
        age_min: audience.ageMin || 18,
        age_max: audience.ageMax || 65,
    };

    let optimizationGoal = 'LINK_CLICKS'; // Default
    if (campaignObjective === 'OUTCOME_AWARENESS') {
        optimizationGoal = 'REACH';
    } else if (campaignObjective === 'OUTCOME_SALES') {
        optimizationGoal = 'OFFSITE_CONVERSIONS'; // Para vendas, o objetivo de otimização geralmente é esse
    }

    const body = new URLSearchParams({
        name: `AdSet FlowUp - ${new Date().toLocaleTimeString()}`,
        campaign_id: campaignId,
        daily_budget: (budget.daily * 100).toString(), // Orçamento em centavos
        billing_event: 'IMPRESSIONS',
        optimization_goal: optimizationGoal,
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP', // Estratégia de lance automático
        start_time: budget.startDate || new Date().toISOString(),
        targeting: JSON.stringify(targeting),
        status: 'PAUSED',
    });

    const data = await fetchGraphAPI(url, accessToken, 'Criar Ad Set', 'POST', body);
    if (!data.id) throw new Error('Falha ao obter o ID do Ad Set.');
    console.log(`[ADS_SERVICE] Ad Set criado: ${data.id}`);
    return data.id;
}


// 3. Criar Ad Creative (já tínhamos algo parecido)
export async function createAdCreative(adAccountId: string, accessToken: string, pageId: string, message: string, link: string, imageHash: string): Promise<string> {
    const url = `${GRAPH_API_URL}/${adAccountId}/adcreatives`;
    const objectStorySpec = {
        page_id: pageId,
        link_data: {
            link: link,
            message: message,
            image_hash: imageHash,
        },
    };

    const body = new URLSearchParams({
        name: `Criativo FlowUp - ${new Date().toISOString()}`,
        object_story_spec: JSON.stringify(objectStorySpec),
    });

    const data = await fetchGraphAPI(url, accessToken, 'Criar Ad Creative', 'POST', body);
    if (!data.id) throw new Error('Falha ao obter o ID do criativo.');
    console.log(`[ADS_SERVICE] Criativo criado: ${data.id}`);
    return data.id;
}


// 4. Criar Anúncio
export async function createAd(adAccountId: string, accessToken: string, adSetId: string, creativeId: string): Promise<string> {
    const url = `${GRAPH_API_URL}/${adAccountId}/ads`;
    const body = new URLSearchParams({
        name: `Anúncio FlowUp - ${new Date().toISOString()}`,
        adset_id: adSetId,
        creative: JSON.stringify({ creative_id: creativeId }),
        status: 'PAUSED',
    });

    const data = await fetchGraphAPI(url, accessToken, 'Criar Anúncio', 'POST', body);
    if (!data.id) throw new Error('Falha ao obter o ID do anúncio.');
    console.log(`[ADS_SERVICE] Anúncio criado: ${data.id}`);
    return data.id;
}

// 5. Ativar o anúncio
export async function publishAd(adId: string, accessToken: string): Promise<boolean> {
    const url = `${GRAPH_API_URL}/${adId}`;
    const body = new URLSearchParams({
        status: 'ACTIVE',
    });

    const data = await fetchGraphAPI(url, accessToken, 'Publicar Anúncio', 'POST', body);
    console.log(`[ADS_SERVICE] Anúncio ${adId} publicado:`, data);
    return data.success || false;
}

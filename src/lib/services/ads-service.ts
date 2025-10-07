
'use server';

import { fetchGraphAPI } from "./meta-service";

const GRAPH_API_VERSION = "v20.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Creates a new advertising campaign.
 * @param adAccountId The ad account ID (e.g., act_123...).
 * @param accessToken The USER access token.
 * @param objective The campaign objective (e.g., OUTCOME_TRAFFIC).
 * @returns The ID of the newly created campaign.
 */
export async function createCampaign(adAccountId: string, accessToken: string, objective: string): Promise<string> {
    const url = `${GRAPH_API_URL}/${adAccountId}/campaigns`;
    const body = new URLSearchParams({
        name: `FlowUp Campaign - ${objective} - ${new Date().toLocaleDateString()}`,
        objective: objective,
        status: 'PAUSED', // Start paused to configure ad sets and ads.
        special_ad_categories: '[]'
    });

    const data = await fetchGraphAPI(url, accessToken, 'Create Campaign', 'POST', body);
    if (!data.id) throw new Error('Failed to get campaign ID.');
    console.log(`[ADS_SERVICE] Campaign created: ${data.id}`);
    return data.id;
}

/**
 * Creates a new ad set within a campaign.
 * @param adAccountId The ad account ID.
 * @param accessToken The USER access token.
 * @param campaignId The ID of the parent campaign.
 * @param budget The budget details (e.g., { daily: 50 }).
 * @param audience The audience targeting details.
 * @returns The ID of the newly created ad set.
 */
export async function createAdSet(adAccountId: string, accessToken: string, campaignId: string, budget: any, audience: any, objective: string): Promise<string> {
    const url = `${GRAPH_API_URL}/${adAccountId}/adsets`;
    
    const targeting = {
        geo_locations: { countries: [audience.location || 'BR'] },
        age_min: audience.ageMin || 18,
        age_max: audience.ageMax || 65,
        publisher_platforms: ["facebook", "instagram"],
        facebook_positions: ["feed"],
        instagram_positions: ["stream"],
    };

    let optimizationGoal = 'LINK_CLICKS';
    if (objective === 'OUTCOME_AWARENESS') {
        optimizationGoal = 'REACH';
    } else if (objective === 'OUTCOME_SALES') {
        optimizationGoal = 'OFFSITE_CONVERSIONS';
    }

    const body = new URLSearchParams({
        name: `FlowUp Ad Set - ${new Date().toLocaleTimeString()}`,
        campaign_id: campaignId,
        daily_budget: (budget.daily * 100).toString(), // Budget in cents
        billing_event: 'IMPRESSIONS',
        optimization_goal: optimizationGoal,
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        start_time: budget.startDate || new Date().toISOString(),
        targeting: JSON.stringify(targeting),
        status: 'PAUSED',
    });

    const data = await fetchGraphAPI(url, accessToken, 'Create Ad Set', 'POST', body);
    if (!data.id) throw new Error('Failed to get Ad Set ID.');
    console.log(`[ADS_SERVICE] Ad Set created: ${data.id}`);
    return data.id;
}

/**
 * Creates an ad creative.
 * @param adAccountId The ad account ID.
 * @param accessToken The USER access token.
 * @param pageId The Facebook Page ID to associate the ad with.
 * @param message The primary text of the ad.
 * @param link The destination URL.
 * @param imageHash The hash of the uploaded ad image.
 * @returns The ID of the newly created ad creative.
 */
export async function createAdCreative(adAccountId: string, accessToken: string, pageId: string, message: string, link: string, imageHash: string): Promise<string> {
    const url = `${GRAPH_API_URL}/${adAccountId}/adcreatives`;
    const objectStorySpec = {
        page_id: pageId,
        link_data: {
            link: link,
            message: message,
            image_hash: imageHash,
            call_to_action: { type: 'LEARN_MORE' }
        },
    };

    const body = new URLSearchParams({
        name: `FlowUp Creative - ${new Date().toISOString()}`,
        object_story_spec: JSON.stringify(objectStorySpec),
    });

    const data = await fetchGraphAPI(url, accessToken, 'Create Ad Creative', 'POST', body);
    if (!data.id) throw new Error('Failed to get creative ID.');
    console.log(`[ADS_SERVICE] Creative created: ${data.id}`);
    return data.id;
}

/**
 * Creates an ad.
 * @param adAccountId The ad account ID.
 * @param accessToken The USER access token.
 * @param adSetId The ID of the parent ad set.
 * @param creativeId The ID of the ad creative.
 * @returns The ID of the newly created ad.
 */
export async function createAd(adAccountId: string, accessToken: string, adSetId: string, creativeId: string): Promise<string> {
    const url = `${GRAPH_API_URL}/${adAccountId}/ads`;
    const body = new URLSearchParams({
        name: `FlowUp Ad - ${new Date().toISOString()}`,
        adset_id: adSetId,
        creative: JSON.stringify({ creative_id: creativeId }),
        status: 'PAUSED',
    });

    const data = await fetchGraphAPI(url, accessToken, 'Create Ad', 'POST', body);
    if (!data.id) throw new Error('Failed to get ad ID.');
    console.log(`[ADS_SERVICE] Ad created: ${data.id}`);
    return data.id;
}

/**
 * Publishes a campaign and its contents by setting their status to ACTIVE.
 * This should be one of the final steps.
 * @param campaignId The ID of the campaign to publish.
 * @param accessToken The USER access token.
 * @returns True if successful.
 */
export async function publishCampaign(campaignId: string, accessToken: string): Promise<boolean> {
    const url = `${GRAPH_API_URL}/${campaignId}`;
    const body = new URLSearchParams({ status: 'ACTIVE' });

    const data = await fetchGraphAPI(url, accessToken, 'Publish Campaign', 'POST', body);
    console.log(`[ADS_SERVICE] Campaign ${campaignId} published:`, data);
    return data.success || false;
}


// As funções relacionadas a anúncios foram desativadas e esvaziadas.

export async function createCampaign(adAccountId: string, accessToken: string, objective: string): Promise<string> {
    console.warn("A funcionalidade de anúncios foi desativada.");
    return "";
}

export async function createAdSet(adAccountId: string, accessToken: string, campaignId: string, budget: any, audience: any, objective: string): Promise<string> {
    console.warn("A funcionalidade de anúncios foi desativada.");
    return "";
}

export async function createAdCreative(adAccountId: string, accessToken: string, pageId: string, message: string, link: string, imageHash: string): Promise<string> {
    console.warn("A funcionalidade de anúncios foi desativada.");
    return "";
}

export async function createAd(adAccountId: string, accessToken: string, adSetId: string, creativeId: string): Promise<string> {
    console.warn("A funcionalidade de anúncios foi desativada.");
    return "";
}

export async function publishCampaign(campaignId: string, accessToken: string): Promise<boolean> {
    console.warn("A funcionalidade de anúncios foi desativada.");
    return false;
}


// src/app/api/ads/accounts/route.ts

import { getMetaConnection, fetchGraphAPI } from "@/lib/services/meta-service";
import { NextResponse, type NextRequest } from "next/server";

const GRAPH_API_VERSION = "v20.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface AdAccount {
    id: string;
    account_id: string;
    name: string;
    account_status: number;
}

export async function GET(request: NextRequest) {
    try {
        const metaConnection = await getMetaConnection();
        if (!metaConnection.isConnected || !metaConnection.pageToken) {
            throw new Error("Conexão com a Meta não está ativa ou o token de acesso não está disponível.");
        }
        const accessToken = metaConnection.pageToken;

        // 1. Listar Ad Accounts pessoais
        const personalAccountsUrl = `${GRAPH_API_URL}/me/adaccounts?fields=id,account_id,name,account_status`;
        const personalAccountsData = await fetchGraphAPI(personalAccountsUrl, accessToken, "Listar Contas de Anúncio Pessoais");
        let allAdAccounts: AdAccount[] = personalAccountsData.data || [];

        // 2. Listar Business Managers
        const businessesUrl = `${GRAPH_API_URL}/me/businesses?fields=id,name`;
        const businessesData = await fetchGraphAPI(businessesUrl, accessToken, "Listar Business Managers");
        const businesses = businessesData.data || [];
        
        // 3. Para cada BM, listar contas de anúncio (owned e client)
        for (const business of businesses) {
            const ownedAccountsUrl = `${GRAPH_API_URL}/${business.id}/owned_ad_accounts?fields=id,account_id,name,account_status&limit=100`;
            const clientAccountsUrl = `${GRAPH_API_URL}/${business.id}/client_ad_accounts?fields=id,account_id,name,account_status&limit=100`;

            try {
                const [ownedAccountsData, clientAccountsData] = await Promise.all([
                    fetchGraphAPI(ownedAccountsUrl, accessToken, `Listar Contas Próprias do BM ${business.name}`),
                    fetchGraphAPI(clientAccountsUrl, accessToken, `Listar Contas de Cliente do BM ${business.name}`)
                ]);
                
                if (ownedAccountsData.data) allAdAccounts.push(...ownedAccountsData.data);
                if (clientAccountsData.data) allAdAccounts.push(...clientAccountsData.data);

            } catch (error: any) {
                 console.warn(`[WARN] Falha ao buscar contas para o BM ${business.name} (ID: ${business.id}): ${error.message}`);
                 // Continua para o próximo BM mesmo que um falhe
            }
        }
        
        // Remover duplicatas e filtrar apenas contas ativas (status 1)
        const uniqueAccounts = Array.from(new Map(allAdAccounts.map(item => [item.id, item])).values());
        const activeAccounts = uniqueAccounts.filter(acc => acc.account_status === 1);
        
        console.log(`[API_SUCCESS] Total de ${activeAccounts.length} contas de anúncio ativas encontradas.`);

        return NextResponse.json({
            success: true,
            accounts: activeAccounts,
        });

    } catch (error: any) {
        console.error("[ACCOUNTS_API_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

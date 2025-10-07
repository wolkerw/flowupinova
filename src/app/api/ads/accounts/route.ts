
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
        // **A CORREÇÃO PRINCIPAL ESTÁ AQUI**
        // Usar o userAccessToken para listar os BMs e as contas.
        const accessToken = metaConnection.userAccessToken;

        if (!metaConnection.isConnected || !accessToken) {
            throw new Error("Conexão com a Meta não está ativa ou o token de acesso de usuário não está disponível.");
        }
        
        let allAdAccounts: AdAccount[] = [];

        // 1. Listar Business Managers (BMs) aos quais o usuário tem acesso.
        // O endpoint /me/businesses requer um token de acesso de usuário.
        const businessesUrl = `${GRAPH_API_URL}/me/businesses?fields=id,name`;
        const businessesData = await fetchGraphAPI(businessesUrl, accessToken, "Listar Business Managers");
        const businesses = businessesData.data || [];
        
        // Se o usuário não tiver acesso a nenhum BM, tenta buscar contas de anúncio pessoais como fallback.
        if (businesses.length === 0) {
            console.log("[WARN] Nenhum Business Manager encontrado. Buscando contas de anúncio pessoais.");
            const personalAccountsUrl = `${GRAPH_API_URL}/me/adaccounts?fields=id,account_id,name,account_status&limit=100`;
            const personalAccountsData = await fetchGraphAPI(personalAccountsUrl, accessToken, "Listar Contas Pessoais");
            if (personalAccountsData.data) {
                allAdAccounts.push(...personalAccountsData.data);
            }
        } else {
            // 2. Para cada BM, listar as contas de anúncio (tanto as próprias quanto as de clientes).
            for (const business of businesses) {
                const ownedAccountsUrl = `${GRAPH_API_URL}/${business.id}/owned_ad_accounts?fields=id,account_id,name,account_status&limit=100`;
                const clientAccountsUrl = `${GRAPH_API_URL}/${business.id}/client_ad_accounts?fields=id,account_id,name,account_status&limit=100`;

                try {
                    // Importante: Usamos o mesmo userAccessToken para listar as contas dentro do BM.
                    const [ownedAccountsData, clientAccountsData] = await Promise.all([
                        fetchGraphAPI(ownedAccountsUrl, accessToken, `Listar Contas Próprias do BM ${business.name}`),
                        fetchGraphAPI(clientAccountsUrl, accessToken, `Listar Contas de Cliente do BM ${business.name}`)
                    ]);
                    
                    if (ownedAccountsData.data) allAdAccounts.push(...ownedAccountsData.data);
                    if (clientAccountsData.data) allAdAccounts.push(...clientAccountsData.data);

                } catch (error: any) {
                     console.warn(`[WARN] Falha ao buscar contas para o BM ${business.name} (ID: ${business.id}): ${error.message}`);
                     // Continua para o próximo BM mesmo que um falhe, para não interromper todo o processo.
                }
            }
        }
        
        // Remove duplicatas (uma conta pode aparecer em mais de uma chamada) e filtra apenas contas ativas (status 1).
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

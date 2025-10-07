
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
    const accessToken = metaConnection.userAccessToken;

    if (!metaConnection.isConnected || !accessToken) {
      throw new Error("Conexão com a Meta não está ativa ou o token de usuário não está disponível.");
    }

    // 1) Tenta primeiro as contas do usuário (caminho garantido p/ Ads)
    const adAccountsUrl = `${GRAPH_API_URL}/me/adaccounts?fields=id,account_id,name,account_status&limit=200`;
    const adAccountsData = await fetchGraphAPI(adAccountsUrl, accessToken, "List user adaccounts");
    let allAdAccounts: AdAccount[] = adAccountsData.data || [];

    // 2) Se vier vazio, tenta BM sem quebrar a rota
    if (allAdAccounts.length === 0) {
      try {
        const businessesUrl = `${GRAPH_API_URL}/me/businesses?fields=id,name`;
        const businessesData = await fetchGraphAPI(businessesUrl, accessToken, "List businesses");
        const businesses = businessesData.data || [];

        for (const b of businesses) {
          const ownedUrl  = `${GRAPH_API_URL}/${b.id}/owned_ad_accounts?fields=id,account_id,name,account_status&limit=200`;
          const clientUrl = `${GRAPH_API_URL}/${b.id}/client_ad_accounts?fields=id,account_id,name,account_status&limit=200`;

          const [owned, client] = await Promise.allSettled([
            fetchGraphAPI(ownedUrl, accessToken, `BM ${b.name} owned`),
            fetchGraphAPI(clientUrl, accessToken, `BM ${b.name} client`)
          ]);

          if (owned.status  === "fulfilled" && owned.value.data)  allAdAccounts.push(...owned.value.data);
          if (client.status === "fulfilled" && client.value.data) allAdAccounts.push(...client.value.data);
        }
      } catch (e: any) {
        console.warn("[WARN] BM listing failed but user adaccounts were empty:", e.message);
      }
    }

    // 3) Dedup + só ativas
    const unique = Array.from(new Map(allAdAccounts.map(a => [a.id, a])).values());
    const active = unique.filter(a => a.account_status === 1);

    return NextResponse.json({ success: true, accounts: active });
  } catch (error: any) {
    console.error("[ACCOUNTS_API_ERROR]", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

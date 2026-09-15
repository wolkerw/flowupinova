import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getMetaConnectionAdmin } from "@/lib/services/meta-service-admin";
import { parseMetaError, getAccountStatusInfo, type AccountStatusInfo } from "@/lib/utils/meta-error-mapper";

export interface EnrichedAdAccount {
  id: string;
  name: string;
  businessId?: string;
  accountStatus: number;
  currency?: string;
  statusInfo: AccountStatusInfo;
}

export async function GET(request: NextRequest) {
  try {
    const uid = await getUidFromCookie();
    const metaConnection = await getMetaConnectionAdmin(uid);

    if (!metaConnection.isConnected && !metaConnection.pending) {
      return NextResponse.json(
        { success: false, error: "Conexão com a Meta não configurada." },
        { status: 403 }
      );
    }

    const token = metaConnection.userAccessToken || metaConnection.accessToken;
    let allAccounts: EnrichedAdAccount[] = [];
    let accountsUrl: string | null =
      `https://graph.facebook.com/v24.0/me/adaccounts?fields=name,business,account_status,disable_reason,currency&limit=150&access_token=${token}`;

    while (accountsUrl) {
      const res: Response = await fetch(accountsUrl);
      const resData: any = await res.json();

      if (!res.ok) {
        console.error("[API_ADS_ACCOUNTS_GET] Meta API Error:", resData.error);
        const mappedError = parseMetaError(resData.error);
        return NextResponse.json(
          {
            success: false,
            error: mappedError.description,
            metaError: mappedError,
          },
          { status: res.status || 400 }
        );
      }

      if (resData.data) {
        allAccounts.push(
          ...resData.data.map((acc: any) => {
            const rawStatus = typeof acc.account_status === "number" ? acc.account_status : 1;
            const statusInfo = getAccountStatusInfo(rawStatus);
            return {
              id: acc.id,
              name: acc.name,
              businessId: acc.business?.id || "",
              accountStatus: rawStatus,
              currency: acc.currency || "BRL",
              statusInfo,
            };
          })
        );
      }

      accountsUrl = resData.paging?.next || null;
    }

    console.log(`[API_ADS_ACCOUNTS] Total accounts fetched from Meta: ${allAccounts.length}`);
    console.log(
      `[API_ADS_ACCOUNTS] Accounts:`,
      allAccounts.map((a) => `${a.name} (${a.id}) - ${a.statusInfo.statusText}`)
    );

    return NextResponse.json({ success: true, accounts: allAccounts });
  } catch (error: any) {
    console.error("[API_ADS_ACCOUNTS_GET] Error:", error.message);
    const mappedError = parseMetaError(error);
    return NextResponse.json(
      {
        success: false,
        error: mappedError.description,
        metaError: mappedError,
      },
      { status: 500 }
    );
  }
}

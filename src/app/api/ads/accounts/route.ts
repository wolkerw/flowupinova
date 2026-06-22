import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getMetaConnectionAdmin } from "@/lib/services/meta-service-admin";

export async function GET(request: NextRequest) {
  try {
    const uid = await getUidFromCookie();
    const metaConnection = await getMetaConnectionAdmin(uid);

    if (!metaConnection.isConnected && !metaConnection.pending) {
      return NextResponse.json(
        { success: false, error: "Meta account not connected." },
        { status: 403 }
      );
    }

    const token = metaConnection.userAccessToken || metaConnection.accessToken;
    let allAccounts: { id: string; name: string; businessId?: string }[] = [];
    let accountsUrl: string | null =
      `https://graph.facebook.com/v24.0/me/adaccounts?fields=name,business&limit=150&access_token=${token}`;

    while (accountsUrl) {
      const res: Response = await fetch(accountsUrl);
      const resData: any = await res.json();

      if (!res.ok) {
        console.error("[API_ADS_ACCOUNTS_GET] Meta API Error:", resData.error);
        throw new Error(resData.error?.message || "Failed to fetch ad accounts.");
      }

      if (resData.data) {
        allAccounts.push(
          ...resData.data.map((acc: any) => ({
            id: acc.id,
            name: acc.name,
            businessId: acc.business?.id || "",
          }))
        );
      }

      accountsUrl = resData.paging?.next || null;
    }

    console.log(`[API_ADS_ACCOUNTS] Total accounts fetched from Meta: ${allAccounts.length}`);
    console.log(
      `[API_ADS_ACCOUNTS] Accounts:`,
      allAccounts.map((a) => `${a.name} (${a.id})`)
    );

    return NextResponse.json({ success: true, accounts: allAccounts });
  } catch (error: any) {
    console.error("[API_ADS_ACCOUNTS_GET] Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

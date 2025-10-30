
import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getMetaConnection } from "@/lib/services/meta-service";

export async function GET(request: NextRequest) {
    try {
        const uid = await getUidFromCookie();
        const metaConnection = await getMetaConnection(uid);

        if (!metaConnection.isConnected || !metaConnection.accessToken) {
            return NextResponse.json({ success: false, error: "Meta account not connected." }, { status: 403 });
        }

        const url = `https://graph.facebook.com/v20.0/me/adaccounts?fields=name&access_token=${metaConnection.accessToken}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error("[API_ADS_ACCOUNTS_GET] Meta API Error:", data.error);
            throw new Error(data.error?.message || "Failed to fetch ad accounts.");
        }

        // A API retorna um objeto com uma propriedade 'data' que é o array de contas
        const accounts = data.data.map((acc: { id: string; name: string }) => ({
            id: acc.id,
            name: acc.name,
        }));

        return NextResponse.json({ success: true, accounts });

    } catch (error: any) {
        console.error("[API_ADS_ACCOUNTS_GET] Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

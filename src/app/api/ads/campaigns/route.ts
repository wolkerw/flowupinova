
import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getMetaConnection } from "@/lib/services/meta-service";

const AD_ACCOUNT_ID = "1537973740074338"; // Hardcoded for now

export async function POST(request: NextRequest) {
    try {
        const uid = await getUidFromCookie();
        const metaConnection = await getMetaConnection(uid);

        if (!metaConnection.isConnected || !metaConnection.accessToken) {
            return NextResponse.json({ success: false, error: "Meta account not connected." }, { status: 403 });
        }

        const body = await request.json();
        const { name, objective } = body;

        if (!name || !objective) {
            return NextResponse.json({ success: false, error: "Name and objective are required." }, { status: 400 });
        }

        const url = `https://graph.facebook.com/v24.0/act_${AD_ACCOUNT_ID}/campaigns`;
        const params = new URLSearchParams({
            name,
            objective,
            status: 'PAUSED', // Campaigns are always created as paused
            special_ad_categories: '[]', // Required field
            access_token: metaConnection.accessToken,
        });

        const response = await fetch(url, {
            method: 'POST',
            body: params
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[API_ADS_CAMPAIGNS_POST] Meta API Error:", data.error);
            throw new Error(data.error?.error_user_msg || data.error?.message || "Failed to create campaign.");
        }

        return NextResponse.json({ success: true, id: data.id });

    } catch (error: any) {
        console.error("[API_ADS_CAMPAIGNS_POST] Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

    

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
        const { name, campaign_id, daily_budget, targeting } = body;

        if (!name || !campaign_id || !daily_budget || !targeting) {
            return NextResponse.json({ success: false, error: "name, campaign_id, daily_budget, and targeting are required." }, { status: 400 });
        }

        const url = `https://graph.facebook.com/v24.0/act_${AD_ACCOUNT_ID}/adsets`;
        
        const params = new URLSearchParams({
            name,
            campaign_id,
            daily_budget: daily_budget.toString(),
            billing_event: 'IMPRESSIONS', // Required for many objectives
            optimization_goal: 'REACH', // A safe default
            targeting: JSON.stringify(targeting),
            status: 'PAUSED',
            access_token: metaConnection.accessToken,
        });

        const response = await fetch(url, {
            method: 'POST',
            body: params
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[API_ADS_ADSETS_POST] Meta API Error:", data.error);
            throw new Error(data.error?.error_user_msg || data.error?.message || "Failed to create ad set.");
        }

        return NextResponse.json({ success: true, id: data.id });

    } catch (error: any) {
        console.error("[API_ADS_ADSETS_POST] Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie, adminDb } from "@/lib/firebase-admin";
import { getMetaConnectionAdmin } from "@/lib/services/meta-service-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const uid = await getUidFromCookie();
    const metaConnection = await getMetaConnectionAdmin(uid);

    if (!metaConnection.isConnected || !metaConnection.pageId) {
      return NextResponse.json({
        success: true,
        hasWhatsApp: false,
        error: "Meta page not connected.",
      });
    }

    const pageId = metaConnection.pageId;
    // Prefer Page Access Token for page-level queries, fall back to User Access Token
    const token = metaConnection.accessToken || metaConnection.userAccessToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No access token found." },
        { status: 401 }
      );
    }

    // Strategy: Query Page Call-to-Actions (CTAs).
    // The deprecated fields (has_whatsapp_number, whatsapp_number) on the Page node
    // are unreliable and return empty in the New Page Experience.
    // The WABA endpoints require whatsapp_business_management permission.
    //
    // However, the Page CTA endpoint reliably returns a CTA of type "WHATSAPP_MESSAGE"
    // with status "ACTIVE" when a WhatsApp number is connected to the page.
    // This only requires pages_read_engagement or similar permissions we already have.
    const ctaRes = await fetch(
      `https://graph.facebook.com/v24.0/${pageId}/call_to_actions?access_token=${token}`
    );
    const ctaData = await ctaRes.json();

    if (!ctaRes.ok) {
      console.error("[API_META_PAGE_WHATSAPP] CTA API Error:", ctaData.error);
      return NextResponse.json(
        {
          success: false,
          error: ctaData.error?.message || "Failed to query Page CTAs.",
        },
        { status: 500 }
      );
    }

    // Check if there is an active WhatsApp CTA
    const whatsappCta = ctaData.data?.find(
      (cta: any) => cta.type === "WHATSAPP_MESSAGE" && cta.status === "ACTIVE"
    );

    const hasWhatsApp = !!whatsappCta;

    // Fetch page name for display
    let pageName = metaConnection.pageName || "";
    if (!pageName) {
      try {
        const nameRes = await fetch(
          `https://graph.facebook.com/v24.0/${pageId}?fields=name&access_token=${token}`
        );
        const nameData = await nameRes.json();
        if (nameRes.ok && nameData.name) {
          pageName = nameData.name;
        }
      } catch {
        // Non-critical
      }
    }

    // Fetch business phone from the user's profile as a reference for the WhatsApp number
    // The Meta Graph API does not expose the actual WhatsApp number without whatsapp_business_management permission.
    // We use the business profile phone as a helpful hint since it's typically the same number.
    let businessPhone = "";
    try {
      const profileDoc = await adminDb
        .collection("users")
        .doc(uid)
        .collection("business")
        .doc("profile")
        .get();
      if (profileDoc.exists) {
        businessPhone = profileDoc.data()?.phone || "";
      }
    } catch {
      // Non-critical
    }

    // Build the page settings URL for the user to manage their WhatsApp
    const settingsUrl = `https://www.facebook.com/${pageId}/settings/?tab=whatsapp`;

    return NextResponse.json({
      success: true,
      hasWhatsApp,
      pageId,
      pageName,
      businessPhone,
      settingsUrl,
    });
  } catch (error: any) {
    console.error("[API_META_PAGE_WHATSAPP] General Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

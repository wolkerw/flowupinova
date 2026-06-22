import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { createGoogleAdsCampaign } from "@/lib/services/google-ads-service-admin";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      customerId,
      name,
      dailyBudget,
      headline1,
      headline2,
      headline3,
      description1,
      description2,
      keywords,
      postId,
      imageUrl,
      bodyText,
      durationDays,
    } = body;

    if (!userId || !customerId || !name || !dailyBudget) {
      return NextResponse.json(
        { success: false, error: "Parâmetros obrigatórios ausentes (userId, customerId, name, dailyBudget)." },
        { status: 400 }
      );
    }

    // 1. Invoca a criação da campanha no Google Ads (via API ou simulação)
    const adsResult = await createGoogleAdsCampaign(userId, customerId, {
      name,
      dailyBudget: Number(dailyBudget),
      headline1: headline1 || name,
      headline2: headline2 || "",
      headline3: headline3 || "",
      description1: description1 || bodyText || "",
      description2: description2 || "",
      keywords: keywords || [],
    });

    if (!adsResult || !adsResult.success) {
      throw new Error("Falha ao criar recursos da campanha no Google Ads.");
    }

    // 2. Registra a campanha criada na base de dados do Firestore
    const adCampaignRef = adminDb.collection("users").doc(userId).collection("ads").doc();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + Number(durationDays || 7));

    const campaignDbData = {
      userId,
      postId: postId || null,
      name,
      status: "active",
      platforms: ["google"],
      googleCampaignId: adsResult.campaignId || `gads-${Date.now()}`,
      googleCustomerId: customerId,
      creative: {
        headline: headline1 || name,
        bodyText: bodyText || description1 || "",
        imageUrl: imageUrl || "",
        ctaType: "LEARN_MORE",
      },
      budget: {
        type: "daily",
        amount: Number(dailyBudget),
        currency: "BRL",
      },
      durationDays: Number(durationDays || 7),
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      targeting: {
        address: "Raio de atuação local",
        radiusKm: 5,
        ageMin: 18,
        ageMax: 65,
        gender: "all",
        keywords: keywords || [],
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await adCampaignRef.set(campaignDbData);

    // Se o anúncio for baseado em um post, marca o post como impulsionado no Firestore
    if (postId) {
      try {
        await adminDb
          .collection("users")
          .doc(userId)
          .collection("posts")
          .doc(postId)
          .update({
            isBoosted: true,
            adCampaignId: adCampaignRef.id,
          });
      } catch (postErr) {
        console.warn("[GOOGLE_ADS_CAMPAIGN_ROUTE] Falha ao marcar post como impulsionado:", postErr);
      }
    }

    return NextResponse.json({
      success: true,
      campaignId: adCampaignRef.id,
      googleCampaignId: adsResult.campaignId,
    });
  } catch (error: any) {
    console.error("[GOOGLE_ADS_CAMPAIGN_ROUTE_ERROR] Erro na criação de campanha:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao processar criação de campanha." },
      { status: 500 }
    );
  }
}

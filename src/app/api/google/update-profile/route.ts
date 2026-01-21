
import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getAuthenticatedGoogleClient } from "@/lib/services/google-service-admin";
import { google } from "googleapis";

export async function POST(request: NextRequest) {
  try {
    const uid = await getUidFromCookie();
    const { locationName, updates } = await request.json();

    if (!locationName || !updates) {
      return NextResponse.json(
        { success: false, error: "Location name and updates are required." },
        { status: 400 }
      );
    }

    const oauth2Client = await getAuthenticatedGoogleClient(uid);
    const mybusinessbusinessinformation = google.mybusinessbusinessinformation({
      version: "v1",
      auth: oauth2Client,
    });

    const updateMask = Object.keys(updates)
      .map(key => key === 'website' ? 'websiteUri' : key) // Mapeia 'website' para 'websiteUri' se necessário
      .join(',');

    await mybusinessbusinessinformation.locations.patch({
      name: locationName,
      updateMask: "websiteUri", // Hardcoded para o teste inicial
      requestBody: updates,
    });

    return NextResponse.json({ success: true, message: "Profile updated successfully." });

  } catch (error: any) {
    console.error("[GOOGLE_UPDATE_PROFILE_ERROR]", error);
    const errorMessage = error.response?.data?.error?.message || error.message || "An unknown error occurred.";
    return NextResponse.json(
      { success: false, error: `Failed to update profile: ${errorMessage}` },
      { status: 500 }
    );
  }
}

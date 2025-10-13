
import { NextResponse, type NextRequest } from "next/server";
// Import FieldValue from the admin SDK
import { FieldValue } from "firebase-admin/firestore";

// Import admin SDK types
import type admin from 'firebase-admin';

// Helper function to initialize the Firebase Admin SDK
// This ensures it's only initialized once per server instance.
function initializeAdminApp() {
    // We need to use require here due to Next.js build quirks with firebase-admin
    const admin = require('firebase-admin');
    const serviceAccount = require('@/service-account.json');

    if (admin.apps.length > 0) {
        return admin.app();
    }
    
    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// Helper to get the admin firestore instance
function getAdminDb() {
    const adminApp = initializeAdminApp();
    return adminApp.firestore();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId } = body;

    if (!code || !userId) {
      return NextResponse.json(
        { success: false, error: "Authorization code or user ID not provided." },
        { status: 400 }
      );
    }
    
    const clientId = "826418333144156";
    const clientSecret = "944e053d34b162c13408cd00ad276aa2";
    const redirectUri = "https://9000-firebase-studio-1757951248950.cluster-57i2ylwve5fskth4xb2kui2ow2.cloudworkstations.dev/dashboard/conteudo";
    
    const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;
    
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Meta Token Exchange Error:", tokenData);
      throw new Error(tokenData.error?.message || "Falha ao obter token de acesso da Meta.");
    }
    
    const adminDb = getAdminDb();
    const metaConnectionRef = adminDb.doc(`users/${userId}/connections/meta`);
    
    // CORRECTED: Use FieldValue.serverTimestamp() from the admin SDK
    await metaConnectionRef.set({ 
        isConnected: true,
        connectedAt: FieldValue.serverTimestamp() 
    }, { merge: true });

    console.log(`Meta connection status updated for user ${userId}.`);

    return NextResponse.json({
      success: true,
      message: "Meta account connected and status updated.",
    });

  } catch (error: any) {
    console.error("[META_CALLBACK_ERROR]", error);
    // Firestore permission errors often have a specific code.
    if (error.code === 7 || (error.details && error.details.includes('PERMISSION_DENIED'))) {
         return NextResponse.json(
          { success: false, error: "7 PERMISSION_DENIED: Missing or insufficient permissions. Check your Firestore rules.", details: error.message },
          { status: 403 }
        );
    }
    return NextResponse.json(
      { success: false, error: error.message || "An unknown error occurred." },
      { status: 500 }
    );
  }
}

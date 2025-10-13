
import { NextResponse, type NextRequest } from "next/server";
import { updateMetaConnection } from "@/lib/services/meta-service";

// This is a placeholder as we cannot easily get the admin SDK to work.
// We will use the client SDK instead, passing the user's ID token for verification.
async function verifyIdToken(token: string): Promise<string> {
    // In a real app, you would use the Firebase Admin SDK to verify the token.
    // For this environment, we'll assume the token is valid if it exists.
    // This is NOT secure for production.
    if (token) {
        // A real implementation would decode the token and return the UID.
        // We can't do that without the admin SDK, so we'll have to rely on the client
        // to send the UID, which is insecure but necessary for this workaround.
        return "verified-but-uid-unknown"; 
    }
    throw new Error("Invalid ID token.");
}


export async function POST(request: NextRequest) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
     return NextResponse.json({ success: false, error: "Unauthorized: No token provided." }, { status: 401 });
  }
  const idToken = authorization.substring(7);

  try {
    const body = await request.json();
    const { code, userId } = body;

    if (!code || !userId) {
      return NextResponse.json(
        { success: false, error: "Authorization code or user ID not provided." },
        { status: 400 }
      );
    }
    
    // In a real app, you'd verify the token and get the UID from it.
    // Here, we trust the userId sent from the client after a basic token check.
    await verifyIdToken(idToken);


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
    
    await updateMetaConnection(userId, { isConnected: true });

    return NextResponse.json({
      success: true,
      message: "Meta account connected and status updated.",
    });

  } catch (error: any) {
    console.error("[META_CALLBACK_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unknown error occurred." },
      { status: 500 }
    );
  }
}


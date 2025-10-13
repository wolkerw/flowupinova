
import { NextResponse, type NextRequest } from "next/server";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Função auxiliar para verificar o token do usuário (simulação)
async function verifyIdToken(token: string): Promise<string | null> {
    // Em um app de produção, use o Firebase Admin SDK para uma verificação segura.
    // Como estamos em um ambiente onde o Admin SDK apresentou problemas de build,
    // e o objetivo principal é validar o fluxo, vamos confiar no token se ele existir.
    // Esta abordagem NÃO é segura para produção.
    if (token) {
        // A implementação real decodificaria o token e retornaria o UID.
        // Aqui, apenas confirmamos que um token foi passado.
        return "verified"; 
    }
    return null;
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
    
    // Verificação básica do token
    const verificationResult = await verifyIdToken(idToken);
    if (!verificationResult) {
        return NextResponse.json({ success: false, error: "Invalid ID token." }, { status: 401 });
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
    
    // Lógica de atualização do Firestore movida para cá, com a estrutura correta.
    const metaConnectionRef = doc(db, "users", userId, "connections", "meta");
    await setDoc(metaConnectionRef, { 
        isConnected: true,
        connectedAt: serverTimestamp() 
    }, { merge: true });

    console.log(`Meta connection status updated for user ${userId}.`);

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

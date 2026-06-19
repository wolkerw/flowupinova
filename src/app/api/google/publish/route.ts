import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie, adminDb } from "@/lib/firebase-admin";
import { getAuthenticatedGoogleClient } from "@/lib/services/google-service-admin";

export const dynamic = "force-dynamic";

interface PublishRequestBody {
  postData: {
    text: string;
    imageUrl?: string;
    userId?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    let uid: string | null = null;
    try {
      uid = await getUidFromCookie();
    } catch (e) {
      // Chamada em segundo plano (cron job) sem cookie de sessão
    }

    const body: PublishRequestBody = await request.json();
    const { postData } = body;

    const targetUid = uid || postData?.userId;

    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: "Identificação do usuário (UID) ausente ou inválida." },
        { status: 400 }
      );
    }

    if (!postData?.text) {
      return NextResponse.json(
        { success: false, error: "O texto da publicação é obrigatório." },
        { status: 400 }
      );
    }

    // 1. Carrega dados de conexão e perfil do Firestore
    const connRef = adminDb.collection("users").doc(targetUid).collection("connections").doc("google");
    const profileRef = adminDb.collection("users").doc(targetUid).collection("business").doc("profile");

    const [connDoc, profileDoc] = await Promise.all([connRef.get(), profileRef.get()]);

    if (!connDoc.exists) {
      return NextResponse.json(
        { success: false, error: "A conta Google do usuário não está conectada." },
        { status: 400 }
      );
    }

    if (!profileDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Perfil de negócios do usuário não encontrado." },
        { status: 400 }
      );
    }

    const accountId = connDoc.data()?.accountId;
    const googleName = profileDoc.data()?.googleName; // Formato: "locations/{locationId}"
    const website = profileDoc.data()?.website || profileDoc.data()?.instagram || "";

    if (!accountId || !googleName) {
      return NextResponse.json(
        { success: false, error: "Configuração do Google Meu Negócio incompleta. Verifique se o local foi selecionado." },
        { status: 400 }
      );
    }

    // 2. Autentica o cliente e gera token de acesso (efetua refresh automaticamente se expirado)
    const oauth2Client = await getAuthenticatedGoogleClient(targetUid);
    const { token } = await oauth2Client.getAccessToken();

    if (!token) {
      throw new Error("Não foi possível gerar um token de acesso válido com o Google.");
    }

    // 3. Monta a chamada para o endpoint localPosts v4 da API
    // Endpoint: accounts/{accountId}/locations/{locationId}/localPosts
    const googleApiUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/${googleName}/localPosts`;

    const postPayload: any = {
      languageCode: "pt-BR",
      summary: postData.text.slice(0, 1500), // Limite razoável para postagens do Google Meu Negócio
      topicType: "STANDARD",
    };

    // Imagem da publicação
    if (postData.imageUrl) {
      postPayload.media = [
        {
          mediaFormat: "PHOTO",
          sourceUrl: postData.imageUrl,
        },
      ];
    }

    // Botão de Call to Action (Saiba Mais redirecionando para o site do cliente)
    if (website) {
      const targetUrl = website.startsWith("http") ? website : `https://${website}`;
      postPayload.callToAction = {
        actionType: "LEARN_MORE",
        url: targetUrl,
      };
    }

    console.log(`[GOOGLE_PUBLISH] Enviando post para ${googleName}...`);
    const apiResponse = await fetch(googleApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postPayload),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("[GOOGLE_PUBLISH_API_ERROR]", errorText);
      let errorMessage = `Erro da API do Google Meu Negócio: ${apiResponse.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (parseErr) {
        // Ignora
      }
      throw new Error(errorMessage);
    }

    const resultData = await apiResponse.json();
    console.log("[GOOGLE_PUBLISH_SUCCESS] Post publicado no Google Meu Negócio:", resultData.name);

    return NextResponse.json({
      success: true,
      publishedMediaId: resultData.name, // ID completo retornado pelo Google
    });
  } catch (error: any) {
    console.error("[GOOGLE_PUBLISH_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro desconhecido ao publicar no Google." },
      { status: 500 }
    );
  }
}

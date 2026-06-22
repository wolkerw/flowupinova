import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { publishToGoogle } from "@/lib/services/publisher-service";

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

    const publishedMediaId = await publishToGoogle(targetUid, postData.text, postData.imageUrl);

    console.log("[GOOGLE_PUBLISH_SUCCESS] Post publicado no Google Meu Negócio:", publishedMediaId);

    return NextResponse.json({
      success: true,
      publishedMediaId,
    });
  } catch (error: any) {
    console.error("[GOOGLE_PUBLISH_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro desconhecido ao publicar no Google." },
      { status: 500 }
    );
  }
}

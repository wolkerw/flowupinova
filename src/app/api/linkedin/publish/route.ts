import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { publishToLinkedIn } from "@/lib/services/publisher-service";

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
      // Background call or token validation fallback
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

    const publishedMediaId = await publishToLinkedIn(
      targetUid,
      postData.text,
      postData.imageUrl
    );

    console.log("[LINKEDIN_PUBLISH_SUCCESS] Post publicado com sucesso no LinkedIn:", publishedMediaId);

    return NextResponse.json({
      success: true,
      publishedMediaId,
    });
  } catch (error: any) {
    console.error("[LINKEDIN_PUBLISH_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro desconhecido ao publicar no LinkedIn." },
      { status: 500 }
    );
  }
}

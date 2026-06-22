import { NextResponse, type NextRequest } from "next/server";
import { publishToInstagram } from "@/lib/services/publisher-service";

export const dynamic = "force-dynamic";

interface PublishRequestBody {
  postData: {
    text: string;
    imageUrls: string[];
    isCarousel: boolean;
    accessToken: string;
    instagramId: string;
    collaborators?: string[];
    userTags?: { username: string; x: number; y: number }[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const { postData }: PublishRequestBody = await request.json();

    if (
      !postData ||
      !postData.instagramId ||
      !postData.accessToken ||
      !postData.imageUrls ||
      postData.imageUrls.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "Dados da requisição incompletos." },
        { status: 400 }
      );
    }

    const publishedMediaId = await publishToInstagram(
      postData.instagramId,
      postData.accessToken,
      postData.imageUrls,
      postData.isCarousel,
      postData.text,
      postData.collaborators,
      postData.userTags
    );

    console.log(
      `[INSTAGRAM_V2_PUBLISH_SUCCESS] Mídia publicada com sucesso. Post ID: ${publishedMediaId}`
    );
    return NextResponse.json({ success: true, publishedMediaId: publishedMediaId });
  } catch (error: any) {
    const errorMessage = `[INSTAGRAM_V2_PUBLISH_ERROR] Mensagem: ${error.message}.`;
    console.error(errorMessage, { cause: error.cause, stack: error.stack });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

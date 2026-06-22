import { NextResponse, type NextRequest } from "next/server";
import { publishToFacebook } from "@/lib/services/publisher-service";

export const dynamic = "force-dynamic";

interface PublishRequestBody {
  postData: {
    text: string;
    imageUrl: string;
    metaConnection: {
      accessToken: string;
      pageId: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PublishRequestBody = await request.json();
    const { postData } = body;

    if (
      !postData ||
      !postData.metaConnection?.pageId ||
      !postData.metaConnection?.accessToken ||
      !postData.imageUrl
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados da requisição incompletos. Faltando ID da página, token, ou URL da imagem.",
        },
        { status: 400 }
      );
    }

    const caption = postData.text.slice(0, 2200);

    const publishedPostId = await publishToFacebook(
      postData.metaConnection.pageId,
      postData.metaConnection.accessToken,
      postData.imageUrl,
      caption
    );

    console.log(
      `[API_FB_PUBLISH] Foto publicada com sucesso na página ${postData.metaConnection.pageId}. Post ID: ${publishedPostId}`
    );

    return NextResponse.json({ success: true, publishedMediaId: publishedPostId });
  } catch (error: any) {
    console.error(`[FACEBOOK_PUBLISH_ERROR]`, error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

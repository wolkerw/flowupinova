
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

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

async function publishToFacebookPage(pageId: string, accessToken: string, imageUrl: string, caption: string): Promise<string> {
  const url = `https://graph.facebook.com/v20.0/${pageId}/photos`;
  const params = new URLSearchParams({
    url: imageUrl,
    caption: caption,
    access_token: accessToken,
  });

  const response = await fetch(`${url}?${params.toString()}`, { method: 'POST' });
  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error("[META_API_ERROR] Falha ao publicar na Página do Facebook:", data.error);
    throw new Error(data.error?.message || "Falha ao publicar a foto na Página do Facebook.");
  }

  return data.id; // Retorna o ID do post criado
}


export async function POST(request: NextRequest) {
    try {
        const body: PublishRequestBody = await request.json();
        const { postData } = body;
        
        if (!postData || !postData.metaConnection?.pageId || !postData.metaConnection?.accessToken || !postData.imageUrl) {
            return NextResponse.json({ success: false, error: "Dados da requisição incompletos. Faltando ID da página, token, ou URL da imagem." }, { status: 400 });
        }
        
        const caption = postData.text.slice(0, 2200); // Facebook has a higher limit, but let's be safe
        
        const publishedPostId = await publishToFacebookPage(
            postData.metaConnection.pageId,
            postData.metaConnection.accessToken,
            postData.imageUrl,
            caption
        );
        
        console.log(`[API_FB_PUBLISH] Foto publicada com sucesso na página ${postData.metaConnection.pageId}. Post ID: ${publishedPostId}`);

        return NextResponse.json({ success: true, publishedMediaId: publishedPostId });

    } catch (error: any) {
        console.error(`[FACEBOOK_PUBLISH_ERROR]`, error.message);
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
}

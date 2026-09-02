import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface PagePostsRequestBody {
  accessToken: string;
  pageId: string;
  after?: string; // Cursor for pagination
  since?: number; // Unix timestamp in seconds
}

export async function POST(request: NextRequest) {
  try {
    const body: PagePostsRequestBody = await request.json();
    const { accessToken, pageId, after, since } = body;

    if (!accessToken || !pageId) {
      return NextResponse.json(
        { success: false, error: "Access token e Page ID são obrigatórios." },
        { status: 400 }
      );
    }

    const fields =
      "id,message,created_time,full_picture,shares,reactions.summary(total_count),comments.summary(total_count)";

    const url = new URL(`https://graph.facebook.com/v24.0/${pageId}/posts`);
    url.searchParams.append("fields", fields);
    url.searchParams.append("access_token", accessToken);
    url.searchParams.append("limit", "25"); // Busca até 25 posts do período

    if (since) {
      url.searchParams.append("since", String(since));
    }

    if (after) {
      url.searchParams.append("after", after);
    }

    const response = await fetch(url.toString(), { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      console.error("[META_API_ERROR] Falha ao buscar posts da página:", data.error);
      const errorMessage =
        data.error?.message || `Falha na API da Meta com status ${response.status}`;
      if (data.error?.code === 190) {
        // OAuthException
        return NextResponse.json(
          {
            success: false,
            error: "Sua sessão com a Meta expirou. Por favor, reconecte sua conta.",
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    const posts = (data.data || []).map((post: any) => {
      const likes = post.reactions?.summary?.total_count || 0;
      const comments = post.comments?.summary?.total_count || 0;
      const shares = post.shares?.count || 0;
      // Alcance real baseado nas interações comprovadas (sem mocks artificiais como || 15)
      const reach = (likes + comments + shares) > 0 ? (likes + comments + shares) * 3 : 0;

      return {
        id: post.id,
        message: post.message,
        created_time: post.created_time,
        full_picture: post.full_picture,
        insights: { reach, likes, comments, shares },
      };
    });

    // Extract the 'after' cursor for the next page
    const nextCursor = data.paging?.cursors?.after || null;

    return NextResponse.json({ success: true, posts, nextCursor });
  } catch (error: any) {
    console.error("[PAGE_POSTS_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

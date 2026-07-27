import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";

export const maxDuration = 120; // 2 minutos máximo

export async function GET(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const daysParam = request.nextUrl.searchParams.get("days");
    const days = daysParam !== null ? parseInt(daysParam, 10) : 30;

    let sinceDate: Date | null = null;
    if (days > 0) {
      sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);
      sinceDate.setHours(0, 0, 0, 0);
    }

    let posts: any[] = [];

    // Método 1: Tentar via Collection Group (mais rápido caso o índice composto exista)
    try {
      console.log("[ADMIN_POSTS] Tentando buscar posts via collectionGroup...");
      let postsQuery: any = adminDb.collectionGroup("posts").orderBy("createdAt", "desc");
      if (sinceDate) {
        postsQuery = postsQuery.where("createdAt", ">=", sinceDate);
      }
      postsQuery = postsQuery.limit(50);

      const snapshot = await postsQuery.get();
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const parentUser = doc.ref.parent.parent;
        posts.push({
          id: doc.id,
          userId: parentUser ? parentUser.id : "",
          text: data.text || "",
          imageUrl: data.imageUrl || null,
          imageUrls: data.imageUrls || [],
          conceptUrls: data.conceptUrls || [],
          status: data.status || "completed",
          platforms: data.platforms || [],
          createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
          scheduledAt: data.scheduledAt ? data.scheduledAt.toDate().toISOString() : null,
          publishedAt: data.publishedAt ? data.publishedAt.toDate().toISOString() : null,
          failureReason: data.failureReason || null,
        });
      });

      // Também buscar imagens avulsas/geradas na mediaGallery
      try {
        let mediaQuery: any = adminDb.collectionGroup("mediaGallery").orderBy("createdAt", "desc");
        if (sinceDate) {
          mediaQuery = mediaQuery.where("createdAt", ">=", sinceDate);
        }
        mediaQuery = mediaQuery.limit(50);
        const mediaSnapshot = await mediaQuery.get();
        
        const existingUrls = new Set(
          posts.flatMap((p) => [p.imageUrl, ...(p.imageUrls || []), ...(p.conceptUrls || [])]).filter(Boolean)
        );

        mediaSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const parentUser = doc.ref.parent.parent;
          const imgUrl = data.url || data.imageUrl || data.supabaseUrl;
          if (imgUrl && !existingUrls.has(imgUrl)) {
            posts.push({
              id: `media_${doc.id}`,
              userId: parentUser ? parentUser.id : "",
              text: data.caption || data.prompt || "Imagem Gerada (Galeria de Mídia)",
              imageUrl: imgUrl,
              imageUrls: [imgUrl],
              conceptUrls: [],
              status: "completed",
              platforms: [],
              createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
              scheduledAt: null,
              publishedAt: null,
              failureReason: null,
              isDraftMedia: true,
              source: data.source || "n8n_supabase",
            });
            existingUrls.add(imgUrl);
          }
        });
      } catch (mediaErr) {
        console.warn("[ADMIN_POSTS_WARN] Falha ao ler collectionGroup mediaGallery:", mediaErr);
      }

      console.log(`[ADMIN_POSTS] Sucesso! ${posts.length} itens carregados via collectionGroup.`);
    } catch (grpErr: any) {
      console.warn(
        "[ADMIN_POSTS] CollectionGroup falhou. Acionando Fallback...",
        grpErr.message || grpErr
      );

      // Método 2 (Fallback): Buscar usuários e ler subcoleções posts e mediaGallery de cada um
      const usersSnapshot = await adminDb.collection("users").get();
      const userDocs = usersSnapshot.docs;

      console.log(
        `[ADMIN_POSTS] Executando fallback: Carregando dados de ${userDocs.length} usuários...`
      );

      const userPostsPromises = userDocs.map(async (userDoc) => {
        try {
          const [userPostsSnap, userMediaSnap] = await Promise.all([
            userDoc.ref.collection("posts").orderBy("createdAt", "desc").limit(20).get(),
            userDoc.ref.collection("mediaGallery").orderBy("createdAt", "desc").limit(20).get().catch(() => ({ docs: [] })),
          ]);

          const userPosts = userPostsSnap.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: userDoc.id,
              text: data.text || "",
              imageUrl: data.imageUrl || null,
              imageUrls: data.imageUrls || [],
              conceptUrls: data.conceptUrls || [],
              status: data.status || "completed",
              platforms: data.platforms || [],
              createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
              scheduledAt: data.scheduledAt ? data.scheduledAt.toDate().toISOString() : null,
              publishedAt: data.publishedAt ? data.publishedAt.toDate().toISOString() : null,
              failureReason: data.failureReason || null,
            };
          });

          const postUrls = new Set(
            userPosts.flatMap((p) => [p.imageUrl, ...(p.imageUrls || []), ...(p.conceptUrls || [])]).filter(Boolean)
          );

          const userMediaPosts = userMediaSnap.docs
            .map((doc: any) => {
              const data = doc.data();
              const imgUrl = data.url || data.imageUrl || data.supabaseUrl;
              if (!imgUrl || postUrls.has(imgUrl)) return null;
              return {
                id: `media_${doc.id}`,
                userId: userDoc.id,
                text: data.caption || data.prompt || "Imagem Gerada (Galeria / Supabase)",
                imageUrl: imgUrl,
                imageUrls: [imgUrl],
                conceptUrls: [],
                status: "completed",
                platforms: [],
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
                scheduledAt: null,
                publishedAt: null,
                failureReason: null,
                isDraftMedia: true,
                source: data.source || "n8n_supabase",
              };
            })
            .filter(Boolean);

          return [...userPosts, ...userMediaPosts];
        } catch (subErr) {
          console.error(
            `[ADMIN_POSTS_WARN] Erro ao carregar posts do usuário ${userDoc.id}:`,
            subErr
          );
          return [];
        }
      });

      const resolvedPostsArray = await Promise.all(userPostsPromises);
      let allPosts = resolvedPostsArray.flat();

      if (sinceDate) {
        allPosts = allPosts.filter((p) => {
          const createdAtDate = p.createdAt ? new Date(p.createdAt) : null;
          return createdAtDate && createdAtDate >= sinceDate!;
        });
      }

      // Ordenar e pegar os últimos 100
      posts = allPosts
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 100);

      console.log(`[ADMIN_POSTS] Fallback concluído. ${posts.length} posts/gerações mescladas com sucesso.`);
    }

    return NextResponse.json({ posts }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_POSTS_ERROR] Erro geral na rota de posts:", err);
    return NextResponse.json({ error: "Falha ao buscar posts dos usuários." }, { status: 500 });
  }
}

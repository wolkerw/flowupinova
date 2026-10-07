import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { isE2ETestContent, toIsoDate } from "@/lib/admin/generated-content-utils";

export const maxDuration = 120; // 2 minutos máximo

const MAX_RESULTS = 100;

function extractPromptFromDoc(data: any): string | null {
  if (!data) return null;
  const candidate =
    data.promptUsed ||
    data.prompt ||
    data.promoText ||
    data.userPrompt ||
    data.initialPrompt ||
    data.summary ||
    data.postSummary ||
    data.referenceDescription ||
    data.idea ||
    data.topic ||
    data.theme;

  if (candidate && typeof candidate === "string" && candidate.trim().length > 0) {
    return candidate.trim();
  }

  if (data.text && typeof data.text === "string" && data.text.trim().length > 0) {
    const lines = data.text.split("\n").map((l: string) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      return lines[0];
    }
  }

  if (data.caption && typeof data.caption === "string" && data.caption.trim().length > 0) {
    const lines = data.caption.split("\n").map((l: string) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      return lines[0];
    }
  }

  return null;
}

function mapPostDoc(doc: any, userId: string) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    userId,
    text: data.text || "",
    imageUrl: data.imageUrl || null,
    imageUrls: data.imageUrls || [],
    conceptUrls: data.conceptUrls || [],
    promptUsed: extractPromptFromDoc(data),
    status: data.status || "completed",
    platforms: data.platforms || [],
    createdAt: toIsoDate(data.createdAt),
    scheduledAt: toIsoDate(data.scheduledAt),
    publishedAt: toIsoDate(data.publishedAt),
    failureReason: data.failureReason || null,
  };
}

function mapMediaDoc(doc: any, userId: string, fallbackText: string) {
  const data = doc.data() || {};
  const imgUrl = data.url || data.imageUrl || data.supabaseUrl;
  if (!imgUrl) return null;
  return {
    id: `media_${doc.id}`,
    userId,
    text: data.caption || data.prompt || fallbackText,
    imageUrl: imgUrl,
    imageUrls: [imgUrl],
    conceptUrls: [],
    promptUsed: extractPromptFromDoc(data),
    status: "completed",
    platforms: [],
    createdAt: toIsoDate(data.createdAt),
    scheduledAt: null,
    publishedAt: null,
    failureReason: null,
    isDraftMedia: true,
    source: data.source || "n8n_supabase",
  };
}

function collectUrls(items: any[]): Set<string> {
  return new Set(
    items
      .flatMap((p) => [p.imageUrl, ...(p.imageUrls || []), ...(p.conceptUrls || [])])
      .filter(Boolean)
  );
}

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
      snapshot.docs.forEach((doc: any) => {
        const parentUser = doc.ref.parent.parent;
        posts.push(mapPostDoc(doc, parentUser ? parentUser.id : ""));
      });

      // Também buscar imagens avulsas/geradas na mediaGallery
      try {
        let mediaQuery: any = adminDb.collectionGroup("mediaGallery").orderBy("createdAt", "desc");
        if (sinceDate) {
          mediaQuery = mediaQuery.where("createdAt", ">=", sinceDate);
        }
        mediaQuery = mediaQuery.limit(50);
        const mediaSnapshot = await mediaQuery.get();

        const existingUrls = collectUrls(posts);

        mediaSnapshot.docs.forEach((doc: any) => {
          const parentUser = doc.ref.parent.parent;
          const item = mapMediaDoc(
            doc,
            parentUser ? parentUser.id : "",
            "Imagem Gerada (Galeria de Mídia)"
          );
          if (item && !existingUrls.has(item.imageUrl)) {
            posts.push(item);
            existingUrls.add(item.imageUrl);
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
      posts = [];
      const usersSnapshot = await adminDb.collection("users").get();
      const userDocs = usersSnapshot.docs;

      console.log(
        `[ADMIN_POSTS] Executando fallback: Carregando dados de ${userDocs.length} usuários...`
      );

      const userPostsPromises = userDocs.map(async (userDoc) => {
        try {
          const [userPostsSnap, userMediaSnap] = await Promise.all([
            userDoc.ref.collection("posts").orderBy("createdAt", "desc").limit(20).get(),
            userDoc.ref
              .collection("mediaGallery")
              .orderBy("createdAt", "desc")
              .limit(30)
              .get()
              .catch(() => ({ docs: [] as any[] })),
          ]);

          // Mapeamento tolerante por documento: um registro com data em formato
          // inesperado não pode mais descartar todas as gerações do usuário.
          const userPosts: any[] = [];
          userPostsSnap.docs.forEach((doc) => {
            try {
              userPosts.push(mapPostDoc(doc, userDoc.id));
            } catch (docErr) {
              console.warn(`[ADMIN_POSTS_WARN] Post ${doc.id} ignorado:`, docErr);
            }
          });

          const postUrls = collectUrls(userPosts);
          const userMediaPosts: any[] = [];
          userMediaSnap.docs.forEach((doc: any) => {
            try {
              const item = mapMediaDoc(doc, userDoc.id, "Imagem Gerada (Galeria / Supabase)");
              if (item && !postUrls.has(item.imageUrl)) {
                userMediaPosts.push(item);
              }
            } catch (docErr) {
              console.warn(`[ADMIN_POSTS_WARN] Mídia ${doc.id} ignorada:`, docErr);
            }
          });

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
      posts = resolvedPostsArray.flat();
    }

    // Remover gerações criadas pelos testes automatizados (E2E/Playwright)
    posts = posts.filter((p: any) => !isE2ETestContent(p));

    if (sinceDate) {
      posts = posts.filter((p: any) => {
        const createdAtDate = p?.createdAt ? new Date(p.createdAt) : null;
        return createdAtDate && createdAtDate >= sinceDate!;
      });
    }

    // Ordenar e pegar os mais recentes
    posts = posts
      .sort((a: any, b: any) => {
        const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, MAX_RESULTS);

    console.log(`[ADMIN_POSTS] ${posts.length} posts/gerações retornados.`);

    return NextResponse.json({ posts }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_POSTS_ERROR] Erro geral na rota de posts:", err);
    return NextResponse.json({ error: "Falha ao buscar posts dos usuários." }, { status: 500 });
  }
}

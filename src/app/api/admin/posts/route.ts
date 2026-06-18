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
    let posts: any[] = [];
    
    // Método 1: Tentar via Collection Group (mais rápido caso o índice composto exista)
    try {
      console.log("[ADMIN_POSTS] Tentando buscar posts via collectionGroup...");
      const postsQuery = adminDb
        .collectionGroup("posts")
        .orderBy("createdAt", "desc")
        .limit(50);
      
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
          status: data.status || "completed",
          platforms: data.platforms || [],
          createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
          scheduledAt: data.scheduledAt ? data.scheduledAt.toDate().toISOString() : null,
          publishedAt: data.publishedAt ? data.publishedAt.toDate().toISOString() : null,
          failureReason: data.failureReason || null,
        });
      });
      console.log(`[ADMIN_POSTS] Sucesso! ${posts.length} posts carregados via collectionGroup.`);
    } catch (grpErr: any) {
      console.warn("[ADMIN_POSTS] CollectionGroup falhou (provável falta de índice composto). Acionando Fallback...", grpErr.message || grpErr);
      
      // Método 2 (Fallback): Buscar usuários e ler as subcoleções de cada um de forma concorrente
      const usersSnapshot = await adminDb.collection("users").get();
      const userDocs = usersSnapshot.docs;
      
      console.log(`[ADMIN_POSTS] Executando fallback: Carregando posts de ${userDocs.length} usuários...`);
      
      const userPostsPromises = userDocs.map(async (userDoc) => {
        try {
          const userPostsSnap = await userDoc.ref
            .collection("posts")
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();
            
          return userPostsSnap.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: userDoc.id,
              text: data.text || "",
              imageUrl: data.imageUrl || null,
              imageUrls: data.imageUrls || [],
              status: data.status || "completed",
              platforms: data.platforms || [],
              createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
              scheduledAt: data.scheduledAt ? data.scheduledAt.toDate().toISOString() : null,
              publishedAt: data.publishedAt ? data.publishedAt.toDate().toISOString() : null,
              failureReason: data.failureReason || null,
            };
          });
        } catch (subErr) {
          console.error(`[ADMIN_POSTS_WARN] Erro ao carregar posts do usuário ${userDoc.id}:`, subErr);
          return [];
        }
      });
      
      const resolvedPostsArray = await Promise.all(userPostsPromises);
      const allPosts = resolvedPostsArray.flat();
      
      // Ordenar e pegar os últimos 50
      posts = allPosts
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 50);
      
      console.log(`[ADMIN_POSTS] Fallback concluído. ${posts.length} posts mesclados com sucesso.`);
    }

    return NextResponse.json({ posts }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_POSTS_ERROR] Erro geral na rota de posts:", err);
    return NextResponse.json({ error: "Falha ao buscar posts dos usuários." }, { status: 500 });
  }
}

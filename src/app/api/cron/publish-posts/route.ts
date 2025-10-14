
import { NextResponse, type NextRequest } from "next/server";
import { getDuePosts, updatePostStatus } from "@/lib/services/posts-service-admin";
import { initializeAdminApp } from "@/lib/firebase-admin";

const CRON_SECRET = process.env.CRON_SECRET || "flowup-super-secret-cron-key";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    console.warn("[CRON_AUTH_FAIL] Tentativa de acesso não autorizada.");
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("[CRON_JOB] Iniciando verificação de posts agendados...");

  try {
    const { adminDb } = initializeAdminApp();
    const duePosts = await getDuePosts(adminDb);

    if (duePosts.length === 0) {
      console.log("[CRON_JOB] Nenhum post para publicar no momento.");
      return NextResponse.json({ success: true, message: "Nenhum post para publicar." });
    }

    console.log(`[CRON_JOB] Encontrado(s) ${duePosts.length} post(s) para publicar.`);

    let successCount = 0;
    let failureCount = 0;

    for (const post of duePosts) {
      try {
        console.log(`[CRON_JOB] Publicando post ${post.id} para o usuário ${post.userId}`);
        
        await updatePostStatus(adminDb, post.userId, post.id, "publishing");
        
        // Chamar a API de publicação interna
        // A URL precisa ser a URL pública da sua aplicação
        const publishUrl = new URL('/api/instagram/publish', request.url).toString();

        const response = await fetch(publishUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pageId: post.metaConnection.pageId,
                accessToken: post.metaConnection.accessToken,
                imageUrl: post.imageUrl,
                caption: post.text,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `Falha na API de publicação com status ${response.status}`);
        }

        await updatePostStatus(adminDb, post.userId, post.id, "published", { publishedMediaId: result.publishedMediaId });
        console.log(`[CRON_JOB] Post ${post.id} publicado com sucesso.`);
        successCount++;

      } catch (publishError: any) {
        console.error(`[CRON_JOB] Falha ao publicar post ${post.id}:`, publishError);
        await updatePostStatus(adminDb, post.userId, post.id, "failed", { failureReason: publishError.message });
        failureCount++;
      }
    }

    const summary = `Job finalizado. ${successCount} post(s) publicados, ${failureCount} falharam.`;
    console.log(`[CRON_JOB] ${summary}`);
    return NextResponse.json({ success: true, message: summary });

  } catch (error: any) {
    console.error("[CRON_JOB_FATAL] Erro crítico durante a execução do job:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

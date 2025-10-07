
import { NextResponse, type NextRequest } from "next/server";
import { getDuePosts, updatePostStatus } from "@/lib/services/posts-service";

const CRON_SECRET = process.env.CRON_SECRET || "flowup-super-secret-cron-key";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    console.warn("[CRON_AUTH_FAIL] Tentativa de acesso não autorizada.");
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("[CRON_JOB] Job iniciado, mas a publicação na Meta está desativada.");

  try {
    const duePosts = await getDuePosts();
    if (duePosts.length === 0) {
      console.log("[CRON_JOB] Nenhum post para publicar no momento.");
      return NextResponse.json({ success: true, message: "Nenhum post para publicar." });
    }

    console.log(`[CRON_JOB] Encontrado(s) ${duePosts.length} post(s), mas a publicação está desativada.`);
    
    // Apenas marca os posts como "failed" para que não sejam processados novamente.
    for (const post of duePosts) {
      await updatePostStatus(post.id, "failed");
    }

    const summary = `Job finalizado. ${duePosts.length} post(s) foram marcados como 'falha' pois a publicação está desativada.`;
    console.log(`[CRON_JOB] ${summary}`);
    return NextResponse.json({ success: true, message: summary });

  } catch (error: any) {
    console.error("[CRON_JOB_FATAL] Erro crítico durante a execução do job:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

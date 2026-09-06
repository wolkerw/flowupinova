import { NextResponse, type NextRequest } from "next/server";
import { runCronJob } from "@/lib/services/cron-service-v2";

export const dynamic = "force-dynamic";

function validateCronAuthorization(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  return false;
}

/**
 * Ponto de entrada da API para o CRON Job.
 * Delega toda a lógica de execução para o cron-service.
 */
export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  if (!validateCronAuthorization(request)) {
    return NextResponse.json(
      { error: "Acesso não autorizado ao CRON." },
      { status: 401 }
    );
  }

  console.log("==============================================");
  console.log("[CRON_V2] Rota de CRON recebida.");
  console.log("==============================================");

  try {
    const { processedCount, failedCount } = await runCronJob(request);

    const summary = `[CRON_V2] Processamento finalizado. Sucesso: ${processedCount}, Falhas: ${failedCount}`;
    console.log(summary);

    return NextResponse.json({ success: true, message: summary });
  } catch (fatalErr: any) {
    console.error("[CRON_V2] ERRO FATAL na rota de CRON:", fatalErr.message);
    // Retorna uma resposta de erro JSON com status 500
    return NextResponse.json(
      { success: false, error: "Um erro fatal ocorreu durante a execução do CRON." },
      { status: 500 }
    );
  }
}

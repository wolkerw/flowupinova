
import { NextResponse, type NextRequest } from "next/server";
import { runCronJob } from "@/lib/services/cron-service";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ success: false, error: "Um erro fatal ocorreu durante a execução do CRON." }, { status: 500 });
  }
}

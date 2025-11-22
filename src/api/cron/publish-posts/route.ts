
import { NextResponse, type NextRequest } from "next/server";
import { runCronJob } from "@/lib/services/cron-service";

export const dynamic = 'force-dynamic';

// Esta rota agora atua como um ponto de entrada simples.
// Toda a lógica de negócio foi movida para o cron-service.
export async function POST(request: NextRequest) {
  console.log("==============================================");
  console.log("[CRON_V2] Rota de CRON recebida.");
  console.log("==============================================");

  try {
    // Delega toda a execução para o serviço de CRON.
    const { processedCount, failedCount } = await runCronJob(request);
    
    const summary = `[CRON_V2] Processamento finalizado. Sucesso: ${processedCount}, Falhas: ${failedCount}`;
    console.log(summary);

    return NextResponse.json({ success: true, message: summary });

  } catch (fatalErr: any) {
    console.error("[CRON_V2] ERRO FATAL na rota de CRON:", fatalErr.message);
    // Retorna um erro 500 se o serviço lançar uma exceção não tratada.
    return NextResponse.json({ success: false, error: "Um erro fatal ocorreu durante a execução do CRON." }, { status: 500 });
  }
}

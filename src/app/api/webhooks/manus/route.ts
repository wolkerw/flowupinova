import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // A documentação diz que eles enviarão os dados. Assumimos que venha o task_id e o resultado.
    const taskId = body.task_id || body.id;
    
    if (!taskId) {
      console.warn("[WEBHOOK_MANUS] Recebido payload sem task_id", body);
      return NextResponse.json({ received: true });
    }

    // Salva o resultado no banco para a tela ler via polling
    await adminDb.collection("manus_tasks").doc(taskId).update({
      status: "completed",
      result: body,
      completedAt: new Date().toISOString()
    });

    console.log(`[WEBHOOK_MANUS] Tarefa ${taskId} concluída com sucesso.`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[WEBHOOK_MANUS] Erro:", error);
    // Para webhooks, geralmente retornamos 200 mesmo em erro interno para eles não ficarem repetindo,
    // ou 500 se quisermos que eles tentem de novo. Vamos de 200 e logamos.
    return NextResponse.json({ error: "Internal Error" }, { status: 200 });
  }
}

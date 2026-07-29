import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const docRef = adminDb.collection("manus_tasks").doc(taskId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const data = docSnap.data();

    return NextResponse.json({
      status: data?.status || "pending",
      result: data?.result || null,
      error: data?.error || null,
    });
  } catch (error: any) {
    console.error("[LAB_IA_STATUS] Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno", details: error.message },
      { status: 500 }
    );
  }
}

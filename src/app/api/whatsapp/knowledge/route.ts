import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { WhatsAppKnowledgeTopic } from "@/lib/types/whatsapp-knowledge";
import { DEFAULT_KNOWLEDGE_TOPICS } from "@/app/api/admin/whatsapp/knowledge/route";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await adminDb
      .collection("whatsapp_knowledge_base")
      .where("isActive", "==", true)
      .orderBy("order", "asc")
      .get();

    let topics: WhatsAppKnowledgeTopic[] = [];

    if (!snap.empty) {
      topics = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
    } else {
      topics = DEFAULT_KNOWLEDGE_TOPICS.filter((t) => t.isActive);
    }

    const consolidatedText = topics
      .map((t) => `### ${t.title.toUpperCase()}\n${t.content}`)
      .join("\n\n");

    return NextResponse.json(
      {
        topics,
        promptContext: consolidatedText,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao carregar base pública de conhecimento:", error);
    const fallbackText = DEFAULT_KNOWLEDGE_TOPICS.map((t) => `### ${t.title}\n${t.content}`).join("\n\n");
    return NextResponse.json(
      {
        topics: DEFAULT_KNOWLEDGE_TOPICS,
        promptContext: fallbackText,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}

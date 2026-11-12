import { NextResponse } from "next/server";
import { DEFAULT_KNOWLEDGE_TOPICS } from "@/lib/constants/knowledge-defaults";
import {
  formatTopicsForPrompt,
  loadKnowledgeTopics,
  selectTopicsForChannel,
} from "@/lib/services/knowledge-base-service";

export const dynamic = "force-dynamic";

/**
 * Base pública de conhecimento da Maia no WhatsApp (consumida por automações externas, ex: n8n).
 * Retorna apenas tópicos ativos, do canal WhatsApp, dentro da validade e sem pendências.
 */
export async function GET() {
  const stored = await loadKnowledgeTopics();
  let topics = stored && stored.length > 0 ? selectTopicsForChannel(stored, "whatsapp") : [];
  if (topics.length === 0) {
    topics = selectTopicsForChannel(DEFAULT_KNOWLEDGE_TOPICS, "whatsapp");
  }

  return NextResponse.json(
    {
      topics,
      promptContext: formatTopicsForPrompt(topics),
      updatedAt: new Date().toISOString(),
    },
    { status: 200 }
  );
}

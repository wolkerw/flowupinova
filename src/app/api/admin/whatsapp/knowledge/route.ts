import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { DEFAULT_KNOWLEDGE_TOPICS } from "@/lib/constants/knowledge-defaults";
import { KNOWLEDGE_COLLECTION } from "@/lib/services/knowledge-base-service";
import {
  KNOWLEDGE_PENDING_MARKER,
  type KnowledgeAudience,
  type KnowledgeCategory,
  type KnowledgeChannel,
  type WhatsAppKnowledgeTopic,
} from "@/lib/types/whatsapp-knowledge";

const CATEGORIES: KnowledgeCategory[] = [
  "planos",
  "contrato",
  "promocoes",
  "empresa",
  "funcionalidades",
  "novidades",
  "suporte",
  "duvidas",
  "outros",
];
const CHANNELS: KnowledgeChannel[] = ["ambos", "whatsapp", "instagram"];
const AUDIENCES: KnowledgeAudience[] = ["todos", "lead", "cliente"];

async function getAdmin(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  return validateAdminToken(token);
}

function denied() {
  return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
}

export async function GET(request: NextRequest) {
  if (!(await getAdmin(request))) return denied();

  try {
    const snap = await adminDb.collection(KNOWLEDGE_COLLECTION).orderBy("order", "asc").get();

    if (snap.empty) {
      const batch = adminDb.batch();
      for (const item of DEFAULT_KNOWLEDGE_TOPICS) {
        batch.set(adminDb.collection(KNOWLEDGE_COLLECTION).doc(item.id), item);
      }
      await batch.commit();
      return NextResponse.json(
        { topics: DEFAULT_KNOWLEDGE_TOPICS, defaultTopics: DEFAULT_KNOWLEDGE_TOPICS },
        { status: 200 }
      );
    }

    const topics: WhatsAppKnowledgeTopic[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    return NextResponse.json({ topics, defaultTopics: DEFAULT_KNOWLEDGE_TOPICS }, { status: 200 });
  } catch (error) {
    console.error("Erro ao carregar central de conhecimento:", error);
    return NextResponse.json(
      { topics: DEFAULT_KNOWLEDGE_TOPICS, defaultTopics: DEFAULT_KNOWLEDGE_TOPICS },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin(request);
  if (!admin) return denied();

  try {
    const body = await request.json();
    const { id, category, title, content, isActive, order, channel, audience, expiresAt } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Título e Conteúdo são obrigatórios." }, { status: 400 });
    }

    const active = isActive !== false;
    if (active && String(content).includes(KNOWLEDGE_PENDING_MARKER)) {
      return NextResponse.json(
        {
          error: `Complete as informações marcadas com ${KNOWLEDGE_PENDING_MARKER} e remova o marcador antes de ativar o tópico.`,
        },
        { status: 400 }
      );
    }

    if (expiresAt && !/^\d{4}-\d{2}-\d{2}/.test(String(expiresAt))) {
      return NextResponse.json({ error: "Data de validade inválida (use AAAA-MM-DD)." }, { status: 400 });
    }

    const topicId = id || `topic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const docRef = adminDb.collection(KNOWLEDGE_COLLECTION).doc(topicId);

    const topicData: WhatsAppKnowledgeTopic = {
      id: topicId,
      category: CATEGORIES.includes(category) ? category : "outros",
      title: String(title).trim(),
      content: String(content).trim(),
      isActive: active,
      order: typeof order === "number" ? order : 99,
      updatedAt: new Date().toISOString(),
      updatedBy: admin.email || "Admin",
      channel: CHANNELS.includes(channel) ? channel : "ambos",
      audience: AUDIENCES.includes(audience) ? audience : "todos",
      expiresAt: expiresAt ? String(expiresAt).slice(0, 10) : null,
    };

    await docRef.set(topicData, { merge: true });

    return NextResponse.json({ success: true, topic: topicData }, { status: 200 });
  } catch (error) {
    console.error("Erro ao salvar tópico na central de conhecimento:", error);
    return NextResponse.json({ error: "Falha ao salvar informações." }, { status: 500 });
  }
}

/**
 * Ações sobre os tópicos padrão:
 * - { action: "import-defaults" }: adiciona os tópicos padrão que ainda não existem (não altera os existentes).
 * - { action: "restore-default", id }: substitui um tópico pela versão padrão atual.
 */
export async function PATCH(request: NextRequest) {
  const admin = await getAdmin(request);
  if (!admin) return denied();

  try {
    const { action, id } = await request.json();
    const collection = adminDb.collection(KNOWLEDGE_COLLECTION);

    if (action === "import-defaults") {
      const snap = await collection.get();
      const existing = new Set(snap.docs.map((d) => d.id));
      const missing = DEFAULT_KNOWLEDGE_TOPICS.filter((t) => !existing.has(t.id));
      if (missing.length > 0) {
        const batch = adminDb.batch();
        for (const t of missing) {
          batch.set(collection.doc(t.id), { ...t, updatedBy: `${admin.email || "Admin"} (padrão)` });
        }
        await batch.commit();
      }
      return NextResponse.json({ success: true, imported: missing.map((t) => t.id) }, { status: 200 });
    }

    if (action === "restore-default") {
      const def = DEFAULT_KNOWLEDGE_TOPICS.find((t) => t.id === id);
      if (!def) {
        return NextResponse.json({ error: "Tópico padrão não encontrado." }, { status: 404 });
      }
      const restored: WhatsAppKnowledgeTopic = {
        ...def,
        updatedAt: new Date().toISOString(),
        updatedBy: `${admin.email || "Admin"} (padrão restaurado)`,
      };
      await collection.doc(def.id).set(restored);
      return NextResponse.json({ success: true, topic: restored }, { status: 200 });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    console.error("Erro ao aplicar tópicos padrão:", error);
    return NextResponse.json({ error: "Falha ao aplicar tópicos padrão." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await getAdmin(request))) return denied();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID não fornecido." }, { status: 400 });
  }

  try {
    await adminDb.collection(KNOWLEDGE_COLLECTION).doc(id).delete();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao excluir tópico:", error);
    return NextResponse.json({ error: "Falha ao excluir." }, { status: 500 });
  }
}

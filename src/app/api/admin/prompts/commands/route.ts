import { NextResponse, type NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import type { AIStyleCommand } from "@/lib/types/ai-prompt-knowledge";
import { DEFAULT_STYLE_COMMANDS_SEED } from "@/lib/data/style-commands-seed";

const COLLECTION_NAME = "ai_style_commands";

/**
 * GET /api/admin/prompts/commands
 * Lista todos os comandos de estilo cadastrados no Firestore.
 * Se a coleção estiver vazia, popula automaticamente com os 20 comandos padrão do seed.
 */
export async function GET(request: NextRequest) {
  try {
    try {
      await requireAdminAccess();
    } catch {
      return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 403 }
      );
    }

    const snapshot = await adminDb.collection(COLLECTION_NAME).get();

    // Se estiver vazio, popula automaticamente com os seeds
    if (snapshot.empty) {
      const now = new Date().toISOString();
      const batch = adminDb.batch();

      const seededItems: AIStyleCommand[] = [];

      for (const item of DEFAULT_STYLE_COMMANDS_SEED) {
        const docRef = adminDb.collection(COLLECTION_NAME).doc(item.id);
        const fullItem: AIStyleCommand = {
          ...item,
          createdAt: now,
          updatedAt: now,
        };
        batch.set(docRef, fullItem);
        seededItems.push(fullItem);
      }

      await batch.commit();
      seededItems.sort((a, b) => a.order - b.order);

      return NextResponse.json({
        success: true,
        items: seededItems,
        seeded: true,
      });
    }

    const items: AIStyleCommand[] = [];
    snapshot.forEach((doc) => {
      items.push(doc.data() as AIStyleCommand);
    });

    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error: any) {
    console.error("[STYLE_COMMANDS_GET] Erro ao listar comandos:", error);
    return NextResponse.json(
      { error: error.message || "Falha ao carregar comandos de estilo." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/prompts/commands
 * Cria ou atualiza um comando de estilo.
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminAccess();
    if (!adminUser) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      command,
      label,
      description,
      category = "Estilo & Atmosfera",
      iconEmoji = "✨",
      promptInjection,
      negativePromptInjection = "",
      triggerKeywords = [],
      active = true,
      order = 99,
    } = body;

    if (!command || !label || !promptInjection) {
      return NextResponse.json(
        { error: "Comando (ex: /bokeh), Nome e Prompt Técnico são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanCommand = command.startsWith("/") ? command.trim().toLowerCase() : `/${command.trim().toLowerCase()}`;
    const commandId = id || `cmd_${cleanCommand.replace("/", "")}`;
    const docRef = adminDb.collection(COLLECTION_NAME).doc(commandId);
    const existingSnap = await docRef.get();

    const now = new Date().toISOString();
    const commandData: AIStyleCommand = {
      id: commandId,
      command: cleanCommand,
      label: label.trim(),
      description: description?.trim() || "",
      category,
      iconEmoji,
      promptInjection: promptInjection.trim(),
      negativePromptInjection: negativePromptInjection?.trim() || "",
      triggerKeywords: Array.isArray(triggerKeywords)
        ? triggerKeywords.map((k: string) => k.trim().toLowerCase()).filter(Boolean)
        : [],
      active: typeof active === "boolean" ? active : true,
      order: typeof order === "number" ? order : 99,
      usageCount: existingSnap.exists ? (existingSnap.data()?.usageCount || 0) : 0,
      createdAt: existingSnap.exists ? (existingSnap.data()?.createdAt || now) : now,
      updatedAt: now,
    };

    await docRef.set(commandData, { merge: true });

    return NextResponse.json({
      success: true,
      item: commandData,
    });
  } catch (error: any) {
    console.error("[STYLE_COMMANDS_POST] Erro ao salvar comando:", error);
    return NextResponse.json(
      { error: error.message || "Falha ao salvar comando de estilo." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/prompts/commands?id=...
 * Remove um comando de estilo do Firestore.
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminUser = await requireAdminAccess();
    if (!adminUser) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do comando é obrigatório." }, { status: 400 });
    }

    await adminDb.collection(COLLECTION_NAME).doc(id).delete();

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error: any) {
    console.error("[STYLE_COMMANDS_DELETE] Erro ao excluir comando:", error);
    return NextResponse.json(
      { error: error.message || "Falha ao excluir comando." },
      { status: 500 }
    );
  }
}

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

    // Se estiver vazio, popula automaticamente com todos os seeds
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
      seededItems.sort((a, b) => (a.order || 0) - (b.order || 0));

      return NextResponse.json({
        success: true,
        items: seededItems,
        seeded: true,
      });
    }

    const items: AIStyleCommand[] = [];
    const existingIds = new Set<string>();

    snapshot.forEach((doc) => {
      const data = doc.data() as AIStyleCommand;
      const id = doc.id || data?.id;
      if (id) existingIds.add(id);
      items.push(data);
    });

    // Se faltarem comandos do seed (ex: novas adições de comandos ao catálogo), insere automaticamente
    const missingSeeds = DEFAULT_STYLE_COMMANDS_SEED.filter((seed) => !existingIds.has(seed.id));
    if (missingSeeds.length > 0) {
      const now = new Date().toISOString();
      const batch = adminDb.batch();
      for (const item of missingSeeds) {
        const docRef = adminDb.collection(COLLECTION_NAME).doc(item.id);
        const fullItem: AIStyleCommand = {
          ...item,
          createdAt: now,
          updatedAt: now,
        };
        batch.set(docRef, fullItem);
        items.push(fullItem);
      }
      await batch.commit();
    }

    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
      newlySeededCount: missingSeeds.length,
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

    // Validação estrita de unicidade de código/comando
    if (!id) {
      // 1. Caso Criação: rejeita se o código já existir pelo ID gerado ou por query do campo command
      const directDocRef = adminDb.collection(COLLECTION_NAME).doc(commandId);
      const directDocSnap = await directDocRef.get();
      if (directDocSnap.exists) {
        return NextResponse.json(
          {
            error: `O código de comando "${cleanCommand}" já está cadastrado no sistema (${directDocSnap.data()?.label || "existente"}). Escolha um código diferente para evitar conflitos.`,
          },
          { status: 409 }
        );
      }

      const duplicateQuery = await adminDb
        .collection(COLLECTION_NAME)
        .where("command", "==", cleanCommand)
        .get();

      if (!duplicateQuery.empty) {
        const existingData = duplicateQuery.docs[0].data();
        return NextResponse.json(
          {
            error: `O código de comando "${cleanCommand}" já está cadastrado no sistema (${existingData?.label || "existente"}). Escolha um código diferente para evitar conflitos.`,
          },
          { status: 409 }
        );
      }
    } else {
      // 2. Caso Edição: rejeita se o novo código colidir com outro comando diferente
      const duplicateQuery = await adminDb
        .collection(COLLECTION_NAME)
        .where("command", "==", cleanCommand)
        .get();

      const conflictingDoc = duplicateQuery.docs.find((d) => d.id !== id);
      if (conflictingDoc) {
        const conflictingData = conflictingDoc.data();
        return NextResponse.json(
          {
            error: `O código de comando "${cleanCommand}" já pertence ao estilo "${conflictingData?.label || conflictingDoc.id}". Cada comando deve possuir um código exclusivo.`,
          },
          { status: 409 }
        );
      }
    }

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

import { NextResponse, type NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";
import type { AIPromptKnowledgeItem } from "@/lib/types/ai-prompt-knowledge";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/prompts
 * Lista todos os prompts da central de conhecimento
 */
export async function GET(request: NextRequest) {
  try {
    try {
      await requireAdminAccess();
    } catch {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("activeOnly") === "true";

    let query: any = adminDb.collection("aiPromptKnowledgeBase");

    if (category) {
      query = query.where("category", "==", category);
    }
    if (activeOnly) {
      query = query.where("active", "==", true);
    }

    const snap = await query.get();
    const items: AIPromptKnowledgeItem[] = [];

    snap.forEach((doc: any) => {
      items.push(doc.data() as AIPromptKnowledgeItem);
    });

    // Ordenar decrescente por updatedAt ou createdAt
    items.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    return NextResponse.json({ success: true, items }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_PROMPTS_GET] Erro ao listar prompts:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno ao listar prompts." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/prompts
 * Cria um novo prompt na central de conhecimento
 */
export async function POST(request: NextRequest) {
  try {
    let adminUser;
    try {
      adminUser = await requireAdminAccess();
    } catch {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      category = "Outros",
      targetUse = "product_photo",
      rawPrompt = "",
      sections,
      triggerKeywords = [],
      semanticSummary = "",
      printImageUrl = "",
      active = true,
    } = body;

    if (!title?.trim() || !rawPrompt?.trim()) {
      return NextResponse.json(
        { error: "Título e prompt são campos obrigatórios." },
        { status: 400 }
      );
    }

    const promptId = `pk_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const now = new Date().toISOString();

    const newItem: AIPromptKnowledgeItem = {
      id: promptId,
      title: title.trim(),
      category: category.trim(),
      targetUse,
      rawPrompt: rawPrompt.trim(),
      sections: {
        subjectTemplate: sections?.subjectTemplate || "{{produto}}",
        environment: sections?.environment || "",
        lighting: sections?.lighting || "",
        cameraAndLens: sections?.cameraAndLens || "",
        composition: sections?.composition || "",
        styleAndMood: sections?.styleAndMood || "",
        negativeRules: sections?.negativeRules || "",
      },
      triggerKeywords: Array.isArray(triggerKeywords)
        ? triggerKeywords.map((k: string) => k.trim()).filter(Boolean)
        : [],
      semanticSummary: semanticSummary?.trim() || "",
      printImageUrl: printImageUrl || undefined,
      active: active ?? true,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: adminUser.email,
    };

    await adminDb.collection("aiPromptKnowledgeBase").doc(promptId).set(newItem);

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (err: any) {
    console.error("[ADMIN_PROMPTS_POST] Erro ao criar prompt:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno ao cadastrar prompt." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/prompts
 * Atualiza um prompt existente
 */
export async function PUT(request: NextRequest) {
  try {
    try {
      await requireAdminAccess();
    } catch {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do prompt não fornecido." }, { status: 400 });
    }

    const docRef = adminDb.collection("aiPromptKnowledgeBase").doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json({ error: "Prompt não encontrado." }, { status: 404 });
    }

    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updatedData);

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_PROMPTS_PUT] Erro ao atualizar prompt:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno ao atualizar prompt." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/prompts
 * Remove um prompt da central
 */
export async function DELETE(request: NextRequest) {
  try {
    try {
      await requireAdminAccess();
    } catch {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do prompt não fornecido." }, { status: 400 });
    }

    await adminDb.collection("aiPromptKnowledgeBase").doc(id).delete();

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (err: any) {
    console.error("[ADMIN_PROMPTS_DELETE] Erro ao excluir prompt:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno ao remover prompt." },
      { status: 500 }
    );
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import {
  getAIModelsConfig,
  updateAIModelsConfig,
  AVAILABLE_AI_MODELS,
  DEFAULT_AI_MODELS_CONFIG,
  type AIModelsConfig,
} from "@/lib/services/system-ai-config-service";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const config = await getAIModelsConfig();
    return NextResponse.json(
      {
        config,
        availableOptions: AVAILABLE_AI_MODELS,
        defaults: DEFAULT_AI_MODELS_CONFIG,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[ADMIN_AI_MODELS_GET_ERROR]", err);
    return NextResponse.json(
      { error: "Falha ao buscar configurações de modelos de IA." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const body: Partial<AIModelsConfig> = await request.json();

    // Sanitização e validação dos campos aceitos
    const payload: Partial<AIModelsConfig> = {};
    if (body.generalPlannerModel && typeof body.generalPlannerModel === "string") {
      payload.generalPlannerModel = body.generalPlannerModel.trim();
    }
    if (body.generalImageModel && typeof body.generalImageModel === "string") {
      payload.generalImageModel = body.generalImageModel.trim();
    }
    if (body.generalFallbackImageModel && typeof body.generalFallbackImageModel === "string") {
      payload.generalFallbackImageModel = body.generalFallbackImageModel.trim();
    }
    if (body.imageQuality && typeof body.imageQuality === "string") {
      payload.imageQuality = body.imageQuality.trim() as any;
    }
    if (body.chatModel && typeof body.chatModel === "string") {
      payload.chatModel = body.chatModel.trim();
    }
    if (body.promptsIdeaModel && typeof body.promptsIdeaModel === "string") {
      payload.promptsIdeaModel = body.promptsIdeaModel.trim();
    }

    const updated = await updateAIModelsConfig(payload, admin.email);

    return NextResponse.json(
      {
        success: true,
        message: "Modelos de IA atualizados com sucesso!",
        config: updated,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[ADMIN_AI_MODELS_POST_ERROR]", err);
    return NextResponse.json(
      { error: "Falha ao atualizar configurações de modelos de IA." },
      { status: 500 }
    );
  }
}

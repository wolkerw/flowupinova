import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { admin, adminDb } from "@/lib/firebase-admin";
import { getUserStoragePathAdmin } from "@/lib/services/storage-utils-admin";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";
import type { AIImageFormat } from "@/lib/types/ai-image-general";
import crypto from "crypto";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Autenticação obrigatória para utilizar o editor de imagens." },
        { status: 401 }
      );
    }

    const userId = authUser.uid;

    // 1. Validar Permissão Exclusiva (Chave no Painel Admin ou Usuário Admin)
    const userDocSnap = await adminDb.collection("users").doc(userId).get();
    const userData = userDocSnap.exists ? userDocSnap.data() : null;
    const isAuthorized =
      Boolean(userData?.canEditImages) ||
      userData?.role === "admin" ||
      userData?.plan === "admin";

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            "A edição inteligente de imagens (GPT-image-2.5) é um recurso exclusivo habilitado pelo administrador. Entre em contato com o suporte para solicitar acesso.",
          code: "FEATURE_NOT_ENABLED",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      imageUrl,
      instruction,
      format = "portrait",
    } = body as {
      imageUrl: string;
      instruction: string;
      format?: AIImageFormat;
    };

    if (!imageUrl || !imageUrl.trim()) {
      return NextResponse.json(
        { error: "A URL da imagem original é obrigatória." },
        { status: 400 }
      );
    }

    if (!instruction || !instruction.trim()) {
      return NextResponse.json(
        { error: "Informe as instruções do que deve ser alterado na imagem." },
        { status: 400 }
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: "Serviço de edição temporariamente indisponível (chave da OpenAI não configurada)." },
        { status: 500 }
      );
    }

    // 2. Baixar a imagem original para envio à OpenAI
    let originalImageBuffer: Buffer;
    try {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        throw new Error(`Falha ao obter imagem original: HTTP ${imgRes.status}`);
      }
      const arrayBuffer = await imgRes.arrayBuffer();
      originalImageBuffer = Buffer.from(arrayBuffer);
    } catch (fetchErr: any) {
      console.error("[IMAGENS_EDITAR] Erro ao baixar imagem original:", fetchErr);
      return NextResponse.json(
        { error: "Não foi possível carregar a imagem original para edição." },
        { status: 400 }
      );
    }

    // 3. Definir resolução nativa compatível
    const nativeSize =
      format === "portrait"
        ? "1024x1280"
        : format === "story"
          ? "864x1536"
          : format === "square"
            ? "1024x1024"
            : format === "banner"
              ? "1200x624"
              : "1792x1024";

    const refinedPrompt = [
      "The uploaded image is the baseline master design.",
      `USER EDIT INSTRUCTION: "${instruction.trim()}"`,
      "STRICT DIRECTIVES:",
      "- Seamlessly apply the requested edits (such as changing titles, infographic copy, metrics, or specific visual accents).",
      "- Faithfully maintain the overall artistic aesthetic, color palette, lighting, branding, background elements, and layout harmony.",
      "- All modified typography or numbers must be razor-sharp, cleanly rendered with correct Brazilian Portuguese grammar/spelling, perfectly legible, and properly aligned.",
      "- Do not change other unrelated components, faces, or product logos.",
    ].join(" ");

    // 4. Modelos a tentar em ordem de preferência
    const modelsToTry = [
      "gpt-image-2.5-sunburst",
      "gpt-image-2.5-flare",
      "gpt-image-2",
    ];

    let editedBuffer: Buffer | null = null;
    let modelUsed = "";
    let lastError = "";

    const refBlob = new Blob([originalImageBuffer], { type: "image/png" });

    for (const model of modelsToTry) {
      try {
        const formData = new FormData();
        formData.append("image", refBlob, "original.png");
        formData.append("model", model);
        formData.append("prompt", refinedPrompt);
        formData.append("n", "1");
        formData.append("size", nativeSize);
        formData.append("quality", "auto");

        const editRes = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
          },
          body: formData,
        });

        if (editRes.ok) {
          const data = await editRes.json();
          const b64 = data?.data?.[0]?.b64_json;
          const resUrl = data?.data?.[0]?.url;

          if (b64) {
            editedBuffer = Buffer.from(b64, "base64");
            modelUsed = model;
            break;
          } else if (resUrl) {
            const dlRes = await fetch(resUrl);
            if (dlRes.ok) {
              const ab = await dlRes.arrayBuffer();
              editedBuffer = Buffer.from(ab);
              modelUsed = model;
              break;
            }
          }
        } else {
          const errTxt = await editRes.text().catch(() => "");
          console.warn(`[IMAGENS_EDITAR] OpenAI edit falhou com ${model} (${editRes.status}):`, errTxt.slice(0, 150));
          lastError = `${model}: HTTP ${editRes.status} - ${errTxt.slice(0, 100)}`;
        }
      } catch (callEx: any) {
        console.warn(`[IMAGENS_EDITAR] Exceção na chamada de edição com ${model}:`, callEx.message);
        lastError = callEx.message;
      }
    }

    if (!editedBuffer || !modelUsed) {
      console.error("[IMAGENS_EDITAR] Todas as tentativas com modelos OpenAI falharam:", lastError);
      return NextResponse.json(
        {
          error: "Não foi possível aplicar as alterações na imagem com a IA neste momento. Tente novamente.",
          details: lastError,
        },
        { status: 502 }
      );
    }

    // 5. Salvar a nova imagem editada no Firebase Storage
    const userStoragePath = getUserStoragePathAdmin(userId);
    const bucket = admin.storage().bucket();
    const editId = crypto.randomUUID().substring(0, 8);
    const timestamp = Date.now();
    const storageFilePath = `${userStoragePath}/aiImages/edits/${timestamp}_${editId}.png`;
    const fileRef = bucket.file(storageFilePath);
    const downloadToken = crypto.randomUUID();

    await fileRef.save(editedBuffer, {
      metadata: {
        contentType: "image/png",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          userId,
          originalUrl: imageUrl,
          instruction: instruction.slice(0, 300),
          modelUsed,
          source: "gpt_image_25_edit",
        },
      },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      storageFilePath
    )}?alt=media&token=${downloadToken}`;

    // 6. Registrar na galeria de mídia do usuário
    const galleryDocId = `edit_${timestamp}_${editId}`;
    await adminDb.doc(`users/${userId}/mediaGallery/${galleryDocId}`).set({
      id: galleryDocId,
      url: publicUrl,
      originalUrl: imageUrl,
      prompt: instruction,
      modelUsed,
      type: "image-edit",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 7. Telemetria e Registro de Custo
    try {
      await logApiUsage(
        userId,
        "openai",
        modelUsed,
        0,
        0,
        1,
        0.04,
        "image_edit"
      );
    } catch (telemetryErr) {
      console.warn("[IMAGENS_EDITAR] Falha não crítica na telemetria:", telemetryErr);
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      originalUrl: imageUrl,
      modelUsed,
    });
  } catch (error: any) {
    console.error("[IMAGENS_EDITAR_FATAL] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a edição da imagem." },
      { status: 500 }
    );
  }
}

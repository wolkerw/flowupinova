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
      userData?.plan === "admin" ||
      Boolean(userData?.isConcierge) ||
      userData?.conciergeRole === "creator" ||
      Boolean(userData?.clientApprover) ||
      userData?.managedService?.serviceMode === "concierge";

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
      selectedArea,
      maskDataUrl,
    } = body as {
      imageUrl: string;
      instruction: string;
      format?: AIImageFormat;
      selectedArea?: {
        x: number;
        y: number;
        width: number;
        height: number;
        action: "erase" | "replace" | "insert";
        description?: string;
      };
      maskDataUrl?: string;
      caption?: string;
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

    // Processar máscara PNG se enviada pelo cliente (formato Data URL base64)
    let maskBuffer: Buffer | null = null;
    if (maskDataUrl && typeof maskDataUrl === "string" && maskDataUrl.startsWith("data:image")) {
      try {
        const base64Data = maskDataUrl.replace(/^data:image\/\w+;base64,/, "");
        maskBuffer = Buffer.from(base64Data, "base64");
      } catch (maskErr) {
        console.warn("[IMAGENS_EDITAR] Falha ao decodificar máscara:", maskErr);
      }
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

    let areaDirective = "";
    if (selectedArea) {
      let actionText = "";
      if (selectedArea.action === "erase") {
        actionText =
          "SURGICAL INPAINTING — ERASE & RECONSTRUCT: Completely remove and eliminate the element in the targeted area. Seamlessly inpaint and reconstruct the background with natural textures, lighting, and ambient shadows, making it look as if the element was never there.";
      } else if (selectedArea.action === "insert") {
        actionText =
          "SURGICAL INPAINTING — INSERT ELEMENT IN AREA: In the specified bounding area, organically insert and blend the requested new element or graphic. Seamlessly integrate shadows, ambient contact occlusion, lighting, reflections, and perspective with the surrounding scene, preserving 100% of the rest of the image completely untouched.";
      } else {
        actionText =
          "SURGICAL INPAINTING — REPLACE CONTENT: Replace the content inside the targeted region with the newly requested text/graphic. Ensure the new element fits seamlessly with surrounding typography and colors.";
      }
      areaDirective = `[TARGET REGION: ${selectedArea.description || `bounding area approx. (${Math.round(selectedArea.x)}%, ${Math.round(selectedArea.y)}%) to (${Math.round(selectedArea.x + selectedArea.width)}%, ${Math.round(selectedArea.y + selectedArea.height)}%)`}] [DIRECTIVE: ${actionText}]`;
    }

    // 3.1. Carregar BrandKit do usuário (fontes e cores oficiais) para travar a tipografia durante a edição
    let brandTypographyEditDirective =
      "- TYPOGRAPHY & CONTRAST INTEGRITY (/fontlock): Preserve 100% of the exact typeface family anatomy, letter curvature, and original color of any existing headline or text in the baseline image. On light/bright walls or backgrounds, keep headlines in their clean dark/primary brand color — NEVER change dark/colored text on a light wall into white text with a dark smoky shadow patch behind it!";
    try {
      const [onboardingSnap, profileSnap] = await Promise.all([
        adminDb.doc(`users/${userId}/business/onboarding`).get(),
        adminDb.doc(`users/${userId}/business/profile`).get(),
      ]);
      const onboardingData = onboardingSnap.exists ? onboardingSnap.data() : null;
      const profileData = profileSnap.exists ? profileSnap.data() : null;
      const bk = onboardingData?.brandKit || profileData?.brandKit || userData?.brandKit;
      const primaryColor = bk?.primaryColor || onboardingData?.primaryColor || profileData?.primaryColor;
      const secondaryColor = bk?.secondaryColor || onboardingData?.secondaryColor || profileData?.secondaryColor;
      const fonts = bk?.fonts;
      if (fonts && (fonts.primaryFont || fonts.secondaryFont || fonts.style)) {
        const fontSpec = [
          fonts.primaryFont ? `Primary/Title Font: "${fonts.primaryFont}"` : "",
          fonts.secondaryFont ? `Secondary/Body Font: "${fonts.secondaryFont}"` : "",
          fonts.style ? `Typography Style: "${fonts.style}"` : "",
        ].filter(Boolean).join(" | ");
        const colorSpec = [primaryColor, secondaryColor].filter(Boolean).join(", ");
        brandTypographyEditDirective = `- STRICT BRANDKIT TYPOGRAPHY & ADAPTIVE CONTRAST LOCK (/fontlock): Any edited or newly rendered text MUST strictly follow the user's official BrandKit typography (${fontSpec})${colorSpec ? ` and official brand colors (${colorSpec})` : ""}, preserving 100% of the exact letter anatomy, weight, and terminals of the baseline image's BrandKit font. On light backgrounds, render headlines cleanly in the BrandKit Primary Color (${primaryColor || "dark brand color"}) with ZERO smoky black shadow patches or dark boxes behind white text!`;
      }
    } catch {
      // Continua com a diretiva padrão de preservação tipográfica
    }

    const refinedPrompt = [
      "The uploaded image is the baseline master design.",
      areaDirective,
      `USER EDIT INSTRUCTION: "${instruction.trim()}"`,
      "STRICT DIRECTIVES:",
      "- Seamlessly apply the requested edits (such as erasing elements, changing titles, infographic copy, metrics, or specific visual accents).",
      "- Faithfully maintain the overall artistic aesthetic, color palette, lighting, branding, background elements, and layout harmony.",
      brandTypographyEditDirective,
      "- All modified typography or numbers must be razor-sharp, cleanly rendered with correct Brazilian Portuguese grammar/spelling, perfectly legible, and properly aligned.",
      "- STRICT PACKAGING & LABEL LOCK (/labellock): Do NOT alter, redraw, or hallucinate changes to any physical product packaging, jars, pouches, printed labels, label logos, or faces unless explicitly targeted by the user instruction.",
    ].filter(Boolean).join(" ");

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
        const createFormData = (includeMask: boolean) => {
          const fd = new FormData();
          fd.append("image", refBlob, "original.png");
          if (includeMask && maskBuffer) {
            const maskBlob = new Blob([maskBuffer], { type: "image/png" });
            fd.append("mask", maskBlob, "mask.png");
          }
          fd.append("model", model);
          fd.append("prompt", refinedPrompt);
          fd.append("n", "1");
          fd.append("size", nativeSize);
          fd.append("quality", "auto");
          return fd;
        };

        // Tenta primeiro com máscara se disponível; se falhar com 400, faz fallback imediato sem máscara
        let editRes = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: { Authorization: `Bearer ${openaiKey}` },
          body: createFormData(Boolean(maskBuffer)),
        });

        if (!editRes.ok && maskBuffer) {
          console.warn(`[IMAGENS_EDITAR] Tentativa com máscara falhou (${editRes.status}). Retentando sem máscara com prompt localizado...`);
          editRes = await fetch("https://api.openai.com/v1/images/edits", {
            method: "POST",
            headers: { Authorization: `Bearer ${openaiKey}` },
            body: createFormData(false),
          });
        }

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

    // 6. Registrar na galeria de mídia do usuário preservando a legenda original do post
    let preservedCaption = typeof body.caption === "string" && body.caption.trim() ? body.caption.trim() : null;
    let origHasPrintedLogo = true;
    if (imageUrl) {
      try {
        const origMediaSnap = await adminDb
          .collection(`users/${userId}/mediaGallery`)
          .where("url", "==", imageUrl)
          .limit(1)
          .get();
        if (!origMediaSnap.empty) {
          const origData = origMediaSnap.docs[0].data();
          if (!preservedCaption) {
            preservedCaption = origData?.caption || null;
          }
          origHasPrintedLogo = Boolean(origData?.hasPrintedLogo ?? origData?.brandKitApplied ?? true);
        }
      } catch (e) {
        console.warn("[IMAGENS_EDITAR] Aviso ao buscar dados originais:", e);
      }
    }

    const galleryDocId = `edit_${timestamp}_${editId}`;
    await adminDb.doc(`users/${userId}/mediaGallery/${galleryDocId}`).set({
      id: galleryDocId,
      url: publicUrl,
      originalUrl: imageUrl,
      caption: preservedCaption,
      prompt: instruction,
      modelUsed,
      type: "image-edit",
      hasPrintedLogo: origHasPrintedLogo,
      skipAutoLogo: origHasPrintedLogo,
      // Date é persistido como Timestamp pelo Admin SDK (não usar string ISO: quebra ordenação/leitura no admin)
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 7. Telemetria e Registro de Custo
    try {
      await logApiUsage({
        userId,
        provider: "openai",
        model: modelUsed,
        costUsd: 0.04,
        type: "image_edit",
      });
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

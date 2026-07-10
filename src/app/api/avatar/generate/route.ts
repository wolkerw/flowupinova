import { NextResponse, type NextRequest } from "next/server";
import { admin, adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";
import { getGlobalSettings } from "@/lib/services/settings-service-admin";
import { fal } from "@fal-ai/client";
import { Jimp } from "jimp";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    // 1. Obter chaves do ambiente e configurar Fal SDK
    const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    if (falKey) {
      const rawFalKey = falKey.trim().startsWith("Key ")
        ? falKey.trim().replace(/^Key\s+/i, "")
        : falKey.trim();
      fal.config({
        credentials: rawFalKey,
      });
    }

    // 2. Ler os dados do formulário (FormData)
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const prompt = (formData.get("prompt") as string) || "";
    const userId = formData.get("userId") as string;
    const styleFile = formData.get("styleFile") as File | null;
    const engine = "nanobanana_pro";

    if (!file || (!prompt.trim() && !styleFile) || !userId) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios ausentes: selfie de referência ausente, ou informe uma descrição em texto, ou envie uma foto de estilo profissional.",
        },
        { status: 400 }
      );
    }

    // 3. Fazer o upload do arquivo de referência para o Firebase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const projectId = process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c";
    const bucket = admin.storage().bucket(`${projectId}.firebasestorage.app`);

    const refId = crypto.randomUUID();
    const refFileRef = bucket.file(`users/${userId}/avatar_references/${refId}_ref.jpg`);
    const refDownloadToken = crypto.randomUUID();

    await refFileRef.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          firebaseStorageDownloadTokens: refDownloadToken,
        },
      },
    });

    const faceImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(refFileRef.name)}?alt=media&token=${refDownloadToken}`;
    console.log(`[AVATAR_GENERATE] Imagem de referência carregada: ${faceImageUrl}`);

    // 4. Buscar configurações do webhook do admin
    const settings = await getGlobalSettings();
    const webhookUrl = settings.generateAvatarWebhook;

    let generatedImageUrl = "";
    let generatedBy = "";

    // 5. Tentar chamar o webhook do n8n
    if (
      webhookUrl &&
      webhookUrl.startsWith("http") &&
      !webhookUrl.includes("gerador_avatar_twin")
    ) {
      console.log(`[AVATAR_GENERATE] Disparando webhook do n8n: ${webhookUrl}`);
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Server-Timeout": settings.serverTimeout,
          },
          body: JSON.stringify({
            faceImageUrl,
            userPrompt: prompt,
            userId,
            engine,
          }),
        });

        if (response.ok) {
          const resText = await response.text();
          try {
            const data = JSON.parse(resText);
            // Procurar por uma URL nos formatos comuns de retorno do n8n/webhook
            generatedImageUrl =
              data.imageUrl || data.url || data.generatedImageUrl || data.data?.image?.url || "";
            if (generatedImageUrl) {
              generatedBy = "n8n_webhook";
              console.log(`[AVATAR_GENERATE] Sucesso via webhook do n8n: ${generatedImageUrl}`);
            }
          } catch (jsonErr) {
            console.warn("[AVATAR_GENERATE] Resposta do webhook não era JSON válido:", resText);
          }
        } else {
          console.warn(
            `[AVATAR_GENERATE] Webhook retornou status ${response.status}. Acionando fallback...`
          );
        }
      } catch (webhookErr) {
        console.error("[AVATAR_GENERATE] Erro ao conectar com o webhook:", webhookErr);
      }
    }

    let imgBuffer: Buffer | null = null;
    let source = "nanobanana_ref";

    // 6. Fallback Nativo: Chamar o Nano Banana Pro (Gemini 3 Pro Image) se o webhook não respondeu
    if (!generatedImageUrl) {
      console.log(
        "[AVATAR_GENERATE] Iniciando fallback nativo via Nano Banana Pro (Gemini 3 Pro Image)..."
      );
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return NextResponse.json(
            { error: "Falha ao gerar o avatar. GEMINI_API_KEY ausente para o Nano Banana Pro." },
            { status: 500 }
          );
        }

        let styleJson: any = null;

        if (styleFile) {
          console.log(
            "[AVATAR_GENERATE] Imagem de estilo profissional fornecida. Analisando com Gemini 2.5 Flash Vision..."
          );
          const styleArrayBuffer = await styleFile.arrayBuffer();
          const styleBuffer = Buffer.from(styleArrayBuffer);
          const styleBase64 = styleBuffer.toString("base64");
          const styleMime = styleFile.type || "image/jpeg";

          try {
            const visionPrompt = `Analise detalhadamente a imagem fornecida (que representa um retrato profissional ideal) e descreva os seus elementos estéticos de forma estruturada.
Você DEVE responder exclusivamente no formato JSON abaixo, de forma estrita, sem qualquer introdução, conclusão ou marcação markdown de código (como \`\`\`json). Responda APENAS o JSON bruto:
{
  "clothing": "Descrição detalhada da vestimenta e estilo (ex: terno azul escuro moderno slim fit, camisa social branca sem gravata)",
  "background": "Descrição do cenário de fundo (ex: fundo cinza neutro de estúdio com iluminação suave degradê)",
  "pose": "Descrição detalhada da pose, enquadramento e mãos (ex: plano médio close-up, pose frontal corporativa clássica confiante)",
  "lighting": "Descrição detalhada da iluminação (ex: iluminação suave direcional estilo Rembrandt vindo da lateral com foco nos olhos)"
}`;

            const geminiVisionUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

            const geminiVisionResponse = await fetch(geminiVisionUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: visionPrompt },
                      {
                        inlineData: {
                          mimeType: styleMime,
                          data: styleBase64,
                        },
                      },
                    ],
                  },
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                },
              }),
            });

            if (geminiVisionResponse.ok) {
              const resData = await geminiVisionResponse.json();
              const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

              // Registrar log de consumo do Vision (gemini-3.5-flash)
              const usage = resData?.usageMetadata;
              if (usage && userId) {
                const pTokens = usage.promptTokenCount || 0;
                const cTokens = usage.candidatesTokenCount || 0;
                const costInput = pTokens * (0.075 / 1_000_000);
                const costOutput = cTokens * (0.3 / 1_000_000);
                const totalCost = costInput + costOutput;

                logApiUsage({
                  userId,
                  type: "vision_analysis",
                  provider: "google_gemini",
                  model: "gemini-3.5-flash",
                  costUsd: totalCost,
                  tokens: {
                    promptTokens: pTokens,
                    completionTokens: cTokens,
                    totalTokens: pTokens + cTokens,
                  },
                });
              }

              try {
                const cleanJsonText = rawText
                  .replace(/^```json\s*/i, "")
                  .replace(/```$/, "")
                  .trim();
                styleJson = JSON.parse(cleanJsonText);
                console.log(
                  "[AVATAR_GENERATE] Estilo extraído com sucesso via Gemini Vision:",
                  styleJson
                );
              } catch (jsonErr) {
                console.warn(
                  "[AVATAR_GENERATE] Erro ao analisar JSON do Gemini Vision:",
                  jsonErr,
                  rawText
                );
              }
            } else {
              console.warn(
                "[AVATAR_GENERATE] API do Gemini Vision retornou status de erro:",
                geminiVisionResponse.status
              );
            }
          } catch (geminiVisionErr) {
            console.error("[AVATAR_GENERATE] Erro ao chamar Gemini Vision:", geminiVisionErr);
          }
        }

        let cropBuffer = buffer;
        try {
          const image = await Jimp.read(buffer);
          const width = image.width;
          const height = image.height;
          if (width !== height) {
            const size = Math.min(width, height);
            const x = Math.max(0, Math.floor((width - size) / 2));
            const y = Math.max(0, Math.floor((height - size) / 2));
            image.crop({ x, y, w: size, h: size });
            cropBuffer = await image.getBuffer("image/jpeg");
          }
        } catch (e) {
          console.warn("[AVATAR_GENERATE] Falha no crop do Jimp:", e);
        }

        const base64Image = cropBuffer.toString("base64");
        const mimeType = "image/jpeg";

        const NANOBANANA_MODELS = [
          "gemini-3-pro-image",
          "gemini-3.1-flash-image",
          "gemini-3.5-flash-image",
        ];

        let clothingSection = `DIRETRIZES DE VESTUÁRIO: Vista a pessoa conforme as instruções fornecidas no prompt do usuário: "${prompt}".`;
        let backgroundSection = `CENÁRIO E AMBIENTE: Posicione a pessoa no cenário e fundo conforme as instruções fornecidas no prompt do usuário: "${prompt}".`;
        let poseSection = `ENQUADRAMENTO, POSE E MOVIMENTO: Configure a pose, gesto, enquadramento e ação do sujeito exatamente conforme as instruções fornecidas no prompt do usuário: "${prompt}". Caso o usuário não tenha especificado nenhuma pose ou ação nas instruções, adote uma postura corporativa clássica confiante e amigável com enquadramento em plano médio (medium close-up).`;
        let lightingSection = `ILUMINAÇÃO: Aplique a iluminação conforme as instruções fornecidas no prompt do usuário: "${prompt}". Caso não especifique, use uma iluminação profissional suave de retrato.`;

        if (styleJson) {
          clothingSection = `VESTUÁRIO DO RETRATO: Vista a pessoa exatamente com as seguintes roupas extraídas da imagem de estilo: ${styleJson.clothing || "terno moderno e camisa social"}. ${prompt ? `Complemento adicional de roupas e acessórios do usuário: ${prompt}` : ""}`;
          backgroundSection = `CENÁRIO DE FUNDO: Posicione a pessoa exatamente no cenário descrito: ${styleJson.background || "fundo de escritório moderno desfocado"}. ${prompt ? `Complemento adicional de cenário do usuário: ${prompt}` : ""}`;
          if (styleJson.pose) {
            poseSection = `ENQUADRAMENTO E COMPOSIÇÃO: Posicione e enquadre a pessoa simulando a seguinte pose e postura corporal: ${styleJson.pose}. ${prompt ? `Complemento adicional de pose/ação do usuário: ${prompt}` : ""}`;
          }
          if (styleJson.lighting) {
            lightingSection = `ILUMINAÇÃO DO RETRATO: Simule a seguinte iluminação profissional: ${styleJson.lighting}. ${prompt ? `Complemento adicional de iluminação do usuário: ${prompt}` : ""}`;
          }
        }

        const nanobananaPrompt = `Você é um Diretor de Fotografia e Retratista Editorial Sênior.
Com base na imagem de referência da pessoa fornecida (selfie), gere um retrato fotográfico profissional e ultra realista de altíssima fidelidade, mantendo estritamente as características físicas, expressão facial e consistência da identidade da pessoa (mesmo cabelo, barba, formato dos olhos e cor da pele).

DIRETRIZES ESTÉTICAS E TÉCNICAS (CONSOLIDADO):
1. ${poseSection}
2. ${lightingSection}
3. DETALHES DE CÂMERA E LENTE: Fotografia estilo retrato editorial, qualidade de câmera profissional DSLR com lente prime de 85mm ajustada em abertura f/2.8, foco perfeito e nítido nos olhos do sujeito com profundidade de campo rasa (fundo suavemente desfocado).
4. QUALIDADE E TEXTURA DA PELE: Retoque de pele profissional que preserve texturas naturais de pele (poros e imperfeições reais), eliminando qualquer visual artificial de cera ou distorções plásticas.
5. REGRAS NEGATIVAS: Sem textos escritos na imagem, sem logotipos, sem acessórios estranhos ou distorções anatômicas.

DIRETRIZES DE ESTILO, VESTUÁRIO E AMBIENTE:
- ${clothingSection}
- ${backgroundSection}`;

        let imageBytes: string | null = null;
        let modelUsed = "";

        for (const model of NANOBANANA_MODELS) {
          try {
            console.log(`[AVATAR_GENERATE] Tentando Nano Banana Pro com modelo ${model}...`);
            const nanobananaUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const response = await fetch(nanobananaUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: nanobananaPrompt },
                      {
                        inlineData: {
                          mimeType: mimeType,
                          data: base64Image,
                        },
                      },
                    ],
                  },
                ],
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const bytes = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              if (bytes) {
                imageBytes = bytes;
                modelUsed = model;
                console.log(
                  `[AVATAR_GENERATE] ✅ Sucesso total com o modelo Nano Banana ${model}!`
                );
                break;
              }
            }
          } catch (modelErr: any) {
            console.warn(`[AVATAR_GENERATE] Erro no modelo ${model}:`, modelErr.message);
          }
        }

        if (!imageBytes) {
          throw new Error(
            "Todos os modelos do Google Gemini Image (Nano Banana) falharam para a geração do avatar."
          );
        }

        imgBuffer = Buffer.from(imageBytes, "base64");
        generatedBy = `nanobanana_pro_${modelUsed}`;
        source = "nanobanana_ref";
        console.log(`[AVATAR_GENERATE] Sucesso na geração via Nano Banana Pro (${modelUsed})`);

        // Registrar log de consumo real no Firestore
        logApiUsage({
          userId,
          type: "avatar_generation",
          provider: "google_gemini",
          model: modelUsed,
          costUsd: 0.03,
        });
      } catch (bananaErr: any) {
        console.error("[AVATAR_GENERATE] Falha catastrófica no Nano Banana Pro:", bananaErr);
        return NextResponse.json(
          { error: "Erro na geração do avatar via Nano Banana Pro.", details: bananaErr.message },
          { status: 500 }
        );
      }
    }

    // 7. Fazer o download da imagem gerada se não tivermos ela em memória
    if (!imgBuffer && generatedImageUrl) {
      console.log(`[AVATAR_GENERATE] Fazendo download da imagem gerada: ${generatedImageUrl}`);
      const imgResponse = await fetch(generatedImageUrl);
      if (!imgResponse.ok) {
        throw new Error(`Falha ao obter imagem gerada da CDN (${imgResponse.status})`);
      }
      imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
    }

    if (!imgBuffer) {
      throw new Error("Buffer de imagem final indisponível para gravação.");
    }

    const genId = crypto.randomUUID();
    const genFileRef = bucket.file(`users/${userId}/mediaGallery/avatar_${genId}.jpg`);
    const genDownloadToken = crypto.randomUUID();

    await genFileRef.save(imgBuffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          firebaseStorageDownloadTokens: genDownloadToken,
        },
      },
    });

    const finalFirebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(genFileRef.name)}?alt=media&token=${genDownloadToken}`;
    console.log(`[AVATAR_GENERATE] Retrato profissional salvo no Storage: ${finalFirebaseUrl}`);

    // 8. Gravar o registro na subcoleção mediaGallery do Firestore do usuário
    const galleryRef = adminDb.collection("users").doc(userId).collection("mediaGallery");
    const galleryDocId = `avatar_${genId}`;

    await galleryRef.doc(galleryDocId).set({
      id: galleryDocId,
      url: finalFirebaseUrl,
      storagePath: genFileRef.name,
      source,
      prompt: prompt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      usedInPostId: null,
      fileName: `avatar_${genId}.jpg`,
      generatedBy,
      referenceImageUrl: faceImageUrl,
    });

    console.log(
      `[AVATAR_GENERATE] Avatar catalogado com sucesso na subcoleção mediaGallery: ${galleryDocId}`
    );

    return NextResponse.json({
      success: true,
      id: galleryDocId,
      url: finalFirebaseUrl,
      source,
    });
  } catch (error: any) {
    console.error("[AVATAR_GENERATE_ERROR] Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno no processamento do avatar.", details: error.message },
      { status: 500 }
    );
  }
}

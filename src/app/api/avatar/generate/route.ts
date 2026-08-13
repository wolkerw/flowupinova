import { NextResponse, type NextRequest } from "next/server";
import { admin, adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";
import { getGlobalSettings } from "@/lib/services/settings-service-admin";
import { getUserStoragePathAdmin } from "@/lib/services/storage-utils-admin";
import { fal } from "@fal-ai/client";
import { Jimp } from "jimp";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    // 1. Obter chaves do ambiente e configurar Fal SDK
    const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    const rawFalKey = falKey
      ? falKey.trim().startsWith("Key ")
        ? falKey.trim().replace(/^Key\s+/i, "")
        : falKey.trim()
      : null;

    if (rawFalKey) {
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

    const userStoragePath = await getUserStoragePathAdmin(userId);

    // 3. Fazer o upload da selfie de referência para o Firebase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const projectId = process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c";
    const bucket = admin.storage().bucket(`${projectId}.firebasestorage.app`);

    const refId = crypto.randomUUID();
    const refFileRef = bucket.file(`${userStoragePath}/avatar_references/${refId}_ref.jpg`);
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
    console.log(`[AVATAR_GENERATE] Imagem de selfie/referência carregada no Storage: ${faceImageUrl}`);

    // Upload da imagem de estilo profissional (se fornecida)
    let styleImageUrl: string | null = null;
    if (styleFile) {
      const styleArrayBuffer = await styleFile.arrayBuffer();
      const styleBuffer = Buffer.from(styleArrayBuffer);
      const styleRefId = crypto.randomUUID();
      const styleFileRef = bucket.file(`${userStoragePath}/avatar_references/${styleRefId}_style.jpg`);
      const styleDownloadToken = crypto.randomUUID();

      await styleFileRef.save(styleBuffer, {
        metadata: {
          contentType: styleFile.type || "image/jpeg",
          metadata: {
            firebaseStorageDownloadTokens: styleDownloadToken,
          },
        },
      });

      styleImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(styleFileRef.name)}?alt=media&token=${styleDownloadToken}`;
      console.log(`[AVATAR_GENERATE] Imagem de estilo carregada no Storage: ${styleImageUrl}`);
    }

    // 4. Buscar configurações do webhook do admin
    const settings = await getGlobalSettings();
    const webhookUrl = settings.generateAvatarWebhook;

    let generatedImageUrl = "";
    let generatedBy = "";

    // 5. Tentar chamar o webhook do n8n (Motor Preferencial para Digital Twin)
    if (webhookUrl && webhookUrl.trim().startsWith("http")) {
      console.log(`[AVATAR_GENERATE] Disparando webhook do n8n (Nano Banana Twin): ${webhookUrl}`);
      try {
        const response = await fetch(webhookUrl.trim(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Server-Timeout": String(settings.serverTimeout || 300),
          },
          body: JSON.stringify({
            faceImageUrl,
            styleImageUrl,
            userPrompt: prompt,
            userId,
            engine,
          }),
        });

        if (response.ok) {
          const resText = await response.text();
          try {
            const data = JSON.parse(resText);
            generatedImageUrl =
              data.imageUrl || data.url || data.generatedImageUrl || data.data?.image?.url || "";
            if (generatedImageUrl) {
              generatedBy = "n8n_webhook_nanobanana";
              console.log(`[AVATAR_GENERATE] Sucesso via webhook do n8n: ${generatedImageUrl}`);
            }
          } catch (jsonErr) {
            console.warn("[AVATAR_GENERATE] Resposta do webhook não era JSON válido:", resText);
          }
        } else {
          console.warn(
            `[AVATAR_GENERATE] Webhook retornou status ${response.status}. Acionando motor nativo Nano Banana Pro...`
          );
        }
      } catch (webhookErr) {
        console.error("[AVATAR_GENERATE] Erro ao conectar com o webhook:", webhookErr);
      }
    }

    let imgBuffer: Buffer | null = null;
    let source = "nanobanana_ref";

    // 6. Motor Nativo Nano Banana Pro (Condicionamento Multimodal de Imagem de Selfie)
    if (!generatedImageUrl) {
      console.log(
        "[AVATAR_GENERATE] 🍌 Iniciando motor nativo Nano Banana Pro com condicionamento de selfie..."
      );
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        let styleJson: any = null;

        // Se uma foto de estilo profissional foi fornecida, analisa via Gemini 3.5 Flash Vision
        if (styleFile && apiKey) {
          console.log(
            "[AVATAR_GENERATE] Analisando imagem de estilo profissional via Gemini 3.5 Flash Vision..."
          );
          const styleArrayBuffer = await styleFile.arrayBuffer();
          const styleBuffer = Buffer.from(styleArrayBuffer);
          const styleBase64 = styleBuffer.toString("base64");
          const styleMime = styleFile.type || "image/jpeg";

          try {
            const visionPrompt = `Analise detalhadamente a imagem fornecida (que representa um retrato profissional ideal) e descreva os seus elementos estéticos de forma estruturada.
Você DEVE responder exclusivamente no formato JSON abaixo, de forma estrita, sem qualquer introdução, conclusão ou marcação markdown de código:
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

              const usage = resData?.usageMetadata;
              if (usage && userId) {
                const pTokens = usage.promptTokenCount || 0;
                const cTokens = usage.candidatesTokenCount || 0;
                logApiUsage({
                  userId,
                  type: "vision_analysis",
                  provider: "google_gemini",
                  model: "gemini-3.5-flash",
                  costUsd: pTokens * (0.075 / 1_000_000) + cTokens * (0.3 / 1_000_000),
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
                console.warn("[AVATAR_GENERATE] Erro ao analisar JSON do Gemini Vision:", jsonErr);
              }
            }
          } catch (geminiVisionErr) {
            console.error("[AVATAR_GENERATE] Erro ao chamar Gemini Vision:", geminiVisionErr);
          }
        }

        let clothingSection = `DIRETRIZES DE VESTUÁRIO: Vista a pessoa exatamente conforme as instruções fornecidas no prompt do usuário: "${prompt}".`;
        let backgroundSection = `CENÁRIO E AMBIENTE: Posicione a pessoa no cenário e fundo conforme as instruções fornecidas no prompt do usuário: "${prompt}".`;
        let poseSection = `ENQUADRAMENTO, POSE E MOVIMENTO: Configure a pose, gesto, enquadramento e ação do sujeito conforme as instruções fornecidas no prompt do usuário: "${prompt}". Caso o usuário não tenha especificado nenhuma pose ou ação nas instruções, adote uma postura corporativa clássica confiante e amigável em plano médio (medium close-up).`;
        let lightingSection = `ILUMINAÇÃO: Aplique iluminação profissional suave de estúdio editorial.`;

        if (styleJson) {
          clothingSection = `VESTUÁRIO DO RETRATO: Vista a pessoa exatamente com as seguintes roupas extraídas da imagem de estilo: ${styleJson.clothing || "terno moderno e camisa social"}. ${prompt ? `Complemento adicional de roupas: ${prompt}` : ""}`;
          backgroundSection = `CENÁRIO DE FUNDO: Posicione a pessoa no cenário: ${styleJson.background || "fundo de escritório moderno desfocado"}. ${prompt ? `Complemento adicional de cenário: ${prompt}` : ""}`;
          if (styleJson.pose) {
            poseSection = `ENQUADRAMENTO E COMPOSIÇÃO: Enquadre a pessoa simulando a seguinte pose e postura corporal: ${styleJson.pose}. ${prompt ? `Complemento adicional de pose: ${prompt}` : ""}`;
          }
          if (styleJson.lighting) {
            lightingSection = `ILUMINAÇÃO DO RETRATO: Simule a iluminação profissional: ${styleJson.lighting}. ${prompt ? `Complemento adicional de iluminação: ${prompt}` : ""}`;
          }
        }

        const nanobananaPrompt = `Você é um Diretor de Fotografia e Retratista Editorial Sênior.
Com base na imagem de referência da pessoa fornecida nesta selfie, gere um retrato fotográfico profissional e ultra realista de altíssima fidelidade, mantendo estritamente as características físicas, expressão facial, traços do rosto e consistência da identidade da pessoa (mesmo cabelo, barba, formato dos olhos e cor da pele da selfie).

DIRETRIZES ESTÉTICAS E TÉCNICAS (CONSOLIDADO):
1. ${poseSection}
2. ${lightingSection}
3. DETALHES DE CÂMERA E LENTE: Fotografia estilo retrato editorial, qualidade de câmera profissional DSLR com lente prime de 85mm ajustada em abertura f/2.8, foco perfeito e nítido nos olhos do sujeito com profundidade de campo rasa (fundo suavemente desfocado).
4. QUALIDADE E TEXTURA DA PELE: Retoque de pele profissional que preserve texturas naturais de pele (poros e imperfeições reais), eliminando qualquer visual artificial de cera ou distorções plásticas.
5. REGRAS NEGATIVAS: Sem textos escritos na imagem, sem logotipos, sem acessórios estranhos ou distorções anatômicas.

DIRETRIZES DE ESTILO, VESTUÁRIO E AMBIENTE:
- ${clothingSection}
- ${backgroundSection}`;

        // Tentativa via Fal.ai Flux Kontext (Motor Nano Banana com Condicionamento Visual)
        if (rawFalKey) {
          try {
            console.log("[AVATAR_GENERATE] 🍌 Chamando Fal.ai (Flux Kontext / Nano Banana Pro)...");
            const queueResponse = await fetch("https://queue.fal.run/fal-ai/flux-pro/kontext", {
              method: "POST",
              headers: {
                Authorization: `Key ${rawFalKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                prompt: nanobananaPrompt,
                image_url: faceImageUrl,
                aspect_ratio: "1:1",
              }),
            });

            if (queueResponse.ok) {
              const queueData = await queueResponse.json();
              const requestId = queueData.request_id;
              if (requestId) {
                // Polling síncrono do status do Fal.ai
                const statusUrl = `https://queue.fal.run/fal-ai/flux-pro/requests/${requestId}/status`;
                const responseUrl = `https://queue.fal.run/fal-ai/flux-pro/requests/${requestId}`;
                let attempts = 0;
                while (attempts < 45) {
                  await new Promise((r) => setTimeout(r, 2000));
                  attempts++;

                  const statusRes = await fetch(statusUrl, {
                    headers: { Authorization: `Key ${rawFalKey}` },
                  });
                  if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    if (statusData.status === "COMPLETED") {
                      const resResponse = await fetch(responseUrl, {
                        headers: { Authorization: `Key ${rawFalKey}` },
                      });
                      if (resResponse.ok) {
                        const resData = await resResponse.json();
                        const imgUrl = resData.images?.[0]?.url || resData.image?.url;
                        if (imgUrl) {
                          generatedImageUrl = imgUrl;
                          generatedBy = "falai_flux_kontext_nanobanana";
                          console.log(
                            `[AVATAR_GENERATE] ✅ Sucesso total via Fal.ai (Flux Kontext): ${generatedImageUrl}`
                          );
                          break;
                        }
                      }
                    }
                  }
                }
              }
            } else {
              const errText = await queueResponse.text();
              console.warn("[AVATAR_GENERATE_WARN] Falha na fila do Fal.ai:", errText);
            }
          } catch (falErr) {
            console.warn(
              "[AVATAR_GENERATE] Falha no Fal.ai Flux Kontext:",
              falErr
            );
          }
        }

        // Se o Fal.ai não tiver gerado, tenta o condicionamento multimodal via Google Gemini Nano Banana Pro
        if (!generatedImageUrl && apiKey) {
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
            "gemini-3.5-flash",
            "gemini-2.5-flash",
            "gemini-3.1-flash-lite",
            "gemini-2.5-pro",
          ];

          for (const model of NANOBANANA_MODELS) {
            try {
              console.log(`[AVATAR_GENERATE] 🍌 Tentando Nano Banana Pro Multimodal com modelo ${model}...`);
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
                  imgBuffer = Buffer.from(bytes, "base64");
                  generatedBy = `nanobanana_pro_${model}`;
                  console.log(`[AVATAR_GENERATE] ✅ Sucesso total via Nano Banana Pro Multimodal (${model})!`);
                  break;
                }
              }
            } catch (modelErr: any) {
              console.warn(`[AVATAR_GENERATE] Erro no modelo ${model}:`, modelErr.message);
            }
          }
        }

        if (!imgBuffer && !generatedImageUrl) {
          throw new Error("Falha ao gerar o avatar através do motor Nano Banana Pro.");
        }

        logApiUsage({
          userId,
          type: "avatar_generation",
          provider: "falai",
          model: "nanobanana_pro",
          costUsd: 0.03,
        });
      } catch (bananaErr: any) {
        console.error("[AVATAR_GENERATE] Falha no motor Nano Banana Pro:", bananaErr);
        return NextResponse.json(
          { error: "Erro na geração do avatar via Nano Banana Pro.", details: bananaErr.message },
          { status: 500 }
        );
      }
    }

    // 7. Fazer o download da imagem gerada se vier da CDN/Webhook
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
    const genFileRef = bucket.file(`${userStoragePath}/mediaGallery/avatar_${genId}.jpg`);
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
      styleImageUrl: styleImageUrl || null,
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

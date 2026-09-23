import type { AIImageFormat } from "@/lib/types/ai-image-general";
import type { ReferenceInput } from "./types";

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 2000): Promise<Response> {
  let lastResponse: Response | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      lastResponse = response;
      if (response.status === 429 || response.status >= 500) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      return response;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  return lastResponse || fetch(url, options);
}

export class ImageModelExecutor {
  public static async execute(params: {
    prompt: string;
    format: AIImageFormat;
    references?: ReferenceInput[];
    preferredModel?: string;
  }): Promise<{
    imageBuffer: Buffer;
    modelUsed: string;
    durationMs: number;
  }> {
    const startTime = Date.now();
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // Resoluções nativas da OpenAI que eliminam necessidade de crop destrutivo
    const nativeSize =
      params.format === "portrait"
        ? "1024x1280"
        : params.format === "story"
          ? "864x1536"
          : params.format === "square"
            ? "1024x1024"
            : params.format === "banner"
              ? "1200x624"
              : "1792x1024";

    const subjectRef = params.references?.find((r) => r.role === "product_subject");

    // Diretiva estrita de proibição de logomarca gerada
    const zeroLogoDirective =
      " [CRITICAL MANDATE — ZERO LOGOS & CLEAN LOGO SPACE: Absolutely DO NOT draw, invent, or render any logos, brand emblems, corporate icons, or badges. Leave a clean, open space in the top corner specifically reserved for manual logo overlay.]";

    const subjectDirective = subjectRef
      ? " [CRITICAL MANDATE — HERO SUBJECT PRESERVATION: The attached reference image contains the real person or product provided by the user. Maintain their exact facial features, identity, hair, clothing (if person) or packaging, shape, colors, label details (if product) with high fidelity, placing them naturally in the scene as the hero protagonist.]"
      : "";

    const modelsToTry = [
      { provider: "openai", model: params.preferredModel || "gpt-image-2" },
      { provider: "google", model: "gemini-2.5-flash-image" },
      { provider: "google", model: "gemini-3-pro-image" },
      { provider: "google", model: "gemini-2.0-flash-exp" },
    ];

    let lastError = "";

    for (const cfg of modelsToTry) {
      try {
        if (cfg.provider === "openai" && openaiKey) {
          let openaiPrompt = params.prompt;
          if (!openaiPrompt.includes("ZERO LOGOS")) {
            openaiPrompt += zeroLogoDirective;
          }
          if (subjectRef && !openaiPrompt.includes("HERO SUBJECT PRESERVATION")) {
            openaiPrompt += subjectDirective;
          }

          // Se houver foto do sujeito (pessoa ou produto) da Etapa 5, tentar Image-to-Image / Edits da OpenAI
          if (subjectRef && subjectRef.base64) {
            try {
              const imageBuf = Buffer.from(subjectRef.base64, "base64");
              const subjectBlob = new Blob([imageBuf], { type: subjectRef.mimeType || "image/png" });
              const editsFormData = new FormData();
              editsFormData.append("image", subjectBlob, "subject.png");
              editsFormData.append("model", cfg.model);
              editsFormData.append("prompt", openaiPrompt);
              editsFormData.append("n", "1");
              editsFormData.append("size", nativeSize);

              const editRes = await fetch("https://api.openai.com/v1/images/edits", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${openaiKey}`,
                },
                body: editsFormData,
              });

              if (editRes.ok) {
                const data = await editRes.json();
                const b64 = data?.data?.[0]?.b64_json;
                const imgUrl = data?.data?.[0]?.url;
                if (b64) {
                  return {
                    imageBuffer: Buffer.from(b64, "base64"),
                    modelUsed: cfg.model,
                    durationMs: Date.now() - startTime,
                  };
                } else if (imgUrl) {
                  const downloadRes = await fetch(imgUrl);
                  if (downloadRes.ok) {
                    const ab = await downloadRes.arrayBuffer();
                    return {
                      imageBuffer: Buffer.from(ab),
                      modelUsed: cfg.model,
                      durationMs: Date.now() - startTime,
                    };
                  }
                }
              } else {
                const editErrTxt = await editRes.text().catch(() => "");
                console.warn(`[ImageModelExecutor] OpenAI edits (${cfg.model}) retornou ${editRes.status}: ${editErrTxt.slice(0, 150)}`);
              }
            } catch (editEx) {
              console.warn(`[ImageModelExecutor] Falha na chamada de edits OpenAI:`, editEx);
            }
          }

          // Geração padrão via OpenAI images/generations
          const res = await fetchWithRetry("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: cfg.model,
              prompt: openaiPrompt,
              n: 1,
              size: nativeSize,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const b64 = data?.data?.[0]?.b64_json;
            const imgUrl = data?.data?.[0]?.url;
            if (b64) {
              return {
                imageBuffer: Buffer.from(b64, "base64"),
                modelUsed: cfg.model,
                durationMs: Date.now() - startTime,
              };
            } else if (imgUrl) {
              const downloadRes = await fetch(imgUrl);
              if (downloadRes.ok) {
                const ab = await downloadRes.arrayBuffer();
                return {
                  imageBuffer: Buffer.from(ab),
                  modelUsed: cfg.model,
                  durationMs: Date.now() - startTime,
                };
              }
            }
          } else {
            const errTxt = await res.text().catch(() => "");
            lastError = `OpenAI ${cfg.model} retornou ${res.status}: ${errTxt.slice(0, 150)}`;
            console.warn(`[ImageModelExecutor] ${lastError}`);
          }
        } else if (cfg.provider === "google" && geminiKey) {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${geminiKey}`;
          
          let geminiPrompt = params.prompt;
          if (!geminiPrompt.includes("ZERO LOGOS")) {
            geminiPrompt += zeroLogoDirective;
          }
          if (subjectRef && !geminiPrompt.includes("HERO SUBJECT PRESERVATION")) {
            geminiPrompt = `${subjectDirective}\n\n${geminiPrompt}`;
          }

          const parts: any[] = [{ text: geminiPrompt }];

          // Anexar imagem da pessoa/produto da Etapa 5 como parte multimodal direta
          if (params.references && params.references.length > 0) {
            for (const ref of params.references.slice(0, 2)) {
              if (ref.base64 && ref.mimeType) {
                parts.push({
                  inlineData: {
                    mimeType: ref.mimeType,
                    data: ref.base64,
                  },
                });
              }
            }
          }

          const getGeminiAspectRatio = (fmt: AIImageFormat): string => {
            switch (fmt) {
              case "portrait":
                return "3:4";
              case "story":
                return "9:16";
              case "landscape":
              case "banner":
                return "16:9";
              case "square":
              default:
                return "1:1";
            }
          };

          const payload = {
            contents: [{ parts }],
            generationConfig: {
              responseModalities: ["IMAGE"],
              imageConfig: {
                aspectRatio: getGeminiAspectRatio(params.format),
              },
            },
          };

          let res = await fetchWithRetry(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok && res.status === 400) {
            // Tentar sem imageConfig
            res = await fetchWithRetry(geminiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { responseModalities: ["IMAGE"] },
              }),
            });
          }

          if (res.ok) {
            const data = await res.json();
            let b64: string | undefined;
            const candidateParts = data?.candidates?.[0]?.content?.parts;
            if (Array.isArray(candidateParts)) {
              for (const part of candidateParts) {
                if (part?.inlineData?.data) {
                  b64 = part.inlineData.data;
                  break;
                }
              }
            }
            if (b64) {
              return {
                imageBuffer: Buffer.from(b64, "base64"),
                modelUsed: cfg.model,
                durationMs: Date.now() - startTime,
              };
            }
          } else {
            const errTxt = await res.text().catch(() => "");
            lastError = `Gemini ${cfg.model} retornou ${res.status}: ${errTxt.slice(0, 150)}`;
            console.warn(`[ImageModelExecutor] ${lastError}`);
          }
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn(`[ImageModelExecutor] Falha na execução com ${cfg.model}:`, lastError);
      }
    }

    throw new Error(`Falha em todos os modelos de geração de imagem. Último erro: ${lastError}`);
  }
}

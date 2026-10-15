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
    fallbackModel?: string;
    quality?: string;
    referenceMode?: "style_only" | "campaign_identity";
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
    const logoRef = params.references?.find(
      (r) => r.role === "business_logo" || r.role === "official_logo"
    );
    const hasLogo = Boolean(logoRef);

    // REGRA INVIOLÁVEL: PROIBIÇÃO ABSOLUTA DE LOGOS geradas por difusão/IA.
    // O modelo de difusão NUNCA deve inventar logomarcas, ícones de sol/flor, símbolos em celulares ou caricaturas.
    // O espaço superior deve vir sempre limpo e reservado para a aplicação digital da logo oficial.
    const zeroLogoDirective =
      " [CRITICAL MANDATE — POST BRANDING & EMPTY LOGO SPACE: The top-left corner of the poster layout MUST remain completely empty, clean and free blank negative space. Do NOT generate floating digital logos, artificial company emblems, or brand watermarks in the background or corners. CRITICAL EXCEPTION FOR PHYSICAL PRODUCTS: Real physical products, packaging, jars, bottles, and merchandise from reference photos MUST preserve their authentic printed labels, original brand names, typography, and graphics 100% intact. Do NOT erase or abstract packaging labels into blank color patches.]";

    const logoDirective =
      " [CRITICAL MANDATE — MANDATORY BUSINESS LOGO INTEGRATION: The official logo is added digitally in post-processing. The top-left corner MUST remain 100% BLANK, EMPTY and UNBRANDED negative space. Do NOT draw floating logos or brand badges in the poster layout. Real product packaging labels must remain authentic.]";

    const subjectDirective = subjectRef
      ? " [CRITICAL MANDATE — HERO SUBJECT & PRODUCT LABEL PRESERVATION: The attached reference image contains the real person or product provided by the user. Maintain their exact facial features (if person) or authentic packaging, shape, printed label graphics, original brand name on package, product title, and colors (if product) with high fidelity. Place them naturally in the scene as the hero protagonist without altering or erasing the physical product packaging label.]"
      : "";

    const getProvider = (m: string): "openai" | "google" =>
      m.startsWith("gemini") ? "google" : "openai";

    const preferred = params.preferredModel || "gpt-image-2";
    const fallback = params.fallbackModel || "gemini-2.5-flash-image";

    const defaultList = [
      { provider: "openai" as const, model: "gpt-image-2" },
      { provider: "openai" as const, model: "gpt-image-2.5-sunburst" },
      { provider: "openai" as const, model: "gpt-image-2.5-flare" },
      { provider: "google" as const, model: "gemini-2.5-flash-image" },
      { provider: "google" as const, model: "gemini-3-pro-image" },
    ];

    const modelsToTry = [
      { provider: getProvider(preferred), model: preferred },
      { provider: getProvider(fallback), model: fallback },
      ...defaultList.filter((d) => d.model !== preferred && d.model !== fallback),
    ];

    let lastError = "";

    for (const cfg of modelsToTry) {
      try {
        if (cfg.provider === "openai" && openaiKey) {
          let openaiPrompt = params.prompt;
          if (hasLogo) {
            if (!openaiPrompt.includes("MANDATORY BUSINESS LOGO INTEGRATION")) {
              openaiPrompt += logoDirective;
            }
          } else {
            // Sem logo: garantir proibição de logos no layout mantendo rótulos intactos
            if (!openaiPrompt.includes("POST BRANDING & EMPTY LOGO SPACE") && !openaiPrompt.includes("ABSOLUTE PROHIBITION")) {
              openaiPrompt += zeroLogoDirective;
            }
          }
          if (subjectRef && !openaiPrompt.includes("HERO SUBJECT & PRODUCT LABEL PRESERVATION") && !openaiPrompt.includes("HERO SUBJECT PRESERVATION")) {
            openaiPrompt += subjectDirective;
          }
          // Regra mandatória reforçada: topo limpo para overlay do post, com preservação integral de rótulos de produtos físicos
          openaiPrompt = `[MANDATORY POST BRANDING DIRECTIVE: Top corners must be completely clean, unbranded negative space for digital post overlay. Do NOT generate floating logos or artificial brand marks in the scene background. CRITICAL: Physical product packaging and labels from user references MUST remain 100% intact with authentic printed text and branding.] ${openaiPrompt} [STRICT PROHIBITION: Do NOT draw artificial header logos. Keep authentic product packaging labels intact.]`;

          const isGpt25 = cfg.model.includes("2.5");
          const isGptImage = cfg.model.startsWith("gpt-image-");
          const selectedQuality = params.quality || (isGpt25 ? "auto" : "medium");

          // Apenas fotos reais de sujeito/produto (pessoa ou produto) vão para edits. Logomarcas NUNCA são enviadas como base para edits.
          const primaryReference = subjectRef?.base64 ? subjectRef : null;

          if (primaryReference && primaryReference.base64) {
            try {
              const imageBuf = Buffer.from(primaryReference.base64, "base64");
              const refBlob = new Blob([imageBuf], { type: primaryReference.mimeType || "image/png" });
              const editsFormData = new FormData();
              editsFormData.append(
                "image",
                refBlob,
                "subject.png"
              );
              editsFormData.append("model", cfg.model);
              editsFormData.append("prompt", openaiPrompt);
              editsFormData.append("n", "1");
              editsFormData.append("size", nativeSize);
              if (isGptImage || isGpt25) {
                editsFormData.append("quality", selectedQuality);
              }

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
          const requestBody: Record<string, any> = {
            model: cfg.model,
            prompt: openaiPrompt,
            n: 1,
            size: nativeSize,
          };
          if (isGptImage || isGpt25) {
            requestBody.quality = selectedQuality;
          } else if (cfg.model === "dall-e-3") {
            requestBody.quality = selectedQuality === "high" || selectedQuality === "xhigh" ? "hd" : "standard";
          }

          const res = await fetchWithRetry("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify(requestBody),
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
          if (hasLogo) {
            if (!geminiPrompt.includes("MANDATORY BUSINESS LOGO INTEGRATION")) {
              geminiPrompt = `${logoDirective}\n\n${geminiPrompt}`;
            }
          } else {
            // Sem logo: garantir proibição absoluta no prompt final
            if (!geminiPrompt.includes("ZERO LOGOS") && !geminiPrompt.includes("ABSOLUTE PROHIBITION")) {
              geminiPrompt += zeroLogoDirective;
            }
          }
          if (subjectRef && !geminiPrompt.includes("HERO SUBJECT PRESERVATION")) {
            geminiPrompt = `${subjectDirective}\n\n${geminiPrompt}`;
          }

          const styleRef = params.references?.find((r) => r.role === "style_reference");
          if (
            styleRef &&
            params.referenceMode === "campaign_identity" &&
            !geminiPrompt.includes("CAMPAIGN LAYOUT ARCHITECTURE")
          ) {
            const campaignDirective = `[CRITICAL MANDATE — BRANDING DNA HERITAGE & FRESH CREATIVE SUBJECT]:
The attached reference image is the BRAND GUIDELINE / MASTER KEY ART for this campaign series.
1. DO NOT REPLICATE THE PEOPLE, CHARACTERS, OR POSES from the reference image. The characters and actions in the new image must be FRESH, ORIGINAL, and created specifically according to the user prompt.
2. REPLICATE THE CAMPAIGN'S SIGNATURE BRANDING DNA:
   - Incorporate the signature 3D glowing neon light ribbons/tubes (in electric blue and warm orange) swirling dynamically around the new subject.
   - Maintain the dark cinematic studio lighting and subtle floor reflections.
   - Maintain the clean, modern layout balance with glassmorphic translucent badges and typography on the right.
   - Keep the top-left corner 100% clean and unbranded for post-production logo overlay.`;
            geminiPrompt = `${campaignDirective}\n\n${geminiPrompt}`;
          }

          const parts: any[] = [{ text: geminiPrompt }];

          // Anexar imagem do sujeito e referências de estilo como partes multimodais
          if (params.references && params.references.length > 0) {
            const prioritizedRefs = [
              ...params.references.filter((r) => r.role === "product_subject"),
              ...params.references.filter((r) => r.role === "style_reference"),
            ].slice(0, 2);

            for (const ref of prioritizedRefs) {
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

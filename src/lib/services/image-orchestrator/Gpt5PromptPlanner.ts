import type {
  Gpt5PlannerInput,
  Gpt5VisualPlanResponse,
  OrchestratorPlanResult,
} from "./types";

export class Gpt5PromptPlanner {
  private static readonly SYSTEM_PROMPT = `
Você é o Diretor Criativo e Especialista Sênior em Planejamento Visual da NumVapt.
Sua missão é atuar como intermediário inteligente entre o briefing do usuário e o modelo gerador de imagens OpenAI (gpt-image-2).

Você deve analisar o briefing, as diretrizes de marca (BrandKit), o objetivo e as referências, e produzir um plano visual estruturado em JSON e um prompt altamente detalhado, específico e descritivo em inglês para o gpt-image-2.

DIRETRIZES FUNDAMENTAIS DE COMPOSIÇÃO DO PROMPT DO GPT IMAGE 2:
1. NUNCA resuma o briefing em poucas palavras. O prompt gerado para o gpt-image-2 deve ser rico, minucioso e estruturado em 10 blocos:
   [1. INTENDED GOAL]: Objetivo comercial/editorial claro.
   [2. SCENE & CONTEXT]: Descrição do ambiente, profundidade, planos de fundo e atmosfera.
   [3. HERO SUBJECT]: Detalhes do sujeito ou produto principal (postura, expressão, materiais).
   [4. COMPOSITION & PLACEMENT]: Distribuição visual e pontos focais equilibrados.
   [5. FRAMING & PERSPECTIVE]: Ângulo de câmera, lente (ex: 50mm, 85mm f/1.8), proporção.
   [6. LIGHTING & COLOR]: Iluminação profissional (softbox, rim light, temperatura) e paleta cromática harmônica.
   [7. TEXTURES & FINISH]: Acabamentos de estúdio de alta fidelidade, reflexos e realismo.
   [8. VISUAL STYLE]: Fotografia comercial moderna, sem distorções.
   [9. BRAND & REFERENCES]: Instrução precisa de preservação da identidade visual oficial da marca sem inventar logotipos fictícios.
   [10. CRITICAL SAFE MARGINS]: REGRA INVIOLÁVEL DE ZERO CROP. Deixar 15% a 20% de margem de respiro livre em todas as bordas externas (superior, inferior e laterais). Nenhum texto, logo ou elemento essencial pode encostar ou ficar próximo das bordas.

DIRETRIZES DE TEXTO / INFOGRÁFICO:
- Se textOverlayMode for NONE: Instruir ZERO TEXT, fotografia pura sem letras ou legendas.
- Se textOverlayMode for TITLE_ONLY: Incluir headline em português com tipografia nítida, elegante e contrastante no topo ou centro com margem de segurança.
- Se textOverlayMode for INFOGRAPHIC: Criar layout dinâmico adaptado ao briefing (badges flutuantes, callouts com linhas sutis, cards de benefícios ou estatísticas modernas), com espaçamento generoso e textos nítidos em português (pt-BR).

REGRAS DE CONFORMIDADE:
- Responda OBRIGATORIAMENTE em formato JSON válido respeitando o schema solicitado.
- Não inclua markdown adicional ou texto fora do JSON.
`;

  public static async plan(input: Gpt5PlannerInput): Promise<OrchestratorPlanResult> {
    const startTime = Date.now();
    const openaiKey = process.env.OPENAI_API_KEY;

    // Tentar planejamento com GPT-5 (ou gpt-4o / gemini como fallback ordenado)
    if (openaiKey) {
      try {
        const userPrompt = this.buildUserPrompt(input);
        const modelsToTry = ["gpt-5", "gpt-4o", "gpt-4o-mini"];

        for (const model of modelsToTry) {
          try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiKey}`,
              },
              body: JSON.stringify({
                model,
                messages: [
                  { role: "system", content: this.SYSTEM_PROMPT },
                  { role: "user", content: userPrompt },
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
              }),
            });

            if (res && res.ok) {
              const data = await res.json();
              const rawContent = data?.choices?.[0]?.message?.content;
              if (rawContent) {
                const parsedPlan = this.validateAndNormalizePlan(JSON.parse(rawContent), input);
                const duration = Date.now() - startTime;
                return {
                  plannerModelUsed: model,
                  plannerDurationMs: duration,
                  visualPlan: parsedPlan,
                  compiledImagePrompt: parsedPlan.imagePrompt,
                  compiledNegativePrompt: parsedPlan.negativePrompt,
                };
              }
            } else if (res) {
              const errTxt = await res.text().catch(() => "");
              console.warn(`[Gpt5PromptPlanner] Erro na OpenAI (${model}): ${res.status} - ${errTxt.slice(0, 150)}`);
            }
            // Se o primeiro modelo falhar ou não retornar escolhas estruturadas, cai para o plano determinístico
            break;
          } catch (modelErr) {
            console.warn(`[Gpt5PromptPlanner] Exceção ao tentar ${model}:`, modelErr);
            break;
          }
        }
      } catch (err) {
        console.warn("[Gpt5PromptPlanner] Falha geral no provedor OpenAI:", err);
      }
    }

    // Fallback inteligente: construtor sintético robusto garantindo conformidade sem travar a pipeline
    const fallbackPlan = this.createDeterministicPlan(input);
    return {
      plannerModelUsed: "deterministic-rules-engine",
      plannerDurationMs: Date.now() - startTime,
      visualPlan: fallbackPlan,
      compiledImagePrompt: fallbackPlan.imagePrompt,
      compiledNegativePrompt: fallbackPlan.negativePrompt,
    };
  }

  private static buildUserPrompt(input: Gpt5PlannerInput): string {
    const brand = input.brandKit;
    const brandSection =
      brand && brand.enabled
        ? `
BRANDKIT DO CLIENTE:
- Nome da Empresa: ${brand.businessName}
- Segmento: ${brand.segment || "Geral"}
- Cores Primárias: ${brand.primaryColors.join(", ")}
- Cores Secundárias: ${brand.secondaryColors.join(", ")}
- Estilo Visual: ${brand.visualStyle || "Moderno e profissional"}
- Tom de Voz: ${brand.toneOfVoice || "Corporativo e confiável"}
- Restrições: ${brand.restrictions?.join("; ") || "Nenhuma"}
- Logomarca Oficial Disponível: ${brand.logoUrl ? "Sim (URL fornecida)" : brand.hasLocalOfficialLogo ? "Sim (NumVapt local)" : "Não"}
`
        : "BrandKit: Desativado ou não fornecido pelo usuário.";

    const referencesSection =
      input.referenceImages && input.referenceImages.length > 0
        ? `
IMAGENS DE REFERÊNCIA ANEXADAS:
${input.referenceImages
  .map(
    (ref, i) =>
      `- Imagem ${i + 1}: Papel "${ref.role}", Tipo: ${ref.mimeType}. Descrição: ${ref.description || "Referência visual"}`
  )
  .join("\n")}
`
        : "Nenhuma imagem de referência externa anexada.";

    return `
BRIEFING ORIGINAL DO USUÁRIO:
"${input.userBrief}"

PARÂMETROS DE PRODUÇÃO:
- Objetivo: ${input.objective}
- Formato: ${input.format} (${input.width}x${input.height})
- Estilo Selecionado: ${input.stylePreference}
- Modo de Sobreposição de Texto: ${input.textOverlayMode || "NONE"}
- Título/Headline Desejada: ${input.productHeadline || "Não especificada"}
- Instruções Negativas do Usuário: ${input.negativeInstructions || "Nenhuma"}

${brandSection}
${referencesSection}
${input.compiledPrompt ? `\nDIRETRIZES TÉCNICAS E DE MARCA PRÉ-COMPILADAS:\n${input.compiledPrompt}\n` : ""}

Gere o JSON completo e estruturado conforme o schema com o prompt em inglês perfeito para gpt-image-2.
`;
  }

  private static validateAndNormalizePlan(raw: any, input: Gpt5PlannerInput): Gpt5VisualPlanResponse {
    const brand = input.brandKit;
    const safeAspect = input.format === "portrait" ? "1024x1280" : input.format === "story" ? "864x1536" : "1024x1024";

    return {
      schemaVersion: "1.0",
      requestType: "generate",
      confidence: typeof raw.confidence === "number" ? raw.confidence : 0.95,
      needsClarification: Boolean(raw.needsClarification),
      clarifyingQuestions: Array.isArray(raw.clarifyingQuestions) ? raw.clarifyingQuestions : [],
      interpretation: {
        goal: raw.interpretation?.goal || input.objective,
        subject: raw.interpretation?.subject || input.userBrief.slice(0, 100),
        intendedUse: raw.interpretation?.intendedUse || `Arte publicitária para ${input.format}`,
        audience: raw.interpretation?.audience || brand?.audience || "Público geral",
      },
      visualPlan: {
        scene: raw.visualPlan?.scene || "Ambiente moderno e iluminado de alto padrão comercial.",
        composition: raw.visualPlan?.composition || "Composição central equilibrada com 20% de margens seguras.",
        framing: raw.visualPlan?.framing || "Enquadramento comercial aberto garantindo que nenhum elemento seja cortado.",
        lighting: raw.visualPlan?.lighting || "Iluminação suave de estúdio com luz de preenchimento.",
        materialsAndTextures: Array.isArray(raw.visualPlan?.materialsAndTextures)
          ? raw.visualPlan.materialsAndTextures
          : ["Texturas realistas de alta definição"],
        colorDirection: Array.isArray(raw.visualPlan?.colorDirection)
          ? raw.visualPlan.colorDirection
          : brand?.primaryColors || ["#0083C7", "#FA6305"],
        style: raw.visualPlan?.style || input.stylePreference,
        mood: raw.visualPlan?.mood || "Confiável, profissional e inspirador",
      },
      brandApplication: {
        enabled: Boolean(brand?.enabled),
        useColors: Boolean(brand?.enabled),
        useLogo: Boolean(brand?.enabled && (brand.logoUrl || brand.hasLocalOfficialLogo)),
        brandElementsToPreserve: [brand?.businessName || "Identidade da marca"],
      },
      referenceInstructions: Array.isArray(raw.referenceInstructions) ? raw.referenceInstructions : [],
      textLayers: Array.isArray(raw.textLayers) ? raw.textLayers : [],
      imagePrompt: raw.imagePrompt || this.buildFallbackImagePrompt(input),
      negativePrompt:
        raw.negativePrompt ||
        "blurry, distorted text, cropped headline, cut off borders, low quality, artifacts, cartoonish fake logos",
      preserve: Array.isArray(raw.preserve) ? raw.preserve : ["Logomarca oficial", "Margens seguras"],
      generationParameters: {
        model: "gpt-image-2",
        quality: "high",
        size: safeAspect,
        background: "opaque",
        outputFormat: "png",
      },
      accessibility: {
        altText: raw.accessibility?.altText || input.userBrief.slice(0, 120),
        suggestedTitle: raw.accessibility?.suggestedTitle || "Arte visual NumVapt",
      },
    };
  }

  private static createDeterministicPlan(input: Gpt5PlannerInput): Gpt5VisualPlanResponse {
    const brand = input.brandKit;
    const safeAspect = input.format === "portrait" ? "1024x1280" : input.format === "story" ? "864x1536" : "1024x1024";

    return {
      schemaVersion: "1.0",
      requestType: "generate",
      confidence: 0.9,
      needsClarification: false,
      clarifyingQuestions: [],
      interpretation: {
        goal: input.objective,
        subject: input.userBrief.slice(0, 100),
        intendedUse: `Publicação profissional em formato ${input.format}`,
        audience: brand?.audience || "Público-alvo qualificado",
      },
      visualPlan: {
        scene: "Estúdio fotográfico profissional com iluminação equilibrada e fundo limpo.",
        composition: "Composição harmônica com ponto focal nítido e margens seguras generosas.",
        framing: "Plano médio com respiro de 20% em todas as bordas para evitar corte de conteúdo.",
        lighting: "Luz suave de softbox com destaques pontuais de contraste.",
        materialsAndTextures: ["Acabamento premium", "Texturas orgânicas fiéis"],
        colorDirection: brand?.primaryColors.length ? brand.primaryColors : ["#0083C7", "#FA6305"],
        style: input.stylePreference,
        mood: "Profissional, atraente e moderno",
      },
      brandApplication: {
        enabled: Boolean(brand?.enabled),
        useColors: Boolean(brand?.enabled),
        useLogo: Boolean(brand?.enabled),
        brandElementsToPreserve: [brand?.businessName || "NumVapt"],
      },
      textLayers: input.productHeadline
        ? [{ text: input.productHeadline, type: "headline", position: "top" }]
        : [],
      imagePrompt: this.buildFallbackImagePrompt(input),
      negativePrompt:
        "cropped typography, text touching borders, watermark, distorted letters, oversaturated, amateur framing",
      preserve: ["Margem segura de 20%", "Identidade visual"],
      generationParameters: {
        model: "gpt-image-2",
        quality: "high",
        size: safeAspect,
        background: "opaque",
        outputFormat: "png",
      },
      accessibility: {
        altText: input.userBrief.slice(0, 100),
        suggestedTitle: "Design Publicitário NumVapt",
      },
    };
  }

  private static buildFallbackImagePrompt(input: Gpt5PlannerInput): string {
    if (input.compiledPrompt) {
      let p = input.compiledPrompt;
      if (!p.includes("SAFE MARGINS")) {
        p += " [SAFE MARGINS MANDATE: Maintain 15% to 20% safe margin clearance around all borders. Absolutely no text, logo, or focal subjects touching the edges.]";
      }
      return p;
    }

    const brand = input.brandKit;
    const isInfographic =
      input.textOverlayMode === "INFOGRAPHIC" || input.textOverlayMode === "BOTH";
    const isTitle = input.textOverlayMode === "TITLE_ONLY";

    let textInstruction =
      "[CRITICAL MANDATE — ZERO TEXT: Clean photography with zero typography, letters or watermarks.]";
    if (isTitle) {
      const headline = input.productHeadline?.trim() || "Headline em português";
      textInstruction = `[HEADLINE POSTER DIRECTIVE: Render bold, elegant, high-contrast typography in Portuguese (pt-BR) saying "${headline}" with generous breathing room and 20% safe margins.]`;
    } else if (isInfographic) {
      const headline = input.productHeadline?.trim() || "Solução Inteligente";
      textInstruction = `[DYNAMIC MODERN INFOGRAPHIC DIRECTIVE: Clean editorial layout in Portuguese (pt-BR) with headline "${headline}", modern floating callout badges or sleek highlight tags, minimalist line icons, and 20% safe margins from all outer borders.]`;
    }

    const brandInstruction =
      brand && brand.enabled
        ? `Incorporate the visual identity of "${brand.businessName}" with colors ${brand.primaryColors.join(
            ", "
          )}. Preserve official branding without arbitrary fake logos.`
        : "";

    return `Commercial advertising artwork: ${input.userBrief}. Modern studio photography, crisp details, natural lighting, elegant atmosphere. ${brandInstruction} ${textInstruction} [SAFE MARGINS MANDATE: Maintain 15% to 20% safe margin clearance around all borders. Absolutely no text or focal subjects touching the edges.]`;
  }
}

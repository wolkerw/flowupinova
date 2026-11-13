/**
 * Motor de prompt v2 — planejamento criativo "insight → ideia → execução".
 *
 * Diferenças em relação ao v1 (Gpt5PromptPlanner):
 * - O LLM recebe o negócio (descrição, diferenciais, público) e propõe 3 ideias antes de escolher uma.
 * - A direção de arte vem de uma biblioteca de estilos de agência escolhida por adequação ao nicho,
 *   evitando repetir as últimas usadas pelo cliente (sem contador global, sem neon/vidro/levitação).
 * - O LLM devolve conteúdo estruturado e o CÓDIGO monta o prompt final: curto, em linguagem positiva,
 *   sem códigos internos (/xxxlock), sem gritos e sem blocos de regras colados depois.
 * - Cores da NumVapt nunca entram na arte de clientes: sem paleta cadastrada, a paleta vem do nicho.
 * - A zona do logo é uma só (a mesma usada pelo BrandLogoApplier).
 */

import type {
  BrandLogoPlacement,
  Gpt5PlannerInput,
  Gpt5VisualPlanResponse,
  OrchestratorPlanResult,
} from "../types";
import { Gpt5PromptPlanner } from "../Gpt5PromptPlanner";
import { getArtDirection, selectArtDirections, type ArtDirection } from "./art-direction-library";

export interface PlannerV2Input extends Gpt5PlannerInput {
  /** Últimas direções de arte usadas pelo cliente (mais recente primeiro). */
  recentArtDirectionIds?: string[];
}

export interface CreativeConceptV2 {
  idea: string;
  artDirectionId: string;
  why: string;
}

export interface PlannerV2LlmOutput {
  insight?: string;
  concepts?: CreativeConceptV2[];
  chosenIndex?: number;
  headline?: string;
  subline?: string;
  visual?: {
    subject?: string;
    setting?: string;
    composition?: string;
    people?: string;
    palette?: string;
    mood?: string;
  };
  socialCaption?: {
    title?: string;
    hook?: string;
    body?: string;
    callToAction?: string;
    hashtags?: string[];
    fullPostText?: string;
  };
}

const LOGO_ZONE_EN: Record<BrandLogoPlacement, string> = {
  "top-left": "top-left corner",
  "top-right": "top-right corner",
  "top-center": "top center",
  "bottom-right": "bottom-right corner",
  "bottom-left": "bottom-left corner",
};

const LOGO_PLACEMENTS: BrandLogoPlacement[] = ["top-left", "top-right", "top-center", "bottom-right"];

export const PLANNER_V2_SYSTEM_PROMPT = `Você é diretor de criação de uma agência de publicidade premium e escreve o plano visual de UMA peça para redes sociais.

Como trabalhar:
1. Leia o briefing e o perfil do negócio. Escreva o insight: a verdade sobre o público ou o produto que torna a peça relevante.
2. Proponha 3 ideias diferentes. Cada ideia usa UMA das direções de arte candidatas (pelo id) e transforma o benefício em imagem concreta. Prefira ideias simples, específicas do nicho e memoráveis.
3. Escolha a melhor (chosenIndex) e descreva a execução visual com frases curtas, concretas e positivas: descreva o que deve aparecer, não o que deve ser evitado.

Padrões de qualidade:
- Pense como fotografia e design de campanha real, nunca como "imagem de IA". Não use fitas ou tubos de neon, cartões de vidro flutuando, hologramas, objetos levitando, partículas mágicas, luz azul e laranja nem bokeh genérico.
- Pessoas só quando a direção escolhida pede ou permite e a ideia precisar. Devem parecer gente real do nicho (equipe ou clientes), em momento espontâneo, com roupas do contexto, e não executivos de banco de imagem sorrindo para a câmera.
- Use as cores da marca como cor de cenário, objetos e superfícies, não como luz de neon.
- Respeite as restrições informadas (produto real, logo, referência de estilo).
- Texto na imagem: se pedido, uma headline curta em português (até 6 palavras) e, opcionalmente, uma linha de apoio (até 8 palavras). Ortografia perfeita.

Responda somente com JSON neste formato:
{
  "insight": "1 frase",
  "concepts": [{"idea": "1-2 frases", "artDirectionId": "id da lista", "why": "1 frase"}],
  "chosenIndex": 0,
  "headline": "texto exato ou vazio",
  "subline": "texto exato ou vazio",
  "visual": {
    "subject": "em inglês, o herói da imagem e o que ele faz",
    "setting": "em inglês, o cenário concreto",
    "composition": "em inglês, enquadramento e posição dos elementos",
    "people": "em inglês, quem aparece (ou 'none')",
    "palette": "em inglês, as cores e onde aparecem",
    "mood": "em inglês, 3 a 5 palavras"
  },
  "socialCaption": {"title": "", "hook": "", "body": "", "callToAction": "", "hashtags": ["#..."], "fullPostText": "legenda completa em pt-BR"}
}`;

function clip(text: string | undefined, max: number): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

function stripCliches(text: string): string {
  // Rede de segurança: remove termos-clichê caso o LLM os use mesmo assim.
  return text
    .replace(/\b(glowing\s+)?neon\s+(ribbons?|tubes?|lights?|energy|trails?)\b/gi, "colored accents")
    .replace(/\bglass(morphic|morphism)\b[^,.;]*/gi, "")
    .replace(/\bholograph(ic|ically)?\b[^,.;]*/gi, "")
    .replace(/\b(levitating|floating in zero[- ]gravity|zero[- ]gravity)\b/gi, "arranged")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .trim();
}

export class PromptPlannerV2 {
  public static selectLogoPlacement(input: PlannerV2Input): BrandLogoPlacement {
    if (input.logoPosition) return input.logoPosition;
    const last = input.lastLogoPosition;
    const idx = last ? LOGO_PLACEMENTS.indexOf(last) : -1;
    return LOGO_PLACEMENTS[(idx + 1) % LOGO_PLACEMENTS.length];
  }

  public static hasBrandLogo(input: PlannerV2Input): boolean {
    return Boolean(
      input.referenceImages?.some((r) => (r.role === "business_logo" || r.role === "official_logo") && r.base64)
    );
  }

  public static paletteLine(input: PlannerV2Input): string {
    const bk = input.brandKit;
    const colors = [...(bk?.primaryColors || []), ...(bk?.secondaryColors || [])].filter(Boolean);
    if (bk?.enabled && bk.hasCustomColors !== false && colors.length > 0) {
      return `Brand palette ${colors.join(", ")}: use it in the set, surfaces, props and wardrobe accents, not as colored light.`;
    }
    const niche = bk?.rawSegment || bk?.segment || "the business";
    return `Palette: a refined, harmonious palette that suits ${niche}.`;
  }

  public static buildUserPrompt(input: PlannerV2Input, candidates: ArtDirection[]): string {
    const bk = input.brandKit;
    const subject = input.referenceImages?.find((r) => r.role === "product_subject");
    const style = input.referenceImages?.find((r) => r.role === "style_reference");
    const isStep5Logo = Gpt5PromptPlanner.isStep5LogoUpload(input);
    const wantsText = Boolean(input.textOverlayMode && input.textOverlayMode !== "NONE");

    const business = bk?.enabled
      ? [
          `Negócio: ${bk.businessName}`,
          `Segmento: ${bk.rawSegment || bk.segment || "não informado"}`,
          bk.businessDescription ? `O que faz: ${clip(bk.businessDescription, 400)}` : "",
          bk.mainBenefits?.length ? `Diferenciais: ${bk.mainBenefits.slice(0, 6).join("; ")}` : "",
          bk.audience ? `Público: ${clip(bk.audience, 200)}` : "",
          bk.toneOfVoice ? `Tom de voz: ${bk.toneOfVoice}` : "",
          bk.slogan ? `Slogan: ${bk.slogan}` : "",
          bk.personas?.length
            ? `Personas: ${bk.personas
                .slice(0, 3)
                .map((p: any) => `${p?.name || "Cliente"} (${clip(p?.profile || p?.description || "", 120)})`)
                .join("; ")}`
            : "",
        ]
      : ["Perfil do negócio não informado."];

    const directions = candidates
      .map(
        (d) =>
          `- ${d.id} — ${d.labelPt}. Pessoas: ${d.people === "none" ? "não" : d.people === "required" ? "sim" : "opcional"}. Cena: ${d.sceneEn}`
      )
      .join("\n");

    const constraints = [
      subject && !isStep5Logo
        ? "O cliente enviou a foto do produto/pessoa: ela é o herói e deve aparecer exatamente como é; só cenário e luz mudam."
        : "",
      subject && isStep5Logo
        ? "O cliente enviou um logo: integre-o de forma natural em uma superfície física da cena (fachada, embalagem, uniforme)."
        : "",
      style
        ? input.referenceMode === "campaign_identity"
          ? "Há uma referência de campanha: mantenha a mesma luz, paleta e linguagem gráfica, com sujeito e composição novos."
          : "Há uma referência de estilo: use-a só como clima e paleta."
        : "",
      input.negativeInstructions ? `O cliente não quer: ${input.negativeInstructions}` : "",
    ].filter(Boolean);

    return [
      `BRIEFING: "${clip(input.userBrief, 1200)}"`,
      `Objetivo: ${input.objective}. Formato: ${input.format}.`,
      wantsText
        ? `Texto na imagem: sim${input.productHeadline ? ` — headline obrigatória: "${input.productHeadline}"` : " — crie a headline"}.`
        : "Texto na imagem: não.",
      "",
      ...business.filter(Boolean),
      "",
      "DIREÇÕES DE ARTE CANDIDATAS (escolha entre elas):",
      directions,
      constraints.length ? `\nRESTRIÇÕES:\n- ${constraints.join("\n- ")}` : "",
    ]
      .filter((l) => l !== undefined)
      .join("\n");
  }

  /** Monta o prompt final para o modelo de imagem a partir do plano (determinístico, curto). */
  public static compileImagePrompt(
    input: PlannerV2Input,
    direction: ArtDirection,
    llm: PlannerV2LlmOutput,
    logoPlacement: BrandLogoPlacement
  ): string {
    const v = llm.visual || {};
    const subjectRef = input.referenceImages?.find((r) => r.role === "product_subject");
    const styleRef = input.referenceImages?.find((r) => r.role === "style_reference");
    const isStep5Logo = Gpt5PromptPlanner.isStep5LogoUpload(input);
    const concept = llm.concepts?.[llm.chosenIndex ?? 0];
    const wantsText = Boolean(input.textOverlayMode && input.textOverlayMode !== "NONE");
    const headline = clip(input.productHeadline || llm.headline, 60);
    const subline = clip(llm.subline, 70);

    const peopleRaw = clip(v.people, 260);
    const noPeople = direction.people === "none" || /^none\b/i.test(peopleRaw) || !peopleRaw;

    const lines: string[] = [
      clip(concept?.idea, 300) || clip(input.userBrief, 200),
      `Art direction: ${direction.sceneEn}.`,
      v.subject ? `Subject: ${clip(v.subject, 300)}.` : "",
      v.setting ? `Setting: ${clip(v.setting, 260)}.` : "",
      v.composition ? `Composition: ${clip(v.composition, 220)}.` : "",
      noPeople ? "No people in the image." : `People: ${peopleRaw}; candid and natural, real-looking, believable hands.`,
      `Light: ${direction.lightEn}. Camera: ${direction.cameraEn}.`,
      v.palette ? `${clip(v.palette, 200)}. ${this.paletteLine(input)}` : this.paletteLine(input),
      v.mood ? `Mood: ${clip(v.mood, 80)}.` : "",
    ];

    if (subjectRef && !isStep5Logo) {
      lines.push(
        "Use the product or person from the reference image exactly as it is: same shape, proportions, colors, label text and printed graphics; only the setting and light change."
      );
    } else if (subjectRef && isStep5Logo) {
      lines.push(
        "Place the uploaded logo naturally on one physical surface in the scene (signage, packaging or apparel), reproduced exactly with the same spelling, shapes and colors."
      );
    }

    if (styleRef) {
      lines.push(
        input.referenceMode === "campaign_identity"
          ? "Match the style reference's lighting, palette and graphic language so it reads as the same campaign, with a new subject and composition."
          : "Use the style reference only for mood and color palette."
      );
    }

    if (wantsText && headline) {
      const fonts = input.brandKit?.fonts;
      const typeHint = fonts?.style || (fonts?.primaryFont ? `in the style of ${fonts.primaryFont}` : "clean modern sans-serif");
      lines.push(
        `Text: the headline "${headline}"${subline ? ` and the smaller line "${subline}"` : ""}, in Brazilian Portuguese with exact spelling, set in ${typeHint}, placed in ${direction.textZoneEn}, high contrast and fully legible. No other text.`
      );
    } else {
      lines.push("No text, letters or watermarks in the image.");
    }

    if (this.hasBrandLogo(input)) {
      lines.push(`Keep the ${LOGO_ZONE_EN[logoPlacement]} free of text and objects for the brand logo added later; do not draw any logo.`);
    } else if (!subjectRef) {
      lines.push("Do not draw any logo or brand mark.");
    }

    lines.push("Keep important elements away from the edges. Photographic realism with natural textures.");

    return stripCliches(lines.filter(Boolean).join("\n"));
  }

  public static parseLlmOutput(raw: unknown, candidates: ArtDirection[]): { llm: PlannerV2LlmOutput; direction: ArtDirection } {
    const llm = (raw && typeof raw === "object" ? raw : {}) as PlannerV2LlmOutput;
    const concepts = Array.isArray(llm.concepts) ? llm.concepts : [];
    let idx = typeof llm.chosenIndex === "number" ? llm.chosenIndex : 0;
    if (idx < 0 || idx >= concepts.length) idx = 0;
    llm.chosenIndex = idx;
    const chosenId = concepts[idx]?.artDirectionId;
    const direction =
      (chosenId && candidates.find((c) => c.id === chosenId)) || getArtDirection(chosenId) || candidates[0];
    return { llm, direction };
  }

  private static async callPlannerLlm(
    input: PlannerV2Input,
    userPrompt: string
  ): Promise<{ raw: unknown; model: string } | null> {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return null;

    const baseModels = ["gpt-6.1-sol", "gpt-5", "gpt-4o"];
    const models = input.preferredModel
      ? [input.preferredModel, ...baseModels.filter((m) => m !== input.preferredModel)]
      : baseModels;

    const content: any[] = [{ type: "text", text: userPrompt }];
    for (const ref of input.referenceImages || []) {
      if ((ref.role === "product_subject" || ref.role === "style_reference") && ref.base64) {
        content.push({ type: "image_url", image_url: { url: `data:${ref.mimeType};base64,${ref.base64}`, detail: "high" } });
      }
    }

    for (const model of models) {
      if (model.startsWith("gemini")) continue;
      try {
        const body: Record<string, unknown> = {
          model,
          messages: [
            { role: "system", content: PLANNER_V2_SYSTEM_PROMPT },
            { role: "user", content: content.length > 1 ? content : userPrompt },
          ],
          response_format: { type: "json_object" },
        };
        if (!/^(gpt-5|gpt-6|o1|o3)/.test(model)) body.temperature = 0.9;
        if (/^(gpt-6|o1|o3)/.test(model)) body.reasoning_effort = "medium";

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          console.warn(`[PromptPlannerV2] ${model} retornou ${res.status}`);
          continue;
        }
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return { raw: JSON.parse(text), model };
      } catch (err) {
        console.warn(`[PromptPlannerV2] Falha em ${model}:`, err);
      }
    }
    return null;
  }

  public static async plan(input: PlannerV2Input): Promise<OrchestratorPlanResult & { artDirectionId: string }> {
    const start = Date.now();
    const hasProductReference = Boolean(
      input.referenceImages?.some((r) => r.role === "product_subject") && !Gpt5PromptPlanner.isStep5LogoUpload(input)
    );
    const candidates = selectArtDirections({
      objective: input.objective,
      segment: input.brandKit?.rawSegment || input.brandKit?.segment,
      brief: input.userBrief,
      hasProductReference,
      recentIds: input.recentArtDirectionIds || input.brandKit?.lastArtDirectionIds,
    });

    const logoPlacement = this.selectLogoPlacement(input);
    input.logoPosition = logoPlacement;

    const userPrompt = this.buildUserPrompt(input, candidates);
    const llmResult = await this.callPlannerLlm(input, userPrompt);

    const { llm, direction } = llmResult
      ? this.parseLlmOutput(llmResult.raw, candidates)
      : { llm: {} as PlannerV2LlmOutput, direction: candidates[0] };

    const imagePrompt = this.compileImagePrompt(input, direction, llm, logoPlacement);
    const caption =
      llm.socialCaption && typeof llm.socialCaption.fullPostText === "string" && llm.socialCaption.fullPostText.length > 20
        ? {
            title: llm.socialCaption.title || input.productHeadline || llm.headline || "Post",
            hook: llm.socialCaption.hook || "",
            body: llm.socialCaption.body || "",
            callToAction: llm.socialCaption.callToAction || "",
            hashtags: Array.isArray(llm.socialCaption.hashtags) ? llm.socialCaption.hashtags : [],
            fullPostText: llm.socialCaption.fullPostText,
          }
        : Gpt5PromptPlanner.generateFallbackSocialCaption(input);

    const hasLogo = this.hasBrandLogo(input);
    const headline = input.productHeadline || llm.headline;
    const visualPlan: Gpt5VisualPlanResponse = {
      schemaVersion: "1.0",
      requestType: "generate",
      confidence: llmResult ? 0.9 : 0.6,
      needsClarification: false,
      clarifyingQuestions: [],
      interpretation: {
        goal: String(input.objective),
        subject: clip(llm.concepts?.[llm.chosenIndex ?? 0]?.idea || input.userBrief, 140),
        intendedUse: `Peça para redes sociais (${input.format})`,
        audience: input.brandKit?.audience || "",
      },
      visualPlan: {
        scene: clip(llm.visual?.setting || direction.sceneEn, 300),
        composition: clip(llm.visual?.composition || direction.textZoneEn, 300),
        framing: direction.cameraEn,
        lighting: direction.lightEn,
        materialsAndTextures: [],
        colorDirection: input.brandKit?.hasCustomColors === false ? [] : input.brandKit?.primaryColors || [],
        style: direction.labelPt,
        mood: clip(llm.visual?.mood, 80),
      },
      brandApplication: {
        enabled: Boolean(input.brandKit?.enabled),
        useColors: Boolean(input.brandKit?.enabled && input.brandKit?.hasCustomColors !== false),
        useLogo: hasLogo,
        logoPosition: logoPlacement,
        brandElementsToPreserve: [],
      },
      referenceInstructions: [],
      textLayers:
        input.textOverlayMode && input.textOverlayMode !== "NONE" && headline
          ? [
              { text: headline, type: "headline" as const, position: direction.textZoneEn },
              ...(llm.subline ? [{ text: llm.subline, type: "subtitle" as const, position: direction.textZoneEn }] : []),
            ]
          : [],
      socialCaption: caption,
      imagePrompt,
      negativePrompt: "",
      preserve: [],
      generationParameters: {
        model: "gpt-image-2",
        quality: "medium",
        size: input.format === "portrait" ? "1024x1280" : input.format === "story" ? "864x1536" : "1024x1024",
        background: "opaque",
        outputFormat: "png",
      },
      accessibility: {
        altText: clip(llm.concepts?.[llm.chosenIndex ?? 0]?.idea || input.userBrief, 120),
        suggestedTitle: headline || "Arte",
      },
    };
    (visualPlan as any).artDirectionId = direction.id;
    (visualPlan as any).insight = llm.insight || "";
    (visualPlan as any).concepts = llm.concepts || [];

    return {
      plannerModelUsed: llmResult ? `${llmResult.model} (prompt v2)` : "deterministic-v2",
      plannerDurationMs: Date.now() - start,
      visualPlan,
      compiledImagePrompt: imagePrompt,
      compiledNegativePrompt: "",
      artDirectionId: direction.id,
    };
  }
}

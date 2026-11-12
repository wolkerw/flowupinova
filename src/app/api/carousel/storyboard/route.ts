import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { aiRateLimit } from "@/lib/rate-limit";
import {
  getSemanticCache,
  setSemanticCache,
} from "@/lib/services/semantic-cache";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";
import {
  CarouselInternalSlide,
  CarouselInternalSlideSchema,
  CarouselSlideCount,
  CarouselStoryboard,
  CarouselStoryboardSchema,
  EXPECTED_SLIDE_TYPES_5,
  EXPECTED_SLIDE_TYPES_7,
} from "@/types/carousel";
import {
  buildLayoutCatalogForPrompt,
  sanitizeSlideLayoutExtras,
} from "@/lib/services/carousel/layouts/select";

const GEMINI_TEXT_MODEL = "gemini-2.5-flash";

function clampText(raw: string, maxLen: number): string {
  const cleaned = (raw || "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  const sliced = cleaned.slice(0, maxLen - 1).trim();
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace > Math.floor(maxLen * 0.6)) {
    return `${sliced.slice(0, lastSpace).replace(/[.,;:-]+$/, "")}…`;
  }
  return `${sliced.replace(/[.,;:-]+$/, "")}…`;
}

/**
 * Constrói o prompt unificado do Roteiro de Carrossel (5 ou 7 slides) em 1 única chamada de LLM.
 */
export function buildCarouselStoryboardSystemPrompt(params: {
  theme: string;
  slideCount: CarouselSlideCount;
  companyName?: string;
  segment?: string;
  targetAudience?: string;
  toneOfVoice?: string;
  ctaChannel?: string;
}): string {
  const {
    theme,
    slideCount,
    companyName = "sua empresa",
    segment = "negócios",
    targetAudience = "clientes e seguidores",
    toneOfVoice = "profissional, próximo e persuasivo",
    ctaChannel = "WhatsApp no link da bio",
  } = params;

  const expectedTypes =
    slideCount === 5 ? EXPECTED_SLIDE_TYPES_5 : EXPECTED_SLIDE_TYPES_7;

  const slidesStructureDescription =
    slideCount === 5
      ? `- Slide 2 (n: 2, tipo: "contexto"): Contexto ou dor/problema direto ligado à chamada da capa.
- Slide 3 (n: 3, tipo: "ponto_principal"): Ponto principal ou solução central prometida na capa.
- Slide 4 (n: 4, tipo: "complemento"): Ponto complementar ou exemplo prático aplicável.
- Slide 5 (n: 5, tipo: "cta"): Chamada para ação convidando para o canal real (${ctaChannel}), preenchendo "titulo", "texto" e "botao".`
      : `- Slide 2 (n: 2, tipo: "contexto"): Contexto ou dor/problema direto ligado à chamada da capa.
- Slide 3 (n: 3, tipo: "desenvolvimento"): Desenvolvimento — Passo ou Pilar 1 da promessa da capa.
- Slide 4 (n: 4, tipo: "desenvolvimento"): Desenvolvimento — Passo ou Pilar 2 da promessa da capa.
- Slide 5 (n: 5, tipo: "desenvolvimento"): Desenvolvimento — Passo ou Pilar 3 da promessa da capa.
- Slide 6 (n: 6, tipo: "prova_resumo"): Prova prática, exemplo real ou resumo acionável.
- Slide 7 (n: 7, tipo: "cta"): Chamada para ação convidando para o canal real (${ctaChannel}), preenchendo "titulo", "texto" e "botao".`;

  return `Você é um Estrategista de Conteúdo e Copywriter Sênior especialista em Carrosséis de Alta Retenção para Instagram no Brasil.

CONTEXTO DO NEGÓCIO:
- Empresa: ${companyName}
- Segmento: ${segment}
- Público-alvo: ${targetAudience}
- Tom de voz: ${toneOfVoice}
- Canal real de CTA: ${ctaChannel}
- Tema / Objetivo do Carrossel: "${theme}"
- Tamanho total do carrossel: ${slideCount} slides (1 capa + ${slideCount - 1} slides internos).

ORDEM DE RACIOCÍNIO OBRIGATÓRIA:
1. Primeiro, crie a "chamadaCapa" (headline gancho do Slide 1, máximo de 65 caracteres). Ela deve ser magnética, direta e específica sobre "${theme}".
2. Em seguida, crie o "promptImagemCapa" descrevendo uma cena fotográfica ou editorial em proporção 4:5 (1080x1350) que deixe uma área limpa e de luminosidade 100% UNIFORME para o texto "${theme}" (sem vinhetas escuras nos cantos nem degradês claro-escuro atrás do bloco de texto, garantindo contraste máximo — texto branco em fundo escuro uniforme ou texto escuro em fundo claro uniforme), paleta de cores bem definida e elementos gráficos simples para que os slides seguintes herdem a mesma linguagem visual.
3. Depois, escreva os slides 2 a ${slideCount} desenvolvendo e cumprindo EXATAMENTE a promessa feita em "chamadaCapa". NENHUM slide interno pode fugir do tema da capa.

ESTRUTURA OBRIGATÓRIA DOS SLIDES INTERNOS (${expectedTypes.join(" -> ")}):
${slidesStructureDescription}

REGRAS INVIOLÁVEIS DE TEXTO:
- Português do Brasil impecável, com gramática, concordância e acentuação gráfica 100% revisadas por você antes de responder.
- Cada slide interno deve ter "titulo" com NO MÁXIMO 45 caracteres.
- Cada slide interno deve ter "texto" com NO MÁXIMO 160 caracteres.
- O último slide (n: ${slideCount}, tipo: "cta") deve ter "botao" com NO MÁXIMO 32 caracteres citando o canal real (${ctaChannel}).

LAYOUT DE CADA SLIDE INTERNO (design por template, custo zero de imagem):
Escolha para cada slide interno um "layout" do catálogo abaixo, combinando com o conteúdo. Varie os layouts (não repita o mesmo em slides seguidos). Quando o layout exigir campos extras, preencha-os:
- "destaque": número ou palavra de impacto com até 14 caracteres (ex.: "73%", "3x", "R$ 0"). Use apenas números reais ou plausíveis para o negócio, nunca invente estatística de mercado.
- "itens": de 2 a 5 itens curtos (até 70 caracteres cada) para listas, checklist, linha do tempo ou grade.
- "comparacao": { "a": { "rotulo": "...", "itens": ["..."] }, "b": { "rotulo": "...", "itens": ["..."] } } com rótulos de até 24 caracteres e 1 a 4 itens de até 60 caracteres por lado (ex.: "Sem método" × "Com método").
- "autor": nome de quem disse a frase, apenas em citações reais ou depoimentos de clientes informados pelo negócio.
O slide CTA usa um layout de CTA. Mesmo com campos extras, mantenha "titulo" e "texto" preenchidos.

CATÁLOGO DE LAYOUTS:
${buildLayoutCatalogForPrompt()}

Retorne APENAS um JSON válido no formato exato:
{
  "chamadaCapa": "...",
  "promptImagemCapa": "...",
  "slides": [
    { "n": 2, "tipo": "contexto", "layout": "numero-destaque", "titulo": "...", "texto": "...", "destaque": "..." },
    { "n": 3, "tipo": "...", "layout": "lista-numerada", "titulo": "...", "texto": "...", "itens": ["...", "..."] },
    ...
    { "n": ${slideCount}, "tipo": "cta", "layout": "cta-botao", "titulo": "...", "texto": "...", "botao": "..." }
  ]
}`;
}

/**
 * Fallback determinístico e coerente caso a API externa de texto falhe ou retorne formato parcial,
 * garantindo que o usuário nunca fique bloqueado e que as regras do Zod sejam 100% cumpridas.
 */
export function buildFallbackStoryboard(params: {
  theme: string;
  slideCount: CarouselSlideCount;
  companyName?: string;
  ctaChannel?: string;
}): CarouselStoryboard {
  const cleanTheme = clampText(params.theme || "Estratégia prática para seu negócio", 48);
  const ctaChannel = params.ctaChannel || "Chame no WhatsApp";
  const chamadaCapa = clampText(`Como dominar: ${cleanTheme}`, 65);

  const promptImagemCapa = `Composição editorial moderna em formato retrato 4:5 (1080x1350) sobre "${cleanTheme}", com área superior limpa para tipografia em destaque, iluminação de estúdio, paleta de cores sólida e formas geométricas minimalistas de apoio.`;

  if (params.slideCount === 5) {
    return {
      chamadaCapa,
      promptImagemCapa,
      slides: [
        {
          n: 2,
          tipo: "contexto",
          titulo: clampText(`O desafio em ${cleanTheme}`, 45),
          texto: clampText(
            `Muitos profissionais perdem resultados em ${cleanTheme} por falta de um processo claro e consistente no dia a dia.`,
            160
          ),
        },
        {
          n: 3,
          tipo: "ponto_principal",
          titulo: clampText("O ponto-chave que muda o jogo", 45),
          texto: clampText(
            `Para cumprir a promessa de "${chamadaCapa}", comece organizando as prioridades com foco no que gera retorno imediato.`,
            160
          ),
        },
        {
          n: 4,
          tipo: "complemento",
          titulo: clampText("Na prática: como aplicar hoje", 45),
          texto: clampText(
            "Combine constância e acompanhamento semanal de indicadores para transformar essa estratégia em resultado real.",
            160
          ),
        },
        {
          n: 5,
          tipo: "cta",
          titulo: clampText("Quer aplicar no seu negócio?", 45),
          texto: clampText(
            `Fale com ${params.companyName || "nossa equipe"} agora mesmo e receba orientação personalizada pelo nosso canal oficial.`,
            160
          ),
          botao: clampText(ctaChannel, 32),
        },
      ],
    };
  }

  return {
    chamadaCapa,
    promptImagemCapa,
    slides: [
      {
        n: 2,
        tipo: "contexto",
        titulo: clampText(`Por que ${cleanTheme} importa`, 45),
        texto: clampText(
          `Ignorar os fundamentos de ${cleanTheme} custa tempo e reduz a competitividade da sua operação todos os meses.`,
          160
        ),
      },
      {
        n: 3,
        tipo: "desenvolvimento",
        titulo: clampText("1. Diagnóstico claro do cenário", 45),
        texto: clampText(
          `O primeiro passo para "${chamadaCapa}" é mapear os gargalos atuais antes de tomar qualquer decisão.`,
          160
        ),
      },
      {
        n: 4,
        tipo: "desenvolvimento",
        titulo: clampText("2. Execução com método simples", 45),
        texto: clampText(
          "Padronize as etapas essenciais para que sua equipe mantenha qualidade previsível em cada entrega.",
          160
        ),
      },
      {
        n: 5,
        tipo: "desenvolvimento",
        titulo: clampText("3. Ajustes orientados por dados", 45),
        texto: clampText(
          "Acompanhe as métricas certas toda semana e corrija desvios rapidamente sem desperdiçar recursos.",
          160
        ),
      },
      {
        n: 6,
        tipo: "prova_resumo",
        titulo: clampText("Resumo prático para salvar", 45),
        texto: clampText(
          `Diagnóstico + método + revisão contínua: essa é a tríade que garante resultados sólidos em ${cleanTheme}.`,
          160
        ),
      },
      {
        n: 7,
        tipo: "cta",
        titulo: clampText("Vamos dar o próximo passo?", 45),
        texto: clampText(
          `Entre em contato com ${params.companyName || "nossa equipe"} e descubra como implementar essa solução hoje.`,
          160
        ),
        botao: clampText(ctaChannel, 32),
      },
    ],
  };
}

/**
 * Sanitiza um objeto bruto vindo do LLM para respeitar estritamente a estrutura e limites
 * antes de passar pelo `CarouselStoryboardSchema.parse`.
 */
function normalizeRawStoryboard(
  raw: any,
  slideCount: CarouselSlideCount,
  fallbackParams: {
    theme: string;
    companyName?: string;
    ctaChannel?: string;
  }
): CarouselStoryboard {
  const fallback = buildFallbackStoryboard({
    ...fallbackParams,
    slideCount,
  });

  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const expectedTypes =
    slideCount === 5 ? EXPECTED_SLIDE_TYPES_5 : EXPECTED_SLIDE_TYPES_7;
  const rawSlides = Array.isArray(raw.slides) ? raw.slides : [];

  const normalizedSlides: CarouselInternalSlide[] = expectedTypes.map(
    (expectedTipo, idx) => {
      const slideNumber = idx + 2;
      const candidate =
        rawSlides.find((s: any) => Number(s?.n) === slideNumber) ||
        rawSlides[idx] ||
        fallback.slides[idx];

      const baseSlide: CarouselInternalSlide = {
        ...sanitizeSlideLayoutExtras(candidate),
        n: slideNumber,
        tipo: expectedTipo,
        titulo: clampText(
          candidate?.titulo || fallback.slides[idx].titulo,
          45
        ),
        texto: clampText(
          candidate?.texto || fallback.slides[idx].texto || "",
          160
        ),
      };

      if (expectedTipo === "cta") {
        baseSlide.botao = clampText(
          candidate?.botao ||
            fallbackParams.ctaChannel ||
            fallback.slides[idx].botao ||
            "Fale no WhatsApp",
          32
        );
      }

      return baseSlide;
    }
  );

  return CarouselStoryboardSchema.parse({
    chamadaCapa: clampText(raw.chamadaCapa || fallback.chamadaCapa, 65),
    promptImagemCapa:
      typeof raw.promptImagemCapa === "string" &&
      raw.promptImagemCapa.trim().length >= 10
        ? raw.promptImagemCapa.trim()
        : fallback.promptImagemCapa,
    slides: normalizedSlides,
  });
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireUser(request);
    if (authUser instanceof NextResponse) return authUser;
    const userId = authUser.uid;

    const rateCheck = await aiRateLimit.limit(userId);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error:
            "Muitas solicitações simultâneas. Aguarde alguns segundos e tente novamente.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const action = body.action || "generate_storyboard";

    // =========================================================================
    // MODO 2: Reescrever apenas 1 slide interno específico (0 crédito de imagem)
    // =========================================================================
    if (action === "rewrite_slide") {
      const slideToRewrite = body.slide;
      const chamadaCapa = String(body.chamadaCapa || "").trim();
      const rewriteInstruction = String(
        body.instruction || "Deixe o texto mais direto, claro e persuasivo."
      ).trim();
      const ctaChannel = String(body.ctaChannel || "Fale no WhatsApp").trim();

      if (!slideToRewrite || Number(slideToRewrite.n) < 2) {
        return NextResponse.json(
          {
            error:
              "Slide inválido para reescrita. Informe um slide interno (n >= 2).",
          },
          { status: 400 }
        );
      }

      let rewritten: CarouselInternalSlide | null = null;
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey) {
        try {
          const prompt = `Você é um Copywriter Sênior em Português do Brasil.
Reescreva APENAS o slide ${slideToRewrite.n} (tipo: "${slideToRewrite.tipo}") de um carrossel cuja chamada de capa é: "${chamadaCapa}".
Instrução do usuário: "${rewriteInstruction}".
Título atual: "${slideToRewrite.titulo}"
Texto atual: "${slideToRewrite.texto || ""}"
Layout atual: "${slideToRewrite.layout || "automático"}". Se o slide tiver "destaque", "itens", "comparacao" ou "autor", devolva esses campos revisados no mesmo formato.

Regras obrigatórias:
- Mantenha total coerência com a chamada da capa ("${chamadaCapa}").
- Português do Brasil com acentuação e gramática revisadas.
- "titulo" com NO MÁXIMO 45 caracteres.
- "texto" com NO MÁXIMO 160 caracteres.
${slideToRewrite.tipo === "cta" ? `- "botao" com NO MÁXIMO 32 caracteres convidando para ${ctaChannel}.` : ""}

Retorne APENAS JSON:
{
  "n": ${Number(slideToRewrite.n)},
  "tipo": "${slideToRewrite.tipo}",
  "titulo": "...",
  "texto": "..."${slideToRewrite.tipo === "cta" ? `, "botao": "..."` : ""}
}`;

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.5,
                  responseMimeType: "application/json",
                },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const rawText =
              data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            const parsed = JSON.parse(
              rawText.replace(/```json\s*/gi, "").replace(/```/g, "").trim()
            );

            rewritten = CarouselInternalSlideSchema.parse({
              ...sanitizeSlideLayoutExtras(slideToRewrite),
              ...sanitizeSlideLayoutExtras(parsed),
              n: Number(slideToRewrite.n),
              tipo: slideToRewrite.tipo,
              titulo: clampText(parsed.titulo || slideToRewrite.titulo, 45),
              texto: clampText(parsed.texto || slideToRewrite.texto || "", 160),
              ...(slideToRewrite.tipo === "cta"
                ? {
                    botao: clampText(
                      parsed.botao || slideToRewrite.botao || ctaChannel,
                      32
                    ),
                  }
                : {}),
            });
          }
        } catch (err) {
          console.warn("[CarouselStoryboard] Fallback em rewrite_slide:", err);
        }
      }

      if (!rewritten) {
        rewritten = CarouselInternalSlideSchema.parse({
          ...sanitizeSlideLayoutExtras(slideToRewrite),
          n: Number(slideToRewrite.n),
          tipo: slideToRewrite.tipo,
          titulo: clampText(slideToRewrite.titulo, 45),
          texto: clampText(
            `${slideToRewrite.texto || ""} (${rewriteInstruction})`.trim(),
            160
          ),
          ...(slideToRewrite.tipo === "cta"
            ? { botao: clampText(slideToRewrite.botao || ctaChannel, 32) }
            : {}),
        });
      }

      await logApiUsage({
        userId,
        type: "chat",
        provider: "google",
        model: GEMINI_TEXT_MODEL,
        tokens: 320,
        costUsd: 0.0002,
        endpoint: "/api/carousel/storyboard#rewrite_slide",
      });

      return NextResponse.json({
        slide: rewritten,
        imageCallsExecuted: 0,
      });
    }

    // =========================================================================
    // MODO 1: Gerar Roteiro Completo (5 ou 7 slides) em 1 única chamada de texto
    // =========================================================================
    const theme = String(body.theme || "").trim();
    const rawSlideCount = Number(body.slideCount || 5);
    if (rawSlideCount !== 5 && rawSlideCount !== 7) {
      return NextResponse.json(
        { error: "O carrossel deve ter exatamente 5 ou 7 slides." },
        { status: 400 }
      );
    }
    if (theme.length < 3) {
      return NextResponse.json(
        { error: "Informe o tema ou objetivo do carrossel (mínimo 3 caracteres)." },
        { status: 400 }
      );
    }

    const slideCount = rawSlideCount as CarouselSlideCount;
    const companyName = String(body.companyName || "").trim();
    const segment = String(body.segment || "").trim();
    const targetAudience = String(body.targetAudience || "").trim();
    const toneOfVoice = String(body.toneOfVoice || "").trim();
    const ctaChannel = String(body.ctaChannel || "WhatsApp no link da bio").trim();
    const bypassCache = Boolean(body.bypassCache);

    const cacheKeyInput = JSON.stringify({
      theme,
      slideCount,
      companyName,
      segment,
      targetAudience,
      toneOfVoice,
      ctaChannel,
    });

    if (!bypassCache) {
      const cached = await getSemanticCache(cacheKeyInput, "carousel_storyboard");
      if (cached) {
        try {
          const validatedCache = CarouselStoryboardSchema.parse(cached);
          return NextResponse.json({
            storyboard: validatedCache,
            slideCount,
            fromCache: true,
            modelUsed: GEMINI_TEXT_MODEL,
            imageCallsExecuted: 0,
          });
        } catch {
          // Segue para nova geração se cache antigo for inválido
        }
      }
    }

    const systemPrompt = buildCarouselStoryboardSystemPrompt({
      theme,
      slideCount,
      companyName,
      segment,
      targetAudience,
      toneOfVoice,
      ctaChannel,
    });

    let storyboard: CarouselStoryboard | null = null;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: {
                temperature: 0.55,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const rawText =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const cleanedJson = rawText
            .replace(/```json\s*/gi, "")
            .replace(/```/g, "")
            .trim();
          const parsed = JSON.parse(cleanedJson);

          storyboard = normalizeRawStoryboard(parsed, slideCount, {
            theme,
            companyName,
            ctaChannel,
          });
        }
      } catch (err) {
        console.warn(
          "[CarouselStoryboard] Falha na chamada Gemini Flash, usando normalizador seguro:",
          err
        );
      }
    }

    if (!storyboard) {
      storyboard = buildFallbackStoryboard({
        theme,
        slideCount,
        companyName,
        ctaChannel,
      });
    }

    // Validação final estrita com Zod (5 ou 7 slides + coerência)
    const validatedStoryboard = CarouselStoryboardSchema.parse(storyboard);

    await setSemanticCache(
      cacheKeyInput,
      "carousel_storyboard",
      validatedStoryboard,
      GEMINI_TEXT_MODEL
    );

    await logApiUsage({
      userId,
      type: "chat",
      provider: "google",
      model: GEMINI_TEXT_MODEL,
      tokens: 850,
      costUsd: 0.0005,
      endpoint: "/api/carousel/storyboard",
    });

    return NextResponse.json({
      storyboard: validatedStoryboard,
      slideCount,
      fromCache: false,
      modelUsed: GEMINI_TEXT_MODEL,
      imageCallsExecuted: 0,
    });
  } catch (error: any) {
    console.error("[API /api/carousel/storyboard] Erro:", error);
    return NextResponse.json(
      {
        error:
          error?.message || "Erro interno ao gerar roteiro do carrossel.",
      },
      { status: 500 }
    );
  }
}

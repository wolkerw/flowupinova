import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";
import type {
  VisualDirectionResponse,
  AIImageGenerationRequest,
} from "@/lib/types/ai-image-general";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Autenticação obrigatória para acessar a direção visual." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Partial<AIImageGenerationRequest>;
    const brief = body.brief?.trim();

    if (!brief) {
      return NextResponse.json(
        { error: "O briefing descritivo é obrigatório para interpretar a direção visual." },
        { status: 400 }
      );
    }

    const {
      objective = "commercial",
      format = "portrait",
      style = "automatic",
      useBrandKit = true,
      textMode = "editable_layers",
      textOverlayMode = "NONE",
      productHeadline = "",
      negativeInstructions = "",
    } = body;

    // 1. Carregar perfil de negócio e BrandKit se habilitado
    let brandContext = "";
    if (useBrandKit) {
      try {
        const businessDoc = await adminDb
          .doc(`users/${authUser.uid}/business/onboarding`)
          .get();

        if (businessDoc.exists) {
          const data = businessDoc.data();
          const bk = data?.brandKit;
          const name = data?.name || bk?.name;
          const segment = data?.segment || bk?.segment;
          const primaryColor = data?.primaryColor || bk?.primaryColor;
          const secondaryColor = data?.secondaryColor || bk?.secondaryColor;
          const guidelines = bk?.visualGuidelines;

          brandContext = `
Dados da Marca / Negócio do Usuário:
- Nome: ${name || "Não informado"}
- Segmento: ${segment || "Não informado"}
- Cores da marca: Primária ${primaryColor || "N/A"}, Secundária ${secondaryColor || "N/A"}
- Diretrizes Visuais: ${guidelines || "N/A"}
`;
        }
      } catch (err) {
        console.warn("[DIRECAO_VISUAL] Falha ao carregar BrandKit do usuário:", err);
      }
    }

    // 2. Consultar Central de Conhecimento de Prompts para enriquecimento inteligente
    let promptKnowledgeContext = "";
    let matchedKnowledgeTitle = "";
    try {
      const { getActivePromptKnowledgeItems, findBestMatchingPrompt } = await import(
        "@/lib/services/prompt-knowledge-service"
      );
      const activeKnowledgeItems = await getActivePromptKnowledgeItems();
      const match = findBestMatchingPrompt(brief, activeKnowledgeItems);

      if (match) {
        matchedKnowledgeTitle = match.item.title;
        promptKnowledgeContext = `
Referência de Alto Padrão da Central de Prompts [Modelo de Estúdio: "${match.item.title}"]:
- Iluminação Técnica: ${match.item.sections.lighting || "Luz de estúdio comercial"}
- Equipamento e Lente: ${match.item.sections.cameraAndLens || "Lente profissional 50mm ou 85mm"}
- Composição e Ângulo: ${match.item.sections.composition || "Enquadramento comercial"}
- Cenário e Atmosfera: ${match.item.sections.environment || "Ambiente realista de alta definição"}
- Estilo e Clima: ${match.item.sections.styleAndMood || "Comercial publicitário"}
INSTRUÇÃO ESPECIAL DE QUALIDADE: Aplique rigorosamente este acabamento técnico de estúdio profissional à arte, mantendo o produto ou tema do usuário ("${brief}") como protagonista absoluto.
`;
      }
    } catch (pkErr) {
      console.warn("[DIRECAO_VISUAL] Aviso ao consultar Central de Prompts:", pkErr);
    }

    const systemPrompt = `
Você é um Diretor de Arte e Especialista Sênior em Design Visual e Fotografia Publicitária da NumVapt.
Sua missão é interpretar o briefing livre do usuário e transformá-lo em uma Direção Visual estruturada de alto impacto, pronta para geração com IA de ponta.

${brandContext}
${promptKnowledgeContext}

Parâmetros do Pedido:
- Briefing do Usuário: "${brief}"
- Objetivo: ${objective}
- Formato: ${format}
- Estilo: ${style}
- Modo de Texto e Diagramação: ${textOverlayMode} ${productHeadline ? `(Frase / Título solicitado: "${productHeadline}")` : ""}
- Restrições/Instruções Negativas: ${negativeInstructions || "Nenhuma específica"}

REGRAS RÍGIDAS DE DIREÇÃO VISUAL:
1. Responda em Português do Brasil de forma clara, estética e profissional.
2. Se o modo de texto for INFOGRAPHIC ou BOTH, planeje a cena como um cartaz publicitário comercial de agência, com espaço para headline no topo, selo de qualidade, cards com ícones de diferenciais e rodapé de slogan, com margem segura de respiro de 20%.
3. Se o modo de texto for TITLE_ONLY, planeje espaço harmônico no topo para tipografia de headline comercial nítida.
4. Se o modo de texto for NONE, a composição deve ser puramente fotográfica sem textos.
5. Não invente certificações falsas ou preços não citados.
6. Se o briefing for ambíguo, gere até 2 variações adicionais no array "alternativeDirections".
7. Campo "avoid": liste elementos indesejáveis (ex: texto borrado, membros extras, logotipos bizarros).
8. O retorno DEVE ser estritamente um JSON no formato abaixo:

{
  "visualDirection": {
    "interpretation": "Resumo objetivo e estético do que será criado",
    "subject": "Descrição do sujeito ou produto principal",
    "composition": "Regra de enquadramento, proporção, posição do elemento e espaço negativo",
    "lighting": "Tipo de iluminação, temperatura de cor e sombras",
    "style": "Estilo visual e acabamento fotográfico/artístico",
    "brandApplication": "Como as cores e identidade da marca são integradas harmonicamente",
    "textLayers": [
      { "text": "Título ou chamada sugerida", "type": "headline" }
    ],
    "avoid": ["texto ilegível", "logos gerados por IA", "elementos bizarros"]
  },
  "alternativeDirections": []
}
`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"];
      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 2000,
                responseMimeType: "application/json",
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
              let parsed: any = null;
              try {
                parsed = JSON.parse(cleaned);
              } catch {
                const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  try {
                    parsed = JSON.parse(jsonMatch[0]);
                  } catch (subErr) {
                    console.warn("[DIRECAO_VISUAL] Sub-parse falhou:", subErr);
                  }
                }
              }

              if (parsed?.visualDirection) {
                return NextResponse.json({
                  success: true,
                  visualDirection: parsed.visualDirection,
                  alternativeDirections: parsed.alternativeDirections || [],
                  matchedPromptKnowledge: matchedKnowledgeTitle
                    ? { title: matchedKnowledgeTitle }
                    : undefined,
                });
              }
            }
          }
        } catch (mErr) {
          console.warn(`[DIRECAO_VISUAL] Modelo ${model} falhou:`, mErr);
        }
      }
    }

    // Fallback determinístico de alta fidelidade
    const fallbackDirection: VisualDirectionResponse = {
      interpretation: `Criação visual para "${brief}" com foco em qualidade publicitária e estética profissional.`,
      subject: brief,
      composition: "Composição harmônica centralizada com respiro e margens seguras de 20%.",
      lighting: "Iluminação suave difusa de estúdio com destaque no sujeito principal.",
      style: style === "automatic" ? "Fotografia contemporânea de alta resolução" : style,
      brandApplication: useBrandKit
        ? "Harmonização sutil com as cores e linguagem visual do negócio."
        : "Estilo limpo e neutro sem aplicação de marca.",
      textLayers:
        textOverlayMode === "NONE" || textMode === "none"
          ? []
          : textOverlayMode === "TITLE_ONLY"
          ? [{ text: productHeadline || brief.slice(0, 40), type: "headline" }]
          : [
              { text: productHeadline || brief.slice(0, 40), type: "headline" },
              { text: "Qualidade Garantida", type: "badge" },
              { text: "Diferenciais Exclusivos", type: "subtitle" },
            ],
      avoid: ["textos desenhados com artefatos", "logotipos distorcidos", "baixa resolução"],
    };

    return NextResponse.json({
      success: true,
      visualDirection: fallbackDirection,
      alternativeDirections: [],
    });
  } catch (error: any) {
    console.error("[DIRECAO_VISUAL_ERROR]:", error);
    return NextResponse.json(
      { error: "Falha interna ao processar a direção visual." },
      { status: 500 }
    );
  }
}

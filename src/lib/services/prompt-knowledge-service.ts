import { adminDb } from "@/lib/firebase-admin";
import type { AIPromptKnowledgeItem } from "@/lib/types/ai-prompt-knowledge";

/**
 * Remove acentos e caracteres especiais para comparação flexível de termos
 */
export function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Carrega todos os prompts ativos da Central de Conhecimento
 */
export async function getActivePromptKnowledgeItems(): Promise<AIPromptKnowledgeItem[]> {
  try {
    const snap = await adminDb
      .collection("aiPromptKnowledgeBase")
      .where("active", "==", true)
      .get();

    if (snap.empty) return [];

    return snap.docs.map((doc) => doc.data() as AIPromptKnowledgeItem);
  } catch (err) {
    console.warn("[PROMPT_KNOWLEDGE] Erro ao carregar prompts ativos:", err);
    return [];
  }
}

/**
 * Avalia a similaridade entre o briefing do usuário e os prompts da central.
 * Retorna o item mais relevante ou null se nenhum atingir score mínimo de relevância.
 */
export function findBestMatchingPrompt(
  brief: string,
  prompts: AIPromptKnowledgeItem[],
  minScore = 2
): { item: AIPromptKnowledgeItem; score: number } | null {
  if (!brief.trim() || !prompts.length) return null;

  const normalizedBrief = normalizeSearchTerm(brief);
  const briefTokens = new Set(normalizedBrief.split(" ").filter((w) => w.length > 2));

  let bestMatch: { item: AIPromptKnowledgeItem; score: number } | null = null;

  for (const item of prompts) {
    if (!item.active) continue;

    let score = 0;

    // 1. Pontuação por triggerKeywords exatas ou contidas
    if (item.triggerKeywords && Array.isArray(item.triggerKeywords)) {
      for (const keyword of item.triggerKeywords) {
        const normKey = normalizeSearchTerm(keyword);
        if (!normKey) continue;

        // Se a frase inteira contém a palavra-chave
        if (normalizedBrief.includes(normKey)) {
          score += normKey.includes(" ") ? 4 : 2.5; // Frases compostas valem mais
        } else {
          // Token match
          const keyTokens = normKey.split(" ");
          for (const kt of keyTokens) {
            if (briefTokens.has(kt)) {
              score += 1;
            }
          }
        }
      }
    }

    // 2. Pontuação por título e categoria
    const normTitle = normalizeSearchTerm(item.title);
    for (const bt of briefTokens) {
      if (normTitle.includes(bt)) score += 1.5;
    }

    // 3. Pontuação por semanticSummary
    if (item.semanticSummary) {
      const normSummary = normalizeSearchTerm(item.semanticSummary);
      for (const bt of briefTokens) {
        if (normSummary.includes(bt)) score += 0.5;
      }
    }

    if (score >= minScore && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { item, score };
    }
  }

  return bestMatch;
}

/**
 * Funde a intenção do usuário com o padrão técnico profissional da Central de Prompts
 */
export function enrichPromptWithKnowledge(
  userBrief: string,
  matchedPrompt: AIPromptKnowledgeItem
): {
  enrichedBrief: string;
  matchedPromptTitle: string;
  technicalGuidelines: string;
} {
  const { sections } = matchedPrompt;

  const technicalParts: string[] = [];

  if (sections.lighting) {
    technicalParts.push(`Iluminação: ${sections.lighting}`);
  }
  if (sections.cameraAndLens) {
    technicalParts.push(`Equipamento e Óptica: ${sections.cameraAndLens}`);
  }
  if (sections.composition) {
    technicalParts.push(`Composição e Ângulo: ${sections.composition}`);
  }
  if (sections.environment) {
    technicalParts.push(`Cenário e Atmosfera: ${sections.environment}`);
  }
  if (sections.styleAndMood) {
    technicalParts.push(`Estilo Visual: ${sections.styleAndMood}`);
  }

  const technicalGuidelines = technicalParts.join(". ");

  const enrichedBrief = `${userBrief}. Diretrizes de Estúdio Profissional [Padrão '${matchedPrompt.title}']: ${technicalGuidelines}.`;

  return {
    enrichedBrief,
    matchedPromptTitle: matchedPrompt.title,
    technicalGuidelines,
  };
}

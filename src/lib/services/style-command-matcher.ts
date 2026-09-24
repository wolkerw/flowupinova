import { adminDb } from "@/lib/firebase-admin";
import type { AIStyleCommand } from "@/lib/types/ai-prompt-knowledge";
import { DEFAULT_STYLE_COMMANDS_SEED } from "@/lib/data/style-commands-seed";

export interface MatchStyleCommandsResult {
  matchedCommands: AIStyleCommand[];
  commandNames: string[];
  injectedDirectives: string[];
  injectedNegativeDirectives: string[];
  enrichedPrompt: string;
}

/**
 * Remove acentos e caracteres especiais para comparação flexível
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Identifica quais comandos de estilo correspondem à intenção do usuário
 * e devolve as diretrizes técnicas prontas para enriquecer a geração de imagem.
 */
export async function matchStyleCommands(
  userPrompt: string,
  providedCommands?: AIStyleCommand[]
): Promise<MatchStyleCommandsResult> {
  let commands: AIStyleCommand[] = [];

  if (providedCommands && providedCommands.length > 0) {
    commands = providedCommands.filter((c) => c.active);
  } else {
    try {
      const snap = await adminDb.collection("ai_style_commands").where("active", "==", true).get();
      if (!snap.empty) {
        snap.forEach((d) => commands.push(d.data() as AIStyleCommand));
      } else {
        // Fallback para seeds se coleção não inicializada
        commands = DEFAULT_STYLE_COMMANDS_SEED.map((s) => ({
          ...s,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }
    } catch {
      // Fallback em caso de erro de conexão com banco
      commands = DEFAULT_STYLE_COMMANDS_SEED.map((s) => ({
        ...s,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }
  }

  const normalizedUserPrompt = normalizeText(userPrompt);
  const matched: AIStyleCommand[] = [];
  const addedIds = new Set<string>();

  for (const cmd of commands) {
    if (addedIds.has(cmd.id)) continue;

    // 1. Verificação explícita do comando (ex: "/bokeh" no texto)
    const cmdTrigger = cmd.command.toLowerCase().trim();
    if (userPrompt.toLowerCase().includes(cmdTrigger)) {
      matched.push(cmd);
      addedIds.add(cmd.id);
      continue;
    }

    // 2. Verificação semântica por palavras-chave gatilho
    if (cmd.triggerKeywords && cmd.triggerKeywords.length > 0) {
      const hasKeywordMatch = cmd.triggerKeywords.some((keyword) => {
        const normKey = normalizeText(keyword);
        if (!normKey) return false;

        // Se a palavra-chave tiver mais de 2 letras, busca correspondência
        if (normKey.length <= 3) {
          const regex = new RegExp(`\\b${normKey}\\b`, "i");
          return regex.test(normalizedUserPrompt);
        }
        return normalizedUserPrompt.includes(normKey);
      });

      if (hasKeywordMatch) {
        matched.push(cmd);
        addedIds.add(cmd.id);
      }
    }
  }

  // Ordena por relevância e remove duplicações
  const commandNames = matched.map((m) => m.command);
  const injectedDirectives = matched.map((m) => m.promptInjection).filter(Boolean);
  const injectedNegativeDirectives = matched
    .map((m) => m.negativePromptInjection)
    .filter((neg): neg is string => Boolean(neg && neg.trim()));

  // Constrói o prompt enriquecido
  let enrichedPrompt = userPrompt;

  // Remove os comandos explícitos digitados pelo usuário no texto limpo (ex: remove "/bokeh")
  for (const cName of commandNames) {
    const reg = new RegExp(`\\${cName}\\b`, "gi");
    enrichedPrompt = enrichedPrompt.replace(reg, "").trim();
  }

  if (injectedDirectives.length > 0) {
    enrichedPrompt = `${enrichedPrompt}. [ESTILO PROFISSIONAL APLICADO: ${injectedDirectives.join(" ")}]`;
  }

  return {
    matchedCommands: matched,
    commandNames,
    injectedDirectives,
    injectedNegativeDirectives,
    enrichedPrompt,
  };
}

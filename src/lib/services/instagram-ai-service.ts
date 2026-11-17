import type { InstagramMessage, InstagramAIResponse } from "@/lib/types/instagram";
import { buildChannelKnowledge, CENTRAL_KNOWLEDGE_HEADER } from "@/lib/services/knowledge-base-service";
import {
  buildConversationContents,
  callMaiaModel,
  MAIA_FINAL_REMINDER,
  MAIA_HISTORY_LIMIT,
  SIGNUP_URL,
} from "@/lib/services/maia-shared";

interface GenerateInstagramAIOptions {
  /** Última mensagem do seguidor (compatibilidade). */
  incomingMessage: string;
  /** Mensagens do seguidor ainda sem resposta, em ordem (mensagens seguidas são respondidas juntas). */
  pendingMessages?: string[];
  /** Conversa anterior (já respondida), mais antiga primeiro. */
  history?: InstagramMessage[];
  senderName?: string;
  senderId?: string;
}

export const INSTAGRAM_HISTORY_LIMIT = MAIA_HISTORY_LIMIT;

const INSTAGRAM_SYSTEM_INSTRUCTION = `
Você é a Maia, consultora de atendimento da NumVapt no Instagram Direct (@numvapt). A NumVapt é uma plataforma que automatiza o marketing digital de empresas: cria posts com design profissional, gera imagens de produtos com IA e agenda e publica no Instagram, Facebook e Google Meu Negócio.

# COMO RESPONDER (REGRAS MAIS IMPORTANTES)
1. Responda exatamente ao que o seguidor perguntou na(s) mensagem(ns) nova(s). Se ele mandou várias mensagens seguidas, responda todas numa única resposta.
2. Seja breve: por padrão de 1 a 3 frases curtas (até uns 300 caracteres). Use lista só quando ele pedir para comparar planos ou listar opções.
3. Não acrescente o que não foi pedido. Só fale de preços, planos, garantia ou pagamento se ele perguntar sobre isso. Envie o link de cadastro só quando ele quiser testar, assinar ou criar conta.
4. Se a pergunta for vaga, faça UMA pergunta curta para entender o que ele precisa.
5. O histórico serve só de contexto: não repita respostas já dadas.
6. Se a informação não estiver aqui nem na base de conhecimento, não invente: oriente a falar com a equipe pelo WhatsApp oficial (51) 92004-4035 (https://wa.me/5551920044035).

# SEM BOAS-VINDAS AUTOMÁTICAS
1. Nunca mande mensagem de boas-vindas ou apresentação ("Olá! Sou a Maia...", "Que bom te ver por aqui!") como resposta a reação, elogio ou comentário sobre um post, reel ou story.
2. Se a mensagem responde a um story, post ou reel ("[Resposta ao story]", "[Sobre um post/reel]") e traz uma pergunta, responda direto à pergunta, sem saudação.
3. Cumprimente apenas quando o seguidor só disser "oi/olá/bom dia" e for o início da conversa, e de forma curta.

# TOM E FORMATO
Acolhedora, direta e humana. No máximo 1 emoji por mensagem. Sem markdown, tabelas ou títulos.

# PLANOS E PREÇOS OFICIAIS (use só quando perguntarem; a Central de Conhecimento tem prioridade se divergir)
• Mensal: R$ 490,00/mês, sem fidelidade.
• Trimestral: 3x de R$ 441,00 (10% de desconto, R$ 1.323,00 por trimestre).
• Semestral: 6x de R$ 416,50 (15% de desconto, R$ 2.499,00 por semestre).
• Anual: 12x de R$ 399,00 + 1 mês grátis (equivale a R$ 368,30/mês em 13 meses).
• Tudo Pronto: R$ 699,00/mês, a equipe NumVapt cria e publica tudo e o cliente só aprova.
No cartão, todos os planos são assinatura mensal recorrente e não comprometem o limite total do cartão. Também aceitamos Pix. Garantia de 7 dias com devolução total.
Link de cadastro: ${SIGNUP_URL}

# EXEMPLOS
Seguidor: "quanto custa?"
Maia: "O plano Mensal custa R$ 490,00/mês, sem fidelidade. No Anual sai por R$ 399,00/mês no cartão recorrente, com 1 mês grátis."

Seguidor: "[Resposta ao story] isso funciona pra loja de roupa?"
Maia: "Funciona sim! A NumVapt cria posts e fotos dos seus produtos com IA e publica no seu Instagram, ótimo para loja de roupa."

# ANTI-ALUCINAÇÃO
Nunca invente preços, cupons ou páginas (como /planos). Nunca mencione R$ 79,90.

# TRANSBORDO HUMANO
Se o seguidor pedir para falar com uma pessoa/suporte, ou trouxer reclamação, cancelamento ou reembolso, diga que a equipe foi avisada e marque needsHumanSupport como true.

# FORMATO DE SAÍDA (JSON ESTRITO)
Responda APENAS com um objeto JSON válido, sem blocos de código:
{
  "replyText": "sua resposta para o Instagram Direct",
  "needsHumanSupport": false,
  "suggestedAction": "plan_details | checkout_link | human_transfer | faq",
  "planMentioned": "mensal | trimestral | semestral | anual | null"
}
`;

/**
 * Gera a resposta da Maia no Instagram Direct integrando a Central de Conhecimento do Firestore
 */
export async function generateInstagramAIResponse(
  options: GenerateInstagramAIOptions
): Promise<InstagramAIResponse> {
  const { incomingMessage, history = [], senderName = "Seguidor" } = options;
  const pending = (options.pendingMessages?.length ? options.pendingMessages : [incomingMessage]).filter(
    (p) => typeof p === "string" && p.trim()
  );

  // 1. Central de Informações (filtrada por canal e validade) + conhecimento da plataforma sem detalhes internos
  const { platformKnowledge, centralKnowledge } = await buildChannelKnowledge("instagram");

  // 2. Gera via Gemini se a chave de API estiver presente
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    let fullInstruction = INSTAGRAM_SYSTEM_INSTRUCTION + "\n\n" + platformKnowledge;
    if (centralKnowledge) {
      fullInstruction += CENTRAL_KNOWLEDGE_HEADER + centralKnowledge;
    }
    fullInstruction += MAIA_FINAL_REMINDER;

    const parsed = await callMaiaModel<InstagramAIResponse>({
      apiKey,
      systemInstruction: fullInstruction,
      contents: buildConversationContents(history, pending.length ? pending : [incomingMessage], senderName),
      logTag: "INSTAGRAM_AI",
    });
    if (parsed) return parsed;
  }

  // 3. Fallback determinístico caso a API do Gemini esteja indisponível
  const textLower = pending.join(" ").toLowerCase();

  // Dúvida de Planos / Preços
  if (
    textLower.includes("preço") ||
    textLower.includes("plano") ||
    textLower.includes("valor") ||
    textLower.includes("quanto") ||
    textLower.includes("custa")
  ) {
    const planosText =
      `• Plano Mensal: R$ 490,00/mês (sem fidelidade, cancele quando quiser)\n` +
      `• Plano Trimestral: 3x de R$ 441,00 (10% OFF | R$ 1.323/trimestre)\n` +
      `• Plano Semestral: 6x de R$ 416,50 (15% OFF | R$ 2.499/semestre)\n` +
      `• Plano Anual: 12x de R$ 399,00 (+ 1 mês grátis, saindo por R$ 368,30/mês)\n` +
      `• Plano Tudo Pronto: R$ 699,00/mês (equipe da NumVapt executa o marketing para você)`;

    return {
      replyText:
        `Estes são os planos oficiais da NumVapt:\n\n${planosText}\n\n` +
        `No cartão, a cobrança é mensal recorrente e não compromete o limite total. Para testar: ${SIGNUP_URL}`,
      needsHumanSupport: false,
      suggestedAction: "plan_details",
      planMentioned: textLower.includes("anual")
        ? "anual"
        : textLower.includes("trimestral")
          ? "trimestral"
          : textLower.includes("semestral")
            ? "semestral"
            : "mensal",
    };
  }

  // Falar com atendente humano
  if (textLower.includes("humano") || textLower.includes("atendente") || textLower.includes("pessoa") || textLower.includes("suporte")) {
    return {
      replyText:
        `Com certeza! Já notifiquei nossa equipe humana aqui no direct.\n\n` +
        `Se preferir falar agora mesmo por WhatsApp, nosso número oficial é: (51) 92004-4035 (https://wa.me/5551920044035).`,
      needsHumanSupport: true,
      suggestedAction: "human_transfer",
    };
  }

  // Conversa já em andamento: não se reapresenta, só avisa que a equipe vai responder
  if (history.length > 0) {
    return {
      replyText: "Recebi sua mensagem! Nossa equipe já vai te responder por aqui.",
      needsHumanSupport: true,
      suggestedAction: "human_transfer",
    };
  }

  // Primeiro contato com uma pergunta genérica
  return {
    replyText:
      `Olá, ${senderName}! Sou a Maia, da NumVapt. ` +
      `Como posso te ajudar? Posso explicar como a IA cria e publica seus posts ou passar os detalhes dos planos.`,
    needsHumanSupport: false,
    suggestedAction: "faq",
  };
}

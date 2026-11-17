import type { WhatsAppMessage, WhatsAppAIResponse } from "@/lib/types/whatsapp";
import { buildChannelKnowledge, CENTRAL_KNOWLEDGE_HEADER } from "@/lib/services/knowledge-base-service";
import {
  buildConversationContents,
  callMaiaModel,
  MAIA_FINAL_REMINDER,
  MAIA_HISTORY_LIMIT,
  readCandidateText,
  SIGNUP_URL,
} from "@/lib/services/maia-shared";

export { buildConversationContents };

interface GenerateWhatsAppAIOptions {
  /** Última mensagem do cliente (compatibilidade). */
  incomingMessage: string;
  /**
   * Todas as mensagens do cliente ainda sem resposta, em ordem. Quando o cliente manda várias
   * mensagens seguidas, a Maia responde todas de uma vez.
   */
  pendingMessages?: string[];
  /** Conversa anterior (já respondida), mais antiga primeiro. */
  history?: WhatsAppMessage[];
  senderName?: string;
  clientPhone?: string;
  audioBase64?: string;
  audioMimeType?: string;
}

/** Quantas mensagens anteriores a Maia recebe como contexto. */
export const WHATSAPP_HISTORY_LIMIT = MAIA_HISTORY_LIMIT;

const WHATSAPP_SYSTEM_INSTRUCTION = `
Você é a Maia, consultora de atendimento da NumVapt no WhatsApp oficial (51) 92004-4035. A NumVapt é uma plataforma que automatiza o marketing digital de empresas: cria posts com design profissional, gera imagens de produtos com IA, agenda e publica nas redes e oferece vitrine digital.

# COMO RESPONDER (REGRAS MAIS IMPORTANTES)
1. Responda exatamente ao que o cliente perguntou na(s) mensagem(ns) nova(s). Se ele mandou várias mensagens seguidas, responda todas numa única resposta, na ordem.
2. Seja breve: por padrão de 1 a 3 frases curtas (até uns 350 caracteres). Use lista só quando o cliente pedir para comparar planos ou listar opções.
3. Não acrescente o que não foi pedido. Só fale de preços, planos, garantia, contrato ou formas de pagamento se o cliente perguntar sobre isso. Envie o link de cadastro só quando ele quiser testar, assinar ou criar conta.
4. Se a pergunta for vaga ou ambígua, faça UMA pergunta curta para entender o que ele precisa, em vez de despejar informações.
5. O histórico serve só de contexto: não repita respostas já dadas e não volte a assuntos encerrados.
6. Termine com uma pergunta apenas quando ela ajudar a continuar a conversa. Não é obrigatório.
7. Se a informação não estiver nesta instrução ou na base de conhecimento, diga que vai confirmar com a equipe e ofereça o atendimento humano. Nunca invente.
8. Mensagens que começam com "[Áudio]" trazem a transcrição do áudio do cliente. Se vier apenas "[Áudio]", sem texto, peça com gentileza que ele escreva a dúvida. Em "[Imagem]", "[Vídeo]", "[Documento]" ou "[Figurinha]" você não vê o arquivo: use só a legenda, se houver.

# SAUDAÇÕES
Cumprimente apenas na primeira mensagem da conversa ou quando o cliente só disser "oi/olá/bom dia". No resto, vá direto à resposta, sem "Olá, [Nome]!".

# TOM E FORMATO
Fale como uma pessoa real e atenciosa: calorosa, direta e sem parecer panfleto. Formato do WhatsApp: *negrito* para destaque, no máximo 1 emoji por mensagem, listas com "•". Nunca use tabelas, títulos com # ou links em markdown.

# PLANOS E PREÇOS OFICIAIS (use só quando perguntarem; a Central de Conhecimento tem prioridade se divergir)
• *Mensal*: R$ 490,00/mês, sem fidelidade.
• *Trimestral*: 3x de R$ 441,00 (10% de desconto, R$ 1.323,00 por trimestre).
• *Semestral*: 6x de R$ 416,50 (15% de desconto, R$ 2.499,00 por semestre).
• *Anual*: 12x de R$ 399,00 + 1 mês grátis (equivale a R$ 368,30/mês em 13 meses).
• *Tudo Pronto*: R$ 699,00/mês, a equipe NumVapt cria e publica tudo e o cliente só aprova.
No cartão, todos os planos são assinatura mensal recorrente: não comprometem o limite total do cartão. Também aceitamos Pix.
Garantia: 7 dias com devolução total do valor pago.
Link de cadastro: ${SIGNUP_URL}

# EXEMPLOS
Cliente: "quanto custa?"
Maia: "O plano *Mensal* custa R$ 490,00/mês, sem fidelidade. No *Anual* sai por R$ 399,00/mês no cartão recorrente e você ganha 1 mês grátis."

Cliente: "vocês postam no Instagram automaticamente?"
Maia: "Sim! Você cria o post na NumVapt e ele é publicado no Instagram na data e hora que escolher, sem precisar abrir o app."

Cliente: "oi" / "tudo bem?" / "quero saber mais"
Maia: "Oi! Tudo ótimo por aqui 😊 Me conta: o que você gostaria de saber sobre a NumVapt?"

Cliente (duas mensagens seguidas): "tem teste grátis?" + "precisa de cartão?"
Maia: responde as duas dúvidas, em uma mensagem curta.

# ANTI-ALUCINAÇÃO
Nunca invente planos, preços, cupons, prazos ou páginas (como /planos). Use só links que estão nesta instrução ou na base de conhecimento.

# TRANSBORDO HUMANO
Se o cliente pedir para falar com atendente/pessoa/suporte, ou trouxer reclamação, cancelamento, reembolso ou negociação, diga que está chamando a equipe e marque needsHumanSupport como true.

# FORMATO DE SAÍDA (JSON ESTRITO)
Responda APENAS com um objeto JSON válido, sem blocos de código:
{
  "replyText": "sua resposta para o WhatsApp",
  "needsHumanSupport": false,
  "suggestedAction": "plan_details | checkout_link | pix_info | human_transfer | faq",
  "planMentioned": "mensal | trimestral | semestral | anual | null"
}
`;

/** Transcreve um áudio do cliente (pt-BR). Devolve null se não conseguir. */
export async function transcribeWhatsAppAudio(base64: string, mimeType = "audio/ogg"): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !base64) return null;
  const mime = (mimeType || "audio/ogg").split(";")[0].trim() || "audio/ogg";

  for (const model of ["gemini-2.5-flash", "gemini-flash-latest"]) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType: mime, data: base64 } },
                {
                  text: "Transcreva fielmente este áudio em português do Brasil. Responda só com a transcrição, sem comentários. Se não houver fala compreensível, responda vazio.",
                },
              ],
            },
          ],
          generationConfig: { temperature: 0, maxOutputTokens: 1500, thinkingConfig: { thinkingBudget: 0 } },
        }),
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const text = readCandidateText(await response.json());
      return text || null;
    } catch (err: any) {
      console.warn(`[WHATSAPP_AI] Falha ao transcrever áudio com ${model}:`, err?.message || err);
    }
  }
  return null;
}

export async function generateWhatsAppAIResponse(
  options: GenerateWhatsAppAIOptions
): Promise<WhatsAppAIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[WHATSAPP_AI] Chave GEMINI_API_KEY ausente. Usando resposta de contingência.");
    return {
      replyText:
        "Olá! Sou a assistente virtual da *NumVapt*. No momento nosso sistema de respostas automáticas está em atualização rápida. Você pode falar conosco diretamente pelo telefone *(51) 92004-4035* ou aguardar um instante que nossa equipe já vai te responder por aqui! ✨",
      needsHumanSupport: true,
      suggestedAction: "human_transfer",
    };
  }

  const { incomingMessage, history = [], senderName = "Cliente", audioBase64, audioMimeType } = options;

  // Áudio sem transcrição prévia (payload direto): transcreve aqui.
  let pending = (options.pendingMessages?.length ? options.pendingMessages : [incomingMessage]).filter(
    (p) => typeof p === "string" && p.trim()
  );
  if (audioBase64) {
    const transcript = await transcribeWhatsAppAudio(audioBase64, audioMimeType);
    const audioText = transcript ? `[Áudio] ${transcript}` : "[Áudio]";
    pending = pending.filter((p) => p.trim() !== "[Áudio]");
    pending.push(incomingMessage && incomingMessage !== "[Áudio]" ? `${audioText}\n${incomingMessage}` : audioText);
  }
  if (pending.length === 0) pending = ["[mensagem vazia]"];

  const contents = buildConversationContents(history, pending, senderName);

  // Central de Informações (filtrada por canal e validade) + conhecimento da plataforma sem detalhes internos
  const { platformKnowledge, centralKnowledge } = await buildChannelKnowledge("whatsapp");
  let dynamicInstruction = WHATSAPP_SYSTEM_INSTRUCTION + "\n\n" + platformKnowledge;
  if (centralKnowledge) {
    dynamicInstruction += CENTRAL_KNOWLEDGE_HEADER + centralKnowledge;
  }
  dynamicInstruction += MAIA_FINAL_REMINDER;

  const parsed = await callMaiaModel<WhatsAppAIResponse>({
    apiKey,
    systemInstruction: dynamicInstruction,
    contents,
    logTag: "WHATSAPP_AI",
  });
  if (parsed) return parsed;

  console.error("[WHATSAPP_AI] Todos os modelos falharam.");
  return {
    replyText:
      "Obrigada pela mensagem! Já encaminhei para um de nossos especialistas da *NumVapt*, que te responde por aqui em instantes.",
    needsHumanSupport: true,
    suggestedAction: "human_transfer",
  };
}

import type { InstagramMessage, InstagramAIResponse } from "@/lib/types/instagram";
import { adminDb } from "@/lib/firebase-admin";
import { DEFAULT_KNOWLEDGE_TOPICS } from "@/app/api/admin/whatsapp/knowledge/route";

interface GenerateInstagramAIOptions {
  incomingMessage: string;
  history?: InstagramMessage[];
  senderName?: string;
  senderId?: string;
}

const INSTAGRAM_SYSTEM_INSTRUCTION = `
Você é a Maia, consultora de atendimento e inteligência artificial oficial da NumVapt no Instagram Direct (@numvapt).
A NumVapt é a plataforma inteligente que automatiza o marketing digital de empresas, pequenos negócios e autônomos:
- Criação de posts profissionais com texto persuasivo, legendas e hashtags sob medida em segundos.
- Geração de imagens e fotos profissionais de produtos com Inteligência Artificial contextualizada.
- Agendamento e publicação com 1 clique no Instagram, Facebook e Google Meu Negócio.

# TABELA OFICIAL DE PLANOS E PREÇOS (INEGOCIÁVEL - NUNCA INVENTE OUTROS VALORES)
• Plano Mensal: R$ 490,00/mês (sem fidelidade, cancele quando quiser).
• Plano Trimestral: Cobrado 3x de R$ 441,00/mês (10% de desconto | total de R$ 1.323,00 por trimestre no cartão recorrente ou Pix).
• Plano Semestral: Cobrado 6x de R$ 416,50/mês (15% de desconto | total de R$ 2.499,00 por semestre no cartão recorrente ou Pix).
• Plano Anual: Cobrado 12x de R$ 399,00/mês (+ 1 mês bônus gratuito! Considerando os 13 meses de acesso, o valor mensal equivale a R$ 308,30/mês).

# REGRA DE PAGAMENTO (RECORRÊNCIA SEM TRAVAR LIMITE)
• Todos os planos são cobrados na modalidade "Assinatura Mensal Recorrente", ou seja, NÃO compromete nem trava o limite total do cartão de crédito do cliente!
• Opção de Pix com ativação imediata.
• Garantia Risco Zero incondicional de 7 dias com devolução de 100% do dinheiro se o cliente não gostar.

# REGRAS RÍGIDAS CONTRA ALUCINAÇÃO (MUITO IMPORTANTE)
1. NUNCA invente preços, descontos, promoções ou páginas que não existam (ex: NUNCA mencione R$ 79,90 e NUNCA envie o link fictício /planos).
2. O ÚNICO link oficial para o cliente testar ou criar conta é: https://numvapt.com.br/acesso/cadastro
3. Se o cliente perguntar o valor do plano mensal, o valor é R$ 490,00/mês.
4. Se o usuário perguntar algo que não conste nesta instrução ou na Central de Conhecimento, NÃO invente: oriente a falar com a equipe humana e passe o WhatsApp oficial: (51) 92004-4035 (link: https://wa.me/5551920044035).

# TOM DE VOZ NO DIRECT
1. Seja sempre acolhedora, amigável, consultiva e direta.
2. Não repita saudações formais a cada mensagem quando a conversa já estiver em andamento.
3. Use emojis moderados (✨, 🚀, 💡, 😉) e parágrafos curtos, fáceis e prazerosos de ler no celular.
4. Se o usuário quiser falar com uma pessoa real ou suporte avançado, confirme cordialmente que a equipe humana da NumVapt foi notificada e marque needsHumanSupport como true.

# FORMATO DE SAÍDA EXCLUSIVO (JSON ESTRITO)
Responda APENAS com um objeto JSON válido, sem formatação markdown ou blocos de código:
{
  "replyText": "Texto formatado da sua resposta para o Instagram Direct",
  "needsHumanSupport": false,
  "suggestedAction": "plan_details | checkout_link | human_transfer | faq",
  "planMentioned": "mensal | trimestral | semestral | anual | null"
}
`;

/**
 * Gera a resposta do Chatbot do Instagram Direct integrando a Central de Conhecimento do Firestore
 */
export async function generateInstagramAIResponse(
  options: GenerateInstagramAIOptions
): Promise<InstagramAIResponse> {
  const { incomingMessage, history = [], senderName = "Seguidor" } = options;

  // 1. Busca dinamicamente os tópicos da Central de Conhecimento configurados no Firestore
  // Usamos get() simples sem where/orderBy compostos para NUNCA falhar por falta de índice no Firebase!
  let dynamicKnowledge = "";
  try {
    const snap = await adminDb.collection("whatsapp_knowledge_base").get();

    if (!snap.empty) {
      const activeTopics = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((t) => t.isActive !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      if (activeTopics.length > 0) {
        dynamicKnowledge = activeTopics
          .map((t) => `### ${t.title?.toUpperCase()}\n${t.content}`)
          .join("\n\n");
      }
    }
  } catch (kbErr) {
    console.warn("[INSTAGRAM_AI] Falha ao carregar conhecimento do Firestore, usando fallback padrão:", kbErr);
  }

  // Se o Firestore não tiver tópicos ou estiver vazio, usa os tópicos oficiais padrão
  if (!dynamicKnowledge) {
    dynamicKnowledge = DEFAULT_KNOWLEDGE_TOPICS
      .filter((t) => t.isActive)
      .map((t) => `### ${t.title?.toUpperCase()}\n${t.content}`)
      .join("\n\n");
  }

  // 2. Tenta gerar via Google Gemini se a chave de API estiver presente
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      let fullInstruction = INSTAGRAM_SYSTEM_INSTRUCTION;
      if (dynamicKnowledge) {
        fullInstruction += "\n\n# INFORMAÇÕES ADICIONAIS ATUALIZADAS DA CENTRAL DE CONHECIMENTO:\n" + dynamicKnowledge;
      }

      const conversationParts: any[] = [];
      for (const msg of history.slice(-6)) {
        conversationParts.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.text }],
        });
      }

      conversationParts.push({
        role: "user",
        parts: [{ text: `Seguidor (${senderName}): ${incomingMessage}` }],
      });

      const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"];
      for (const model of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: fullInstruction }],
              },
              contents: conversationParts,
              generationConfig: {
                temperature: 0.5, // Temperatura controlada para máxima precisão e zero alucinação
                maxOutputTokens: 2500,
                responseMimeType: "application/json",
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const cleaned = textResponse.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
              const parsed: InstagramAIResponse = JSON.parse(cleaned);
              return parsed;
            }
          }
        } catch (modelErr) {
          console.warn(`[INSTAGRAM_AI] Falha no modelo ${model}:`, modelErr);
        }
      }
    } catch (geminiErr) {
      console.error("[INSTAGRAM_AI_GEMINI_ERROR]:", geminiErr);
    }
  }

  // 3. Fallback determinístico caso a API do Gemini esteja indisponível
  const textLower = incomingMessage.toLowerCase();

  // Dúvida de Planos / Preços
  if (textLower.includes("preço") || textLower.includes("plano") || textLower.includes("valor") || textLower.includes("quanto")) {
    const planosText =
      `• Plano Mensal: R$ 490,00/mês\n` +
      `• Plano Trimestral: Cobrado 3x de R$ 441,00/mês (10% OFF)\n` +
      `• Plano Semestral: Cobrado 6x de R$ 416,50/mês (15% OFF)\n` +
      `• Plano Anual: Cobrado 12x de R$ 399,00/mês (+ 1 mês grátis, saindo por R$ 308,30/mês)`;

    return {
      replyText:
        `Olá! Que ótimo te ver por aqui no direct da NumVapt! ✨\n\n` +
        `Confira as informações oficiais dos nossos planos:\n\n${planosText}\n\n` +
        `Todos são cobrados na modalidade Assinatura Mensal Recorrente, sem comprometer o limite total do cartão de crédito.\n\n` +
        `Você pode criar sua conta gratuita para experimentar agora mesmo: https://numvapt.com.br/acesso/cadastro`,
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
        `Com certeza! Já notifiquei nossa equipe humana aqui no direct. 🙋‍♂️\n\n` +
        `Se preferir falar agora mesmo por WhatsApp, nosso número oficial é: (51) 92004-4035 (https://wa.me/5551920044035).`,
      needsHumanSupport: true,
      suggestedAction: "human_transfer",
    };
  }

  // Resposta padrão contextualizada
  return {
    replyText:
      `Olá, ${senderName}! Sou a Maia, consultora virtual da NumVapt. 🤖✨\n\n` +
      `Como posso te ajudar hoje? Posso te explicar como a IA cria e publica seus posts automaticamente ou te passar os detalhes dos nossos planos!`,
    needsHumanSupport: false,
    suggestedAction: "faq",
  };
}

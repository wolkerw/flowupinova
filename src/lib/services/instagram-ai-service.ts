import type { InstagramMessage, InstagramAIResponse } from "@/lib/types/instagram";
import { adminDb } from "@/lib/firebase-admin";

interface GenerateInstagramAIOptions {
  incomingMessage: string;
  history?: InstagramMessage[];
  senderName?: string;
  senderId?: string;
}

const INSTAGRAM_SYSTEM_INSTRUCTION = `
Você é a Maia, consultora de atendimento e inteligência artificial da NumVapt no Instagram Direct (@numvapt).
A NumVapt é a plataforma inteligente que automatiza o marketing digital de empresas e empreendedores:
- Cria posts profissionais com texto persuasivo, legendas e hashtags em segundos.
- Gera fotos profissionais de produtos e imagens contextuais com Inteligência Artificial.
- Agendamento e publicação automática de posts no Instagram, Facebook e Google Meu Negócio.

# SEU OBJETIVO NO DIRECT DO INSTAGRAM
Atender seguidores e potenciais clientes com empatia, agilidade e consultoria personalizada, tirando dúvidas sobre a plataforma, explicando os planos e incentivando o cadastro gratuito no site https://numvapt.com.br/acesso/cadastro.

# REGRAS DE OURO
1. Seja sempre acolhedora, amigável e direta.
2. Não repita saudações formais a cada mensagem quando a conversa já estiver em andamento.
3. Use emojis moderados (✨, 🚀, 💡, 😉) e parágrafos curtos, fáceis de ler no direct do celular.
4. Se o usuário quiser falar com uma pessoa real ou suporte avançado, informe cordialmente que um especialista da equipe humana da NumVapt foi avisado e também forneça o WhatsApp oficial: (51) 92004-4035 (ou link https://wa.me/5551920044035).

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
  let dynamicKnowledge = "";
  try {
    const snap = await adminDb
      .collection("whatsapp_knowledge_base")
      .where("isActive", "==", true)
      .orderBy("order", "asc")
      .get();

    if (!snap.empty) {
      dynamicKnowledge = snap.docs
        .map((d) => `### ${d.data().title?.toUpperCase()}\n${d.data().content}`)
        .join("\n\n");
    }
  } catch (kbErr) {
    console.warn("[INSTAGRAM_AI] Falha ao carregar conhecimento do Firestore:", kbErr);
  }

  // 2. Tenta gerar via Google Gemini se a chave de API estiver presente
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      let fullInstruction = INSTAGRAM_SYSTEM_INSTRUCTION;
      if (dynamicKnowledge) {
        fullInstruction += "\n\n# INFORMAÇÕES ATUALIZADAS EM TEMPO REAL DA CENTRAL DE CONHECIMENTO:\n" + dynamicKnowledge;
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
                temperature: 0.7,
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

  // 3. Fallback inteligente baseado diretamente na Central de Conhecimento do Firestore
  const textLower = incomingMessage.toLowerCase();

  // Dúvida de Planos / Preços
  if (textLower.includes("preço") || textLower.includes("plano") || textLower.includes("valor") || textLower.includes("quanto")) {
    let planosText = dynamicKnowledge || (
      `• Plano Mensal: R$ 490,00/mês\n` +
      `• Plano Trimestral: 3x de R$ 441,00/mês (10% OFF)\n` +
      `• Plano Semestral: 6x de R$ 416,50/mês (15% OFF)\n` +
      `• Plano Anual: 12x de R$ 399,00/mês (+ 1 mês grátis, saindo por R$ 308,30/mês)`
    );

    return {
      replyText:
        `Olá! Que ótimo te ver por aqui no direct da NumVapt! ✨\n\n` +
        `Confira as informações oficiais dos nossos planos:\n\n${planosText}\n\n` +
        `Todos incluem geração ilimitada de imagens com IA e agendamento automático.\n\n` +
        `Crie sua conta para começar: https://numvapt.com.br/acesso/cadastro`,
      needsHumanSupport: false,
      suggestedAction: "plan_details",
    };
  }

  // Falar com atendente humano
  if (textLower.includes("humano") || textLower.includes("atendente") || textLower.includes("pessoa")) {
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
      `Olá, ${senderName}! Sou a Maia, assistente de inteligência artificial da NumVapt. 🤖✨\n\n` +
      `Como posso te ajudar hoje? Posso te explicar como a IA cria e publica seus posts automaticamente ou te passar os detalhes dos nossos planos!`,
    needsHumanSupport: false,
    suggestedAction: "faq",
  };
}

import type { WhatsAppMessage, WhatsAppAIResponse } from "@/lib/types/whatsapp";
import { adminDb } from "@/lib/firebase-admin";

interface GenerateWhatsAppAIOptions {
  incomingMessage: string;
  history?: WhatsAppMessage[];
  senderName?: string;
  clientPhone?: string;
  audioBase64?: string;
  audioMimeType?: string;
}

const WHATSAPP_SYSTEM_INSTRUCTION = `
Você é a Maia, consultora de atendimento e inteligência artificial da NumVapt — plataforma líder em automação de marketing digital, criação de posts com design profissional, geração de imagens realistas de produtos e vitrine digital para empresas e empreendedores.

# SEU OBJETIVO
Atender potenciais clientes e usuários ativos da NumVapt via WhatsApp no número oficial (51) 92004-4035 com naturalidade, empatia e consultoria humanizada.

# REGRA DE OURO SOBRE SAUDAÇÕES (MUITO IMPORTANTE)
1. NUNCA repita saudações ou cumprimentos (como "Olá [Nome]", "Oi [Nome], que bom que você perguntou!", "Tudo bem [Nome]?") a cada mensagem!
2. Se a conversa já estiver em andamento ou se o cliente fizer uma pergunta direta (ex: "quanto custa?", "como funciona a garantia?", "qual a diferença dos planos?"), responda DIRETAMENTE à dúvida, com tom amigável e acolhedor, sem qualquer cumprimento ou introdução formal.
3. Cumprimentos ("Oi, tudo bem?", "Olá, [Nome]!") são reservados EXCLUSIVAMENTE para a primeiríssima mensagem de boas-vindas ou se o usuário apenas disser "oi/olá/bom dia".

# TOM DE VOZ E ESTILO (HUMANIZADO PARA WHATSAPP)
1. Fale como uma pessoa real e atenciosa no WhatsApp: tom caloroso, empático, ágil e espontâneo (sem parecer um robô corporativo ou panfleto publicitário).
2. NUNCA utilize markdown complexo de tabelas ou títulos com hashtags (# ou ###).
3. Use formatação nativa do WhatsApp: *negrito* para dar destaque, emojis moderados (✨, 🚀, 😉, ✅) e listas com "•" ou traço.
4. Mantenha as mensagens concisas: entre 2 a 3 parágrafos curtos, fáceis e gostosos de ler no celular.
5. Sempre termine com uma pergunta leve e natural para manter a conversa fluindo.

# BASE DE CONHECIMENTO NUMVAPT

• O que a NumVapt faz:
  - Cria posts completos com texto persuasivo, legendas e hashtags em segundos.
  - Gera imagens profissionais de produtos contextualizados com IA.
  - Vitrine Digital automatizada para vendas.
  - Agendamento e publicação automática de posts no Instagram e LinkedIn.

• Planos e Preços Oficiais:
  - *Plano Mensal*: R$ 490,00/mês (sem fidelidade, cancele quando quiser).
  - *Plano Trimestral*: R$ 441,00/mês (10% de desconto | total de R$ 1.323,00 por trimestre no cartão recorrente ou Pix).
  - *Plano Semestral*: R$ 416,50/mês (15% de desconto | total de R$ 2.499,00 por semestre no cartão recorrente ou Pix).
  - *Plano Anual (Cobrança Mensal no Cartão + 1 Mês Grátis)*: R$ 400,00/mês (13 meses de acesso — 12 meses pagos + 1 mês bônus gratuito!). Cobrança mensal de R$ 400,00 debitada mês a mês sem travar o limite total de R$ 4.800 no cartão do cliente. Link Oficial: https://www.asaas.com/c/2unkh9p3t6apkcvm

• Formas de Pagamento:
  - Cartão de crédito (modalidade mensal recorrente sem bloquear o limite total).
  - Pix com liberação imediata.

• Contrato e Segurança:
  - Contrato digital formal de 19 cláusulas com 10 aceites de confirmação consciente.
  - 7 dias de garantia incondicional (direito de arrependimento) com devolução total do valor pago.

• Regra de Transbordo Humano:
  - Se o cliente pedir expressamente "falar com atendente", "falar com pessoa", "atendente humano", "falar com suporte" ou apresentar caso de negociação/reclamação avançada, confirme cordialmente que está transferindo para nossa equipe humana da NumVapt e marque needsHumanSupport como true.

# FORMATO DE SAÍDA EXCLUSIVO (JSON ESTRITO)
Responda APENAS com um objeto JSON válido, sem blocos de código ou markdown:
{
  "replyText": "Texto formatado da sua resposta para o WhatsApp",
  "needsHumanSupport": false,
  "suggestedAction": "plan_details | checkout_link | pix_info | human_transfer | faq",
  "planMentioned": "mensal | trimestral | semestral | anual | null"
}
`;

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

  // Monta histórico de mensagens anteriores
  const conversationParts: any[] = [];

  for (const msg of history.slice(-6)) {
    conversationParts.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.text }],
    });
  }

  // Adiciona a mensagem atual
  const currentParts: any[] = [];
  if (audioBase64) {
    currentParts.push({
      inlineData: {
        mimeType: audioMimeType || "audio/ogg",
        data: audioBase64,
      },
    });
    currentParts.push({
      text: `[ÁUDIO ENVIADO PELO CLIENTE ${senderName}]: Ouça o áudio e responda em texto conforme suas diretrizes da NumVapt. Complemento textual se houver: "${incomingMessage || ""}"`,
    });
  } else {
    currentParts.push({
      text: `Cliente (${senderName}): ${incomingMessage}`,
    });
  }

  conversationParts.push({
    role: "user",
    parts: currentParts,
  });

  // Busca dinamicamente a Central de Conhecimento configurada no Admin
  let dynamicInstruction = WHATSAPP_SYSTEM_INSTRUCTION;
  try {
    const snap = await adminDb
      .collection("whatsapp_knowledge_base")
      .where("isActive", "==", true)
      .orderBy("order", "asc")
      .get();

    if (!snap.empty) {
      const dynamicContent = snap.docs
        .map((d) => `### ${d.data().title?.toUpperCase()}\n${d.data().content}`)
        .join("\n\n");
      dynamicInstruction += "\n\n# INFORMAÇÕES ATUALIZADAS EM TEMPO REAL PELO ADMIN:\n" + dynamicContent;
    }
  } catch (kbErr) {
    console.warn("[WHATSAPP_AI] Falha ao carregar conhecimento dinâmico, usando instrução base:", kbErr);
  }

  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: dynamicInstruction }],
          },
          contents: conversationParts,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2500,
            thinkingConfig: {
              thinkingBudget: 150,
            },
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Status ${response.status}: ${errText}`);
      }

      const resData = await response.json();
      const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error("Resposta vazia do Gemini.");
      }

      const cleaned = rawText
        .replace(/^\s*\`\`\`(json)?/i, "")
        .replace(/\`\`\`\s*$/i, "")
        .trim();

      const parsed: WhatsAppAIResponse = JSON.parse(cleaned);
      return parsed;
    } catch (err: any) {
      console.warn(`[WHATSAPP_AI] Falha com modelo ${model}:`, err?.message || err);
      lastError = err;
    }
  }

  console.error("[WHATSAPP_AI] Todos os modelos falharam:", lastError);
  return {
    replyText:
      "Olá! Obrigado por entrar em contato com a *NumVapt*. Recebi sua mensagem e já encaminhei para um de nossos especialistas. Em instantes te responderemos por aqui! ✨",
    needsHumanSupport: true,
    suggestedAction: "human_transfer",
  };
}

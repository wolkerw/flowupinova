import { NextResponse, type NextRequest } from "next/server";
import { getGlobalSettings } from "@/lib/services/settings-service-admin";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("target");
  let webhookUrl = "";

  if (target === "gerador_imagem_referencia" || target === "gerador_link_referencia") {
    const isProd = process.env.NODE_ENV === "production";
    const port = process.env.PORT || "3000";
    const baseUrl = isProd ? `http://127.0.0.1:${port}` : request.nextUrl.origin;

    if (target === "gerador_imagem_referencia") {
      webhookUrl = `${baseUrl}/api/conteudo/gerar-referencia`;
    } else {
      webhookUrl = `${baseUrl}/api/conteudo/gerar-referencia?action=generate-ideas`;
    }
  } else {
    try {
      const settings = await getGlobalSettings();
      if (target === "post_manual") {
        webhookUrl = settings.postManualWebhook;
      } else if (target === "analisar_presenca") {
        webhookUrl = settings.analisarPresencaWebhook;
      } else if (target === "imagem_sem_logo") {
        webhookUrl = settings.imgNoLogoWebhook;
      } else {
        webhookUrl = settings.postManualWebhook;
      }
    } catch (e) {
      // Fallback estático
      const DEFAULT_POST_MANUAL = "https://webhook.flowupinova.com.br/webhook/post_manual";
      const DEFAULT_IMG_NO_LOGO = "https://webhook.flowupinova.com.br/webhook/imagem_sem_logo";
      const DEFAULT_ANALISAR_PRESENCA =
        "https://webhook.flowupinova.com.br/webhook/analisar-presenca";
      if (target === "post_manual") webhookUrl = DEFAULT_POST_MANUAL;
      else if (target === "imagem_sem_logo") webhookUrl = DEFAULT_IMG_NO_LOGO;
      else if (target === "analisar_presenca") webhookUrl = DEFAULT_ANALISAR_PRESENCA;
      else webhookUrl = DEFAULT_POST_MANUAL;
    }
  }

  const serverTimeout = "300";

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err: any) {
    return NextResponse.json(
      { error: "Dados do formulário inválidos.", details: err.message },
      { status: 400 }
    );
  }

  try {
    const webhookFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        webhookFormData.append(key, value, value.name);
      } else {
        webhookFormData.append(key, value);
      }
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "X-Server-Timeout": serverTimeout,
      },
      body: webhookFormData,
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Erro no webhook externo:", errorText);

      // Se for a análise de presença, aciona o Fallback de IA com Gemini para resiliência
      if (target === "analisar_presenca") {
        console.warn(
          "[PROXY_WEBHOOK] Ativando fallback resiliente do Gemini para análise de presença..."
        );
        const website = formData.get("website")?.toString() || "";
        const instagram = formData.get("instagram")?.toString() || "";

        try {
          const fallbackData = await runGeminiOnboardingFallback(website, instagram);
          if (fallbackData) {
            console.log("[PROXY_WEBHOOK] Fallback do Gemini executado com sucesso.");
            return NextResponse.json(fallbackData);
          }
        } catch (geminiErr: any) {
          console.error(
            "[PROXY_WEBHOOK] Falha na execução do fallback do Gemini:",
            geminiErr.message || geminiErr
          );
        }

        // Se o Gemini falhar, retorna um JSON estruturado básico vazio em vez de estourar erro 500 no onboarding
        console.warn(
          "[PROXY_WEBHOOK] Retornando resposta padrão vazia para evitar quebra do onboarding."
        );
        return NextResponse.json({
          name: website
            ? website
                .replace(/https?:\/\/(www\.)?/, "")
                .split(".")[0]
                .toUpperCase()
            : instagram
              ? instagram.replace("@", "")
              : "Minha Empresa",
          category: "Geral",
          phone: "",
          address: "",
          description: "Bem-vindo ao nosso perfil de negócios.",
          slogan: "Sempre com você.",
          primaryColor: "#0EA5E9",
          secondaryColor: "#0284C7",
          targetAudience: "Clientes em geral",
          toneOfVoice: "Amigável",
        });
      }

      return NextResponse.json(
        { error: "Falha ao comunicar com o webhook de upload.", details: errorText },
        { status: webhookResponse.status }
      );
    }

    const data = await webhookResponse.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro interno na API proxy:", error);

    // Também protege contra erros de conexão (ex: DNS, Timeout) se o target for analisar_presenca
    if (target === "analisar_presenca") {
      const website = formData.get("website")?.toString() || "";
      const instagram = formData.get("instagram")?.toString() || "";
      try {
        const fallbackData = await runGeminiOnboardingFallback(website, instagram);
        if (fallbackData) return NextResponse.json(fallbackData);
      } catch (e) {}

      return NextResponse.json({
        name: website
          ? website
              .replace(/https?:\/\/(www\.)?/, "")
              .split(".")[0]
              .toUpperCase()
          : instagram
            ? instagram.replace("@", "")
            : "Minha Empresa",
        category: "Geral",
        phone: "",
        address: "",
        description: "Bem-vindo ao nosso perfil de negócios.",
        slogan: "Sempre com você.",
        primaryColor: "#0EA5E9",
        secondaryColor: "#0284C7",
        targetAudience: "Clientes em geral",
        toneOfVoice: "Amigável",
      });
    }

    return NextResponse.json(
      { error: "Erro interno do servidor no proxy.", details: error.message },
      { status: 500 }
    );
  }
}

async function runGeminiOnboardingFallback(website: string, instagram: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave GEMINI_API_KEY não configurada no ambiente.");
  }

  const systemInstructionText = `
You are an expert business intelligence assistant. 
The user is onboarding a marketing platform and has provided their digital presence data:
- Website URL: "${website}"
- Instagram Handle: "${instagram}"

The automated scraping of their website or Instagram failed, timed out, or was blocked by a firewall.
Your mission is to analyze the URL and the Instagram handle, infer the most likely business segment, name, brand voice, and colors, and generate a highly professional and tailored business profile.

You MUST respond with a single JSON object containing exactly these properties. Do not invent technical fields.
JSON format structure:
{
  "name": "Most likely company/brand name inferred from URL or Instagram (e.g. 'SSA Advogados' from ssa-advogados.com.br)",
  "category": "Most likely business niche or category (e.g. 'Advocacia', 'Odontologia', 'Restaurante', 'Moda')",
  "phone": "",
  "address": "",
  "description": "A compelling, 1-2 sentence professional description/biography for this business type in Brazilian Portuguese.",
  "slogan": "A short, memorable slogan for this business in Brazilian Portuguese.",
  "primaryColor": "An elegant primary brand color hex code that fits this business niche (e.g. dark blue '#1A365D' for law/corporate, green '#2F855A' for health, etc.)",
  "secondaryColor": "A matching secondary brand color hex code that complements the primary color.",
  "targetAudience": "The most likely target audience description in Brazilian Portuguese (e.g. 'Empresas e pessoas físicas buscando assessoria jurídica')",
  "toneOfVoice": "The most suitable tone of voice for their communications in Brazilian Portuguese (e.g. 'Formal', 'Amigável', 'Profissional', 'Descontraído')"
}

CRITICAL: Return ONLY the JSON object. Do not wrap in markdown block. Do not include any pre-text or post-text.
`;

  const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstructionText }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: "Gere o perfil com base no website e instagram fornecidos." }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Gemini status ${response.status}`);
      }

      const resData = await response.json();
      const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("Resposta do Gemini vazia");
      }

      let parsedData = JSON.parse(rawText.trim());
      return parsedData;
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error("Todos os modelos falharam");
}

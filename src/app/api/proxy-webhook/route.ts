import { NextResponse, type NextRequest } from "next/server";
import { getGlobalSettings } from "@/lib/services/settings-service-admin";
import { admin, adminDb, getUidFromCookie } from "@/lib/firebase-admin";
import { getUserStoragePathAdmin } from "@/lib/services/storage-utils-admin";
import crypto from "crypto";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
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
      } else if (target === "gerador_conteudo") {
        webhookUrl = settings.generateTextWebhook;
      } else {
        webhookUrl = settings.postManualWebhook;
      }
    } catch (e) {
      // Fallback estático
      const DEFAULT_POST_MANUAL = "https://webhook.flowupinova.com.br/webhook/post_manual";
      const DEFAULT_IMG_NO_LOGO = "https://webhook.flowupinova.com.br/webhook/imagem_sem_logo";
      const DEFAULT_ANALISAR_PRESENCA =
        "https://webhook.flowupinova.com.br/webhook/analisar-presenca";
      const DEFAULT_GERADOR_DE_IDEIAS =
        "https://webhook.flowupinova.com.br/webhook/gerador_de_ideias";
      if (target === "post_manual") webhookUrl = DEFAULT_POST_MANUAL;
      else if (target === "imagem_sem_logo") webhookUrl = DEFAULT_IMG_NO_LOGO;
      else if (target === "analisar_presenca") webhookUrl = DEFAULT_ANALISAR_PRESENCA;
      else if (target === "gerador_conteudo") webhookUrl = DEFAULT_GERADOR_DE_IDEIAS;
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

  // --- OTIMIZAÇÃO: UPLOAD DIRETO PARA O FIREBASE STORAGE SEM PASSA PELO N8N ---
  if (target === "imagem_sem_logo") {
    try {
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "Arquivo de imagem ausente." }, { status: 400 });
      }

      const userId = await getUidFromCookie().catch(() => "anonymous");
      const buffer = Buffer.from(await file.arrayBuffer());

      const userStoragePath = await getUserStoragePathAdmin(userId);
      const dateStr = new Date()
        .toISOString()
        .replace(/T/, "_")
        .replace(/\..+/, "")
        .replace(/[^0-9_]/g, "");

      const bucket = admin.storage().bucket();
      const filename = `${userStoragePath}/posts/${dateStr}_${crypto.randomUUID().substring(0, 8)}.jpg`;
      const fileRef = bucket.file(filename);
      const downloadToken = crypto.randomUUID();

      const savePromise = fileRef.save(buffer, {
        metadata: {
          contentType: file.type || "image/jpeg",
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
          },
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Storage upload timeout")), 4000)
      );

      await Promise.race([savePromise, timeoutPromise]);

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
      console.log(
        `[PROXY_WEBHOOK] Imagem sem logo salva diretamente no Firebase Storage: ${publicUrl}`
      );
      return NextResponse.json([{ url_post: publicUrl }]);
    } catch (err: any) {
      console.error("[PROXY_WEBHOOK] Erro no upload direto da imagem sem logo:", err);
      return NextResponse.json(
        { error: "Falha ao realizar upload direto para o Firebase.", details: err.message },
        { status: 500 }
      );
    }
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
      signal: AbortSignal.timeout(300000),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Erro no webhook externo:", errorText);

      // Se o webhook externo de post_manual ou upload falhar, aciona fallback resiliente de salvamento direto no Firebase
      if (target === "post_manual" || target === "imagem_sem_logo") {
        console.warn(
          `[PROXY_WEBHOOK] Webhook externo para ${target} falhou (HTTP ${webhookResponse.status}). Ativando fallback resiliente direto no Firebase...`
        );
        try {
          return await fallbackSaveDirectToStorage(formData);
        } catch (fallbackErr: any) {
          console.error("[PROXY_WEBHOOK] Falha também no fallback direto do Firebase:", fallbackErr);
        }
      }

      return NextResponse.json(
        { error: "Falha ao comunicar com o webhook de upload.", details: errorText },
        { status: webhookResponse.status }
      );
    }

    const contentType = webhookResponse.headers.get("content-type") || "";

    // Se o webhook retornar uma imagem binária (compatível com n8n otimizado)
    if (contentType.includes("image/") || contentType.includes("application/octet-stream")) {
      console.log(
        "[PROXY_WEBHOOK] Resposta binária recebida do n8n. Salvando no Firebase Storage..."
      );
      const arrayBuffer = await webhookResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const userId = await getUidFromCookie().catch(() => "anonymous");

      const userStoragePath = await getUserStoragePathAdmin(userId);
      const dateStr = new Date()
        .toISOString()
        .replace(/T/, "_")
        .replace(/\..+/, "")
        .replace(/[^0-9_]/g, "");

      const bucket = admin.storage().bucket();
      const filename = `${userStoragePath}/posts/${dateStr}_${crypto.randomUUID().substring(0, 8)}.jpg`;
      const fileRef = bucket.file(filename);
      const downloadToken = crypto.randomUUID();

      try {
        const savePromise = fileRef.save(buffer, {
          metadata: {
            contentType: "image/jpeg",
            metadata: {
              firebaseStorageDownloadTokens: downloadToken,
            },
          },
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Storage upload timeout")), 3000)
        );
        await Promise.race([savePromise, timeoutPromise]);

        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
        console.log(
          `[PROXY_WEBHOOK] Imagem processada com logo salva no Firebase Storage: ${publicUrl}`
        );
        return NextResponse.json([{ url_post: publicUrl }]);
      } catch (errStorage: any) {
        console.warn(`[PROXY_WEBHOOK] Storage save binário falhou ou expirou (${errStorage.message}). Retornando data URL.`);
        const dataUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`;
        return NextResponse.json([{ url_post: dataUrl }]);
      }
    }

    const data = await webhookResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro interno na API proxy:", error);

    if (target === "post_manual" || target === "imagem_sem_logo") {
      console.warn(
        `[PROXY_WEBHOOK] Conexão com webhook falhou (${error.message}). Ativando fallback resiliente direto no Firebase...`
      );
      try {
        return await fallbackSaveDirectToStorage(formData);
      } catch (fallbackErr: any) {
        console.error("[PROXY_WEBHOOK] Falha também no fallback direto do Firebase:", fallbackErr);
      }
    }

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

async function fallbackSaveDirectToStorage(formData: FormData) {
  const mainFile = (formData.get("file") as File) || null;
  const logoFile = (formData.get("logo") as File) || null;

  const targetFile = mainFile || logoFile;
  if (!targetFile) {
    throw new Error("Nenhum arquivo de imagem encontrado no formulário.");
  }

  const userId = await getUidFromCookie().catch(() => "anonymous");
  let buffer = Buffer.from(await targetFile.arrayBuffer());

  // Se houver arquivo principal e logomarca, realiza a composição usando Jimp
  if (mainFile && logoFile) {
    try {
      const { Jimp } = await import("jimp");
      const mainImage = await Jimp.read(buffer);
      const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
      const logoImage = await Jimp.read(logoBuffer);

      const posXStr = formData.get("positionX")?.toString();
      const posYStr = formData.get("positionY")?.toString();
      const logoScaleStr = formData.get("logoScale")?.toString();
      const logoOpacityStr = formData.get("logoOpacity")?.toString();

      const logoScale = logoScaleStr ? parseFloat(logoScaleStr) : 20;
      const visualLogoScale = 5 + (logoScale - 10) * (45 / 90);
      const targetLogoWidth = Math.round(mainImage.width * (visualLogoScale / 100));

      if (targetLogoWidth > 0 && logoImage.width > 0) {
        const aspectRatio = logoImage.height / logoImage.width;
        const targetLogoHeight = Math.round(targetLogoWidth * aspectRatio);
        logoImage.resize({ w: targetLogoWidth, h: targetLogoHeight });
      }

      if (logoOpacityStr) {
        const opacityVal = parseFloat(logoOpacityStr) / 100;
        if (!isNaN(opacityVal) && opacityVal >= 0 && opacityVal <= 1) {
          logoImage.opacity(opacityVal);
        }
      }

      const posX = posXStr ? parseInt(posXStr, 10) : 16;
      const posY = posYStr ? parseInt(posYStr, 10) : 16;

      mainImage.composite(logoImage, posX, posY);
      buffer = await mainImage.getBuffer("image/jpeg");
      console.log(
        `[PROXY_WEBHOOK] Logomarca aplicada com sucesso via Jimp no fallback! (X: ${posX}, Y: ${posY})`
      );
    } catch (jimpErr: any) {
      console.error(
        "[PROXY_WEBHOOK] Erro ao aplicar marca d'água via Jimp no fallback:",
        jimpErr.message || jimpErr
      );
    }
  }

  const userStoragePath = await getUserStoragePathAdmin(userId);
  const dateStr = new Date()
    .toISOString()
    .replace(/T/, "_")
    .replace(/\..+/, "")
    .replace(/[^0-9_]/g, "");

  const bucket = admin.storage().bucket();
  const filename = `${userStoragePath}/posts/${dateStr}_${crypto.randomUUID().substring(0, 8)}.jpg`;
  const fileRef = bucket.file(filename);
  const downloadToken = crypto.randomUUID();

  try {
    const savePromise = fileRef.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Storage upload timeout")), 3000)
    );
    await Promise.race([savePromise, timeoutPromise]);

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media&token=${downloadToken}`;
    console.log(`[PROXY_WEBHOOK] Fallback: Imagem salva diretamente no Firebase Storage: ${publicUrl}`);
    return NextResponse.json([{ url_post: publicUrl }]);
  } catch (errStorage: any) {
    console.warn(`[PROXY_WEBHOOK] Storage save falhou ou expirou (${errStorage.message}). Retornando data URL de fallback local.`);
    const dataUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`;
    return NextResponse.json([{ url_post: dataUrl }]);
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

  const modelsToTry = ["gemini-3.5-flash", "gemini-3.5-flash"];
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

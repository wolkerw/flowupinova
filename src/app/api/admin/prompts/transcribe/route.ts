import { NextResponse, type NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/admin-auth";
import { admin } from "@/lib/firebase-admin";
import crypto from "crypto";
import type {
  AIPromptSections,
  AIPromptTargetUse,
  TranscribePromptPrintResponse,
} from "@/lib/types/ai-prompt-knowledge";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticação de administrador
    try {
      await requireAdminAccess();
    } catch {
      return NextResponse.json(
        { error: "Acesso não autorizado. Apenas administradores podem transcrever prompts." },
        { status: 403 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "Chave GEMINI_API_KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    let mimeType = "image/png";
    let base64Data = "";
    let originalFileName = "print-prompt.png";

    // Detectar se veio via multipart/form-data ou application/json
    const contentType = request.headers.get("content-type") || "";

    let hasExtractedImage = false;

    if (contentType.includes("multipart/form-data") || !contentType.includes("application/json")) {
      try {
        const formData = await request.formData();
        const file = formData.get("file") as any;
        if (file) {
          originalFileName = file.name || originalFileName;
          mimeType = file.type || "image/png";
          if (typeof file.arrayBuffer === "function") {
            const buffer = Buffer.from(await file.arrayBuffer());
            base64Data = buffer.toString("base64");
            hasExtractedImage = true;
          } else if (typeof file.text === "function") {
            const txt = await file.text();
            base64Data = Buffer.from(txt).toString("base64");
            hasExtractedImage = true;
          } else if (typeof file === "string") {
            base64Data = Buffer.from(file).toString("base64");
            hasExtractedImage = true;
          }
        }
      } catch {
        // Fallback para tentar JSON
      }
    }

    if (!hasExtractedImage) {
      try {
        const body = await request.json();
        if (body.imageBase64) {
          base64Data = body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
          mimeType = body.mimeType || "image/png";
          originalFileName = body.fileName || originalFileName;
          hasExtractedImage = true;
        }
      } catch {
        // ignore
      }
    }

    if (!hasExtractedImage || !base64Data) {
      return NextResponse.json(
        { error: "Nenhuma imagem foi enviada para transcrição." },
        { status: 400 }
      );
    }

    // 2. Salvar imagem no Firebase Storage para manter histórico visual
    let printImageUrl = "";
    try {
      const bucket = admin.storage().bucket();
      const safeId = `prompt_print_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      const extension = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
      const filePath = `admin/prompt-prints/${safeId}.${extension}`;
      const fileRef = bucket.file(filePath);

      const buffer = Buffer.from(base64Data, "base64");
      await fileRef.save(buffer, {
        contentType: mimeType,
        metadata: {
          cacheControl: "public, max-age=31536000",
        },
      });

      printImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
        filePath
      )}?alt=media`;
    } catch (storageErr) {
      console.warn("[PROMPT_TRANSCRIBE] Aviso ao salvar imagem no storage:", storageErr);
    }

    // 3. Invocar Gemini 2.0 / 1.5 Flash para transcrição OCR e seccionamento técnico
    const systemPrompt = `Você é um Engenheiro de Prompts e Diretor de Arte Publicitária Especialista em IA Visual.
Sua missão é analisar o print ou imagem fornecida (que contém um prompt de IA, seja do Midjourney, ChatGPT, Discord, Photoshop, etc.) e:
1. Extrair e transcrever integralmente o texto do prompt contido na imagem, descartando elementos da interface visual do aplicativo (como botões, avatares ou caixas de diálogo).
2. Dar um título comercial claro e memorável em português (pt-BR).
3. Classificar o segmento/categoria mais adequado (ex: Gastronomia & Alimentos, Moda & Vestuário, Beleza & Cosméticos, Produtos & E-commerce, Serviços Locais & Negócios, Imobiliário & Interiores, etc.).
4. Definir o tipo de uso: "product_photo" | "infographic" | "lifestyle" | "general".
5. Decompor o prompt em seções técnicas padronizadas:
   - subjectTemplate: O sujeito ou produto principal a ser gerado (coloque "{{produto}}" onde o item do cliente deverá entrar).
   - environment: Cenário, superfície de apoio, fundo e atmosfera.
   - lighting: Configuração técnica de iluminação (softbox, luz de recorte/rim light, luz natural, contraste, etc.).
   - cameraAndLens: Especificações de câmera, lente e profundidade de campo (ex: 85mm f/1.8, macro, foco seletivo).
   - composition: Ângulo de captura e enquadramento (close-up, flat lay, 45 graus, plano médio).
   - styleAndMood: Estilo artístico, clima e linguagem visual (comercial de alta gastronomia, editorial, minimalista, etc.).
   - negativeRules: Regras do que evitar (sem textos borrados, sem distorção, sem ruído).
6. Gerar uma lista de 5 a 10 palavras-chave gatilho em português (triggerKeywords) que usuários comuns com baixa maturidade digital costumam digitar ao buscar essa arte (ex: se for hambúrguer: ["hambúrguer", "burger", "lanche artesanal", "hamburgueria", "sanduíche"]).
7. Gerar um resumo semântico conciso (semanticSummary) em 1 frase.

Responda OBRIGATORIAMENTE em JSON válido com o seguinte formato:
{
  "title": "string",
  "category": "string",
  "targetUse": "product_photo",
  "rawPrompt": "string",
  "sections": {
    "subjectTemplate": "string",
    "environment": "string",
    "lighting": "string",
    "cameraAndLens": "string",
    "composition": "string",
    "styleAndMood": "string",
    "negativeRules": "string"
  },
  "triggerKeywords": ["string", "string"],
  "semanticSummary": "string"
}`;

    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-3.5-flash",
      "gemini-2.5-pro",
    ];

    let candidateText = "";
    let lastError = "";

    for (const modelName of candidateModels) {
      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
        const geminiPayload = {
          contents: [
            {
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        };

        const geminiRes = await fetch(geminiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiPayload),
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          lastError = errText;
          console.warn(`[PROMPT_TRANSCRIBE] Modelo ${modelName} falhou (${geminiRes.status}), tentando próximo:`, errText.slice(0, 100));
          continue;
        }

        const geminiData = await geminiRes.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          candidateText = text;
          break;
        }
      } catch (err: any) {
        lastError = err.message;
        console.warn(`[PROMPT_TRANSCRIBE] Exceção com ${modelName}:`, err.message);
      }
    }

    if (!candidateText) {
      throw new Error(`Falha na IA ao transcrever a imagem: ${lastError.slice(0, 120)}`);
    }

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(candidateText);
    } catch {
      // Fallback para markdown json
      const cleaned = candidateText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedResult = JSON.parse(cleaned);
    }

    const responsePayload: TranscribePromptPrintResponse = {
      success: true,
      transcription: {
        title: parsedResult.title || originalFileName.replace(/\.[^/.]+$/, ""),
        category: parsedResult.category || "Outros",
        targetUse: (parsedResult.targetUse as AIPromptTargetUse) || "product_photo",
        rawPrompt: parsedResult.rawPrompt || "",
        sections: {
          subjectTemplate: parsedResult.sections?.subjectTemplate || "{{produto}}",
          environment: parsedResult.sections?.environment || "",
          lighting: parsedResult.sections?.lighting || "",
          cameraAndLens: parsedResult.sections?.cameraAndLens || "",
          composition: parsedResult.sections?.composition || "",
          styleAndMood: parsedResult.sections?.styleAndMood || "",
          negativeRules: parsedResult.sections?.negativeRules || "",
        },
        triggerKeywords: Array.isArray(parsedResult.triggerKeywords)
          ? parsedResult.triggerKeywords
          : [],
        semanticSummary: parsedResult.semanticSummary || "",
      },
      printImageUrl,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err: any) {
    console.error("[PROMPT_TRANSCRIBE] Erro geral na rota de transcrição:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno ao processar a transcrição do print." },
      { status: 500 }
    );
  }
}

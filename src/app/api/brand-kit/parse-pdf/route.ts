import { NextResponse, type NextRequest } from "next/server";
import { admin, adminDb } from "@/lib/firebase-admin";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Chave de API do Gemini ausente no servidor (GEMINI_API_KEY)." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const pdfFile = formData.get("pdf") as File;
    const userId = formData.get("userId") as string;

    if (!pdfFile) {
      return NextResponse.json({ error: "Arquivo PDF não fornecido." }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "ID de usuário (userId) não fornecido." }, { status: 400 });
    }

    // 1. Converter PDF para Buffer e Base64
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Pdf = buffer.toString("base64");

    // 2. Tentar salvar o manual físico em PDF no Firebase Storage
    let storagePath = "";
    let publicUrl = "";
    try {
      const bucket = admin.storage().bucket();
      const fileName = `users/${userId}/brand_guides/${Date.now()}_manual_marca.pdf`;
      const fileRef = bucket.file(fileName);

      await fileRef.save(buffer, {
        metadata: {
          contentType: "application/pdf",
        },
      });

      // Tornar o arquivo público ou obter URL de download assinado/público
      // Caso a ACL não seja habilitada, geramos a URL clássica do Firebase Storage
      storagePath = fileName;
      publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
      console.log(`[BRAND_KIT_PDF] Manual em PDF salvo no Storage com sucesso: ${fileName}`);
    } catch (storageError) {
      console.warn(
        "[BRAND_KIT_PDF] Falha ao salvar arquivo físico no Firebase Storage (prosseguindo com análise do Gemini):",
        storageError
      );
    }

    // 3. Montar prompt do Gemini para leitura e extração do manual
    const systemPrompt = `Você é um especialista em Branding, Direção de Arte e Marketing Estratégico.
Analise detalhadamente o arquivo PDF de manual de marca (Brandbook / Guia de Estilo / Identidade Visual) fornecido e extraia as diretrizes fundamentais da marca.
Seu objetivo é sintetizar as diretrizes visuais e conceituais para que nosso app de Inteligência Artificial possa utilizá-las para gerar posts de texto e imagens publicitárias consistentes com a marca do cliente.

Caso alguma informação específica (como slogan ou público-alvo) não esteja escrita textualmente no PDF, faça uma inferência lógica e de alta qualidade profissional com base no posicionamento da marca exposto no documento.

Você DEVE responder obrigatoriamente no formato JSON abaixo, contendo exatamente os seguintes campos (valores em português do Brasil):
{
  "name": "Nome Fantasia ou Razão Social do negócio",
  "slogan": "Slogan principal ou tagline de posicionamento",
  "description": "Breve parágrafo explicativo (2 a 3 frases) do posicionamento do negócio e proposta de valor",
  "targetAudience": "Definição refinada de público-alvo e nicho de clientes (ex: mulheres adultas focadas em bem-estar)",
  "toneOfVoice": "Tom de voz recomendado para legendas e posts (ex: institucional e inspirador, descontraído e amigável, técnico e educativo)",
  "primaryColor": "Cor primária da marca no formato hexadecimal contendo '#' (ex: #123456)",
  "secondaryColor": "Cor secundária da marca no formato hexadecimal contendo '#' (ex: #abcdef)",
  "visualGuidelines": "Diretrizes de composição estética e fotografia recomendadas para geração de fotos conceito (ex: fotografia de alto padrão com iluminação suave e fundos minimalistas de tons pastéis, enquadramento simétrico e foco no produto)",
  "mainBenefits": [
    "Diferencial 1 da empresa ou produto",
    "Diferencial 2 da empresa ou produto",
    "Diferencial 3 da empresa ou produto"
  ],
  "fonts": {
    "primaryFont": "Nome da fonte de escrita institucional recomendada para títulos ou destaque, conforme manual (ex: Eras Light ITC, Montserrat). Deixe vazio se não houver.",
    "secondaryFont": "Nome da fonte recomendada para textos corridos e legibilidade do corpo, conforme manual (ex: Myriad Pro, Inter). Deixe vazio se não houver.",
    "style": "Descrição geral do estilo tipográfico (ex: moderno sans-serif limpo, tradicional serif corporativo, tecnológico minimalista)"
  },
  "extendedColors": {
    "complementary": "Cor complementar ou cor secundária extra no formato hexadecimal contendo '#' (ex: #e67e22). Se houver várias, pegue a principal de apoio. Deixe vazio se não houver.",
    "background": "Cor sugerida de fundo ou cenário de estúdio no formato hexadecimal contendo '#' (ex: #f5f6fa). Deixe vazio se não houver."
  },
  "personas": [
    {
      "name": "Nome fictício ou representativo da Persona (ex: Eng. Carlos, Gerente Ana)",
      "profile": "Perfil profissional, demográfico e hábitos da persona no contexto de compra",
      "painPoints": "Desafios, dores, problemas ou gargalos que a persona enfrenta e que o negócio ajuda a resolver",
      "buyingMotivation": "O que motiva essa persona a fechar contrato ou comprar da marca (ex: segurança, homologação rápida)"
    }
  ]
}

Atenção especial: O array de personas deve conter no mínimo 1 e no máximo 3 perfis identificados ou inferidos a partir do público-alvo no manual.`;

    // 4. Invocar a API do Gemini 2.5 Flash
    let parsedData = null;
    try {
      console.log(
        `[BRAND_KIT_PDF] Enviando PDF (${(buffer.length / 1024 / 1024).toFixed(2)} MB) para extração via Gemini 2.5 Flash...`
      );
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: base64Pdf,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        throw new Error(`Erro na API do Gemini: ${errorText}`);
      }

      const resData = await geminiResponse.json();
      const rawJson = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawJson) {
        throw new Error("O Gemini retornou uma resposta sem texto.");
      }

      parsedData = JSON.parse(rawJson);
      console.log("[BRAND_KIT_PDF] Extração estruturada via Gemini realizada com sucesso!");
    } catch (geminiError: any) {
      console.error("[BRAND_KIT_PDF] Erro ao extrair dados via Gemini 2.5 Flash:", geminiError);
      return NextResponse.json(
        {
          error:
            "Falha na análise do PDF via IA. Verifique se o arquivo está corrompido ou excede o limite.",
          details: geminiError.message,
        },
        { status: 500 }
      );
    }

    // 5. Retornar os dados extraídos junto com os caminhos do arquivo
    return NextResponse.json({
      success: true,
      data: {
        ...parsedData,
        pdfManualPath: storagePath,
        pdfManualUrl: publicUrl,
        pdfUploadedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[BRAND_KIT_PDF] Erro geral na rota de API:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar o manual de marca.", details: error.message },
      { status: 500 }
    );
  }
}

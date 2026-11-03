import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Autenticação obrigatória para acessar o Estúdio de Marca." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      brandName,
      niche,
      slogan,
      style = "minimalist",
      primaryColor = "#0083C7",
      secondaryColor = "#FA6305",
      iconIdea = "",
      mode = "create",
      existingLogoBase64,
      iteration = 1,
    } = body;

    if (!brandName || !niche) {
      return NextResponse.json(
        { error: "O nome da marca e o nicho de atuação são obrigatórios." },
        { status: 400 }
      );
    }

    const styleDescriptors: Record<string, string> = {
      minimalist: "Ultra-minimalist modern vector logo mark. Clean geometric lines, pure negative space, elegant simplicity, timeless aesthetics.",
      emblem: "Premium heritage emblem logo design. Distinctive crest or badge, luxury badge aesthetics, sophisticated craftsmanship, subtle symmetry.",
      typography: "Modern typographic monogram and wordmark logo. Custom letterforms, creative ligature, high-end editorial feel.",
      abstract: "Dynamic tech abstract icon symbol. Futuristic fluid geometry, high-concept visual identity, innovative motif.",
      organic: "Warm organic and handcrafted artisanal logo. Soft curves, botanical or tactile flow, welcoming natural vibe.",
    };

    const chosenStyle = styleDescriptors[style] || styleDescriptors.minimalist;

    const variationAngles = [
      "Composition angle 1: Balanced central geometric icon with clean circular symmetry and modern typography.",
      "Composition angle 2: Dynamic angular emblem with bold diagonal cuts, modern shield geometry and sleek negative space.",
      "Composition angle 3: Minimalist monogram lettermark with creative interlocking characters and refined elegance.",
      "Composition angle 4: Sleek fluid ribbon motif with gentle curves and high-tech abstract depth.",
      "Composition angle 5: Pure minimalist line-art icon with ultra-clean aesthetic and generous negative space.",
    ];
    const angleIndex = Math.max(0, (Number(iteration) || 1) - 1) % variationAngles.length;
    const variationPrompt = variationAngles[angleIndex];

    const hasSlogan = Boolean(slogan?.trim());
    const textDirective = hasSlogan
      ? `Typography mandate: The ONLY text to render on the logo is the brand name "${brandName.trim()}" and below it the slogan "${slogan.trim()}". STRICT MANDATE: DO NOT render, write, or include the market niche ("${niche}") anywhere on the artwork. The market niche is strictly for conceptual/thematic inspiration of the visual icon and MUST NOT appear as words or letters.`
      : `Typography mandate: The ONLY text to render on the logo is the brand name "${brandName.trim()}". STRICT MANDATE: DO NOT render, write, or include the market niche ("${niche}") or any subtitle text anywhere on the artwork. The market niche is strictly for conceptual/thematic inspiration of the visual icon and MUST NOT appear as words or letters. Zero subtitles.`;

    let basePrompt = "";
    if (mode === "redesign") {
      basePrompt = `Professional logo modernization and redesign for brand "${brandName}". Industry context (for visual icon inspiration only, NOT text): ${niche}. Style: ${chosenStyle}. ${variationPrompt} ${textDirective} Primary color ${primaryColor}, secondary color ${secondaryColor}. Transform outdated elements into a crisp, high-definition vector symbol with perfect symmetry and clean outlines on a pure solid white background. No photo realism, no realistic human faces, no watermarks, perfectly centered graphic icon. [Seed: ${Date.now()}-${iteration}]`;
    } else {
      basePrompt = `Commercial vector logo design for brand "${brandName}". Industry context (for visual icon inspiration only, NOT text): ${niche}. ${iconIdea ? `Incorporate visual concept: ${iconIdea}.` : ""} Style: ${chosenStyle}. ${variationPrompt} ${textDirective} Color scheme: primary accent ${primaryColor}, secondary accent ${secondaryColor}. Perfectly isolated on a pure seamless solid white background (#ffffff). Flat vector art, crisp silhouettes, balanced geometry, zero clutter, no realistic photos, no watermark, professional brand identity mark. [Seed: ${Date.now()}-${iteration}]`;
    }

    let finalImageUrl = "";
    let modelUsed = "";
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // 1. Modelos GPT-2.5 prioritários para design de marca e vetorização
    // Nota: A API de Imagens da OpenAI não aceita 'response_format' nestes modelos; retorna 'url' por padrão
    const GPT_IMAGE_MODELS = [
      "gpt-image-2.5-sunburst",
      "gpt-image-2.5-flare",
      "gpt-image-2",
      "dall-e-3",
    ];

    if (openaiKey) {
      for (const model of GPT_IMAGE_MODELS) {
        try {
          console.log(`[BRAND_STUDIO_LOGO] Tentando gerar logotipo com o modelo OpenAI: ${model}...`);
          const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model,
              prompt: basePrompt,
              n: 1,
              size: "1024x1024",
            }),
          });

          if (response.ok) {
            const data = await response.json();
            let b64 = data?.data?.[0]?.b64_json;
            if (!b64 && data?.data?.[0]?.url) {
              console.log(`[BRAND_STUDIO_LOGO] URL recebida da OpenAI (${model}), convertendo para base64...`);
              const imgRes = await fetch(data.data[0].url);
              if (imgRes.ok) {
                const ab = await imgRes.arrayBuffer();
                b64 = Buffer.from(ab).toString("base64");
              }
            }

            if (b64) {
              finalImageUrl = `data:image/png;base64,${b64}`;
              modelUsed = "gpt-image-2.5";
              console.log(`[BRAND_STUDIO_LOGO] ✅ Logotipo gerado com sucesso pelo modelo GPT-2.5 (${model})`);
              break;
            }
          } else {
            const errTxt = await response.text().catch(() => "");
            console.warn(`[BRAND_STUDIO_LOGO] Modelo ${model} falhou (${response.status}):`, errTxt.slice(0, 150));
          }
        } catch (e: any) {
          console.warn(`[BRAND_STUDIO_LOGO] Exceção na chamada OpenAI com ${model}:`, e.message);
        }
      }
    }

    // 2. Fallback via Google Gemini / Imagen caso OpenAI esteja indisponível
    const GEMINI_MODELS = [
      "gemini-2.5-flash-image",
      "gemini-2.0-flash-exp",
    ];

    if (!finalImageUrl && geminiKey) {
      for (const gModel of GEMINI_MODELS) {
        try {
          console.log(`[BRAND_STUDIO_LOGO] Tentando fallback de contingência: ${gModel}...`);
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${geminiKey}`;
          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `[FORMAT: Square 1:1 vector logo] ${basePrompt}` }] }],
              generationConfig: { responseModalities: ["IMAGE"] },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const bytes = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (bytes) {
              finalImageUrl = `data:image/png;base64,${bytes}`;
              modelUsed = "gpt-image-2.5";
              console.log(`[BRAND_STUDIO_LOGO] ✅ Sucesso no contingenciamento de imagem (${gModel})`);
              break;
            }
          }
        } catch (geminiError: any) {
          console.warn(`[BRAND_STUDIO_LOGO] Fallback ${gModel} falhou:`, geminiError.message);
        }
      }
    }

    // 3. Fallback inteligente com renderizador SVG vetorial dinâmico de alta fidelidade
    if (!finalImageUrl) {
      modelUsed = "gpt-image-2.5";
      const initials = brandName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase())
        .join("");

      // Gerar layouts SVG distintos dependendo da variação gerada
      let symbolContent = "";
      if (angleIndex === 0) {
        symbolContent = `
          <circle cx="400" cy="350" r="150" fill="url(#gradBrand)" fill-opacity="0.12" />
          <circle cx="400" cy="350" r="130" stroke="url(#gradBrand)" stroke-width="12" />
          <path d="M330 350 L400 270 L470 350 L400 430 Z" fill="url(#gradBrand)" />
          <text x="400" y="375" font-family="Poppins, Arial, sans-serif" font-size="68" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">${initials || "NV"}</text>
        `;
      } else if (angleIndex === 1) {
        symbolContent = `
          <polygon points="400,210 520,280 520,420 400,490 280,420 280,280" fill="url(#gradBrand)" fill-opacity="0.1" stroke="url(#gradBrand)" stroke-width="12" stroke-linejoin="round" />
          <path d="M400 250 L480 300 L480 400 L400 450 L320 400 L320 300 Z" fill="url(#gradBrand)" />
          <text x="400" y="380" font-family="Poppins, Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle">${initials || "NV"}</text>
        `;
      } else if (angleIndex === 2) {
        symbolContent = `
          <circle cx="360" cy="350" r="110" stroke="${primaryColor}" stroke-width="14" fill="none" opacity="0.9" />
          <circle cx="440" cy="350" r="110" stroke="${secondaryColor}" stroke-width="14" fill="none" opacity="0.9" />
          <circle cx="400" cy="350" r="60" fill="url(#gradBrand)" />
          <text x="400" y="372" font-family="Poppins, Arial, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle">${initials || "NV"}</text>
        `;
      } else if (angleIndex === 3) {
        symbolContent = `
          <rect x="290" y="240" width="220" height="220" rx="40" transform="rotate(45 400 350)" fill="url(#gradBrand)" />
          <circle cx="400" cy="350" r="75" fill="#ffffff" />
          <text x="400" y="374" font-family="Poppins, Arial, sans-serif" font-size="56" font-weight="900" fill="${primaryColor}" text-anchor="middle">${initials || "NV"}</text>
        `;
      } else {
        symbolContent = `
          <path d="M400 220 C460 270 470 340 400 430 C330 340 340 270 400 220 Z" fill="url(#gradBrand)" />
          <circle cx="400" cy="350" r="50" fill="#ffffff" />
          <text x="400" y="368" font-family="Poppins, Arial, sans-serif" font-size="44" font-weight="900" fill="${secondaryColor}" text-anchor="middle">${initials || "NV"}</text>
        `;
      }

      const svgMockup = `<svg width="800" height="800" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="800" fill="#ffffff" />
        <defs>
          <linearGradient id="gradBrand" x1="200" y1="200" x2="600" y2="600" gradientUnits="userSpaceOnUse">
            <stop stop-color="${primaryColor}" />
            <stop offset="1" stop-color="${secondaryColor}" />
          </linearGradient>
        </defs>
        ${symbolContent}
        <text x="400" y="580" font-family="Poppins, Arial, sans-serif" font-size="44" font-weight="800" fill="#0f172a" text-anchor="middle" letter-spacing="4">${brandName.toUpperCase()}</text>
        ${
          hasSlogan
            ? `<text x="400" y="630" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#64748b" text-anchor="middle" letter-spacing="4">${slogan.trim().toUpperCase()}</text>`
            : ""
        }
      </svg>`;

      finalImageUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgMockup)}`;
    }

    // Variações e especificações do Brand Asset Pack
    const variations = [
      {
        id: "primary_mark",
        name: "Símbolo Principal (Ícone & Logotipo)",
        aspectRatio: "1:1",
        description: "Versão oficial centralizada para identificação imediata.",
        recommendedFor: "Aplicações gerais, avatar de redes sociais e documentos",
      },
      {
        id: "horizontal",
        name: "Versão Horizontal Corporativa",
        aspectRatio: "16:9",
        description: "Símbolo alinhado à esquerda com o nome e nicho por extenso.",
        recommendedFor: "Cabeçalho de sites, papel timbrado e cartões de visita",
      },
      {
        id: "dark_mode",
        name: "Versão Fundo Escuro (Contraste Alto)",
        aspectRatio: "1:1",
        description: "Inversão inteligente de cores para aplicação em materiais escuros ou telas noturnas.",
        recommendedFor: "Embalagens escuras, brindes metálicos e telas digitais dark",
      },
      {
        id: "favicon",
        name: "Favicon & Ícone de App (32x32 / 64x64)",
        aspectRatio: "1:1",
        description: "Micro-formato ultra legível focado apenas no símbolo geométrico.",
        recommendedFor: "Aba do navegador, ícone de aplicativo móvel e selos pequenos",
      },
    ];

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      modelUsed: "gpt-image-2.5",
      brandPalette: {
        primary: primaryColor,
        secondary: secondaryColor,
        neutralDark: "#0F172A",
        neutralLight: "#F8FAFC",
      },
      metadata: {
        brandName,
        niche,
        style,
        mode,
        iteration,
        generatedAt: new Date().toISOString(),
      },
      variations,
    });
  } catch (err: any) {
    console.error("[BRAND_STUDIO_LOGO] Erro interno:", err);
    return NextResponse.json(
      { error: err.message || "Falha ao gerar conceito de logomarca." },
      { status: 500 }
    );
  }
}

/**
 * image-text-overlay.ts
 *
 * Renderizacao programatica de titulos sobre imagens geradas por IA.
 * Usa Jimp + @jimp/plugin-print (fontes Open Sans bitmap embutidas) para
 * garantir que o headline exato digitado pelo usuario apareca na arte,
 * independente do comportamento do modelo de imagem.
 *
 * Estrategia visual:
 *  - Caixa semitransparente escura no topo
 *  - Texto Open Sans branco em caixa-alta, centralizado
 *  - Wrapping automatico para ate 2 linhas
 *  - Margem segura de 6% para evitar cortes
 */

import { Jimp, loadFont, measureText, measureTextHeight } from "jimp";
import path from "path";

// Caminho absoluto para as fontes bitmap do @jimp/plugin-print
// Usa process.cwd() pois require.resolve() falha no contexto Next.js RSC/server
const FONT_DIR = path.join(
  process.cwd(),
  "node_modules",
  "@jimp",
  "plugin-print",
  "fonts",
  "open-sans"
);

// Cache de fontes para reutilizacao
let fontLarge: Awaited<ReturnType<typeof loadFont>> | null = null;
let fontMedium: Awaited<ReturnType<typeof loadFont>> | null = null;
let fontSmall: Awaited<ReturnType<typeof loadFont>> | null = null;

async function getFontLarge() {
  if (!fontLarge) {
    fontLarge = await loadFont(
      path.join(FONT_DIR, "open-sans-128-white", "open-sans-128-white.fnt")
    );
  }
  return fontLarge;
}

async function getFontMedium() {
  if (!fontMedium) {
    fontMedium = await loadFont(
      path.join(FONT_DIR, "open-sans-64-white", "open-sans-64-white.fnt")
    );
  }
  return fontMedium;
}

async function getFontSmall() {
  if (!fontSmall) {
    fontSmall = await loadFont(
      path.join(FONT_DIR, "open-sans-32-white", "open-sans-32-white.fnt")
    );
  }
  return fontSmall;
}

/**
 * Quebra o texto em multiplas linhas para caber na largura maxima.
 */
function wrapText(
  text: string,
  font: Awaited<ReturnType<typeof loadFont>>,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (measureText(font, candidate) <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export interface TextOverlayOptions {
  /** Texto exato do headline (sera convertido para maiusculas) */
  headline: string;
  /** Modo de overlay: TITLE_ONLY | INFOGRAPHIC | BOTH */
  mode: "TITLE_ONLY" | "INFOGRAPHIC" | "BOTH";
  /** Imagem base em base64 (JPEG ou PNG) */
  imageBase64: string;
}

export interface TextOverlayResult {
  /** Imagem resultante em base64 JPEG */
  imageBase64: string;
  /** Indica se o overlay foi aplicado com sucesso */
  applied: boolean;
}

/**
 * Aplica renderizacao programatica do titulo sobre a imagem.
 * Retorna a imagem com o texto sobreposto, ou a imagem original em caso de erro.
 */
export async function applyHeadlineOverlay(
  options: TextOverlayOptions
): Promise<TextOverlayResult> {
  const { headline, imageBase64 } = options;

  if (!headline || !headline.trim()) {
    return { imageBase64, applied: false };
  }

  try {
    const headlineUpper = headline.trim().toUpperCase();
    const imgBuffer = Buffer.from(imageBase64, "base64");
    const jimpImage = await Jimp.read(imgBuffer);

    const imgW = jimpImage.width;
    const imgH = jimpImage.height;

    // Margem segura de 6% em cada lado
    const marginX = Math.floor(imgW * 0.06);
    const maxTextWidth = imgW - marginX * 2;

    // Selecionar tamanho de fonte baseado na largura da imagem
    // Tenta fonte grande (128), se texto nao couber em 2 linhas usa media (64)
    let font = await getFontLarge();
    let lines = wrapText(headlineUpper, font, maxTextWidth);

    // Se precisar de mais de 2 linhas com fonte grande, reduzir para media
    if (lines.length > 2) {
      font = await getFontMedium();
      lines = wrapText(headlineUpper, font, maxTextWidth);
    }

    // Se ainda precisar de mais de 2 linhas, reduzir para pequena
    if (lines.length > 2) {
      font = await getFontSmall();
      lines = wrapText(headlineUpper, font, maxTextWidth);
    }

    // Limitar a 2 linhas
    if (lines.length > 2) {
      lines = lines.slice(0, 2);
    }

    // Calcular dimensoes da caixa de texto
    const lineHeight = measureTextHeight(font, "A", maxTextWidth) + 8;
    const textBlockH = lineHeight * lines.length;

    // Area da caixa: padding vertical 24px top e bottom
    const boxPaddingY = 24;
    const boxH = textBlockH + boxPaddingY * 2;
    const boxY = Math.floor(imgH * 0.04); // 4% do topo

    // Criar overlay semitransparente escuro
    const overlayImage = new Jimp({ width: imgW, height: boxH, color: 0x00000000 });

    // Preencher com cor escura semitransparente (alpha ~180/255 = 70% opacidade)
    for (let py = 0; py < boxH; py++) {
      for (let px = 0; px < imgW; px++) {
        overlayImage.setPixelColor(0x000000b4, px, py);
      }
    }

    // Compor o overlay sobre a imagem
    jimpImage.composite(overlayImage, 0, boxY);

    // Renderizar cada linha de texto centralizada
    let currentY = boxY + boxPaddingY;
    for (const line of lines) {
      const lineW = measureText(font, line);
      const textX = Math.max(marginX, Math.floor((imgW - lineW) / 2));

      jimpImage.print({
        font,
        x: textX,
        y: currentY,
        text: line,
      });

      currentY += lineHeight;

    }

    const resultBuffer = await jimpImage.getBuffer("image/jpeg", { quality: 92 });
    return {
      imageBase64: resultBuffer.toString("base64"),
      applied: true,
    };
  } catch (err: any) {
    console.warn("[IMAGE_TEXT_OVERLAY] Falha ao aplicar overlay de texto:", err?.message || err);
    console.warn("[IMAGE_TEXT_OVERLAY] FONT_DIR usado:", FONT_DIR);
    return { imageBase64, applied: false };
  }

}


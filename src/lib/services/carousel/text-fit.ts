/**
 * Quebra de linha e ajuste automático de fonte (estimativa por largura média de caractere).
 * Puro e sem DOM: roda no servidor, nos testes e no navegador.
 */

export interface AutoFitFontParams {
  text: string;
  maxWidthPx: number;
  maxHeightPx: number;
  maxFontSize: number;
  minFontSize?: number;
  lineHeight?: number;
  avgCharWidthRatio?: number;
}

export interface AutoFitFontResult {
  fontSize: number;
  lines: string[];
  lineHeightPx: number;
  totalHeightPx: number;
  fitsWithinBounds: boolean;
}

/**
 * Quebra um parágrafo em linhas respeitando a largura máxima estimada em pixels.
 * Se uma palavra isolada for maior que a linha, aplica quebra segura para nunca vazar.
 */
export function wrapTextIntoLines(
  text: string,
  maxWidthPx: number,
  fontSize: number,
  avgCharWidthRatio = 0.56
): string[] {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return [""];

  const charWidth = Math.max(1, fontSize * avgCharWidthRatio);
  const maxCharsPerLine = Math.max(6, Math.floor(maxWidthPx / charWidth));

  const words = normalized.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const rawWord of words) {
    // Se uma única palavra ultrapassar maxCharsPerLine, fatiamos com hífen
    if (rawWord.length > maxCharsPerLine) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      let remaining = rawWord;
      while (remaining.length > maxCharsPerLine) {
        const chunkLen = Math.max(2, maxCharsPerLine - 1);
        lines.push(`${remaining.slice(0, chunkLen)}-`);
        remaining = remaining.slice(chunkLen);
      }
      currentLine = remaining;
      continue;
    }

    const candidate = currentLine ? `${currentLine} ${rawWord}` : rawWord;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = rawWord;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Calcula automaticamente o tamanho ideal da fonte para que qualquer texto
 * caiba 100% dentro da caixa útil (maxWidthPx × maxHeightPx) sem cortar.
 */
export function calculateAutoFitFontSize({
  text,
  maxWidthPx,
  maxHeightPx,
  maxFontSize,
  minFontSize = 18,
  lineHeight = 1.28,
  avgCharWidthRatio = 0.56,
}: AutoFitFontParams): AutoFitFontResult {
  const safeMaxWidth = Math.max(120, maxWidthPx);
  const safeMaxHeight = Math.max(60, maxHeightPx);
  const startSize = Math.max(minFontSize, Math.floor(maxFontSize));
  const floorSize = Math.max(12, Math.floor(minFontSize));

  for (let size = startSize; size >= floorSize; size -= 2) {
    const lines = wrapTextIntoLines(text, safeMaxWidth, size, avgCharWidthRatio);
    const lineHeightPx = Math.round(size * lineHeight);
    const totalHeightPx = lines.length * lineHeightPx;
    const widestLinePx = Math.max(
      ...lines.map((line) => line.length * size * avgCharWidthRatio),
      0
    );

    if (totalHeightPx <= safeMaxHeight && widestLinePx <= safeMaxWidth * 1.02) {
      return {
        fontSize: size,
        lines,
        lineHeightPx,
        totalHeightPx,
        fitsWithinBounds: true,
      };
    }
  }

  // Fallback no menor tamanho permitido: trunca com reticências se ainda exceder linhas máximas
  const maxLinesAllowed = Math.max(1, Math.floor(safeMaxHeight / Math.round(floorSize * lineHeight)));
  const rawLines = wrapTextIntoLines(text, safeMaxWidth, floorSize, avgCharWidthRatio);
  const clampedLines = rawLines.slice(0, maxLinesAllowed);
  if (rawLines.length > maxLinesAllowed && clampedLines.length > 0) {
    const lastIdx = clampedLines.length - 1;
    clampedLines[lastIdx] = `${clampedLines[lastIdx].replace(/[.,;:\s-]+$/, "")}…`;
  }
  const lineHeightPx = Math.round(floorSize * lineHeight);

  return {
    fontSize: floorSize,
    lines: clampedLines,
    lineHeightPx,
    totalHeightPx: clampedLines.length * lineHeightPx,
    fitsWithinBounds: clampedLines.length * lineHeightPx <= safeMaxHeight,
  };
}

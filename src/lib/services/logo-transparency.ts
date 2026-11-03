/**
 * Serviço de Remoção de Fundo e Exportação de Logotipos Transparentes (PNG Alfa)
 * 
 * Utiliza análise de cor e Flood-Fill (BFS) a partir das bordas para isolar
 * o fundo sólido (branco ou claro) e gerar um PNG com canal alfa transparente
 * preservando detalhes internos e aplicando antialiasing suave nas bordas.
 */

export async function generateTransparentLogoBlob(imageUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 1. Tratamento específico para SVG embutido
    if (imageUrl.startsWith("data:image/svg+xml")) {
      try {
        const svgData = decodeURIComponent(imageUrl.split(",")[1]);
        // Remove retângulos de fundo branco ou claro
        const cleanSvg = svgData.replace(/<rect[^>]*fill=["'](#ffffff|#fff|white)["'][^>]*\/>/gi, "");
        const cleanDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const w = img.naturalWidth || 1024;
          const h = img.naturalHeight || 1024;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Contexto 2D não disponível"));
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Falha ao exportar PNG transparente"));
          }, "image/png");
        };
        img.onerror = (e) => reject(e);
        img.src = cleanDataUrl;
        return;
      } catch (err) {
        console.warn("Falha no parser de SVG, tentando método de Canvas padrão:", err);
      }
    }

    // 2. Processamento de Imagem Raster (PNG, JPG, WebP)
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = img.naturalWidth || img.width || 1024;
        const h = img.naturalHeight || img.height || 1024;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Contexto 2D não disponível"));

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Amostragem da cor média dos 4 cantos
        const sampleCorner = (x: number, y: number) => {
          const idx = (y * w + x) * 4;
          return [data[idx], data[idx + 1], data[idx + 2]];
        };

        const corners = [
          sampleCorner(0, 0),
          sampleCorner(w - 1, 0),
          sampleCorner(0, h - 1),
          sampleCorner(w - 1, h - 1),
        ];

        const bgR = Math.round((corners[0][0] + corners[1][0] + corners[2][0] + corners[3][0]) / 4);
        const bgG = Math.round((corners[0][1] + corners[1][1] + corners[2][1] + corners[3][1]) / 4);
        const bgB = Math.round((corners[0][2] + corners[1][2] + corners[2][2] + corners[3][2]) / 4);

        // Algoritmo de BFS / Flood-Fill a partir de todas as bordas externas
        const visited = new Uint8Array(w * h);
        const queue: number[] = [];

        // Adiciona pixels das bordas superior e inferior
        for (let x = 0; x < w; x++) {
          queue.push(x, 0);
          queue.push(x, h - 1);
        }
        // Adiciona pixels das bordas laterais
        for (let y = 0; y < h; y++) {
          queue.push(0, y);
          queue.push(w - 1, y);
        }

        const colorTolerance = 42; // Tolerância máxima para o fundo
        const featherRange = 28;   // Faixa para antialiasing de bordas

        let head = 0;
        while (head < queue.length) {
          const px = queue[head++];
          const py = queue[head++];
          const pIndex = py * w + px;

          if (visited[pIndex]) continue;
          visited[pIndex] = 1;

          const dataIdx = pIndex * 4;
          const r = data[dataIdx];
          const g = data[dataIdx + 1];
          const b = data[dataIdx + 2];

          // Distância euclidiana em relação à cor do fundo
          const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

          if (dist <= colorTolerance) {
            // Fundo externo: 100% transparente
            data[dataIdx + 3] = 0;

            // Expande a busca para os 4 vizinhos imediatos
            if (px > 0 && !visited[pIndex - 1]) queue.push(px - 1, py);
            if (px < w - 1 && !visited[pIndex + 1]) queue.push(px + 1, py);
            if (py > 0 && !visited[pIndex - w]) queue.push(px, py - 1);
            if (py < h - 1 && !visited[pIndex + w]) queue.push(px, py + 1);
          } else if (dist <= colorTolerance + featherRange) {
            // Suavização gradual de borda (antialiasing)
            const factor = (dist - colorTolerance) / featherRange;
            data[dataIdx + 3] = Math.round(255 * factor);
          }
        }

        ctx.putImageData(imgData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Falha ao exportar blob PNG transparente"));
        }, "image/png");
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      // Se falhar por restrição de CORS em URL externa, tenta via proxy
      if (!imageUrl.startsWith("data:") && !imageUrl.startsWith("blob:") && !imageUrl.includes("action=proxy")) {
        const proxyUrl = `/api/conteudo/gerar-referencia?action=proxy&url=${encodeURIComponent(imageUrl)}`;
        generateTransparentLogoBlob(proxyUrl).then(resolve).catch(reject);
      } else {
        reject(new Error("Não foi possível carregar a imagem para processar a transparência."));
      }
    };

    img.src = imageUrl;
  });
}

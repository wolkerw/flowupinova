const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Arquivo .env.local não encontrado!");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join("=").trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.substring(1, val.length - 1);
      }
      env[key] = val;
    }
  });
  return env;
}

const env = loadEnv();
const apiKey = env.GEMINI_API_KEY;

async function testImagen() {
  // Vamos usar o modelo de Imagen 4 Ultra do Google AI Studio listado na API!
  const modelId = "imagen-4.0-ultra-generate-001";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict?key=${apiKey}`;

  console.log(`Iniciando teste do Google Imagen 4 Ultra (${modelId}) via REST :predict...`);

  // Estrutura padrão de payload do Vertex AI / Imagen REST predict
  const payload = {
    instances: [
      {
        prompt:
          "Um simpático robô azul e branco jogando futebol, design vetorial minimalista moderno, 3D",
      },
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: "1:1",
      outputMimeType: "image/jpeg",
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(`Status HTTP: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Não foi possível decodificar resposta JSON:", responseText);
      return;
    }

    if (!response.ok) {
      console.error("Erro da API:", data);
      return;
    }

    console.log("Resposta com sucesso!");
    console.log("Chaves da resposta principal:", Object.keys(data));

    // Na API de predict da Generative Language, a estrutura pode conter 'predictions'
    if (data.predictions && data.predictions.length > 0) {
      const prediction = data.predictions[0];
      console.log("Chaves da prediction[0]:", Object.keys(prediction));

      // Pode ser bytesBase64Encoded, ou imageBytes, ou similar
      if (prediction.bytesBase64Encoded) {
        console.log("bytesBase64Encoded length:", prediction.bytesBase64Encoded.length);
        console.log("Início dos bytes (base64):", prediction.bytesBase64Encoded.substring(0, 100));

        // Salvar localmente para conferir
        const buffer = Buffer.from(prediction.bytesBase64Encoded, "base64");
        fs.writeFileSync(path.join(__dirname, "test_image.jpg"), buffer);
        console.log("Imagem salva com sucesso em scratch/test_image.jpg!");
      } else if (prediction.image && prediction.image.imageBytes) {
        console.log("Encontrado prediction.image.imageBytes!");
        const imgBytes = prediction.image.imageBytes;
        console.log("imageBytes length:", imgBytes.length);
        const buffer = Buffer.from(imgBytes, "base64");
        fs.writeFileSync(path.join(__dirname, "test_image.jpg"), buffer);
        console.log("Imagem salva com sucesso em scratch/test_image.jpg!");
      } else {
        console.log("Formato inesperado dentro de predictions[0]:", prediction);
      }
    } else {
      console.log("A resposta não possui predictions ou está vazia:", data);
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
  }
}

testImagen();

const fs = require('fs');
const path = require('path');

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-3-flash-preview",
  "gemini-3.5-flash"
];

async function test() {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  const apiKeyMatch = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
  if (!apiKeyMatch) {
    console.error("GEMINI_API_KEY não encontrada no .env.local");
    return;
  }
  const apiKey = apiKeyMatch[1].trim();
  console.log("Chave Gemini encontrada (começo):", apiKey.substring(0, 15));

  // Pixel vermelho 1x1 base64
  const testBase64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const mimeType = "image/png";

  const prompt = `Analise a imagem de teste fornecida e descreva-a de forma estruturada.
Você DEVE responder exclusivamente no formato JSON abaixo, de forma estrita, sem qualquer introdução, conclusão ou marcação markdown de código (como \`\`\`json). Responda APENAS o JSON bruto:
{
  "clothing": "vestimenta da pessoa na imagem",
  "background": "cenário de fundo",
  "pose": "pose e enquadramento",
  "lighting": "iluminação"
}`;

  for (const model of MODELS) {
    console.log(`\nTestando modelo Gemini Vision: ${model}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: testBase64Image
                }
              }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      console.log(`Status para ${model}:`, response.status);
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log(`Resposta texto para ${model}:`, text);
      if (text) {
        break; // Sucesso!
      }
    } catch (err) {
      console.error(`Erro para ${model}:`, err);
    }
  }
}

test();

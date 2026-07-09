const fs = require('fs');
const path = require('path');

const MODELS = [
  "claude-3-5-sonnet-20241022",
  "claude-3-5-sonnet-20240620",
  "claude-3-5-haiku-20241022",
  "claude-3-haiku-20240307"
];

async function test() {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  const apiKeyMatch = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
  if (!apiKeyMatch) {
    console.error("ANTHROPIC_API_KEY não encontrada no .env.local");
    return;
  }
  const apiKey = apiKeyMatch[1].trim();
  console.log("Chave encontrada (começo):", apiKey.substring(0, 15));

  for (const model of MODELS) {
    console.log(`\nTestando modelo: ${model}...`);
    try {
      const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 10,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Olá"
                }
              ]
            }
          ]
        })
      });

      console.log(`Status para ${model}:`, claudeResponse.status);
      const text = await claudeResponse.text();
      console.log(`Resposta para ${model}:`, text);
    } catch (err) {
      console.error(`Erro para ${model}:`, err);
    }
  }
}

test();

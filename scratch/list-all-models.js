const fs = require("fs");
const path = require("path");

async function main() {
  const envContent = fs.readFileSync(path.join(__dirname, "../.env.local"), "utf8");
  const apiKeyMatch = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
  if (!apiKeyMatch) {
    console.error("GEMINI_API_KEY não encontrada no .env.local");
    return;
  }
  const apiKey = apiKeyMatch[1].trim();
  console.log("Chave Gemini encontrada (começo):", apiKey.substring(0, 15));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await res.json();
    console.log("Models supporting generateContent:");
    const filtered = data.models
      .filter((m) => m.supportedGenerationMethods.includes("generateContent"))
      .map((m) => ({ name: m.name, displayName: m.displayName, description: m.description }));
    console.log(JSON.stringify(filtered, null, 2));
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}
main();

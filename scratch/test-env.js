const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log("--- Conteúdo do arquivo .env.local ---");
  
  // Vamos simular a leitura do Next.js. O Next.js usa o dotenv por trás.
  // Vamos ler a variável usando expressões regulares básicas ou dotenv simples.
  const lines = envContent.split(/\r?\n/);
  let pk = "";
  let inPk = false;

  for (const line of lines) {
    if (line.startsWith("FIREBASE_PRIVATE_KEY=")) {
      pk = line.substring("FIREBASE_PRIVATE_KEY=".length);
      inPk = true;
    } else if (inPk) {
      pk += "\n" + line;
    }
  }

  console.log("Leitura Simples da Chave Privada:");
  console.log("Chave existe?", !!pk);
  console.log("Comprimento da string lida:", pk.length);
  console.log("Começo da chave:", pk.substring(0, 60));
  console.log("Fim da chave:", pk.substring(pk.length - 60));
} catch (e) {
  console.error("Erro ao testar env:", e);
}

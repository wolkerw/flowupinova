const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env.local de forma nativa
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error("Arquivo .env.local não encontrado!");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      env[key] = val;
    }
  });
  return env;
}

const env = loadEnv();
const projectId = env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c";
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
let privateKey = env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
  privateKey = privateKey.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
}

if (!clientEmail || !privateKey) {
  console.error("Credenciais do Firebase Admin ausentes no .env.local!");
  process.exit(1);
}

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
  storageBucket: `${projectId}.firebasestorage.app`
});

const bucket = admin.storage().bucket();

async function checkStorage() {
  console.log(`Conectando ao bucket do Firebase Storage: ${bucket.name}...`);
  try {
    const [files] = await bucket.getFiles({ prefix: 'users/' });
    console.log(`\nConexão estabelecida com sucesso!`);
    console.log(`Total de arquivos encontrados sob a pasta 'users/': ${files.length}`);
    
    if (files.length === 0) {
      console.log("Nenhum arquivo encontrado. O bucket está vazio ou a gravação ocorreu em outra pasta.");
    } else {
      console.log("\nArquivos gravados no Storage recentemente:");
      // Ordenar por data de atualização (mais novos primeiro) e pegar os 15 mais recentes
      const sortedFiles = files.sort((a, b) => new Date(b.metadata.updated) - new Date(a.metadata.updated));
      sortedFiles.slice(0, 15).forEach(file => {
        console.log(`- Caminho: ${file.name}`);
        console.log(`  Tamanho: ${(file.metadata.size / 1024).toFixed(2)} KB`);
        console.log(`  Tipo: ${file.metadata.contentType}`);
        console.log(`  Atualizado em: ${file.metadata.updated}`);
        console.log('---');
      });
    }
  } catch (error) {
    console.error("Erro ao acessar o Firebase Storage:", error);
  }
}

checkStorage();

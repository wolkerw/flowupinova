const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) {
    console.error(".env.local não encontrado!");
    return;
  }
  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split("\n");
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

const projectId = process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
  privateKey = privateKey
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");
}

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: `${projectId}.firebasestorage.app`,
  });
  console.log("Firebase inicializado!");

  const bucket = admin.storage().bucket();
  console.log("Storage Bucket:", bucket.name);

  // Testar upload de um buffer de teste
  const testBuffer = Buffer.from("Hello Firebase Storage via Admin!");
  const fileRef = bucket.file("test_antigravity_upload.txt");

  console.log("Tentando salvar arquivo no bucket...");
  fileRef
    .save(testBuffer, {
      metadata: {
        contentType: "text/plain",
      },
    })
    .then(() => {
      console.log("Upload bem-sucedido! O arquivo foi salvo no storage com sucesso via Admin SDK!");
      return fileRef.exists();
    })
    .then(([exists]) => {
      console.log("O arquivo de teste existe no bucket?", exists);
      // Deletar o arquivo de teste
      return fileRef.delete();
    })
    .then(() => {
      console.log("Arquivo de teste removido.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Erro CRÍTICO no upload/storage:", err);
      process.exit(1);
    });
} catch (err) {
  console.error("Erro ao inicializar:", err);
  process.exit(1);
}

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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
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
  privateKey = privateKey.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
}

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    })
  });
  console.log("Firebase inicializado!");

  const db = admin.firestore();
  
  // Buscar usuário por email
  admin.auth().getUserByEmail("fernando.home@hotmail.com")
    .then(async (userRecord) => {
      const userId = userRecord.uid;
      console.log("User found! UID:", userId);
      
      // Ler profile do business (Google Meu Negócio)
      const profileSnap = await db.doc(`users/${userId}/business/profile`).get();
      console.log("PROFILE (GMB):", profileSnap.exists ? profileSnap.data() : "NÃO EXISTE");
      
      // Ler onboarding do business (Brand Kit)
      const onboardingSnap = await db.doc(`users/${userId}/business/onboarding`).get();
      console.log("ONBOARDING (BRAND KIT):", onboardingSnap.exists ? onboardingSnap.data() : "NÃO EXISTE");
      
      process.exit(0);
    })
    .catch((err) => {
      console.error("Erro ao buscar usuário ou documentos:", err);
      process.exit(1);
    });

} catch (err) {
  console.error("Erro de inicialização:", err);
  process.exit(1);
}

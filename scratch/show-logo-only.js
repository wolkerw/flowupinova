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

  const db = admin.firestore();
  
  // Listar todas as subcoleções 'business/onboarding' de todos os usuários
  db.collection("users").get()
    .then(async (usersSnap) => {
      console.log(`=== ANALISANDO ${usersSnap.size} USUÁRIOS ===`);
      for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const userEmail = userData.email || "Sem Email";
        
        const onboardingSnap = await db.doc(`users/${userId}/business/onboarding`).get();
        const profileSnap = await db.doc(`users/${userId}/business/profile`).get();
        
        if (onboardingSnap.exists || profileSnap.exists) {
          console.log(`Usuário: ${userEmail} (UID: ${userId})`);
          
          if (onboardingSnap.exists) {
            const data = onboardingSnap.data();
            const logo = data.logo;
            console.log("  Onboarding Logo:", logo ? `url_len: ${logo.url ? logo.url.length : 0}, w: ${logo.width}, h: ${logo.height}` : "Sem Logo");
          } else {
            console.log("  Onboarding Doc: NÃO EXISTE");
          }
          
          if (profileSnap.exists) {
            const data = profileSnap.data();
            const logo = data.logo;
            console.log("  Profile Logo:   ", logo ? `url_len: ${logo.url ? logo.url.length : 0}, w: ${logo.width}, h: ${logo.height}` : "Sem Logo");
          } else {
            console.log("  Profile Doc:    NÃO EXISTE");
          }
        }
      }
      console.log("=====================================");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Erro:", err);
      process.exit(1);
    });

} catch (err) {
  console.error("Erro:", err);
  process.exit(1);
}

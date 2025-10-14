
import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
// A chave da conta de serviço é importada diretamente do arquivo JSON.
// Certifique-se de que este arquivo esteja presente no seu projeto e adicionado ao .gitignore.
import serviceAccount from '../service-account.json';

// Função para inicializar o Firebase Admin SDK de forma idempotente
export function initializeAdminApp() {
  if (getApps().length) {
    const existingApp = getApps()[0];
    return {
      adminApp: existingApp,
      adminDb: getFirestore(existingApp),
      adminAuth: getAdminAuth(existingApp),
    };
  }

  // A conversão de tipo é necessária porque o tipo gerado pelo `import`
  // não corresponde exatamente ao que o `cert` espera.
  const serviceAccountCredential = serviceAccount as admin.ServiceAccount;

  const newApp = initializeApp({
    credential: cert(serviceAccountCredential),
    // Adicione a URL do seu banco de dados se não for o padrão
    // databaseURL: "https://<DATABASE_NAME>.firebaseio.com"
  });

  return {
    adminApp: newApp,
    adminDb: getFirestore(newApp),
    adminAuth: getAdminAuth(newApp),
  };
}

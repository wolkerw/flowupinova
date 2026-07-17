import { admin } from "@/lib/firebase-admin";

/**
 * Retorna o caminho base do Storage para um usuário, incluindo o nome higienizado.
 * Exemplo: users/JoaoSilva_12345abcde
 */
export async function getUserStoragePathAdmin(userId: string): Promise<string> {
  let userName = "User";
  try {
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      userName = data?.displayName || data?.name || "User";
    }
  } catch (e) {
    console.warn("[STORAGE_UTILS] Erro ao recuperar nome do usuário no Firestore:", e);
  }

  // Remove caracteres especiais e espaços, mantendo apenas letras e números
  const cleanUserName = userName.replace(/[^a-zA-Z0-9]/g, "_");
  
  return `users/${cleanUserName}_${userId}`;
}

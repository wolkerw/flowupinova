import { adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";

const CACHE_COLLECTION = "ai_semantic_cache";

/**
 * Recupera uma resposta do Cache Semântico baseada num hash da string de chave.
 * @param keyStr String única representando os inputs do prompt (ex: instruções + imagem em base64)
 */
export async function getSemanticCache(keyStr: string): Promise<any | null> {
  try {
    const hash = crypto.createHash("sha256").update(keyStr).digest("hex");
    const docRef = adminDb.collection(CACHE_COLLECTION).doc(hash);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      // Opcional: Implementar controle de expiração (ex: 30 dias).
      // Por enquanto, consideramos o cache válido indefinidamente se a chave for idêntica.
      if (data?.response) {
        console.log(`[SEMANTIC CACHE] HIT! Bypass da API para hash: ${hash.substring(0, 8)}...`);
        return data.response;
      }
    }
  } catch (error) {
    console.error("[SEMANTIC CACHE] Erro ao ler do Firestore:", error);
  }
  return null;
}

/**
 * Salva uma resposta no Cache Semântico usando o hash da string de chave.
 * @param keyStr String única representando os inputs
 * @param responseObj O objeto/resultado parseado que a API retornou
 */
export async function setSemanticCache(keyStr: string, responseObj: any): Promise<void> {
  try {
    const hash = crypto.createHash("sha256").update(keyStr).digest("hex");
    const docRef = adminDb.collection(CACHE_COLLECTION).doc(hash);

    await docRef.set({
      response: responseObj,
      createdAt: new Date().toISOString(),
    });
    console.log(`[SEMANTIC CACHE] Salvo com sucesso para hash: ${hash.substring(0, 8)}...`);
  } catch (error) {
    console.error("[SEMANTIC CACHE] Erro ao salvar no Firestore:", error);
  }
}

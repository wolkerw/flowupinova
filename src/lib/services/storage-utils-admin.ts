import { admin } from "@/lib/firebase-admin";

/**
 * Retorna o caminho base do Storage para um usuário, incluindo o nome higienizado.
 * Exemplo: users/JoaoSilva_12345abcde
 */
export async function getUserStoragePathAdmin(userId: string): Promise<string> {
  return `users/${userId}`;
}

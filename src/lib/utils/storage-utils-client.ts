import { User } from "firebase/auth";

/**
 * Retorna o caminho base do Storage para um usuário, incluindo o nome higienizado.
 * Utiliza o displayName do objeto de usuário do Firebase Auth.
 * Exemplo: users/JoaoSilva_12345abcde
 */
export function getUserStoragePathClient(user: User): string {
  return `users/${user.uid}`;
}

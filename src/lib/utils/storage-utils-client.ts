import { User } from "firebase/auth";

/**
 * Retorna o caminho base do Storage para um usuário, incluindo o nome higienizado.
 * Utiliza o displayName do objeto de usuário do Firebase Auth.
 * Exemplo: users/JoaoSilva_12345abcde
 */
export function getUserStoragePathClient(user: User): string {
  const userName = user.displayName || "User";
  
  // Remove caracteres especiais e espaços, mantendo apenas letras e números
  const cleanUserName = userName.replace(/[^a-zA-Z0-9]/g, "_");
  
  return `users/${cleanUserName}_${user.uid}`;
}

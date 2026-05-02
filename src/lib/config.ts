// Define a URL canônica da aplicação para garantir consistência nos redirecionamentos.
// Prioriza a variável de ambiente NEXT_PUBLIC_APP_URL para facilitar a troca de domínios.
const aplicationURL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://numvapt.com"
    : process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "http://localhost:9002");

export const config = {
  aplicationURL,
  instagram: {
    appId: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || process.env.INSTAGRAM_APP_ID!,
    appSecret: process.env.INSTAGRAM_APP_SECRET!,
    redirectUri:
      process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || `${aplicationURL}/api/instagram/callback`,
  },
  meta: {
    appId: process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_CLIENT_ID!,
    appSecret: process.env.META_APP_SECRET || process.env.META_CLIENT_SECRET!,
    redirectUri: process.env.NEXT_PUBLIC_META_REDIRECT_URI || `${aplicationURL}/dashboard/conteudo`,
    configId: process.env.NEXT_PUBLIC_META_CONFIG_ID!,
  },
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri:
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || `${aplicationURL}/api/google/callback`,
  },
};

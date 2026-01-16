
// Define a URL canônica da aplicação para garantir consistência nos redirecionamentos.
const aplicationURL = process.env.NODE_ENV === 'production' 
    ? 'https://flowupinova.com.br' 
    : process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'https://9000-firebase-studio-1757951248950.cluster-57i2ylwve5fskth4xb2kui2ow2.cloudworkstations.dev';


export const config = {
  aplicationURL,
  instagram: {
    appId: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID!,
    appSecret: process.env.INSTAGRAM_APP_SECRET!,
    redirectUri: `${aplicationURL}/api/instagram/callback`, // Callback da API
  },
  meta: {
     appId: process.env.NEXT_PUBLIC_META_APP_ID!,
     appSecret: process.env.META_APP_SECRET!,
     redirectUri: `${aplicationURL}/dashboard/conteudo`, 
     configId: process.env.NEXT_PUBLIC_META_CONFIG_ID!,
  },
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: `${aplicationURL}/api/google/callback`,
  }
};

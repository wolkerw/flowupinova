
// Define a URL canônica da aplicação para garantir consistência nos redirecionamentos.
const aplicationURL = 'https://flowupinova.com.br';

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
     redirectUri: `${aplicationURL}/api/meta/callback`, 
     configId: process.env.NEXT_PUBLIC_META_CONFIG_ID!,
  },
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: `${aplicationURL}/dashboard/meu-negocio`,
  }
};

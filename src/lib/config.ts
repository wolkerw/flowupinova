
// Usamos NEXT_PUBLIC_ para acesso no lado do cliente, mas também lemos no lado do servidor.
// O segredo é apenas do lado do servidor.
export const config = {
  instagram: {
    appId: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID!,
    appSecret: process.env.INSTAGRAM_APP_SECRET!,
    redirectUri: process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI!,
  },
  meta: {
     appId: process.env.NEXT_PUBLIC_META_APP_ID!,
     appSecret: process.env.META_APP_SECRET!,
     redirectUri: process.env.NEXT_PUBLIC_META_REDIRECT_URI!,
     configId: process.env.NEXT_PUBLIC_META_CONFIG_ID!,
  }
};

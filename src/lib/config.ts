// Arquivo central para armazenar configurações e credenciais da aplicação.

// Credenciais do Aplicativo da Meta (Facebook/Instagram)
export const META_APP_ID = "826418333144156";
export const META_APP_SECRET = "944e053d34b162c13408cd00ad276aa2";

// A URI de redirecionamento agora é construída dinamicamente no código
// usando a variável de ambiente NEXT_PUBLIC_APP_URL.
// Certifique-se de que esta variável está definida no seu ambiente (.env.local ou nas variáveis de ambiente da Vercel/Firebase).
// Ex: NEXT_PUBLIC_APP_URL=http://localhost:3000
// ou NEXT_PUBLIC_APP_URL=https://sua-app.com
//
// A URL final no painel da Meta deve ser:
// {NEXT_PUBLIC_APP_URL}/api/meta/callback
//
// Exemplo: http://localhost:3000/api/meta/callback

// A variável abaixo não é mais usada diretamente, mas é mantida para referência histórica.
export const META_REDIRECT_URI = "https://6000-firebase-studio-1757951248950.cluster-57i2ylwve5fskth4xb2kui2ow2.cloudworkstations.dev/api/meta/callback";


import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { code, state } = body;

    if (!code) {
        return NextResponse.json({ success: false, error: "Código de autorização não fornecido." }, { status: 400 });
    }

    // TODO: Validar o parâmetro 'state' para proteção contra CSRF.

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        console.error("[GOOGLE_CALLBACK_ERROR] Variáveis de ambiente GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não estão definidas.");
        return NextResponse.json({ success: false, error: "Erro de configuração no servidor. As credenciais do Google não foram encontradas." }, { status: 500 });
    }

    // O redirectUri deve ser o mesmo que iniciou o fluxo.
    const redirectUri = new URL(request.url).origin + "/dashboard/meu-negocio";

    try {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens || !tokens.access_token) {
            throw new Error("Não foi possível obter os tokens de acesso do Google.");
        }
        
        oauth2Client.setCredentials(tokens);

        const myBizAccount = google.mybusinessaccountmanagement({
            version: 'v1',
            auth: oauth2Client
        });

        const accountsResponse = await myBizAccount.accounts.list();
        const accounts = accountsResponse.data.accounts;
        if (!accounts || accounts.length === 0) {
            throw new Error("Nenhuma conta do Google Meu Negócio encontrada para este usuário.");
        }
        
        const primaryAccount = accounts[0];
        if (!primaryAccount.name) {
            throw new Error("A conta principal do Google Meu Negócio não tem um nome válido.");
        }

        const myBizInfo = google.mybusinessbusinessinformation({
            version: 'v1',
            auth: oauth2Client
        });
        
        const locationsResponse = await myBizInfo.accounts.locations.list({
            parent: primaryAccount.name,
            readMask: "name,title,categories,storefrontAddress,phoneNumbers,websiteUri,metadata,profile,regularHours",
        });

        const locations = locationsResponse.data.locations;
        if (!locations || locations.length === 0) {
            throw new Error("Nenhum perfil de empresa (local) encontrado nesta conta do Google.");
        }

        const location = locations[0];
        const businessProfileData = {
            name: location.title || 'Nome não encontrado',
            category: location.categories?.[0]?.displayName || 'Categoria não encontrada',
            address: location.storefrontAddress ? 
                     `${location.storefrontAddress.addressLines?.join(', ')}, ${location.storefrontAddress.locality}, ${location.storefrontAddress.administrativeArea} - ${location.storefrontAddress.postalCode}` 
                     : 'Endereço não encontrado',
            phone: location.phoneNumbers?.primaryPhone || 'Telefone não encontrado',
            website: location.websiteUri || 'Website não encontrado',
            description: location.profile?.description || 'Descrição não disponível.',
            isVerified: true,
        };

        // A API agora retorna os dados para serem salvos pelo cliente.
        return NextResponse.json({ success: true, businessProfileData });

    } catch (error: any) {
        console.error("[GOOGLE_CALLBACK_ERROR] Erro no fluxo completo:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.error_description || error.message || "Ocorreu um erro desconhecido durante a conexão com o Google.";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}

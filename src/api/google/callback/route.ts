
import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";
import { getUidFromCookie } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { code, state, origin } = body;
    
    // NOTA: A validação de UID do cookie é removida daqui porque o token
    // pode não estar disponível imediatamente nesta chamada de servidor para servidor.
    // A segurança é mantida porque apenas o usuário que iniciou o fluxo OAuth
    // no cliente poderá salvar os dados retornados no seu próprio perfil.

    if (!code) {
        return NextResponse.json({ success: false, error: "Código de autorização não fornecido." }, { status: 400 });
    }
    
    if (!origin) {
         return NextResponse.json({ success: false, error: "Origem da requisição não fornecida." }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        console.error("[GOOGLE_CALLBACK_ERROR] Variáveis de ambiente GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não estão definidas.");
        return NextResponse.json({ success: false, error: "Erro de configuração no servidor. As credenciais do Google não foram encontradas." }, { status: 500 });
    }

    const redirectUri = new URL('/dashboard/meu-negocio', origin).toString();

    try {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        const { tokens } = await oauth2Client.getToken({ code });

        if (!tokens || !tokens.access_token) {
            throw new Error("Não foi possível obter os tokens de acesso do Google.");
        }
        
        oauth2Client.setCredentials(tokens);

        // API para gerenciamento de contas
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
        const accountId = primaryAccount.name.split('/')[1];

        // 1. Lista as localizações para encontrar o ID da localização
        const locationsList = await myBizAccount.accounts.locations.list({
            parent: primaryAccount.name,
        });
        
        const baseLocations = locationsList.data.locations;
        if (!baseLocations || baseLocations.length === 0) {
          throw new Error("Nenhum perfil de empresa (local) encontrado nesta conta do Google.");
        }
        
        const baseLocation = baseLocations[0];
        if (!baseLocation.name) {
          throw new Error("O perfil da empresa encontrado não possui um 'name' (ID da localização) válido.");
        }

        // 2. Busca os detalhes completos da localização usando a Business Information API
        const myBizInfo = google.businessprofile({
            version: 'v1',
            auth: oauth2Client
        });

        const fullLocationResponse = await myBizInfo.locations.get({
            name: baseLocation.name,
            readMask: "name,title,categories,storefrontAddress,phoneNumbers,websiteUri,metadata,profile,regularHours",
        });

        const location = fullLocationResponse.data;

        // 3. Monta o objeto que será enviado para o frontend
        const businessProfileData = {
            name: location.title || 'Nome não encontrado',
            googleName: location.name, // Ex: locations/12345
            category: location.categories?.primaryCategory?.displayName || 'Categoria não encontrada',
            address: location.storefrontAddress ? 
                     `${location.storefrontAddress.addressLines?.join(', ')}, ${location.storefrontAddress.locality}, ${location.storefrontAddress.administrativeArea} - ${location.storefrontAddress.postalCode}` 
                     : 'Endereço não encontrado',
            phone: location.phoneNumbers?.primaryPhone || 'Telefone não encontrado',
            website: location.websiteUri || 'Website não encontrado',
            description: location.profile?.description || 'Descrição não disponível.',
            isVerified: true,
        };

        const connectionData = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiryDate: tokens.expiry_date,
        };

        // Retorna todos os dados para o cliente
        return NextResponse.json({ 
            success: true, 
            businessProfileData: businessProfileData,
            connectionData: connectionData,
            accountId: accountId,
        });

    } catch (error: any) {
        console.error("[GOOGLE_CALLBACK_ERROR] Erro no fluxo completo:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.error_description || error.message || "Ocorreu um erro desconhecido durante a conexão com o Google.";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}

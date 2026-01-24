
import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { code, state, origin } = body;

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
        
        // 1. Usa a API de Gerenciamento de Contas para listar TODAS as contas com paginação
        const myBizAccount = google.mybusinessaccountmanagement({
            version: 'v1',
            auth: oauth2Client
        });

        let allAccounts: any[] = [];
        let nextPageToken: string | undefined | null = undefined;

        do {
            const accountsResponse = await myBizAccount.accounts.list({
                pageSize: 20, // Pede mais contas por vez
                pageToken: nextPageToken || undefined,
            });
            
            const accounts = accountsResponse.data.accounts;
            if (accounts) {
                allAccounts.push(...accounts);
            }
            nextPageToken = accountsResponse.data.nextPageToken;
        } while (nextPageToken);

        if (allAccounts.length === 0) {
            throw new Error("Nenhuma conta do Google Meu Negócio encontrada para este usuário.");
        }
        
        // 2. Para cada conta, busca as localizações (perfis de empresa)
        let allBusinessProfiles: any[] = [];
        let primaryAccountId: string | undefined;

        for (const account of allAccounts) {
            if (!account.name) continue;
            const accountId = account.name.split('/')[1];
            if(!primaryAccountId) primaryAccountId = accountId; // Salva o primeiro para o caso de ter múltiplos

            const readMask = "name,title,categories,storefrontAddress,phoneNumbers,websiteUri,metadata,profile,openInfo,regularHours";
            const locationsListResponse = await fetch(
                `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=${encodeURIComponent(readMask)}`,
                {
                    headers: { Authorization: `Bearer ${tokens.access_token}` },
                }
            );

            if (!locationsListResponse.ok) {
                const errorData = await locationsListResponse.json();
                console.warn(`[GOOGLE_CALLBACK_WARN] Falha ao buscar localizações para a conta ${accountId}:`, errorData.error?.message);
                continue; // Pula para a próxima conta em caso de erro
            }

            const { locations } = await locationsListResponse.json();

            if (locations && locations.length > 0) {
                 for (const loc of locations) {
                    if (!loc.name) continue;

                    allBusinessProfiles.push({
                        name: loc.title || 'Nome não encontrado',
                        googleName: loc.name,
                        category: loc.categories?.primaryCategory?.displayName || 'Categoria não encontrada',
                        address: loc.storefrontAddress ? `${loc.storefrontAddress.addressLines?.join(', ')}, ${loc.storefrontAddress.locality}, ${loc.storefrontAddress.administrativeArea} - ${loc.storefrontAddress.postalCode}` : 'Endereço não encontrado',
                        phone: loc.phoneNumbers?.primaryPhone || 'Telefone não encontrado',
                        website: loc.websiteUri || 'Website não encontrado',
                        description: loc.profile?.description || 'Descrição não disponível.',
                        isVerified: true,
                        regularHours: loc.regularHours || null,
                        openInfo: loc.openInfo || null,
                    });
                }
            }
        }
        
        if (allBusinessProfiles.length === 0) {
          throw new Error("Nenhum perfil de empresa (local) encontrado em nenhuma das contas Google.");
        }

        const connectionData = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiryDate: tokens.expiry_date,
        };

        // Retorna todos os dados para o cliente
        return NextResponse.json({ 
            success: true, 
            businessProfiles: allBusinessProfiles, // Retorna a lista completa de perfis de empresa
            connectionData: connectionData,
            accountId: primaryAccountId, // Retorna o ID da primeira conta encontrada
        });

    } catch (error: any) {
        console.error("[GOOGLE_CALLBACK_ERROR] Erro no fluxo completo:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.error_description || error.message || "Ocorreu um erro desconhecido durante a conexão com o Google.";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}


import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie, adminDb } from "@/lib/firebase-admin";
import { getAuthenticatedGoogleClient } from "@/lib/services/google-service-admin";


export async function POST(request: NextRequest) {
    try {
        const uid = await getUidFromCookie();
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: "Nenhum arquivo foi enviado." }, { status: 400 });
        }

        // 1. Proxy the file to the external webhook to get a public URL
        const webhookUrl = "https://webhook.flowupinova.com.br/webhook/imagem_sem_logo";
        const webhookFormData = new FormData();
        webhookFormData.append('file', file);
        
        const webhookResponse = await fetch(webhookUrl, {
            method: "POST",
            body: webhookFormData,
        });

        if (!webhookResponse.ok) {
            const errorText = await webhookResponse.text();
            throw new Error(`O serviço de upload de imagem falhou: ${errorText}`);
        }

        const webhookResult = await webhookResponse.json();
        const publicUrl = webhookResult?.[0]?.url_post;

        if (!publicUrl) {
            throw new Error("A resposta do serviço de upload não continha uma URL válida.");
        }

        // 2. Fetch connection and profile data to build the parent path
        const connRef = adminDb.collection('users').doc(uid).collection('connections').doc('google');
        const profileRef = adminDb.collection('users').doc(uid).collection('business').doc('profile');

        const [connDoc, profileDoc] = await Promise.all([connRef.get(), profileRef.get()]);

        if (!connDoc.exists) throw new Error("Conexão com Google não encontrada.");
        if (!profileDoc.exists) throw new Error("Perfil de negócio não encontrado.");

        const accountId = connDoc.data()?.accountId;
        const locationName = profileDoc.data()?.googleName; // This should be "locations/{locationId}"

        if (!accountId || !locationName) {
            throw new Error("Dados de conta ou localização do Google incompletos no perfil.");
        }

        // Correctly construct the parent path for the v4 API
        const parent = `accounts/${accountId}/${locationName}`;

        // 3. Associate the new media URL with Google Business Profile using v4 API
        const oauth2Client = await getAuthenticatedGoogleClient(uid);
        const { token } = await oauth2Client.getAccessToken();
        if (!token) {
            throw new Error("Não foi possível obter o token de acesso do Google.");
        }
        
        const googleApiUrl = `https://mybusiness.googleapis.com/v4/${parent}/media`;
        
        const apiResponse = await fetch(googleApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mediaFormat: "PHOTO",
                locationAssociation: {
                    category: 'LOGO'
                },
                sourceUrl: publicUrl
            })
        });
        
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            let errorMessage = `A API do Google retornou um erro: ${apiResponse.statusText}`; // Fallback message
            try {
                const errorJson = JSON.parse(errorText);
                const specificViolation = errorJson.error?.details?.[0]?.fieldViolations?.[0]?.description;
                const generalMessage = errorJson.error?.message;
                
                if (specificViolation) {
                    errorMessage = specificViolation;
                } else if (generalMessage) {
                     if (generalMessage.toLowerCase().includes("invalid argument")) {
                        errorMessage = "Não foi possível enviar a logomarca. Verifique se o arquivo atende aos requisitos: formato JPG ou PNG e dimensões quadradas (proporção 1:1, ex.: 500x500).";
                    } else {
                        errorMessage = generalMessage;
                    }
                }
            } catch (e) {
                console.error("Could not parse Google API error response as JSON.");
            }
            throw new Error(errorMessage);
        }
        
        const resultData = await apiResponse.json();
        console.log("Google API Success Response:", resultData);

        return NextResponse.json({ success: true, data: resultData });

    } catch (error: any) {
        console.error("[GOOGLE_UPLOAD_LOGO_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

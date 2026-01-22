
import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getAuthenticatedGoogleClient, getGoogleBusinessProfile } from "@/lib/services/google-service-admin";
import { google } from "googleapis";

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

        // 2. Associate the new media URL with Google Business Profile
        const profile = await getGoogleBusinessProfile(uid);
        const locationName = profile.googleName;

        if (!locationName) {
            throw new Error("Perfil do Google (locationName) não encontrado para o usuário.");
        }

        const oauth2Client = await getAuthenticatedGoogleClient(uid);
        const mybusinessbusinessinformation = google.mybusinessbusinessinformation({
            version: "v1",
            auth: oauth2Client,
        });

        await mybusinessbusinessinformation.locations.media.create({
            parent: locationName,
            requestBody: {
                mediaUrl: publicUrl,
                category: 'LOGO',
            },
        });
        
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[GOOGLE_UPLOAD_LOGO_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

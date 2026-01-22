
import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getAuthenticatedGoogleClient } from "@/lib/services/google-service-admin";

export async function POST(request: NextRequest) {
    try {
        const uid = await getUidFromCookie();
        const { mediaName } = await request.json();

        if (!mediaName) {
            return NextResponse.json({ success: false, error: "O nome da mídia é obrigatório." }, { status: 400 });
        }

        const oauth2Client = await getAuthenticatedGoogleClient(uid);
        const { token } = await oauth2Client.getAccessToken();
        if (!token) {
            throw new Error("Não foi possível obter o token de acesso do Google.");
        }

        const deleteUrl = `https://mybusiness.googleapis.com/v4/${mediaName}`;
        
        const deleteResponse = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text();
            let errorMessage = `A API do Google retornou um erro: ${deleteResponse.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || errorMessage;
            } catch (e) {
                // Not a JSON error, use the text
            }
            throw new Error(errorMessage);
        }

        // A successful DELETE request to this API returns an empty body.
        return NextResponse.json({ success: true, message: "Mídia excluída com sucesso." });

    } catch (error: any) {
        console.error("[GOOGLE_DELETE_MEDIA_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

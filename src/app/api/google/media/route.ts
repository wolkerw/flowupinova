
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface MediaRequestBody {
  accessToken: string;
  accountId: string;
  locationId: string;
}

export async function POST(request: NextRequest) {
    try {
        const { accessToken, accountId, locationId } = await request.json() as MediaRequestBody;
        
        if (!accessToken || !accountId || !locationId) {
            return NextResponse.json({ success: false, error: "Access Token, Account ID e Location ID são obrigatórios." }, { status: 400 });
        }
        
        const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/media?pageSize=20`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[GOOGLE_MEDIA_ERROR] API retornou status ${response.status}. Resposta:`, errorText);
            let errorMessage = `Falha ao buscar imagens do Google (status: ${response.status}).`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || errorMessage;
            } catch (e) {
                // O corpo não era JSON
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        const items = data.mediaItems || [];

        const cover = items.find((m: any) => m.locationAssociation?.category === 'COVER') || null;
        const profile = items.find((m: any) => m.locationAssociation?.category === 'PROFILE') || null;
        const gallery = items.filter((m: any) => !['COVER', 'PROFILE'].includes(m.locationAssociation?.category ?? ''));
        
        const formattedMedia = {
            coverPhoto: cover ? { url: cover.googleUrl, thumbnailUrl: cover.thumbnailUrl } : null,
            profilePhoto: profile ? { url: profile.googleUrl, thumbnailUrl: profile.thumbnailUrl } : null,
            gallery: gallery.map((m: any) => ({
                url: m.googleUrl,
                thumbnailUrl: m.thumbnailUrl,
                category: m.locationAssociation?.category,
                mediaFormat: m.mediaFormat, // Inclui o formato da mídia (PHOTO ou VIDEO)
            })),
        };

        return NextResponse.json({ success: true, media: formattedMedia });

    } catch (error: any) {
        console.error("[GOOGLE_MEDIA_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message || "Falha ao buscar mídias." }, { status: 500 });
    }
}

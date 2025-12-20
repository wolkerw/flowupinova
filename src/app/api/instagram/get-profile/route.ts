
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get('instagram_access_token_new');

    if (!tokenCookie) {
        return NextResponse.json({ success: false, error: 'Token de acesso não encontrado.' }, { status: 401 });
    }

    const accessToken = tokenCookie.value;

    try {
        const url = `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("Erro da API do Instagram:", data.error);
            return NextResponse.json({ success: false, error: data.error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, username: data.username, id: data.id });

    } catch (error: any) {
        console.error('Erro interno na API get-profile:', error);
        return NextResponse.json({ success: false, error: error.message || 'Erro desconhecido no servidor.' }, { status: 500 });
    }
}

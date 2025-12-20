
import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { updateMetaConnectionAdmin } from '@/lib/services/meta-service-admin';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const userId = searchParams.get('state');

  if (error) {
    const errorDescription = searchParams.get('error_description');
    return NextResponse.redirect(new URL(`/dashboard/conteudo?error=${error}&error_description=${errorDescription || 'User denied access.'}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/conteudo?error=missing_code&error_description=Authorization code is missing.', request.url));
  }

  if (!config.instagram.appId || !config.instagram.appSecret || !config.instagram.redirectUri) {
    console.error('Instagram app credentials are not configured on the server.');
    return NextResponse.redirect(new URL('/dashboard/conteudo?error=missing_config&error_description=Server configuration is incomplete.', request.url));
  }
  
  if (!userId) {
     return NextResponse.redirect(new URL('/dashboard/conteudo?error=missing_state&error_description=User ID (state) is missing.', request.url));
  }


  try {
    // 1. Exchange code for short-lived token
    const tokenFormData = new FormData();
    tokenFormData.append('client_id', config.instagram.appId);
    tokenFormData.append('client_secret', config.instagram.appSecret);
    tokenFormData.append('grant_type', 'authorization_code');
    tokenFormData.append('redirect_uri', config.instagram.redirectUri);
    tokenFormData.append('code', code.replace(/#_$/, '')); // As per docs, remove trailing #_

    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: tokenFormData,
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error_message) {
      throw new Error(tokenData.error_message);
    }

    const shortLivedToken = tokenData.access_token;
    if (!shortLivedToken) {
      throw new Error('Short-lived access token not found in response.');
    }

    // 2. Exchange short-lived token for long-lived token
    const longLivedTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${config.instagram.appSecret}&access_token=${shortLivedToken}`;
    const longLivedTokenResponse = await fetch(longLivedTokenUrl);
    const longLivedTokenData = await longLivedTokenResponse.json();

    if (longLivedTokenData.error) {
      throw new Error(longLivedTokenData.error.message);
    }
    
    const longLivedToken = longLivedTokenData.access_token;

    // 3. Get user profile info
    const profileUrl = `https://graph.instagram.com/me?fields=id,username&access_token=${longLivedToken}`;
    const profileResponse = await fetch(profileUrl);
    const profileData = await profileResponse.json();
    if (profileData.error) {
        throw new Error(`Failed to fetch profile: ${profileData.error.message}`);
    }
    
    // 4. Save to Firestore using admin service
    await updateMetaConnectionAdmin(userId, {
        isConnected: true,
        accessToken: longLivedToken,
        instagramId: profileData.id,
        instagramUsername: profileData.username,
        // Mantemos os dados de página do Facebook se já existirem
        pageId: undefined, 
        pageName: undefined,
    });
    
    
    // Força o redirecionamento para a porta 9000
    const redirectUrl = new URL(request.url);
    redirectUrl.port = '9000';
    redirectUrl.pathname = '/dashboard/conteudo';
    redirectUrl.searchParams.set('new_token_success', 'true');
    redirectUrl.searchParams.set('token_preview', longLivedToken.substring(0, 15));


    const response = NextResponse.redirect(redirectUrl);

    // O ideal seria salvar o token no banco de dados aqui, associado ao usuário.
    // Por enquanto, apenas o colocamos em um cookie para prova de conceito.
    response.cookies.set('instagram_access_token_new', longLivedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: longLivedTokenData.expires_in,
      path: '/',
      sameSite: 'lax',
    });

    return response;

  } catch (err: any) {
    console.error('Error exchanging token:', err);
    return NextResponse.redirect(new URL(`/dashboard/conteudo?error=token_exchange_failed&error_description=${encodeURIComponent(err.message)}`, request.url));
  }
}

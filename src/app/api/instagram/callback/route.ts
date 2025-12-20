
import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    const errorDescription = searchParams.get('error_description');
    return NextResponse.redirect(new URL(`/?error=${error}&error_description=${errorDescription || 'User denied access.'}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code&error_description=Authorization code is missing.', request.url));
  }

  if (!config.instagram.appId || !config.instagram.appSecret || !config.instagram.redirectUri) {
    console.error('Instagram app credentials are not configured on the server.');
    return NextResponse.redirect(new URL('/?error=missing_config&error_description=Server configuration is incomplete.', request.url));
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
    
    // Redireciona para a página de conteúdo com o token como parâmetro para feedback
    const redirectUrl = new URL('/dashboard/conteudo', request.url);
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


import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const userId = searchParams.get('state');

  // Constrói a URL de redirecionamento para a porta correta do dashboard
  const redirectUrl = new URL(request.url);
  redirectUrl.protocol = 'https:';
  redirectUrl.host = request.nextUrl.host;
  redirectUrl.port = '9000'; // Garante a porta do cliente
  redirectUrl.pathname = '/dashboard/conteudo-v2';
  redirectUrl.search = '';

  if (error) {
    redirectUrl.searchParams.set('instagram_error', error);
    redirectUrl.searchParams.set('instagram_error_description', searchParams.get('error_description') || 'User denied access.');
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    redirectUrl.searchParams.set('instagram_error', 'missing_code');
    redirectUrl.searchParams.set('instagram_error_description', 'Authorization code is missing.');
    return NextResponse.redirect(redirectUrl);
  }
  
  if (!userId) {
     redirectUrl.searchParams.set('instagram_error', 'missing_state');
     redirectUrl.searchParams.set('instagram_error_description', 'User ID (state) is missing.');
     return NextResponse.redirect(redirectUrl);
  }

  if (!config.instagram.appId || !config.instagram.appSecret || !config.instagram.redirectUri) {
    console.error('Instagram app credentials are not configured on the server.');
    redirectUrl.searchParams.set('instagram_error', 'server_config_missing');
    redirectUrl.searchParams.set('instagram_error_description', 'Server configuration for Instagram is incomplete.');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // 1. Trocar o código por um token de curta duração
    const tokenFormData = new FormData();
    tokenFormData.append('client_id', config.instagram.appId);
    tokenFormData.append('client_secret', config.instagram.appSecret);
    tokenFormData.append('grant_type', 'authorization_code');
    tokenFormData.append('redirect_uri', config.instagram.redirectUri);
    tokenFormData.append('code', code.replace(/#_$/, ''));

    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: tokenFormData,
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error_message) {
      throw new Error(tokenData.error_message);
    }
    const shortLivedToken = tokenData.access_token;
    if (!shortLivedToken) throw new Error('Short-lived access token not found in response.');

    // 2. Trocar o token de curta duração por um de longa duração
    const longLivedTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${config.instagram.appSecret}&access_token=${shortLivedToken}`;
    const longLivedTokenResponse = await fetch(longLivedTokenUrl);
    const longLivedTokenData = await longLivedTokenResponse.json();

    if (longLivedTokenData.error) throw new Error(longLivedTokenData.error.message);
    const longLivedToken = longLivedTokenData.access_token;

    // 3. Obter os dados do perfil do usuário
    const profileUrl = `https://graph.instagram.com/me?fields=id,username&access_token=${longLivedToken}`;
    const profileResponse = await fetch(profileUrl);
    const profileData = await profileResponse.json();

    if (profileData.error) throw new Error(`Failed to fetch profile: ${profileData.error.message}`);

    // 4. Redirecionar para o cliente com os dados na URL
    redirectUrl.searchParams.set('instagram_connection_success', 'true');
    redirectUrl.searchParams.set('instagram_accessToken', longLivedToken);
    redirectUrl.searchParams.set('instagram_id', profileData.id);
    redirectUrl.searchParams.set('instagram_username', profileData.username);
    redirectUrl.searchParams.set('user_id_from_state', userId);

    return NextResponse.redirect(redirectUrl);

  } catch (err: any) {
    console.error('[INSTAGRAM_CALLBACK_ERROR]', err);
    redirectUrl.searchParams.set('instagram_error', 'token_exchange_failed');
    redirectUrl.searchParams.set('instagram_error_description', encodeURIComponent(err.message));
    return NextResponse.redirect(redirectUrl);
  }
}

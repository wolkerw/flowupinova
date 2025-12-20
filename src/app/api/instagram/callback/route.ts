
import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { updateInstagramConnectionAdmin } from '@/lib/services/instagram-service-admin';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const userId = searchParams.get('state');

  // Build the redirect URL pointing to the correct port (9000)
  const redirectUrl = new URL(request.url);
  redirectUrl.protocol = 'https:';
  redirectUrl.host = request.nextUrl.host; // This should already contain the correct host
  if (redirectUrl.host.includes(':9002')) {
      redirectUrl.host = redirectUrl.host.replace(':9002', ':9000');
  }
  redirectUrl.port = '9000';
  redirectUrl.pathname = '/dashboard/conteudo';
  redirectUrl.search = '';

  if (error) {
    redirectUrl.searchParams.set('error', error);
    redirectUrl.searchParams.set('error_description', searchParams.get('error_description') || 'User denied access.');
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    redirectUrl.searchParams.set('error', 'missing_code');
    redirectUrl.searchParams.set('error_description', 'Authorization code is missing.');
    return NextResponse.redirect(redirectUrl);
  }
  
  if (!userId) {
     redirectUrl.searchParams.set('error', 'missing_state');
     redirectUrl.searchParams.set('error_description', 'User ID (state) is missing.');
     return NextResponse.redirect(redirectUrl);
  }

  if (!config.instagram.appId || !config.instagram.appSecret || !config.instagram.redirectUri) {
    console.error('Instagram app credentials are not configured on the server.');
    redirectUrl.searchParams.set('error', 'missing_config');
    redirectUrl.searchParams.set('error_description', 'Server configuration is incomplete.');
    return NextResponse.redirect(redirectUrl);
  }

  let longLivedToken: string | null = null;
  
  try {
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
    if (!shortLivedToken) {
      throw new Error('Short-lived access token not found in response.');
    }

    const longLivedTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${config.instagram.appSecret}&access_token=${shortLivedToken}`;
    const longLivedTokenResponse = await fetch(longLivedTokenUrl);
    const longLivedTokenData = await longLivedTokenResponse.json();

    if (longLivedTokenData.error) {
      throw new Error(longLivedTokenData.error.message);
    }
    
    longLivedToken = longLivedTokenData.access_token;
    
    // Set the cookie for immediate client-side feedback
    cookies().set('instagram_access_token_new', longLivedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 60, // 60 days
        path: '/',
    });
    
    redirectUrl.searchParams.set('new_token_success', 'true');

  } catch (err: any) {
    console.error('Error during token exchange:', err);
    redirectUrl.searchParams.set('error', 'token_exchange_failed');
    redirectUrl.searchParams.set('error_description', encodeURIComponent(err.message));
    return NextResponse.redirect(redirectUrl);
  }

  // ATTEMPT TO SAVE TO FIRESTORE, BUT DO NOT BLOCK THE MAIN FLOW
  if (longLivedToken) {
    try {
        const profileUrl = `https://graph.instagram.com/me?fields=id,username&access_token=${longLivedToken}`;
        const profileResponse = await fetch(profileUrl);
        const profileData = await profileResponse.json();

        if (profileData.error) {
            throw new Error(`Failed to fetch profile: ${profileData.error.message}`);
        }
        
        const dataToSave = {
            isConnected: true,
            accessToken: longLivedToken,
            instagramId: profileData.id,
            instagramUsername: profileData.username,
        };

        // This function call is now wrapped in a try/catch
        await updateInstagramConnectionAdmin(userId, dataToSave);
        
        console.log(`Firestore updated successfully for user ${userId} in 'instagram' collection.`);
        redirectUrl.searchParams.set('firestore_success', 'true');

    } catch (firestoreError: any) {
        console.error('Error saving to Firestore (will not block redirect):', firestoreError);
        redirectUrl.searchParams.set('firestore_error', 'true');
        redirectUrl.searchParams.set('firestore_error_description', encodeURIComponent(firestoreError.message));
    }
  }

  // Redirect regardless of Firestore success
  const response = NextResponse.redirect(redirectUrl);
  return response;
}

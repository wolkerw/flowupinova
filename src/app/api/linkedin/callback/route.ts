import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const userId = searchParams.get("state"); // state passes the Firebase userId

  // Real host detection
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const origin = `${protocol}://${host}`;

  const redirectUrl = new URL("/dashboard/conteudo", origin);
  redirectUrl.search = "";

  if (error) {
    console.error("[LINKEDIN_CALLBACK_ERROR] Erro na autorização:", error);
    redirectUrl.searchParams.set("linkedin_error", error);
    redirectUrl.searchParams.set(
      "linkedin_error_description",
      searchParams.get("error_description") || "Usuário negou o acesso."
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    redirectUrl.searchParams.set("linkedin_error", "missing_code");
    redirectUrl.searchParams.set("linkedin_error_description", "Código de autorização ausente.");
    return NextResponse.redirect(redirectUrl);
  }

  if (!userId) {
    redirectUrl.searchParams.set("linkedin_error", "missing_state");
    redirectUrl.searchParams.set("linkedin_error_description", "Identificação do usuário (state) ausente.");
    return NextResponse.redirect(redirectUrl);
  }

  if (!config.linkedin.clientId || !config.linkedin.clientSecret) {
    console.error("[LINKEDIN_CALLBACK_ERROR] Credenciais do LinkedIn não configuradas no servidor.");
    redirectUrl.searchParams.set("linkedin_error", "server_config_missing");
    redirectUrl.searchParams.set("linkedin_error_description", "Configuração do servidor para LinkedIn incompleta.");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const currentCallbackUri = `${origin}/api/linkedin/callback`;

    // 1. Trocar código por Access Token e Refresh Token
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: currentCallbackUri,
      client_id: config.linkedin.clientId,
      client_secret: config.linkedin.clientSecret,
    });

    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || "Falha na troca de tokens com o LinkedIn.");
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;
    const expiresIn = tokenData.expires_in;
    const expiryDate = expiresIn ? Date.now() + expiresIn * 1000 : null;

    if (!accessToken) throw new Error("Token de acesso não retornado.");

    // 2. Obter perfil do membro (OpenID Connect)
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      throw new Error("Não foi possível obter os dados do perfil do LinkedIn.");
    }

    const profileData = await profileResponse.json();
    const personName = profileData.name || `${profileData.given_name} ${profileData.family_name}`;
    const personUrn = `urn:li:person:${profileData.sub}`;
    const profilePictureUrl = profileData.picture || null;

    // 3. Obter páginas de organizações (Company Pages) administradas pelo membro
    const linkedinVersion = "202401"; // Versão estável da API
    const orgsUrl = "https://api.linkedin.com/rest/organizationalAccessControl?q=roleAssignee";
    const orgsResponse = await fetch(orgsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": linkedinVersion,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    const organizations: { urn: string; name: string }[] = [];

    if (orgsResponse.ok) {
      const orgsData = await orgsResponse.ok ? await orgsResponse.json() : { elements: [] };
      const elements = orgsData.elements || [];

      // Filtra por funções administrativas (como ADMINISTRATOR)
      const adminRoles = ["ADMINISTRATOR", "DIRECT_SPONSORED_CONTENT_POSTER"];
      const orgUrns = elements
        .filter((el: any) => adminRoles.includes(el.role) && el.organizationalTarget)
        .map((el: any) => el.organizationalTarget);

      // Busca o nome detalhado de cada organização
      const orgDetailsPromises = orgUrns.map(async (urn: string) => {
        try {
          const orgId = urn.split(":").pop();
          const detailUrl = `https://api.linkedin.com/rest/organizations/${orgId}`;
          const detailRes = await fetch(detailUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "LinkedIn-Version": linkedinVersion,
              "X-Restli-Protocol-Version": "2.0.0",
            },
          });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            return {
              urn,
              name: detailData.localizedName || "Página sem nome",
            };
          }
        } catch (detailErr) {
          console.error(`Erro ao buscar detalhes da organização ${urn}:`, detailErr);
        }
        return null;
      });

      const resolvedOrgs = await Promise.all(orgDetailsPromises);
      resolvedOrgs.forEach((org) => {
        if (org) organizations.push(org);
      });
    } else {
      console.warn(
        "[LINKEDIN_CALLBACK_WARN] Falha ao listar organizações:",
        await orgsResponse.text()
      );
    }

    // 4. Salvar conexão no Firestore do usuário
    const dbData = {
      isConnected: true,
      accessToken,
      refreshToken,
      expiryDate,
      personUrn,
      personName,
      profilePictureUrl,
      organizations,
      publishTarget: organizations.length > 0 ? "organization" : "person",
      selectedOrganizationUrn: organizations.length > 0 ? organizations[0].urn : null,
      selectedOrganizationName: organizations.length > 0 ? organizations[0].name : null,
      connectedAt: new Date(),
    };

    await adminDb
      .collection("users")
      .doc(userId)
      .collection("connections")
      .doc("linkedin")
      .set(dbData, { merge: true });

    console.log(`[LINKEDIN_CALLBACK_SUCCESS] Conexão salva no Firestore para o usuário: ${userId}`);

    // 5. Redirecionar frontend com sucesso
    redirectUrl.searchParams.set("linkedin_connection_success", "true");
    redirectUrl.searchParams.set("linkedin_name", personName);
    redirectUrl.searchParams.set("user_id_from_state", userId);

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error("[LINKEDIN_CALLBACK_FATAL_ERROR]", err);
    redirectUrl.searchParams.set("linkedin_error", "token_exchange_failed");
    redirectUrl.searchParams.set("linkedin_error_description", encodeURIComponent(err.message));
    return NextResponse.redirect(redirectUrl);
  }
}

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

    // 2. Obter perfil do membro via /rest/me (scope r_basicprofile)
    // Não usamos /v2/userinfo pois requer openid scope que conflita com Community Management API
    let personName = "LinkedIn User";
    let personUrn = "";
    let profilePictureUrl: string | null = null;

    try {
      const profileResponse = await fetch("https://api.linkedin.com/rest/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": "202505",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      });

      console.log("[LINKEDIN_CALLBACK_DEBUG] /rest/me status:", profileResponse.status);

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        personName = profileData.localizedFirstName && profileData.localizedLastName
          ? `${profileData.localizedFirstName} ${profileData.localizedLastName}`
          : (profileData.localizedFirstName || "LinkedIn User");
        personUrn = profileData.id ? `urn:li:person:${profileData.id}` : "";
        console.log("[LINKEDIN_CALLBACK_DEBUG] Perfil obtido:", personName, personUrn);
      } else {
        const errText = await profileResponse.text();
        console.warn("[LINKEDIN_CALLBACK_WARN] Erro ao obter perfil via /rest/me. Status:", profileResponse.status, errText);
      }
    } catch (profileErr: any) {
      console.warn("[LINKEDIN_CALLBACK_WARN] Erro ao obter perfil:", profileErr.message);
    }

    // 3. Obter páginas de organizações (Company Pages) administradas pelo membro
    // Endpoint: /rest/organizationAcls com scope rw_organization_admin (versão 202505)
    const linkedinVersion = "202505";
    const orgsUrl = "https://api.linkedin.com/rest/organizationAcls?q=roleAssignee";
    const orgsResponse = await fetch(orgsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": linkedinVersion,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    console.log("[LINKEDIN_CALLBACK_DEBUG] organizationAcls status:", orgsResponse.status);

    const organizations: { urn: string; name: string }[] = [];

    if (orgsResponse.ok) {
      const orgsData = await orgsResponse.ok ? await orgsResponse.json() : { elements: [] };
      const elements = orgsData.elements || [];

      // Log diagnóstico: lista todos os roles retornados pela API para facilitar debugging
      console.log(
        "[LINKEDIN_CALLBACK_DEBUG] Roles retornados pela API:",
        JSON.stringify(elements.map((el: any) => ({ role: el.role, target: el.organizationalTarget })))
      );

      // Aceita qualquer organização com target definido (não filtra por role específico)
      // pois o LinkedIn pode usar diferentes nomes de role dependendo do plano e da região
      const orgUrns = elements
        .filter((el: any) => el.organizationalTarget)
        .map((el: any) => el.organizationalTarget);

      // Remove duplicatas (caso o usuário tenha múltiplos roles na mesma org)
      const uniqueOrgUrns = [...new Set<string>(orgUrns)];

      // Busca o nome detalhado de cada organização
      const orgDetailsPromises = uniqueOrgUrns.map(async (urn: string) => {
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
    const targetName = (personUrn && personName !== "LinkedIn User")
      ? personName
      : (organizations.length > 0 ? organizations[0].name : "LinkedIn User");

    const targetUrn = personUrn || (organizations.length > 0 ? organizations[0].urn : "");

    const dbData = {
      isConnected: true,
      accessToken,
      refreshToken,
      expiryDate,
      personUrn: targetUrn,
      personName: targetName,
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

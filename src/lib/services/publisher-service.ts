import { adminDb } from "@/lib/firebase-admin";
import { getAuthenticatedGoogleClient } from "@/lib/services/google-service-admin";

export function isVideoMedia(url: string, type?: string): boolean {
  if (type && type.toLowerCase().startsWith("video/")) return true;
  if (!url) return false;
  const cleanUrl = url.split("?")[0].toLowerCase();
  return (
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".mov") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".m4v") ||
    cleanUrl.endsWith(".avi") ||
    cleanUrl.endsWith(".mkv") ||
    url.toLowerCase().includes("video") ||
    url.toLowerCase().includes(".mp4")
  );
}

/**
 * 1. FACEBOOK PUBLISHING
 */
export async function publishToFacebook(
  pageId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  const isVideo = isVideoMedia(imageUrl);
  let url: string;
  let params: URLSearchParams;

  if (isVideo) {
    url = `https://graph.facebook.com/v20.0/${pageId}/videos`;
    params = new URLSearchParams({
      file_url: imageUrl,
      description: caption,
      access_token: accessToken,
    });
  } else {
    url = `https://graph.facebook.com/v20.0/${pageId}/photos`;
    params = new URLSearchParams({
      url: imageUrl,
      caption: caption,
      access_token: accessToken,
    });
  }

  const response = await fetch(`${url}?${params.toString()}`, { method: "POST" });
  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error("[PUBLISHER_FB_ERROR] Falha ao publicar na Página do Facebook:", data.error);
    throw new Error(data.error?.message || "Falha ao publicar a mídia na Página do Facebook.");
  }

  return data.id;
}

/**
 * 2. INSTAGRAM PUBLISHING
 */
interface InstagramUserTag {
  username: string;
  x: number;
  y: number;
}

async function findInvalidProfile(
  baseParams: URLSearchParams,
  url: string,
  profiles: string[],
  type: "collaborators" | "user_tags"
): Promise<string | null> {
  for (const profile of profiles) {
    const testParams = new URLSearchParams(baseParams.toString());
    testParams.delete("collaborators");
    testParams.delete("user_tags");

    if (type === "collaborators") {
      testParams.append("collaborators", `['${profile}']`);
    } else {
      testParams.append("user_tags", JSON.stringify([{ username: profile, x: 0.5, y: 0.5 }]));
    }

    const testRes = await fetch(`${url}?${testParams.toString()}`, { method: "POST" });
    if (!testRes.ok) {
      const data = await testRes.json();
      if (
        data.error?.message?.toLowerCase().includes("invalid user id") ||
        data.error?.message?.toLowerCase().includes("unknown error")
      ) {
        return profile;
      }
    }
  }
  return null;
}

async function createMediaItemContainer(
  instagramId: string,
  accessToken: string,
  imageUrl: string,
  isCarouselItem: boolean,
  caption?: string,
  collaborators?: string[],
  userTags?: InstagramUserTag[],
  mediaType?: "IMAGE" | "VIDEO" | "REELS" | "STORIES",
  isStory?: boolean
): Promise<string> {
  const host = "https://graph.instagram.com";
  const url = `${host}/v20.0/${instagramId}/media`;

  const isVideo = mediaType === "VIDEO" || mediaType === "REELS" || isVideoMedia(imageUrl);
  const isStoryMedia = isStory || mediaType === "STORIES";

  const params = new URLSearchParams({
    access_token: accessToken,
  });

  if (isStoryMedia) {
    params.append("media_type", "STORIES");
    if (isVideo) {
      params.append("video_url", imageUrl);
    } else {
      params.append("image_url", imageUrl);
    }
    // Stories não aceitam caption, collaborators ou user_tags diretamente no container base
  } else if (isVideo) {
    // Para vídeos no Feed/Reels, a Meta unificou em REELS
    params.append("media_type", "REELS");
    params.append("video_url", imageUrl);

    if (caption) {
      params.append("caption", caption);
    }
    if (collaborators && collaborators.length > 0) {
      const formattedCollaborators = `[${collaborators.map((c) => `'${c}'`).join(",")}]`;
      params.append("collaborators", formattedCollaborators);
    }
    if (userTags && userTags.length > 0) {
      params.append("user_tags", JSON.stringify(userTags));
    }
  } else {
    // Foto estática (Feed ou Carrossel)
    params.append("image_url", imageUrl);

    if (isCarouselItem) {
      params.append("is_carousel_item", "true");
    }

    if (!isCarouselItem && caption) {
      params.append("caption", caption);
    }

    if (!isCarouselItem && collaborators && collaborators.length > 0) {
      const formattedCollaborators = `[${collaborators.map((c) => `'${c}'`).join(",")}]`;
      params.append("collaborators", formattedCollaborators);
    }

    if (userTags && userTags.length > 0) {
      params.append("user_tags", JSON.stringify(userTags));
    }
  }

  const response = await fetch(`${url}?${params.toString()}`, { method: "POST" });
  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error("[PUBLISHER_IG_ERROR] Falha ao criar container de item de mídia:", data.error);
    let errorMessage =
      data.error?.message || "Falha ao criar o container de item de mídia no Instagram.";
    if (
      errorMessage.toLowerCase().includes("invalid user id") ||
      errorMessage.toLowerCase().includes("unknown error")
    ) {
      let exactInvalidProfile = null;
      let errorSource = "";

      if (collaborators?.length && (!userTags || userTags.length === 0)) {
        exactInvalidProfile = await findInvalidProfile(params, url, collaborators, "collaborators");
        errorSource = "Colaboradores";
      } else if (userTags?.length && (!collaborators || collaborators.length === 0)) {
        exactInvalidProfile = await findInvalidProfile(
          params,
          url,
          userTags.map((t) => t.username),
          "user_tags"
        );
        errorSource = "Marcações";
      } else if (collaborators?.length && userTags?.length) {
        exactInvalidProfile = await findInvalidProfile(params, url, collaborators, "collaborators");
        if (exactInvalidProfile) {
          errorSource = "Colaboradores";
        } else {
          exactInvalidProfile = await findInvalidProfile(
            params,
            url,
            userTags.map((t) => t.username),
            "user_tags"
          );
          errorSource = "Marcações";
        }
      }

      if (exactInvalidProfile) {
        errorMessage = `Erro nos ${errorSource}. O perfil @${exactInvalidProfile} não existe ou é privado.`;
      } else {
        errorMessage = "Erro de privacidade. Um dos perfis informados não existe ou é privado.";
      }
    }
    throw new Error(errorMessage);
  }
  return data.id;
}

async function createCarouselContainer(
  instagramId: string,
  accessToken: string,
  childrenIds: string[],
  caption: string,
  collaborators?: string[]
): Promise<string> {
  const host = "https://graph.instagram.com";
  const url = `${host}/v20.0/${instagramId}/media`;

  const params = new URLSearchParams({
    media_type: "CAROUSEL",
    children: childrenIds.join(","),
    caption: caption,
    access_token: accessToken,
  });

  if (collaborators && collaborators.length > 0) {
    const formattedCollaborators = `[${collaborators.map((c) => `'${c}'`).join(",")}]`;
    params.append("collaborators", formattedCollaborators);
  }

  const response = await fetch(`${url}?${params.toString()}`, { method: "POST" });
  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error("[PUBLISHER_IG_ERROR] Falha ao criar o container do carrossel:", data.error);
    let errorMessage =
      data.error?.message || "Falha ao criar o container do carrossel no Instagram.";
    if (
      errorMessage.toLowerCase().includes("invalid user id") ||
      errorMessage.toLowerCase().includes("unknown error")
    ) {
      if (collaborators && collaborators.length > 0) {
        const exactInvalidProfile = await findInvalidProfile(
          params,
          url,
          collaborators,
          "collaborators"
        );
        if (exactInvalidProfile) {
          errorMessage = `Erro nos Colaboradores. O perfil @${exactInvalidProfile} não existe ou é privado.`;
        } else {
          errorMessage = "Erro nos Colaboradores. Um dos perfis não existe ou é privado.";
        }
      } else {
        errorMessage = "Erro de privacidade. Um dos perfis não existe ou é privado.";
      }
    }
    throw new Error(errorMessage);
  }
  return data.id;
}

async function checkContainerStatus(containerId: string, accessToken: string): Promise<void> {
  const host = "https://graph.instagram.com";
  let attempts = 0;
  while (attempts < 24) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const statusUrl = `${host}/v20.0/${containerId}?fields=status_code&access_token=${accessToken}`;
    const statusResponse = await fetch(statusUrl);
    const statusData = await statusResponse.json();

    console.log(
      `[PUBLISHER_IG_STATUS_CHECK] Attempt ${attempts + 1}: Container ${containerId} status is ${statusData.status_code}`
    );

    if (statusData.status_code === "FINISHED") return;
    if (statusData.status_code === "ERROR") {
      console.error("[PUBLISHER_IG_ERROR] Falha no processamento do container:", statusData);
      throw new Error("O container de mídia falhou ao ser processado.");
    }
    attempts++;
  }
  throw new Error("Tempo de espera excedido para o processamento da mídia.");
}

async function publishMediaContainer(
  instagramId: string,
  accessToken: string,
  creationId: string
): Promise<string> {
  const host = "https://graph.instagram.com";
  const url = `${host}/v20.0/${instagramId}/media_publish`;

  const params = new URLSearchParams({
    creation_id: creationId,
    access_token: accessToken,
  });

  const response = await fetch(`${url}?${params.toString()}`, { method: "POST" });
  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error("[PUBLISHER_IG_ERROR] Falha ao publicar o container:", data.error);
    throw new Error(data.error?.message || "A API não retornou um ID de mídia publicado.");
  }
  return data.id;
}

export async function publishToInstagram(
  instagramId: string,
  accessToken: string,
  imageUrls: string[],
  isCarousel: boolean,
  text: string,
  collaborators?: string[],
  userTags?: InstagramUserTag[],
  mediaType?: "IMAGE" | "VIDEO" | "REELS" | "STORIES",
  isStory?: boolean
): Promise<string> {
  const caption = text.slice(0, 2200);
  let creationId: string;

  if (isCarousel) {
    if (imageUrls.length > 10) throw new Error("Carrosséis são limitados a 10 mídias.");

    const childContainerPromises = imageUrls.map((url, index) =>
      createMediaItemContainer(
        instagramId,
        accessToken,
        url,
        true,
        undefined,
        undefined,
        index === 0 ? userTags : undefined,
        undefined,
        false
      )
    );
    const childContainerIds = await Promise.all(childContainerPromises);

    creationId = await createCarouselContainer(
      instagramId,
      accessToken,
      childContainerIds,
      caption,
      collaborators
    );
  } else {
    creationId = await createMediaItemContainer(
      instagramId,
      accessToken,
      imageUrls[0],
      false,
      caption,
      collaborators,
      userTags,
      mediaType,
      isStory
    );
  }

  await checkContainerStatus(creationId, accessToken);

  return publishMediaContainer(instagramId, accessToken, creationId);
}

/**
 * 3. GOOGLE MY BUSINESS PUBLISHING
 */
export async function publishToGoogle(
  userId: string,
  text: string,
  imageUrl?: string
): Promise<string> {
  const connRef = adminDb.collection("users").doc(userId).collection("connections").doc("google");
  const profileRef = adminDb.collection("users").doc(userId).collection("business").doc("profile");

  const [connDoc, profileDoc] = await Promise.all([connRef.get(), profileRef.get()]);

  if (!connDoc.exists) {
    throw new Error("A conta Google do usuário não está conectada.");
  }

  if (!profileDoc.exists) {
    throw new Error("Perfil de negócios do usuário não encontrado.");
  }

  const accountId = connDoc.data()?.accountId;
  const googleName = profileDoc.data()?.googleName;
  const website = profileDoc.data()?.website || profileDoc.data()?.instagram || "";

  if (!accountId || !googleName) {
    throw new Error(
      "Configuração do Google Meu Negócio incompleta. Verifique se o local foi selecionado."
    );
  }

  const oauth2Client = await getAuthenticatedGoogleClient(userId);
  const { token } = await oauth2Client.getAccessToken();

  if (!token) {
    throw new Error("Não foi possível gerar um token de acesso válido com o Google.");
  }

  const googleApiUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/${googleName}/localPosts`;

  const postPayload: any = {
    languageCode: "pt-BR",
    summary: text.slice(0, 1500),
    topicType: "STANDARD",
  };

  if (imageUrl) {
    const isVideo = /\.(mp4|mov|avi|webm|mkv|flv|wmv)(\?|$)/i.test(imageUrl) || imageUrl.toLowerCase().includes("video") || imageUrl.toLowerCase().includes(".mp4");
    postPayload.media = [
      {
        mediaFormat: isVideo ? "VIDEO" : "PHOTO",
        sourceUrl: imageUrl,
      },
    ];
  }

  if (website) {
    const targetUrl = website.startsWith("http") ? website : `https://${website}`;
    postPayload.callToAction = {
      actionType: "LEARN_MORE",
      url: targetUrl,
    };
  }

  console.log(`[PUBLISHER_GOOGLE] Enviando post (${postPayload.media?.[0]?.mediaFormat || "SEM_MIDIA"}) para ${googleName}...`);
  const apiResponse = await fetch(googleApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postPayload),
  });

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    console.error("[PUBLISHER_GOOGLE_ERROR]", errorText);
    let errorMessage = `Erro da API do Google Meu Negócio: ${apiResponse.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        if (errorJson.error.message === "Internal error encountered." || errorJson.error.status === "INTERNAL") {
          errorMessage = "O Google Meu Negócio rejeitou o arquivo da publicação (Internal Error). Se for um vídeo ou imagem, verifique se o tamanho (máx 100MB para vídeo / 10MB para foto) e a resolução cumprem os requisitos do Google Meu Negócio.";
        } else {
          errorMessage = errorJson.error.message;
        }
      }
    } catch (parseErr) {
      // Ignore
    }
    throw new Error(errorMessage);
  }

  const resultData = await apiResponse.json();
  return resultData.name;
}

/**
 * 4. LINKEDIN PUBLISHING
 */
export async function publishToLinkedIn(
  userId: string,
  text: string,
  imageUrl?: string
): Promise<string> {
  const connDoc = await adminDb
    .collection("users")
    .doc(userId)
    .collection("connections")
    .doc("linkedin")
    .get();

  if (!connDoc.exists) {
    throw new Error("A conta LinkedIn do usuário não está conectada.");
  }

  const connData = connDoc.data();
  const accessToken = connData?.accessToken;
  const personUrn = connData?.personUrn;
  const selectedOrganizationUrn = connData?.selectedOrganizationUrn;
  const publishTarget = connData?.publishTarget || "person";

  if (!accessToken) {
    throw new Error("Token de acesso do LinkedIn não encontrado.");
  }

  // A Community Management API (scope w_organization_social) só permite publicar
  // em páginas corporativas — nunca em perfis pessoais (isso exigiria w_member_social).
  // Portanto, sempre usamos selectedOrganizationUrn como owner.
  const owner = selectedOrganizationUrn;
  if (!owner) {
    throw new Error(
      "Nenhuma Página Corporativa do LinkedIn foi selecionada. Por favor, acesse Conexões, desconecte e reconecte o LinkedIn com uma conta que administre uma Página Corporativa."
    );
  }

  const linkedinVersion = "202607";
  let imageUrn: string | null = null;

  // Se houver uma imagem, faz o fluxo de upload
  if (imageUrl) {
    console.log(`[PUBLISHER_LINKEDIN] Iniciando upload de imagem para o LinkedIn: ${imageUrl}`);

    // 1. Baixar a imagem como buffer
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      throw new Error(`Falha ao baixar imagem do Storage: ${imgRes.statusText}`);
    }
    const imgBuffer = await imgRes.arrayBuffer();

    // 2. Inicializar upload no LinkedIn
    const registerUrl = "https://api.linkedin.com/rest/images?action=initializeUpload";
    const registerRes = await fetch(registerUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": linkedinVersion,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: owner,
        },
      }),
    });

    if (!registerRes.ok) {
      const errorText = await registerRes.text();
      console.error("[PUBLISHER_LINKEDIN_ERROR] Falha ao inicializar upload:", errorText);
      throw new Error(`LinkedIn initializeUpload failed: ${errorText}`);
    }

    const registerData = await registerRes.json();
    const uploadUrl = registerData.value?.uploadUrl;
    imageUrn = registerData.value?.image;

    if (!uploadUrl || !imageUrn) {
      throw new Error("URL de upload ou URN da imagem não retornados pelo LinkedIn.");
    }

    // 3. Fazer o PUT binário
    console.log("[PUBLISHER_LINKEDIN] Fazendo upload do binário da imagem para o LinkedIn...");
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "image/jpeg", // Aceito de forma genérica
      },
      body: imgBuffer,
    });

    if (!putRes.ok) {
      const errorText = await putRes.text();
      console.error("[PUBLISHER_LINKEDIN_ERROR] Falha no upload binário da imagem:", errorText);
      throw new Error(`LinkedIn image upload PUT failed: ${errorText}`);
    }
    console.log(`[PUBLISHER_LINKEDIN] Upload binário concluído com sucesso. URN: ${imageUrn}`);
  }

  // 4. Criar o Post
  const postsUrl = "https://api.linkedin.com/rest/posts";
  const postPayload: any = {
    author: owner,
    commentary: text,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  if (imageUrn) {
    postPayload.content = {
      media: {
        id: imageUrn,
      },
    };
  }

  console.log(`[PUBLISHER_LINKEDIN] Criando publicação no LinkedIn para o owner: ${owner}`);
  const postRes = await fetch(postsUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "LinkedIn-Version": linkedinVersion,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postPayload),
  });

  if (!postRes.ok) {
    const errorText = await postRes.text();
    console.error("[PUBLISHER_LINKEDIN_ERROR] Falha ao criar post:", errorText);
    throw new Error(`LinkedIn post creation failed: ${errorText}`);
  }

  const postUrn =
    postRes.headers.get("x-restli-id") ||
    postRes.headers.get("x-linkedin-id") ||
    (await postRes.json().catch(() => ({}))).id ||
    "linkedin_published_success";

  console.log(`[PUBLISHER_LINKEDIN_SUCCESS] Post publicado com sucesso! ID: ${postUrn}`);
  return postUrn;
}

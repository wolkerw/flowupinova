import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface PublishRequestBody {
  postData: {
    text: string;
    imageUrls: string[];
    isCarousel: boolean;
    accessToken: string;
    instagramId: string;
    collaborators?: string[];
    userTags?: { username: string; x: number; y: number }[];
  };
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
      if (data.error?.message?.toLowerCase().includes("invalid user id") || data.error?.message?.toLowerCase().includes("unknown error")) {
        return profile;
      }
    }
  }
  return null;
}

// 1. Create a media container for a single item (image or video)
async function createMediaItemContainer(
  instagramId: string,
  accessToken: string,
  imageUrl: string,
  isCarouselItem: boolean,
  caption?: string,
  collaborators?: string[],
  userTags?: { username: string; x: number; y: number }[]
): Promise<string> {
  const host = "https://graph.instagram.com";
  const url = `${host}/v20.0/${instagramId}/media`;

  const params = new URLSearchParams({
    image_url: imageUrl,
    access_token: accessToken,
  });

  if (isCarouselItem) {
    params.append("is_carousel_item", "true");
  }

  // Caption is only allowed for single media items, not for carousel children.
  if (!isCarouselItem && caption) {
    params.append("caption", caption);
  }

  // Collaborators can be added to the single media container
  if (!isCarouselItem && collaborators && collaborators.length > 0) {
    // The Graph API expects an array of strings representation with single quotes: ['user1','user2']
    const formattedCollaborators = `[${collaborators.map(c => `'${c}'`).join(',')}]`;
    params.append("collaborators", formattedCollaborators);
  }

  // User tags can be applied to single media items or carousel children
  if (userTags && userTags.length > 0) {
    params.append("user_tags", JSON.stringify(userTags));
  }

  const response = await fetch(`${url}?${params.toString()}`, { method: "POST" });
  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error(
      "[INSTAGRAM_V2_API_ERROR] Falha ao criar container de item de mídia:",
      data.error
    );
    let errorMessage = data.error?.message || "Falha ao criar o container de item de mídia no Instagram.";
    if (errorMessage.toLowerCase().includes("invalid user id") || errorMessage.toLowerCase().includes("unknown error")) {
      let exactInvalidProfile = null;
      let errorSource = "";

      if (collaborators?.length && (!userTags || userTags.length === 0)) {
         exactInvalidProfile = await findInvalidProfile(params, url, collaborators, "collaborators");
         errorSource = "Colaboradores";
      } 
      else if (userTags?.length && (!collaborators || collaborators.length === 0)) {
         exactInvalidProfile = await findInvalidProfile(params, url, userTags.map(t=>t.username), "user_tags");
         errorSource = "Marcações";
      } 
      else if (collaborators?.length && userTags?.length) {
         exactInvalidProfile = await findInvalidProfile(params, url, collaborators, "collaborators");
         if (exactInvalidProfile) {
            errorSource = "Colaboradores";
         } else {
            exactInvalidProfile = await findInvalidProfile(params, url, userTags.map(t=>t.username), "user_tags");
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

// 2. Create the main carousel container
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
    const formattedCollaborators = `[${collaborators.map(c => `'${c}'`).join(',')}]`;
    params.append("collaborators", formattedCollaborators);
  }

  const response = await fetch(`${url}?${params.toString()}`, { method: "POST" });
  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error("[INSTAGRAM_V2_API_ERROR] Falha ao criar o container do carrossel:", data.error);
    let errorMessage = data.error?.message || "Falha ao criar o container do carrossel no Instagram.";
    if (errorMessage.toLowerCase().includes("invalid user id") || errorMessage.toLowerCase().includes("unknown error")) {
      if (collaborators && collaborators.length > 0) {
        const exactInvalidProfile = await findInvalidProfile(params, url, collaborators, "collaborators");
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

// 3. Check container status
async function checkContainerStatus(containerId: string, accessToken: string): Promise<void> {
  const host = "https://graph.instagram.com";
  let attempts = 0;
  while (attempts < 12) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const statusUrl = `${host}/v20.0/${containerId}?fields=status_code&access_token=${accessToken}`;
    const statusResponse = await fetch(statusUrl);
    const statusData = await statusResponse.json();

    console.log(
      `[INSTAGRAM_V2_STATUS_CHECK] Attempt ${attempts + 1}: Container ${containerId} status is ${statusData.status_code}`
    );

    if (statusData.status_code === "FINISHED") return;
    if (statusData.status_code === "ERROR") {
      console.error("[INSTAGRAM_V2_API_ERROR] Falha no processamento do container:", statusData);
      throw new Error("O container de mídia falhou ao ser processado.");
    }
    attempts++;
  }
  throw new Error("Tempo de espera excedido para o processamento da mídia.");
}

// 4. Publish the container
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
    console.error("[INSTAGRAM_V2_API_ERROR] Falha ao publicar o container:", data.error);
    throw new Error(data.error?.message || "A API não retornou um ID de mídia publicado.");
  }
  return data.id;
}

export async function POST(request: NextRequest) {
  try {
    const { postData }: PublishRequestBody = await request.json();

    if (
      !postData ||
      !postData.instagramId ||
      !postData.accessToken ||
      !postData.imageUrls ||
      postData.imageUrls.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "Dados da requisição incompletos." },
        { status: 400 }
      );
    }

    const caption = postData.text.slice(0, 2200);
    let creationId: string;

    if (postData.isCarousel) {
      // Carousel Flow
      if (postData.imageUrls.length > 10) throw new Error("Carrosséis são limitados a 10 mídias.");

      // 1. Create individual item containers without caption
      const childContainerPromises = postData.imageUrls.map((url, index) =>
        createMediaItemContainer(
          postData.instagramId, 
          postData.accessToken, 
          url, 
          true,
          undefined,
          undefined,
          index === 0 ? postData.userTags : undefined
        )
      );
      const childContainerIds = await Promise.all(childContainerPromises);

      // 2. Create carousel parent container with caption
      creationId = await createCarouselContainer(
        postData.instagramId,
        postData.accessToken,
        childContainerIds,
        caption,
        postData.collaborators
      );
    } else {
      // Single Media Flow - create container with caption
      creationId = await createMediaItemContainer(
        postData.instagramId,
        postData.accessToken,
        postData.imageUrls[0],
        false,
        caption,
        postData.collaborators,
        postData.userTags
      );
    }

    // 3. Check status of the final container (single or carousel)
    await checkContainerStatus(creationId, postData.accessToken);

    // 4. Publish
    const publishedMediaId = await publishMediaContainer(
      postData.instagramId,
      postData.accessToken,
      creationId
    );

    console.log(
      `[INSTAGRAM_V2_PUBLISH_SUCCESS] Mídia publicada com sucesso. Post ID: ${publishedMediaId}`
    );
    return NextResponse.json({ success: true, publishedMediaId: publishedMediaId });
  } catch (error: any) {
    const errorMessage = `[INSTAGRAM_V2_PUBLISH_ERROR] Mensagem: ${error.message}.`;
    console.error(errorMessage, { cause: error.cause, stack: error.stack });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

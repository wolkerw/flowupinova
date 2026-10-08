import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const userDocRef = adminDb.collection("users").doc(authUser.uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const isApprover = Boolean(
      userData?.conciergeRole === "client_approver" ||
      userData?.plan === "client_approver" ||
      userData?.role === "client_approver" ||
      String(userData?.plan || "").toLowerCase() === "client_approver"
    );

    let targetWorkspaceId = userData?.linkedWorkspaceId || authUser.uid;

    // Se for aprovador mas não tiver linkedWorkspaceId gravado no seu doc, procura qual gestor o cadastrou
    if (isApprover && (!userData?.linkedWorkspaceId || targetWorkspaceId === authUser.uid)) {
      const normalizedEmail = (authUser.email || "").trim().toLowerCase();
      if (normalizedEmail) {
        const gestorSnap = await adminDb
          .collection("users")
          .where("clientApprover.approverEmail", "==", normalizedEmail)
          .limit(1)
          .get();

        if (!gestorSnap.empty) {
          targetWorkspaceId = gestorSnap.docs[0].id;
          // Auto-repara o documento do aprovador gravando o vínculo
          await userDocRef.set(
            {
              linkedWorkspaceId: targetWorkspaceId,
              conciergeRole: "client_approver",
              plan: "client_approver",
            },
            { merge: true }
          );
          console.log(
            `[CONCIERGE_POSTS] Vínculo auto-recuperado para aprovador ${authUser.uid} (${normalizedEmail}) -> workspace ${targetWorkspaceId}`
          );
        }
      }
    }

    // 1. Busca galeria de mídia do workspace para permitir restaurar legendas de artes editadas
    let gallerySnap: any = null;
    try {
      gallerySnap = await adminDb
        .collection("users")
        .doc(targetWorkspaceId)
        .collection("mediaGallery")
        .get();
    } catch (e) {
      // Coleção de galeria opcional caso não mockada
    }

    const galleryByUrl = new Map<string, any>();
    if (gallerySnap && typeof gallerySnap.forEach === "function") {
      gallerySnap.forEach((gDoc: any) => {
        const gData = typeof gDoc.data === "function" ? gDoc.data() : gDoc;
        if (gData?.url) galleryByUrl.set(gData.url, gData);
      });
    } else if (Array.isArray(gallerySnap)) {
      gallerySnap.forEach((gDoc: any) => {
        const gData = typeof gDoc.data === "function" ? gDoc.data() : gDoc;
        if (gData?.url) galleryByUrl.set(gData.url, gData);
      });
    }

    const isTechnicalInstruction = (txt: any): boolean => {
      if (!txt || typeof txt !== "string") return false;
      const s = txt.toLowerCase();
      return (
        s.includes("área selecionada") ||
        s.includes("remova e apague") ||
        s.includes("altere o título") ||
        s.includes("atualize o texto") ||
        s.includes("altere o valor") ||
        s.includes("ajuste os tons") ||
        s.includes("substitua o conteúdo atual") ||
        s.includes("inpainting") ||
        s.includes("topo / parte superior") ||
        s.includes("base / rodapé") ||
        s.includes("lado esquerdo") ||
        s.includes("lado direito") ||
        s.includes("preencha o espaço de forma natural") ||
        (s.includes("largura,") && s.includes("altura)"))
      );
    };

    // 2. Busca os posts do workspace alvo
    const postsSnap: any = await adminDb
      .collection("users")
      .doc(targetWorkspaceId)
      .collection("posts")
      .get();

    const postDocs: any[] = [];
    if (postsSnap && typeof postsSnap.forEach === "function") {
      postsSnap.forEach((doc: any) => postDocs.push(doc));
    } else if (Array.isArray(postsSnap)) {
      postDocs.push(...postsSnap);
    } else if (postsSnap?.docs && Array.isArray(postsSnap.docs)) {
      postDocs.push(...postsSnap.docs);
    }

    const posts: any[] = [];
    for (const doc of postDocs) {
      const data = typeof doc.data === "function" ? doc.data() : doc;
      let text = data.text || data.caption || "";
      let caption = data.caption || data.text || "";

      // Se for instrução técnica, substitui pela legenda do post original ou deixa em branco ("")
      if (isTechnicalInstruction(text) || isTechnicalInstruction(caption)) {
        let originalCaption = "";
        const postImgUrl = data.imageUrl || (Array.isArray(data.imageUrls) ? data.imageUrls[0] : null);

        if (postImgUrl) {
          const mediaItem = galleryByUrl.get(postImgUrl);
          const origUrl = mediaItem?.originalUrl;
          if (origUrl) {
            const origMedia = galleryByUrl.get(origUrl);
            const candidate = origMedia?.caption || "";
            if (candidate && !isTechnicalInstruction(candidate)) {
              originalCaption = candidate;
            }
          } else if (mediaItem?.caption && !isTechnicalInstruction(mediaItem.caption)) {
            originalCaption = mediaItem.caption;
          }
        }

        text = originalCaption;
        caption = originalCaption;

        // Auto-repara o post no Firestore para remover a instrução técnica definitivamente
        if (doc.ref && typeof doc.ref.update === "function") {
          doc.ref.update({
            text: originalCaption,
            caption: originalCaption,
          }).catch((err: any) => console.warn("[CONCIERGE_POSTS] Erro ao limpar instrução técnica do post:", err));
        }
      }

      posts.push({
        ...data,
        id: doc.id,
        text,
        caption,
        // Serializa datas e Timestamps para transporte JSON seguro
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        scheduledAt: data.scheduledAt?.toDate ? data.scheduledAt.toDate().toISOString() : data.scheduledAt,
      });
    }

    // Ordena por data agendada ou criação
    posts.sort((a, b) => {
      const timeA = new Date(a.scheduledAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.scheduledAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      posts,
      targetWorkspaceId,
      isApprover,
    });
  } catch (error: any) {
    console.error("[CONCIERGE_POSTS_GET] Erro:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar postagens do workspace." },
      { status: 500 }
    );
  }
}

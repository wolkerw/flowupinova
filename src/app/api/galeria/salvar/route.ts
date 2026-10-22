import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { admin, adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    let userId = authUser?.uid;

    let file: File | null = null;
    let fileBase64: string | null = null;
    let publicUrl: string | null = null;
    let caption: string | null = null;
    let source: string = "manual_editor";
    let mediaType: "image" | "video" = "image";
    let fileName: string = "";

    const contentTypeHeader = request.headers.get("content-type") || "";

    if (contentTypeHeader.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      userId = body.userId || userId;
      fileBase64 = body.fileBase64 || body.imageBase64 || null;
      publicUrl = body.publicUrl || null;
      caption = body.caption || null;
      source = body.source || "manual_editor";
      const rawType = body.type || "image";
      mediaType = rawType === "video" ? "video" : "image";
      fileName = body.fileName || "";
    } else {
      try {
        const formData = await request.formData();
        userId = (formData.get("userId") as string) || userId;
        file = formData.get("file") as File | null;
        fileBase64 = (formData.get("fileBase64") as string) || null;
        publicUrl = (formData.get("publicUrl") as string) || null;
        caption = (formData.get("caption") as string) || null;
        source = (formData.get("source") as string) || "manual_editor";
        const rawType = (formData.get("type") as string) || "image";
        mediaType = rawType === "video" ? "video" : "image";
        fileName = (formData.get("fileName") as string) || "";
      } catch {
        const body = await request.json().catch(() => ({}));
        userId = body.userId || userId;
        fileBase64 = body.fileBase64 || body.imageBase64 || null;
        publicUrl = body.publicUrl || null;
        caption = body.caption || null;
        source = body.source || "manual_editor";
        const rawType = body.type || "image";
        mediaType = rawType === "video" ? "video" : "image";
        fileName = body.fileName || "";
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado ou userId ausente." },
        { status: 401 }
      );
    }

    let finalUrl = publicUrl || "";
    let storagePath = "";
    const isVideo = mediaType === "video";
    const extension = isVideo ? "mp4" : "jpg";
    const defaultMimeType = isVideo ? "video/mp4" : "image/jpeg";
    const safeName = (fileName || `arte_${Date.now()}.${extension}`).replace(/[^a-zA-Z0-9._-]/g, "_");

    const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || "studio-7502195980-3983c";
    const bucket = admin.storage().bucket(`${firebaseProjectId}.firebasestorage.app`);

    // 1. Processamento a partir de File (Multipart)
    if (file && (file instanceof Blob || typeof (file as any).arrayBuffer === "function")) {
      let buffer: Buffer;
      if (typeof file.arrayBuffer === "function") {
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else if (typeof (file as any).text === "function") {
        const text = await (file as any).text();
        buffer = Buffer.from(text);
      } else {
        buffer = Buffer.from([]);
      }
      const mime = file.type || defaultMimeType;
      const downloadToken = crypto.randomUUID();
      storagePath = `users/${userId}/mediaGallery/${Date.now()}_${safeName}`;
      const fileRef = bucket.file(storagePath);

      await fileRef.save(buffer, {
        metadata: {
          contentType: mime,
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            userId,
            source,
          },
        },
      });

      finalUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
        fileRef.name
      )}?alt=media&token=${downloadToken}`;
    }
    // 2. Processamento a partir de Base64
    else if (fileBase64 && fileBase64.length > 0) {
      const pureBase64 = fileBase64.replace(/^data:(image|video)\/\w+;base64,/, "");
      const buffer = Buffer.from(pureBase64, "base64");
      const downloadToken = crypto.randomUUID();
      storagePath = `users/${userId}/mediaGallery/${Date.now()}_${safeName}`;
      const fileRef = bucket.file(storagePath);

      await fileRef.save(buffer, {
        metadata: {
          contentType: defaultMimeType,
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            userId,
            source,
          },
        },
      });

      finalUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
        fileRef.name
      )}?alt=media&token=${downloadToken}`;
    }
    // 3. Processamento a partir de data: URL
    else if (finalUrl.startsWith("data:")) {
      const pureBase64 = finalUrl.replace(/^data:(image|video)\/\w+;base64,/, "");
      const buffer = Buffer.from(pureBase64, "base64");
      const downloadToken = crypto.randomUUID();
      storagePath = `users/${userId}/mediaGallery/${Date.now()}_${safeName}`;
      const fileRef = bucket.file(storagePath);

      await fileRef.save(buffer, {
        metadata: {
          contentType: defaultMimeType,
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            userId,
            source,
          },
        },
      });

      finalUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
        fileRef.name
      )}?alt=media&token=${downloadToken}`;
    }

    if (!finalUrl) {
      return NextResponse.json(
        { success: false, error: "Nenhum arquivo ou URL válida foi fornecida para salvar na galeria." },
        { status: 400 }
      );
    }

    // Gravar o documento na subcoleção mediaGallery usando o Firestore Admin
    const docData = {
      url: finalUrl,
      storagePath: storagePath || "",
      source: source || "manual_editor",
      prompt: caption || null,
      caption: caption || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      usedInPostId: null,
      fileName: safeName,
      type: isVideo ? "video" : "image",
      isPublished: false,
    };

    const docRef = await adminDb
      .collection("users")
      .doc(userId)
      .collection("mediaGallery")
      .add(docData);

    return NextResponse.json({
      success: true,
      galleryId: docRef.id,
      url: finalUrl,
    });
  } catch (error: any) {
    console.error("[API_GALERIA_SALVAR_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Erro interno ao salvar mídia na galeria.",
      },
      { status: 500 }
    );
  }
}

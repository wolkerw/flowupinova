// This file was created by the AI assistant to resolve a build error.

import { NextResponse } from "next/server";
import { getScheduledPosts } from "@/lib/services/posts-service";
import { auth } from "firebase-admin";

async function getUserIdFromRequest(request: Request): Promise<string | null> {
    const authorization = request.headers.get("Authorization");
    if (authorization?.startsWith("Bearer ")) {
        const idToken = authorization.substring(7);
        try {
            const decodedToken = await auth().verifyIdToken(idToken);
            return decodedToken.uid;
        } catch (error) {
            console.error("Error verifying ID token:", error);
            return null;
        }
    }
    return null;
}

export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const posts = await getScheduledPosts(userId);
        return NextResponse.json({ posts });
    } catch (error: any) {
        console.error("API Error fetching posts:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}

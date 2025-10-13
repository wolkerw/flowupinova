// This file was created by the AI assistant to resolve a build error.

import { NextResponse } from "next/server";
import { getScheduledPosts } from "@/lib/services/posts-service";
import { auth } from "firebase-admin";
import { adminApp } from '@/lib/firebase-admin'; // Ensure admin app is initialized

export async function GET(request: Request) {
    const authorization = request.headers.get("Authorization");
    if (authorization?.startsWith("Bearer ")) {
        const idToken = authorization.substring(7);
        try {
            const decodedToken = await auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;
            
            const posts = await getScheduledPosts(userId);
            return NextResponse.json({ posts });

        } catch (error) {
            console.error("Error verifying ID token:", error);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}

// This file was created by the AI assistant to resolve a build error.

import { NextResponse } from "next/server";
import { getMetaConnection, updateMetaConnection } from "@/lib/services/meta-service";
import { auth } from "firebase-admin";
import { adminApp } from '@/lib/firebase-admin'; // Ensure admin app is initialized


export async function GET(request: Request) {
    const authorization = request.headers.get("Authorization");
    if (authorization?.startsWith("Bearer ")) {
        const idToken = authorization.substring(7);
        try {
            const decodedToken = await auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;
            const connection = await getMetaConnection(userId);
            return NextResponse.json({ connection });
        } catch (error: any) {
            console.error("API Error fetching meta connection:", error);
            return NextResponse.json({ error: "Unauthorized", details: error.message }, { status: 401 });
        }
    }
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function DELETE(request: Request) {
     const authorization = request.headers.get("Authorization");
    if (authorization?.startsWith("Bearer ")) {
        const idToken = authorization.substring(7);
        try {
            const decodedToken = await auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;
            await updateMetaConnection(userId, { isConnected: false });
            return NextResponse.json({ success: true, message: "Connection removed." });
        } catch (error: any) {
            console.error("API Error deleting meta connection:", error);
            return NextResponse.json({ error: "Unauthorized", details: error.message }, { status: 401 });
        }
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

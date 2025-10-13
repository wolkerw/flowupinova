// This file was created by the AI assistant to resolve a build error.

import { NextResponse } from "next/server";
import { getBusinessProfile, updateBusinessProfile } from "@/lib/services/business-profile-service";
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

        const profile = await getBusinessProfile(userId);
        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }
        return NextResponse.json(profile);

    } catch (error: any) {
        console.error("API Error fetching business profile:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
     try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const data = await request.json();
        await updateBusinessProfile(userId, data);
        return NextResponse.json({ success: true, message: "Profile updated." });

    } catch (error: any) {
        console.error("API Error updating business profile:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}

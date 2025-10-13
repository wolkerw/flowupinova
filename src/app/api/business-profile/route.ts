// This file was created by the AI assistant to resolve a build error.

import { NextResponse } from "next/server";
import { getBusinessProfile, updateBusinessProfile } from "@/lib/services/business-profile-service";
import { auth } from "firebase-admin";
import { adminApp } from '@/lib/firebase-admin'; // Ensure admin app is initialized


export async function GET(request: Request) {
    const authorization = request.headers.get("Authorization");
    if (authorization?.startsWith("Bearer ")) {
        const idToken = authorization.substring(7);
        try {
            const decodedToken = await auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;

            const profile = await getBusinessProfile(userId);
            if (!profile) {
                return NextResponse.json({ error: "Profile not found" }, { status: 404 });
            }
            return NextResponse.json(profile);

        } catch (error: any) {
            console.error("API Error fetching business profile:", error);
            return NextResponse.json({ error: "Unauthorized", details: error.message }, { status: 401 });
        }
    }
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
     const authorization = request.headers.get("Authorization");
    if (authorization?.startsWith("Bearer ")) {
        const idToken = authorization.substring(7);
        try {
            const decodedToken = await auth().verifyIdToken(idToken);
            const userId = decodedToken.uid;
        
            const data = await request.json();
            await updateBusinessProfile(userId, data);
            return NextResponse.json({ success: true, message: "Profile updated." });

        } catch (error: any) {
            console.error("API Error updating business profile:", error);
            return NextResponse.json({ error: "Unauthorized", details: error.message }, { status: 401 });
        }
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

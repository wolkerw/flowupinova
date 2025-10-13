import { adminDb } from "@/lib/firebase-admin";

export interface BusinessProfileData {
    name: string;
    category: string;
    address: string;
    phone: string;
    website: string;
    description: string;
    rating: number;
    totalReviews: number;
    isVerified: boolean;
}

const defaultProfile: BusinessProfileData = {
    name: "Minha Empresa",
    category: "Consultoria de Marketing",
    address: "Seu Endereço",
    phone: "(00) 00000-0000",
    website: "www.suaempresa.com.br",
    description: "Descreva sua empresa aqui.",
    rating: 0,
    totalReviews: 0,
    isVerified: false
};

function getProfileDocRef(userId: string) {
    return adminDb.collection("users").doc(userId).collection("business").doc("profile");
}

export async function getBusinessProfile(userId: string): Promise<BusinessProfileData | null> {
    if (!userId) {
        console.error("getBusinessProfile called without userId.");
        return null;
    }
    try {
        const profileDocRef = getProfileDocRef(userId);
        const docSnap = await profileDocRef.get();

        if (docSnap.exists) {
            return docSnap.data() as BusinessProfileData;
        } else {
            // Document doesn't exist, so create it with default data for this user
            await profileDocRef.set(defaultProfile);
            console.log(`Profile document created with default data for user ${userId}.`);
            return defaultProfile;
        }
    } catch (error) {
        console.error(`Error getting business profile for user ${userId}:`, error);
        return null;
    }
}

export async function updateBusinessProfile(userId: string, data: Partial<BusinessProfileData>): Promise<void> {
    if (!userId) {
        console.error("updateBusinessProfile called without userId.");
        return;
    }
    try {
        const profileDocRef = getProfileDocRef(userId);
        // Use set with merge to create or update
        await profileDocRef.set(data, { merge: true });
        console.log(`Business profile updated successfully for user ${userId}.`);
    } catch (error) {
        console.error(`Error updating business profile for user ${userId}:`, error);
    }
}

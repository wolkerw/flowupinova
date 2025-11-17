
"use server";

import { adminDb } from "@/lib/firebase-admin";
import type { BusinessProfileData, LogoData } from "./business-profile-service";

const defaultLogo: LogoData = {
    url: "",
    width: 0,
    height: 0,
};

const defaultProfile: BusinessProfileData = {
  name: "Minha Empresa",
  category: "Consultoria de Marketing",
  address: "Seu Endereço",
  phone: "(00) 00000-0000",
  website: "www.suaempresa.com.br",
  description: "Descreva sua empresa aqui.",
  brandSummary: "",
  logo: defaultLogo,
  rating: 0,
  totalReviews: 0,
  isVerified: false,
  googleName: "",
};


/**
 * Fetches the business profile using the admin SDK. Can be called from server components.
 * @param userId - The UID of the user.
 * @returns The user's business profile data.
 */
export async function getBusinessProfileAdmin(userId: string): Promise<BusinessProfileData> {
    if (!userId) {
        console.error("getBusinessProfileAdmin called without userId.");
        return defaultProfile;
    }
    try {
        const profileDocRef = adminDb.collection('users').doc(userId).collection('business').doc('profile');
        const docSnap = await profileDocRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            // Handle migration from old structure
            if (data?.logoUrl !== undefined) {
                const migratedProfile: any = { // Use any to allow deletion
                    ...defaultProfile,
                    ...data,
                    logo: {
                        url: data.logoUrl || "",
                        width: data.logoWidth || 0,
                        height: data.logoHeight || 0
                    }
                };
                delete migratedProfile.logoUrl;
                delete migratedProfile.logoWidth;
                delete migratedProfile.logoHeight;
                // Save the migrated structure back
                await profileDocRef.set(migratedProfile);
                return migratedProfile;
            }
            return { ...defaultProfile, ...data, logo: { ...defaultLogo, ...data?.logo } };
        } else {
            // Document doesn't exist, create it.
            const userDocRef = adminDb.collection('users').doc(userId);
            // Ensure user document exists before creating subcollection.
            await userDocRef.set({ createdAt: new Date() }, { merge: true });
            await profileDocRef.set(defaultProfile);
            return defaultProfile;
        }
    } catch (error) {
        console.error(`Error getting business profile for user ${userId} in admin service:`, error);
        return defaultProfile;
    }
}


/**
 * Updates the business profile using the admin SDK. Can be called from server-side logic.
 * @param userId The UID of the user.
 * @param data The data to set for the profile.
 */
export async function updateBusinessProfileAdmin(userId: string, data: Partial<BusinessProfileData>): Promise<void> {
    if (!userId) {
        throw new Error("User ID is required to update Business Profile.");
    }
    try {
        const profileDocRef = adminDb.collection('users').doc(userId).collection('business').doc('profile');
        await profileDocRef.set(data, { merge: true });
        console.log(`Admin update for business profile of user ${userId} was successful.`);
    } catch (error: any) {
        console.error(`Error updating business profile for user ${userId} via admin:`, error);
        throw new Error(`Failed to update business profile via admin. Reason: ${error.message}`);
    }
}

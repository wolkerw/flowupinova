
"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface LogoData {
    url: string;
    width: number;
    height: number;
}

export interface BusinessProfileData {
    name: string;
    category: string;
    address: string;
    phone: string;
    website: string;
    description: string;
    logo: LogoData;
    rating: number;
    totalReviews: number;
    isVerified: boolean;
    googleName?: string; // Formato: locations/{locationId}
}

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
    logo: defaultLogo,
    rating: 0,
    totalReviews: 0,
    isVerified: false,
    googleName: "",
};

function getProfileDocRef(userId: string) {
    return doc(db, `users/${userId}/business/profile`);
}

export async function getBusinessProfile(userId: string): Promise<BusinessProfileData> {
    if (!userId) {
        console.error("getBusinessProfile called without userId.");
        return defaultProfile;
    }
    try {
        const profileDocRef = getProfileDocRef(userId);
        const docSnap = await getDoc(profileDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as any; // Read as 'any' to handle migration
            let needsUpdate = false;
            const finalProfile: BusinessProfileData = { ...defaultProfile, ...data };
            
            // Migration from old structure (logoUrl, logoWidth) to new (logo object)
            if (data.logoUrl !== undefined || data.logoWidth !== undefined) {
                finalProfile.logo = {
                    url: data.logoUrl || "",
                    width: data.logoWidth || 0,
                    height: data.logoHeight || 0,
                };
                // Unset the old fields
                delete (finalProfile as any).logoUrl;
                delete (finalProfile as any).logoWidth;
                delete (finalProfile as any).logoHeight;
                needsUpdate = true;
            }

             if (!data.googleName) {
                finalProfile.googleName = "";
             }


            if (needsUpdate) {
                await setDoc(profileDocRef, finalProfile);
                return finalProfile;
            }
            
            return finalProfile;
        } else {
            await setDoc(doc(db, "users", userId), { createdAt: new Date() }, { merge: true });
            await setDoc(profileDocRef, defaultProfile);
            console.log(`Profile document created with default data for user ${userId}.`);
            return defaultProfile;
        }
    } catch (error) {
        console.error(`Error getting business profile for user ${userId}:`, error);
        return defaultProfile;
    }
}

export async function updateBusinessProfile(userId: string, data: Partial<BusinessProfileData>): Promise<void> {
    if (!userId) {
        console.error("updateBusinessProfile called without userId.");
        return;
    }
    try {
        const profileDocRef = getProfileDocRef(userId);
        await setDoc(profileDocRef, data, { merge: true });
        console.log(`Business profile updated successfully for user ${userId}.`);
    } catch (error) {
        console.error(`Error updating business profile for user ${userId}:`, error);
    }
}

export async function resetBusinessProfile(userId: string): Promise<void> {
    if (!userId) {
        throw new Error("UserID é necessário para resetar o perfil de negócio.");
    }
    try {
        const profileDocRef = getProfileDocRef(userId);
        await setDoc(profileDocRef, defaultProfile);
        console.log(`Business profile reset for user ${userId}.`);
    } catch (error: any) {
        console.error(`Error resetting business profile for user ${userId}:`, error);
        throw new Error("Não foi possível resetar o perfil de negócio.");
    }
}

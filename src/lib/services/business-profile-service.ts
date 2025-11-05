
"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface BusinessProfileData {
    name: string;
    category: string;
    address: string;
    phone: string;
    website: string;
    description: string;
    brandSummary: string; // Novo campo para o resumo da marca
    logoUrl?: string; // Campo para a logomarca
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
    brandSummary: "Descreva a identidade da sua marca, incluindo cores, tom de voz e público-alvo.", // Valor padrão
    logoUrl: "",
    rating: 0,
    totalReviews: 0,
    isVerified: false
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
            const data = docSnap.data();
            let needsUpdate = false;
            const updatedData: Partial<BusinessProfileData> = {};

            if (!data.brandSummary) {
                updatedData.brandSummary = defaultProfile.brandSummary;
                needsUpdate = true;
            }

            if (data.logoUrl === undefined) {
                updatedData.logoUrl = defaultProfile.logoUrl;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await setDoc(profileDocRef, updatedData, { merge: true });
                return { ...defaultProfile, ...data, ...updatedData } as BusinessProfileData;
            }
            
            return { ...defaultProfile, ...data } as BusinessProfileData;
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

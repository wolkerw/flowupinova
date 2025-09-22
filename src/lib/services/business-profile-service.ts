
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

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

const profileDocRef = doc(db, "business", "profile");

const defaultProfile: BusinessProfileData = {
    name: "Minha Empresa",
    category: "Consultoria em Marketing",
    address: "Rua das Flores, 123 - São Paulo, SP",
    phone: "(11) 99999-9999",
    website: "www.minhaempresa.com",
    description: "Especialistas em marketing digital e estratégias de crescimento para pequenas e médias empresas.",
    rating: 4.8,
    totalReviews: 47,
    isVerified: true
};

export async function getBusinessProfile(): Promise<BusinessProfileData | null> {
    try {
        const docSnap = await getDoc(profileDocRef);

        if (docSnap.exists()) {
            return docSnap.data() as BusinessProfileData;
        } else {
            // Document doesn't exist, so create it with default data
            await setDoc(profileDocRef, defaultProfile);
            console.log("Profile document created with default data.");
            return defaultProfile;
        }
    } catch (error) {
        console.error("Error getting business profile:", error);
        return null;
    }
}

export async function updateBusinessProfile(data: Partial<BusinessProfileData>): Promise<void> {
    try {
        await updateDoc(profileDocRef, data);
        console.log("Business profile updated successfully.");
    } catch (error) {
        console.error("Error updating business profile:", error);
    }
}

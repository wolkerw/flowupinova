"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface OnboardingLogoData {
  url: string;
  width: number;
  height: number;
}

export interface OnboardingProfileData {
  name: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  instagram: string;
  description: string;
  logo: OnboardingLogoData;
  primaryColor?: string;
  secondaryColor?: string;
  onboardingCompleted?: boolean;
  slogan?: string;
  targetAudience?: string;
  toneOfVoice?: string;
  mainBenefits?: string[];
  cnpj?: string;
  cnpjLocked?: boolean;
  hasPendingCnpjRequest?: boolean;
  logos?: {
    horizontal?: OnboardingLogoData;
    vertical?: OnboardingLogoData;
    symbol?: OnboardingLogoData;
    avatar?: OnboardingLogoData;
  };
  brandKit?: {
    primaryColor?: string;
    secondaryColor?: string;
    visualGuidelines?: string;
    pdfManualPath?: string;
    pdfUploadedAt?: any;
    [key: string]: any;
  };
}

const defaultLogo: OnboardingLogoData = {
  url: "",
  width: 0,
  height: 0,
};

const defaultOnboardingProfile: OnboardingProfileData = {
  name: "",
  category: "",
  address: "",
  phone: "",
  website: "",
  instagram: "",
  description: "",
  logo: defaultLogo,
  primaryColor: "#3b82f6",
  secondaryColor: "#1e293b",
  onboardingCompleted: false,
  slogan: "",
  targetAudience: "",
  toneOfVoice: "",
  mainBenefits: [],
  cnpj: "",
  cnpjLocked: false,
  hasPendingCnpjRequest: false,
  logos: {
    horizontal: { url: "", width: 0, height: 0 },
    vertical: { url: "", width: 0, height: 0 },
    symbol: { url: "", width: 0, height: 0 },
    avatar: { url: "", width: 0, height: 0 },
  },
  brandKit: {
    primaryColor: "#3b82f6",
    secondaryColor: "#1e293b",
    visualGuidelines: "",
    pdfManualPath: "",
    pdfUploadedAt: null,
  },
};

function getOnboardingDocRef(userId: string) {
  return doc(db, `users/${userId}/business/onboarding`);
}

/**
 * Recupera o perfil de onboarding e Brand Kit do lojista no Firestore.
 * Se o documento não existir, cria um novo registro com valores padrão.
 * @param userId ID do usuário no Firebase Auth
 */
export async function getOnboardingProfile(userId: string): Promise<OnboardingProfileData> {
  if (!userId) {
    console.error("getOnboardingProfile chamado sem userId.");
    return defaultOnboardingProfile;
  }
  try {
    const docRef = getOnboardingDocRef(userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...defaultOnboardingProfile,
        ...data,
        logo: { ...defaultLogo, ...data?.logo },
        logos: {
          horizontal: { ...defaultLogo, ...data?.logos?.horizontal },
          vertical: { ...defaultLogo, ...data?.logos?.vertical },
          symbol: { ...defaultLogo, ...data?.logos?.symbol },
          avatar: { ...defaultLogo, ...data?.logos?.avatar },
        },
        brandKit: {
          ...defaultOnboardingProfile.brandKit,
          ...data?.brandKit,
        },
      } as OnboardingProfileData;
    } else {
      // Cria o documento com os valores iniciais de onboarding
      await setDoc(doc(db, "users", userId), { createdAt: new Date() }, { merge: true });
      await setDoc(docRef, defaultOnboardingProfile);
      console.log(`Documento de onboarding inicial criado para o usuário ${userId}.`);
      return defaultOnboardingProfile;
    }
  } catch (error) {
    console.error(`Erro ao obter perfil de onboarding para o usuário ${userId}:`, error);
    return defaultOnboardingProfile;
  }
}

/**
 * Atualiza os campos do perfil de onboarding e Brand Kit no Firestore.
 * @param userId ID do usuário no Firebase Auth
 * @param data Dados parciais a serem salvos
 */
export async function updateOnboardingProfile(
  userId: string,
  data: Partial<OnboardingProfileData>,
  options?: { merge?: boolean }
): Promise<void> {
  if (!userId) {
    throw new Error("UserID é necessário para atualizar o perfil de onboarding.");
  }
  try {
    const docRef = getOnboardingDocRef(userId);
    const merge = options?.merge !== false;
    await setDoc(docRef, data, { merge });
    console.log(`Perfil de onboarding atualizado com sucesso para o usuário ${userId}.`);
  } catch (error) {
    console.error(`Erro ao atualizar perfil de onboarding para o usuário ${userId}:`, error);
    throw new Error("Não foi possível atualizar o perfil de onboarding.");
  }
}

/**
 * Reseta o documento de onboarding do usuário de volta para o estado em branco padrão.
 * @param userId ID do usuário no Firebase Auth
 */
export async function resetOnboardingProfile(userId: string): Promise<void> {
  if (!userId) {
    throw new Error("UserID é necessário para resetar o perfil de onboarding.");
  }
  try {
    const docRef = getOnboardingDocRef(userId);
    await setDoc(docRef, defaultOnboardingProfile);
    console.log(`Perfil de onboarding resetado para o usuário ${userId}.`);
  } catch (error) {
    console.error(`Erro ao resetar perfil de onboarding para o usuário ${userId}:`, error);
    throw new Error("Não foi possível resetar o perfil de onboarding.");
  }
}

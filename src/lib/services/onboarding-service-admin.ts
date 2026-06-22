"use server";

import { adminDb } from "@/lib/firebase-admin";
import type { OnboardingProfileData, OnboardingLogoData } from "./onboarding-service";

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
};

/**
 * Busca as configurações de onboarding usando o Firebase Admin SDK (Server Components).
 * @param userId - O ID do usuário.
 */
export async function getOnboardingProfileAdmin(
  userId: string | null
): Promise<OnboardingProfileData> {
  if (!userId) {
    console.warn("getOnboardingProfileAdmin chamado sem userId.");
    return defaultOnboardingProfile;
  }
  try {
    const onboardingDocRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("business")
      .doc("onboarding");
    const docSnap = await onboardingDocRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        ...defaultOnboardingProfile,
        ...data,
        logo: { ...defaultLogo, ...data?.logo },
      } as OnboardingProfileData;
    } else {
      const userDocRef = adminDb.collection("users").doc(userId);
      await userDocRef.set({ createdAt: new Date() }, { merge: true });
      await onboardingDocRef.set(defaultOnboardingProfile);
      return defaultOnboardingProfile;
    }
  } catch (error) {
    console.error(`Erro ao obter onboarding para o usuário ${userId} via Admin SDK:`, error);
    return defaultOnboardingProfile;
  }
}

/**
 * Atualiza o perfil de onboarding usando o Firebase Admin SDK (Server Components).
 * @param userId O ID do usuário.
 * @param data Os dados parciais a serem salvos.
 */
export async function updateOnboardingProfileAdmin(
  userId: string,
  data: Partial<OnboardingProfileData>
): Promise<void> {
  if (!userId) {
    throw new Error("UserID é necessário para atualizar o perfil de onboarding via Admin SDK.");
  }
  try {
    const onboardingDocRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("business")
      .doc("onboarding");
    await onboardingDocRef.set(data, { merge: true });
    console.log(
      `Atualização do onboarding para o usuário ${userId} via Admin SDK concluída com sucesso.`
    );
  } catch (error: any) {
    console.error(`Erro ao atualizar o onboarding para o usuário ${userId} via Admin SDK:`, error);
    throw new Error(`Falha ao atualizar o onboarding via Admin SDK: ${error.message}`);
  }
}

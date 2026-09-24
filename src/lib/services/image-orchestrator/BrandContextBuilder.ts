import { adminDb } from "@/lib/firebase-admin";
import type { BrandSnapshot } from "@/lib/types/ai-image-general";
import type { BrandContext } from "./types";
import fs from "fs";
import path from "path";

export class BrandContextBuilder {
  public static async build(
    userId: string,
    useBrandKit: boolean,
    cachedSnapshot?: BrandSnapshot | null
  ): Promise<BrandContext> {
    if (!useBrandKit) {
      return {
        enabled: false,
        businessName: "",
        primaryColors: [],
        secondaryColors: [],
        accentColors: [],
        restrictions: [],
        hasLocalOfficialLogo: false,
      };
    }

    let snapshot = cachedSnapshot;
    if (!snapshot) {
      try {
        const [onboardingDoc, profileDoc] = await Promise.all([
          adminDb.doc(`users/${userId}/business/onboarding`).get(),
          adminDb.doc(`users/${userId}/business/profile`).get(),
        ]);
        const data = {
          ...(profileDoc.exists ? profileDoc.data() : {}),
          ...(onboardingDoc.exists ? onboardingDoc.data() : {}),
        };
        const bk = data?.brandKit || {};
        snapshot = {
          name: data?.name || bk?.name || "Empresa",
          segment: data?.segment || data?.category || bk?.segment || "",
          primaryColor: data?.primaryColor || bk?.primaryColor || "#0083C7",
          secondaryColor: data?.secondaryColor || bk?.secondaryColor || "#FA6305",
          visualGuidelines: bk?.visualGuidelines || data?.visualGuidelines || "",
          logoUrl: bk?.logoUrl || data?.logo?.url || (typeof data?.logo === "string" ? data.logo : ""),
          targetAudience: data?.targetAudience || bk?.targetAudience || "",
          toneOfVoice: data?.toneOfVoice || bk?.toneOfVoice || "",
          slogan: data?.slogan || bk?.slogan || "",
          personas: bk?.personas || data?.personas || [],
        };
      } catch (err) {
        console.warn("[BrandContextBuilder] Erro ao carregar brand snapshot:", err);
      }
    }

    const businessName = snapshot?.name || "NumVapt";
    const primaryColor = snapshot?.primaryColor || "#0083C7";
    const secondaryColor = snapshot?.secondaryColor || "#FA6305";

    // Checar se existe arquivo local da logo oficial NumVapt
    let hasLocalOfficialLogo = false;
    try {
      const localLogoPath = path.join(process.cwd(), "public", "logo-numvapt.png");
      hasLocalOfficialLogo = fs.existsSync(localLogoPath);
    } catch {
      hasLocalOfficialLogo = false;
    }

    return {
      enabled: true,
      businessName,
      segment: snapshot?.segment || "Tecnologia e Serviços",
      description: snapshot?.slogan || "",
      audience: snapshot?.targetAudience || "Público geral, empreendedores e empresas",
      primaryColors: [primaryColor],
      secondaryColors: [secondaryColor],
      accentColors: ["#FFFFFF", "#1E293B"],
      visualStyle: snapshot?.visualGuidelines || "Moderno, limpo, confiável, corporativo e tecnológico",
      toneOfVoice: snapshot?.toneOfVoice || "Profissional, acessível e inspirador",
      restrictions: [
        "Não utilizar logotipos concorrentes ou marcas não autorizadas.",
        "Não inventar logotipos alternativos (como foguetes ou caricaturas aleatórias).",
        "Preservar contraste legível em relação ao fundo.",
      ],
      logoUrl: snapshot?.logoUrl || undefined,
      hasLocalOfficialLogo,
    };
  }
}

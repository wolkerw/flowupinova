import { getUidFromCookie } from "@/lib/firebase-admin";
import { getBusinessProfileAdmin } from "@/lib/services/business-profile-service-admin";
import AnunciosPageClient from "./page.client";

export const dynamic = "force-dynamic";

export default async function AnunciosPage() {
  let uid: string | null = null;
  try {
    uid = await getUidFromCookie();
  } catch (error) {
    console.warn(
      "Não foi possível obter o UID do cookie durante a renderização do servidor. Isso é esperado se o usuário não estiver logado."
    );
  }

  const initialProfile = await getBusinessProfileAdmin(uid);

  return <AnunciosPageClient initialProfile={initialProfile} />;
}

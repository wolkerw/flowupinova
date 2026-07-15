import { Metadata } from "next";
import { MinhaContaPageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Minha Conta | NumVapt",
  description: "Gerencie suas credenciais e detalhes da sua assinatura.",
};

export default function MinhaContaPage() {
  return <MinhaContaPageClient />;
}

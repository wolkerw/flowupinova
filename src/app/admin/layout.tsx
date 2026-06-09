import type { Metadata } from "next";
import { requireAdminAccess } from "@/lib/admin-auth";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = {
  title: "NumVapt Admin | Painel de Controle",
  description: "Painel de administração restrito NumVapt.",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Validação server-side: redireciona automaticamente se não for admin
  const admin = await requireAdminAccess();

  return <AdminLayoutClient adminEmail={admin.email}>{children}</AdminLayoutClient>;
}

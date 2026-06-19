import React from "react";
import AdminCnpjRequestsClient from "./page.client";

export const metadata = {
  title: "Solicitações de CNPJ - Admin",
  description: "Aprovação ou recusa de alterações de CNPJ de clientes da plataforma.",
};

export default function AdminCnpjRequestsPage() {
  return <AdminCnpjRequestsClient />;
}

import React, { Suspense } from "react";
import TendenciasPageClient from "./page.client";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Tendências | NumVapt",
  description: "Acompanhe assuntos e buscas em alta no Google Trends em tempo real.",
};

export default function TendenciasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#0083C7]" />
        </div>
      }
    >
      <TendenciasPageClient />
    </Suspense>
  );
}

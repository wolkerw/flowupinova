"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * PÁGINA FOTO PROFISSIONAL (TEMPORARIAMENTE GUARDADA)
 *
 * Para reativar esta página no futuro:
 * 1. Descomente a importação e o export abaixo substituindo o componente de redirecionamento:
 *    export { default } from "./AvatarOriginalView";
 * 2. Descomente a entrada "Foto Profissional" em `src/app/dashboard/layout.tsx`.
 *
 * Todo o código original, componentes e assets permanecem intactos em `./AvatarOriginalView.tsx`.
 */
export default function AvatarPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0083C7] border-t-transparent mb-4" />
      <p className="text-gray-500 text-sm">
        A página de Foto Profissional está temporariamente desativada e guardada para melhorias.
        Redirecionando para o painel...
      </p>
    </div>
  );
}

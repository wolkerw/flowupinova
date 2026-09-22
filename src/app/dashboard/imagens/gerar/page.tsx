"use client";

import React, { Suspense } from "react";
import { ImageGenerationWizard } from "./_components/ImageGenerationWizard";
import { Loader2 } from "lucide-react";

export default function GerarImagensPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#0083C7]" />
          </div>
        }
      >
        <ImageGenerationWizard />
      </Suspense>
    </div>
  );
}

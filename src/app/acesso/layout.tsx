"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function AcessoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] px-4 py-8">
      <div className="mb-6">
        <Link href="/">
          <Image
            src="/logo-numvapt.png"
            alt="NumVapt Logo"
            width={180}
            height={60}
            className="h-auto w-auto max-h-16 cursor-pointer"
            quality={100}
            priority
          />
        </Link>
      </div>
      <main className="w-full max-w-[420px]">
        {children}
      </main>
    </div>
  );
}

"use client";

import React from "react";
import { FloatingNavbar } from "./floating-navbar";
import { HeroSection } from "./hero-section";
import { OnboardingSection } from "./onboarding-section";
import { WorkflowSection } from "./workflow-section";
import { FeaturesBanner } from "./features-banner";
import { FeaturesGrid } from "./features-grid";
import { PricingSection } from "./pricing-section";
import { FAQSection } from "./faq-section";
import { WhatsAppFloatingButton } from "./whatsapp-floating-button";
import Link from "next/link";
import Image from "next/image";
import { Instagram, MessageCircle } from "lucide-react";

export function HomePageContent() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-500/30">
      <FloatingNavbar />
      <WhatsAppFloatingButton />

      <main>
        <HeroSection />
        <OnboardingSection />
        <WorkflowSection />
        <FeaturesBanner />
        <FeaturesGrid />
        <PricingSection />
        <FAQSection />
      </main>

      {/* Footer Simples e Elegante */}
      <footer className="border-t border-slate-800 bg-slate-900 pt-12 pb-24 md:pb-20 text-slate-400">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex flex-col items-center gap-1.5 md:items-start">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <Image
                  src="/logo-numvapt.png"
                  alt="NumVapt Logo"
                  width={120}
                  height={32}
                  className="object-contain"
                />
                <span className="text-sm text-slate-400">
                  © {new Date().getFullYear()} - Todos os direitos reservados
                </span>
              </div>
              <p className="text-xs text-slate-400">
                <span className="font-medium text-slate-300">Flowup Soluções e Inovações Ltda</span>
                <span className="mx-2 text-slate-600">•</span>
                <span>CNPJ: 62.826.950/0001-27</span>
              </p>
            </div>

            <div className="flex gap-6 text-sm">
              <Link href="/termos-de-uso" className="transition-colors hover:text-white">
                Termos de Uso
              </Link>
              <Link href="/politica-de-privacidade" className="transition-colors hover:text-white">
                Privacidade
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 md:pr-14 lg:pr-16">
              <a
                href="https://wa.me/5551920044035?text=Ol%C3%A1!%20Sou%20visitante%20do%20site%20e%20gostaria%20de%20tirar%20d%C3%BAvidas%20sobre%20a%20NumVapt%20antes%20de%20assinar."
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp NumVapt para tirar dúvidas"
                className="group flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 shadow-lg shadow-emerald-500/10 transition-all duration-300 hover:scale-105 hover:border-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <span className="font-semibold text-slate-200 group-hover:text-white">
                  Tirar Dúvidas no WhatsApp
                </span>
              </a>

              <a
                href="https://www.instagram.com/numvapt/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram NumVapt"
                className="group flex items-center gap-2.5 rounded-full border border-pink-500/30 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-500/20 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-pink-500/10 transition-all duration-300 hover:scale-105 hover:border-pink-500/60 hover:from-purple-600/30 hover:via-pink-600/30 hover:to-orange-500/30 hover:shadow-pink-500/20"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <Instagram className="h-4 w-4" />
                </div>
                <span className="font-semibold text-slate-200 group-hover:text-white">
                  Siga @numvapt
                </span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

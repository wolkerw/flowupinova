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
import Link from "next/link";
import Image from "next/image";
import { Instagram, Linkedin } from "lucide-react";

export function HomePageContent() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-500/30">
      <FloatingNavbar />
      
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
      <footer className="py-12 bg-slate-900 border-t border-slate-800 text-slate-400">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Image 
                src="/logo-numvapt.png" 
                alt="NumVapt Logo" 
                width={120} 
                height={32} 
                className="object-contain"
              />
              <span className="text-sm">© {new Date().getFullYear()}</span>
            </div>
            
            <div className="flex gap-6 text-sm">
              <Link href="#" className="hover:text-white transition-colors">Termos de Uso</Link>
              <Link href="#" className="hover:text-white transition-colors">Privacidade</Link>
              <Link href="/suporte" className="hover:text-white transition-colors">Suporte</Link>
            </div>

            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

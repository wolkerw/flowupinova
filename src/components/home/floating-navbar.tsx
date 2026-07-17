"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SparklesIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const FloatingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed left-0 right-0 top-0 z-50 mt-4 flex justify-center px-4">
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className={`flex w-full max-w-5xl items-center justify-between rounded-full px-6 py-3 transition-all duration-300 ${
          scrolled
            ? "shadow-soft border border-slate-200/50 bg-white/80 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center transition-opacity hover:opacity-90">
          <img src="/logo-numvapt.png" alt="NumVapt" className="h-8 object-contain" />
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#como-funciona"
            className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            Como funciona
          </Link>
          <Link
            href="#recursos"
            className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            Recursos
          </Link>
          <Link
            href="#planos"
            className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            Planos
          </Link>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/acesso/login"
            className="hidden text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 sm:block"
          >
            Entrar
          </Link>
          <Button
            asChild
            className="rounded-full bg-[#0083C7] text-white transition-transform duration-300 hover:scale-105 hover:bg-[#006ca3]"
          >
            <Link href="/acesso/cadastro">Começar Grátis</Link>
          </Button>
        </div>
      </motion.nav>
    </div>
  );
};

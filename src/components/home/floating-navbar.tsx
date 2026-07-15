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
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center mt-4 px-4">
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className={`flex items-center justify-between px-6 py-3 rounded-full transition-all duration-300 w-full max-w-5xl ${
          scrolled 
            ? "bg-white/80 backdrop-blur-xl shadow-soft border border-slate-200/50" 
            : "bg-transparent"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
          <img src="/logo-numvapt.png" alt="NumVapt" className="h-8 object-contain" />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#como-funciona" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Como funciona</Link>
          <Link href="#recursos" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Recursos</Link>
          <Link href="#planos" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Planos</Link>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link href="/acesso/login" className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            Entrar
          </Link>
          <Button asChild className="rounded-full bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 transition-transform duration-300">
            <Link href="/acesso/cadastro">Começar Grátis</Link>
          </Button>
        </div>
      </motion.nav>
    </div>
  );
};

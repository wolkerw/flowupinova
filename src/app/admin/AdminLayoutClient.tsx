"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  Settings,
  FileWarning,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { eraseCookie } from "@/lib/cookie";

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Usuários",
    href: "/admin/usuarios",
    icon: Users,
  },
  {
    title: "Solicitações CNPJ",
    href: "/admin/solicitacoes",
    icon: Shield,
  },
  {
    title: "Conteúdo Gerado",
    href: "/admin/conteudo",
    icon: ImageIcon,
  },
  {
    title: "Configurações",
    href: "/admin/configuracoes",
    icon: Settings,
  },
  {
    title: "Logs & Erros",
    href: "/admin/logs",
    icon: FileWarning,
  },
];

export default function AdminLayoutClient({
  children,
  adminEmail,
}: {
  children: React.ReactNode;
  adminEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    eraseCookie("firebase-id-token");
    router.push("/acesso/login");
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo / Header */}
      <div className="flex items-center gap-3 border-b border-slate-700/50 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">NumVapt Admin</p>
          <p className="text-xs text-slate-400">Painel de Controle</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                  : "text-slate-400 hover:bg-slate-700/60 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.title}</span>
              {isActive && <ChevronRight className="h-3 w-3 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer do Sidebar */}
      <div className="border-t border-slate-700/50 px-3 py-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-700/40 px-3 py-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
            {adminEmail.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{adminEmail}</p>
            <p className="text-xs text-violet-400">Administrador</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Ir para o App</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-red-900/30 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-slate-700/50 bg-slate-900 lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile (overlay) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-slate-700/50 bg-slate-900">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Bar Mobile */}
        <header className="flex items-center justify-between border-b border-slate-700/50 bg-slate-900 px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-500" />
            <span className="text-sm font-bold text-white">NumVapt Admin</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6">{children}</main>
      </div>
    </div>
  );
}

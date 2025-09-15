"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  FileText,
  Megaphone,
  Users,
  BarChart3,
  Plus,
  Search,
  Bell,
  HelpCircle,
  User as UserIcon,
  Waves,
  Store,
  Building2,
  Shield,
  LogOut,
  Eye,
  X
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const allNavigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Meu Negócio",
    url: "/dashboard/meu-negocio",
    icon: Building2,
  },
  {
    title: "Conteúdo",
    url: "/dashboard/conteudo",
    icon: FileText,
  },
  {
    title: "Anúncios",
    url: "/dashboard/anuncios",
    icon: Megaphone,
  },
  {
    title: "Relacionamento",
    url: "/dashboard/relacionamento",
    icon: Users,
  },
  {
    title: "Relatórios",
    url: "#",
    icon: BarChart3,
  },
  {
    title: "Marketplace",
    url: "#",
    icon: Store,
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <style>{`
          :root {
            --flowup-cyan: #7DD3FC;
            --flowup-blue: #3B82F6;
            --flowup-blue-dark: #1E40AF;
            --flowup-blue-darker: #1E3A8A;
            --flowup-text-dark: #1F2937;
            --flowup-gradient: linear-gradient(135deg, #7DD3FC 0%, #3B82F6 50%, #1E40AF 100%);
          }
        `}</style>

        <Sidebar className="border-r border-gray-200/60 bg-white">
          <SidebarHeader className="border-b border-gray-100 p-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--flowup-gradient)' }}>
                  <Waves className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">FlowUp</h2>
                <p className="text-xs text-gray-500">Marketing Digital</p>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                Navegação
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {allNavigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-gray-50 transition-all duration-200 rounded-xl mb-1 ${
                          pathname === item.url
                            ? 'text-white border' 
                            : 'hover:text-gray-700'
                        }`}
                        style={pathname === item.url ? { 
                          background: 'var(--flowup-gradient)',
                          borderColor: 'var(--flowup-cyan)'
                        } : {}}
                      >
                        <Link href={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-8">
              <div className="px-3">
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border rounded-xl p-4" style={{ borderColor: 'var(--flowup-cyan)' }}>
                  <h3 className="font-semibold text-gray-900 mb-2">Marketplace</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Descubra novos módulos para expandir sua estratégia
                  </p>
                  <Button
                    asChild
                    className="w-full text-white shadow-sm"
                    style={{ background: 'var(--flowup-gradient)' }}
                  >
                    <Link href="#">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Módulo
                    </Link>
                  </Button>
                </div>
              </div>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-100 p-4">
            <div className="text-center space-y-2">
              <div className="flex justify-center gap-4 text-xs text-gray-400">
                <a href="#" className="hover:text-gray-600 transition-colors">Suporte</a>
                <span>•</span>
                <a href="#" className="hover:text-gray-600 transition-colors">Termos</a>
                <span>•</span>
                <a href="#" className="hover:text-gray-600 transition-colors">Privacidade</a>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col bg-gray-50">
          <header className="bg-white border-b border-gray-200/60 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar campanhas, relatórios..."
                    className="pl-10 pr-4 py-2 w-80 bg-gray-50 border-gray-200 focus:bg-white"
                    style={{ focusBorderColor: 'var(--flowup-blue)' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 rounded-full">
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--flowup-cyan)' }}></div>
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-full">
                  <HelpCircle className="w-5 h-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-full">
                      <UserIcon className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                      <>
                        <div className="px-3 py-2">
                          <p className="text-sm font-medium text-gray-900">
                            Usuário
                          </p>
                          <p className="text-xs text-gray-500">
                            usuario@email.com
                          </p>
                        </div>
                        <DropdownMenuSeparator />
                      </>
                      <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sair da conta
                      </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}


"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import Image from "next/image";

import {
  LayoutDashboard,
  FileText,
  Megaphone,
  Users,
  BarChart3,
  Search,
  Bell,
  HelpCircle,
  Building2,
  LogOut,
  Loader2,
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
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const allNavigationItems = [
  {
    title: "Início",
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
    url: "/dashboard/relatorios",
    icon: BarChart3,
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  
  // A lógica de redirecionamento agora está centralizada no AuthProvider.
  // Apenas renderizamos o loader se o estado ainda estiver carregando.
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <style>{`
          :root {
            --flowup-cyan: #40E0D0;
            --flowup-blue: #2D8EFF;
            --flowup-blue-dark: #1B355E;
            --flowup-gradient: linear-gradient(135deg, #40E0D0 0%, #2D8EFF 100%);
          }
        `}</style>

        <Sidebar className="border-r border-gray-200/60 bg-white">
          <SidebarHeader className="border-b border-gray-100 p-6">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.svg" alt="FlowUp Logo" width={120} height={25} />
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
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-100 p-4">
            <div className="text-center space-y-2">
              <div className="flex justify-center gap-4 text-xs text-gray-400">
                <a href="#" className="hover:text-gray-600 transition-colors">Suporte</a>
                <span>•</span>
                <Link href="/termos" className="hover:text-gray-600 transition-colors">Termos</Link>
                <span>•</span>
                <Link href="/privacidade" className="hover:text-gray-600 transition-colors">Privacidade</Link>
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
                     <Button variant="ghost" className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || undefined} />
                            <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                       <DropdownMenuLabel>
                          <p className="font-bold">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
                       </DropdownMenuLabel>
                       <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={logout}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Sair
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

       <a
        href="https://wa.me/555199922177?text=Olá!%20Eu%20gostaria%20de%20tirar%20uma%20dúvida%20na%20FlowUp."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50"
        aria-label="Entre em contato pelo WhatsApp"
      >
        <Button size="icon" className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-transform hover:scale-110">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8"
            >
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.902-.539-5.586-1.543l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.849 6.037l-1.09 3.972 4.025-1.05z"/>
            </svg>
        </Button>
      </a>
    </SidebarProvider>
  );
}

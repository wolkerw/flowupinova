

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import Image from "next/image";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  CheckCircle,
  XCircle,
  Sparkles,
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { processPendingNotifications, getNotifications, markAllNotificationsAsRead, type Notification } from "@/lib/services/notifications-service";
import { cn } from "@/lib/utils";
import { getBusinessProfile, type BusinessProfileData } from "@/lib/services/business-profile-service";


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

const NotificationItem = ({ notification }: { notification: Notification }) => {
    const statusIcons = {
        unread: <Sparkles className="w-4 h-4 text-blue-500" />,
        published: <CheckCircle className="w-4 h-4 text-green-500" />, // Visual alternative
        failed: <XCircle className="w-4 h-4 text-red-500" />,
    };

    const isUnread = notification.status === 'unread';

    return (
        <DropdownMenuItem className={cn("flex items-start gap-3 p-3 cursor-default focus:bg-gray-50", isUnread && "bg-blue-50")}>
            <div className="mt-1">
                 {statusIcons[notification.status as keyof typeof statusIcons] || <Bell className="w-4 h-4 text-gray-500" />}
            </div>
            <div className="flex-1">
                <p className="text-sm text-gray-800 leading-snug">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: ptBR })}
                </p>
            </div>
        </DropdownMenuItem>
    );
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(null);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const fetchAndProcessNotifications = useCallback(async () => {
    if (!user) return;
    setLoadingNotifications(true);
    try {
        // First, process any pending notifications that are due
        await processPendingNotifications(user.uid);
        // Then, fetch all recent notifications
        const fetchedNotifications = await getNotifications(user.uid);
        setNotifications(fetchedNotifications);
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
    } finally {
        setLoadingNotifications(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
        fetchAndProcessNotifications();
        getBusinessProfile(user.uid).then(setBusinessProfile);
    }
  }, [user, fetchAndProcessNotifications]);

  const handleOpenNotifications = async (isOpen: boolean) => {
    // When the dropdown opens and there are unread notifications, mark them as read.
    if (isOpen && unreadCount > 0) {
        if (!user) return;
        // Optimistically update the UI
        setNotifications(prev => prev.map(n => n.status === 'unread' ? { ...n, status: 'read' } : n));
        // Then, update in the backend
        await markAllNotificationsAsRead(user.uid);
    }
  };
  
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getAvatarFallback = () => {
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    if (businessProfile?.name) return businessProfile.name.charAt(0).toUpperCase();
    return "U";
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
              <Image src="/logo.png" alt="FlowUp Logo" width={120} height={25} />
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
                
              </div>

              <div className="flex items-center gap-3">
                 <DropdownMenu onOpenChange={handleOpenNotifications}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 rounded-full">
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <div className="absolute -top-0 -right-0 w-4 h-4 text-xs flex items-center justify-center rounded-full bg-red-500 text-white">
                                {unreadCount}
                            </div>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel className="flex justify-between items-center">
                            Notificações
                            <Button variant="ghost" size="sm" onClick={fetchAndProcessNotifications} disabled={loadingNotifications}>
                                {loadingNotifications ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar"}
                            </Button>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {loadingNotifications ? (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <p className="text-sm text-center text-gray-500 p-4">Nenhuma notificação nova.</p>
                            ) : (
                                notifications.map(n => <NotificationItem key={n.id} notification={n} />)
                            )}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                 </DropdownMenu>

                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="flex items-center gap-2 p-1 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={businessProfile?.logo?.url || user.photoURL || undefined} />
                            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
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

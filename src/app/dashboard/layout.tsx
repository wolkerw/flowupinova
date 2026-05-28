"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  Settings2,
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
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  processPendingNotifications,
  getNotifications,
  markAllNotificationsAsRead,
  type Notification,
} from "@/lib/services/notifications-service";
import { cn } from "@/lib/utils";
import {
  getBusinessProfile,
  type BusinessProfileData,
} from "@/lib/services/business-profile-service";
import { Badge } from "@/components/ui/badge";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";

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
    disabled: true,
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
    unread: <Sparkles className="h-4 w-4 text-primary" />,
    published: <CheckCircle className="h-4 w-4 text-green-500" />, // Visual alternative
    failed: <XCircle className="h-4 w-4 text-destructive" />,
  };

  const isUnread = notification.status === "unread";

  return (
    <DropdownMenuItem
      className={cn(
        "flex cursor-default items-start gap-3 p-3 focus:bg-accent",
        isUnread && "bg-primary/10"
      )}
    >
      <div className="mt-1">
        {statusIcons[notification.status as keyof typeof statusIcons] || (
          <Bell className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm leading-snug text-foreground">{notification.message}</p>
        <p className="mt-1 text-xs text-muted-foreground">
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
  const [showOnboarding, setShowOnboarding] = useState(false);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

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
      getBusinessProfile(user.uid).then((profile) => {
        setBusinessProfile(profile);
        // Se onboardingCompleted não for true, mostra o wizard automaticamente
        if (profile && profile.onboardingCompleted !== true) {
          setShowOnboarding(true);
        }
      });
    }
  }, [user, fetchAndProcessNotifications]);

  const handleOpenNotifications = async (isOpen: boolean) => {
    // When the dropdown opens and there are unread notifications, mark them as read.
    if (isOpen && unreadCount > 0) {
      if (!user) return;
      // Optimistically update the UI
      setNotifications((prev) =>
        prev.map((n) => (n.status === "unread" ? { ...n, status: "read" } : n))
      );
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
    if (businessProfile?.name) return businessProfile.name.charAt(0).toUpperCase();
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/50">
      <OnboardingWizard
        userId={user.uid}
        initialData={businessProfile}
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => {
          console.log("Onboarding complete!");
          setShowOnboarding(false);
          if (user) {
            getBusinessProfile(user.uid).then(setBusinessProfile);
          }
        }}
      />
      <SidebarProvider>
        <Sidebar className="border-r border-border/60 bg-background">
          <SidebarHeader className="border-b border-border/60 p-6">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo-numvapt.png"
                alt="NumVapt Logo"
                width={120}
                height={60}
                className="h-auto"
              />
            </Link>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Navegação
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {allNavigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        disabled={item.disabled}
                        className={`mb-1 rounded-lg transition-all duration-200 hover:bg-accent ${
                          pathname === item.url
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:text-accent-foreground"
                        } ${item.disabled ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <Link
                          href={item.disabled ? "#" : item.url}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium">{item.title}</span>
                          </div>
                          {item.disabled && (
                            <Badge variant="secondary" className="text-xs">
                              Em breve
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setShowOnboarding(true)}
                    className="hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Settings2 className="h-4 w-4" />
                    <span>Configurações</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-border/60 p-4">
            <div className="space-y-2 text-center">
              <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                <a href="#" className="transition-colors hover:text-foreground">
                  Suporte
                </a>
                <span>•</span>
                <Link href="/termos" className="transition-colors hover:text-foreground">
                  Termos
                </Link>
                <span>•</span>
                <Link href="/privacidade" className="transition-colors hover:text-foreground">
                  Privacidade
                </Link>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex flex-1 flex-col bg-muted/50">
          <header className="border-b border-border/60 bg-background px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
              </div>

              <div className="flex items-center gap-3">
                <DropdownMenu onOpenChange={handleOpenNotifications}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative rounded-full hover:bg-accent"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <div className="absolute -right-0 -top-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                          {unreadCount}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      Notificações
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchAndProcessNotifications}
                        disabled={loadingNotifications}
                      >
                        {loadingNotifications ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Atualizar"
                        )}
                      </Button>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      {loadingNotifications ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                          Nenhuma notificação nova.
                        </p>
                      ) : (
                        notifications.map((n) => <NotificationItem key={n.id} notification={n} />)
                      )}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex h-auto items-center gap-2 rounded-full p-1"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={businessProfile?.logo?.url || user.photoURL || undefined}
                          alt={businessProfile?.name || user.displayName || ""}
                        />
                        <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-1">
                        <p className="font-bold">{businessProfile?.name || user.displayName}</p>
                        <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                        {businessProfile?.primaryColor && (
                          <div className="mt-2 flex gap-1">
                            <div className="h-2 w-full rounded-full" style={{ backgroundColor: businessProfile.primaryColor }} />
                            <div className="h-2 w-full rounded-full" style={{ backgroundColor: businessProfile.secondaryColor }} />
                          </div>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setShowOnboarding(true)}>
                      <Settings2 className="mr-2 h-4 w-4" />
                      Configurações do Negócio
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            <React.Suspense
              fallback={
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
            >
              {children}
            </React.Suspense>
          </div>
        </main>
      </SidebarProvider>

      <a
        href="https://wa.me/555199922177?text=Olá!%20Eu%20gostaria%20de%20tirar%20uma%20dúvida%20na%20NumVapt."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50"
        aria-label="Entre em contato pelo WhatsApp"
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-green-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-8 w-8"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.902-.539-5.586-1.543l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.849 6.037l-1.09 3.972 4.025-1.05z" />
          </svg>
        </Button>
      </a>
    </div>
  );
}

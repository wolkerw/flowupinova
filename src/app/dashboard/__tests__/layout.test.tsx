import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardLayout from "../layout";

// Mock do window.matchMedia (necessário para jsdom)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock do next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock do auth provider
jest.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    user: { uid: "test-user", email: "test@test.com", displayName: "User Test" },
    loading: false,
    logout: jest.fn(),
  }),
}));

// Mock dos serviços do Firebase e notificações
jest.mock("@/lib/services/notifications-service", () => ({
  processPendingNotifications: jest.fn().mockResolvedValue(undefined),
  getNotifications: jest.fn().mockResolvedValue([]),
  markAllNotificationsAsRead: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/services/business-profile-service", () => ({
  getBusinessProfile: jest.fn().mockResolvedValue({
    name: "Test Business",
    onboardingCompleted: true,
  }),
}));

// Mock do OnboardingWizard
jest.mock("@/components/dashboard/onboarding-wizard", () => ({
  OnboardingWizard: () => <div data-testid="onboarding-wizard">OnboardingWizard</div>,
}));

// Mock do next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || "mocked image"} />;
  },
}));

describe("DashboardLayout", () => {
  it("renders the layout navigation items and marks Anúncios as disabled", async () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Aguarda a renderização final pós-promessas assíncronas do useEffect
    await screen.findByText("Início");

    // Verifica se os itens de menu estão presentes
    expect(screen.getByText("Meu Negócio")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
    expect(screen.getByText("Relacionamento")).toBeInTheDocument();
    expect(screen.getByText("Relatórios")).toBeInTheDocument();

    // O item "Anúncios" deve estar presente e desativado como link
    const anunciosLink = screen.getByText("Anúncios").closest("a");
    expect(anunciosLink).toBeInTheDocument();
    expect(anunciosLink).toHaveAttribute("href", "#");
    
    // O link ou seu container SidebarMenuButton deve possuir as classes de disabled
    // Como asChild é usado, as classes se propagam para o Link <a> ou para o container correspondente
    await waitFor(() => {
      const hasDisabledClasses = anunciosLink?.className.includes("cursor-not-allowed") || 
                                 anunciosLink?.parentElement?.className.includes("cursor-not-allowed") ||
                                 screen.getByText("Anúncios").closest("button")?.className.includes("cursor-not-allowed");
      expect(hasDisabledClasses).toBe(true);
    });
    
    // Deve exibir o badge "Em breve" ao lado de Anúncios
    expect(screen.getByText("Em breve")).toBeInTheDocument();
  });
});

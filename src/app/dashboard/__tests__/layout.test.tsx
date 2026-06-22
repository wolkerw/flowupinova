import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardLayout from "../layout";

// Mock do window.matchMedia (necessário para jsdom)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock do next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock do auth provider
vi.mock("@/components/auth/auth-provider", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    user: { uid: "test-user-123", email: "test@example.com" },
    loading: false,
    loginWithEmail: vi.fn().mockResolvedValue(undefined),
    signUpWithEmail: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock dos serviços do Firebase e notificações
vi.mock("@/lib/services/notifications-service", () => ({
  processPendingNotifications: vi.fn().mockResolvedValue(undefined),
  getNotifications: vi.fn().mockResolvedValue([]),
  markAllNotificationsAsRead: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/services/business-profile-service", () => ({
  getBusinessProfile: vi.fn().mockResolvedValue({
    name: "Test Business",
    onboardingCompleted: true,
  }),
}));

// Mock do OnboardingWizard
vi.mock("@/components/dashboard/onboarding-wizard", () => ({
  OnboardingWizard: () => <div data-testid="onboarding-wizard">OnboardingWizard</div>,
}));

// Mock do next/image
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || "mocked image"} />;
  },
}));

describe("DashboardLayout", () => {
  it("renders the layout navigation items, sidebar trigger, and enables Anúncios", async () => {
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

    // Verifica se o botão SidebarTrigger (hambúrguer) está presente no cabeçalho
    expect(screen.getByRole("button", { name: /toggle sidebar/i })).toBeInTheDocument();

    // O item "Anúncios" deve estar presente e ativo como link
    const anunciosLink = screen.getByText("Anúncios").closest("a");
    expect(anunciosLink).toBeInTheDocument();
    expect(anunciosLink).toHaveAttribute("href", "/dashboard/anuncios");

    // O link ou seu container SidebarMenuButton NÃO deve possuir as classes de disabled
    await waitFor(() => {
      const hasDisabledClasses = !!(
        anunciosLink?.className?.includes("cursor-not-allowed") ||
        anunciosLink?.parentElement?.className?.includes("cursor-not-allowed") ||
        screen.getByText("Anúncios").closest("button")?.className?.includes("cursor-not-allowed")
      );
      expect(hasDisabledClasses).toBe(false);
    });

    // Não deve exibir o badge "Em breve" ao lado de Anúncios
    expect(screen.queryByText("Em breve")).not.toBeInTheDocument();
  });
});

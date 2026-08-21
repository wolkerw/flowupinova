"use client";

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConfiguracoesPage from "../page";
import { AuthProvider } from "@/components/auth/auth-provider";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockUser = { uid: "test-user-123", email: "test@example.com" };
const mockAuth = {
  user: mockUser,
  loading: false,
  loginWithEmail: vi.fn().mockResolvedValue(undefined),
  signUpWithEmail: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/components/auth/auth-provider", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => mockAuth,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn().mockReturnValue(false),
  }),
}));

const mockProfile = {
  name: "Empresa Teste",
  category: "Tecnologia",
  phone: "11999999999",
  address: "Rua Teste, 123",
  website: "https://empresa.com",
  instagram: "@empresa",
  description: "Descrição da empresa",
  primaryColor: "#0083C7",
  secondaryColor: "#FA6305",
  slogan: "Inovação sempre",
  targetAudience: "B2B",
  toneOfVoice: "Profissional",
  cnpj: "12.345.678/0001-90",
  cnpjLocked: false,
  brandKit: {
    primaryColor: "#0083C7",
    secondaryColor: "#FA6305",
    visualGuidelines: "Estilo clean",
    personas: [
      {
        name: "Carlos Diretor",
        profile: "Decisor B2B",
        painPoints: "Falta de agilidade e processos lentos",
        buyingMotivation: "Segurança e inovação",
      },
    ],
  },
};

vi.mock("@/lib/services/onboarding-service", () => ({
  getOnboardingProfile: vi.fn().mockImplementation(() => Promise.resolve(mockProfile)),
  updateOnboardingProfile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/services/business-profile-service", () => ({
  updateBusinessProfile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
  storage: {},
}));

vi.mock("@/components/dashboard/onboarding-wizard", () => ({
  OnboardingWizard: () => <div data-testid="mock-onboarding-wizard" />,
}));

vi.mock("@/components/ui/image-cropper-modal", () => ({
  ImageCropperModal: () => <div data-testid="mock-image-cropper" />,
}));

describe("Configurações da Marca - Gestão de Personas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza a página e exibe a persona existente", async () => {
    render(
      <AuthProvider>
        <ConfiguracoesPage />
      </AuthProvider>
    );

    expect(await screen.findByText("Configurações da Marca")).toBeInTheDocument();
    expect(screen.getByText("Personas da Marca")).toBeInTheDocument();
    expect(screen.getAllByText("Carlos Diretor").length).toBeGreaterThan(0);
    expect(screen.getByText("Decisor B2B")).toBeInTheDocument();
  });

  it("permite abrir o modal para adicionar nova persona", async () => {
    render(
      <AuthProvider>
        <ConfiguracoesPage />
      </AuthProvider>
    );

    await screen.findByText("Configurações da Marca");

    const newPersonaButton = screen.getByRole("button", { name: /Nova Persona/i });
    fireEvent.click(newPersonaButton);

    expect(await screen.findByText("Nova Persona da Marca")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome ou Identificador da Persona/i)).toBeInTheDocument();
  });
});

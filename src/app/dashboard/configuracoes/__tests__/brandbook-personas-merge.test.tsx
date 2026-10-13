"use client";

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConfiguracoesPage from "../page";
import { AuthProvider } from "@/components/auth/auth-provider";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { updateOnboardingProfile } from "@/lib/services/onboarding-service";

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

// Mock do BrandBookGeneratorTab expondo um botão para disparar o onApplyToBrain
vi.mock("@/components/dashboard/BrandBookGeneratorTab", () => ({
  BrandBookGeneratorTab: ({ onApplyToBrain }: any) => (
    <div data-testid="mock-brandbook-tab">
      <button
        onClick={() =>
          onApplyToBrain({
            primaryColor: "#112233",
            secondaryColor: "#445566",
            primaryFont: "Montserrat",
            secondaryFont: "Inter",
            fontStyle: "Moderno",
            slogan: "Slogan Novo",
            toneOfVoice: "Amigável",
            targetAudience: "Novos Clientes",
            mainBenefits: ["Rapidez"],
            visualGuidelines: "Clean",
            personas: [
              {
                name: "Mariana IA",
                profile: "Líder de Inovação",
                painPoints: "Processos manuais",
                buyingMotivation: "Automação",
              },
              {
                name: "Carlos Diretor", // Persona duplicada com mesmo nome
                profile: "Perfil Sobrescrito",
                painPoints: "Dores",
                buyingMotivation: "Objetivos",
              },
            ],
            description: "Nova Descrição",
          })
        }
      >
        Disparar Aplicar Brand Book
      </button>
    </div>
  ),
}));

describe("Configurações - Merge de Personas ao Aplicar Brand Book", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantém personas existentes e soma as novas personas do Brand Book sem duplicar", async () => {
    render(
      <AuthProvider>
        <ConfiguracoesPage />
      </AuthProvider>
    );

    await screen.findByText("Configurações da Marca");

    const applyBtn = screen.getByRole("button", { name: /Disparar Aplicar Brand Book/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(updateOnboardingProfile).toHaveBeenCalledWith(
        "test-user-123",
        expect.objectContaining({
          brandKit: expect.objectContaining({
            personas: [
              expect.objectContaining({ name: "Carlos Diretor" }),
              expect.objectContaining({ name: "Mariana IA" }),
            ],
          }),
        }),
        expect.anything()
      );
    });

    const callArgs = vi.mocked(updateOnboardingProfile).mock.calls[0][1];
    const savedPersonas = callArgs.brandKit?.personas;
    // Deve conter exatamente 2 personas (Carlos Diretor existente + Mariana IA nova, sem duplicar o Carlos)
    expect(savedPersonas).toHaveLength(2);
    expect(savedPersonas?.[0].name).toBe("Carlos Diretor");
    expect(savedPersonas?.[1].name).toBe("Mariana IA");
  });
});

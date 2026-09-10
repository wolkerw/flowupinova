import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OnboardingWizard } from "../onboarding-wizard";

// Mock do toast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock do serviço de onboarding
const mockUpdateOnboardingProfile = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/services/onboarding-service", () => ({
  updateOnboardingProfile: (...args: any[]) => mockUpdateOnboardingProfile(...args),
}));

// Mock do Firebase
vi.mock("@/lib/firebase", () => ({
  db: {},
  storage: {},
  auth: {
    currentUser: { uid: "user-123" },
  },
}));

vi.mock("@/lib/utils/storage-utils-client", () => ({
  getUserStoragePathClient: () => "users/user-123",
}));

vi.mock("firebase/analytics", () => ({
  logEvent: vi.fn(),
}));

vi.mock("firebase/storage", () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

// Mock do next/image
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt || ""} />,
}));

describe("OnboardingWizard - Edição de Hexadecimal das Cores da Marca", () => {
  const initialData = {
    name: "Empresa Teste",
    category: "Tecnologia",
    phone: "11999999999",
    address: "Rua Teste, 123",
    website: "https://teste.com",
    instagram: "@empresa_teste",
    description: "Descrição da empresa",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E293B",
    slogan: "Inovando sempre",
    targetAudience: "Empresas",
    toneOfVoice: "Profissional",
    cnpj: "12345678000199",
    cnpjLocked: false,
    logo: {
      url: "https://example.com/logo.png",
      width: 100,
      height: 100,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("permite navegar até a Etapa 5 e editar os códigos hexadecimais diretamente", async () => {
    render(
      <OnboardingWizard
        userId="user-123"
        initialData={initialData as any}
        isOpen={true}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    // Etapa 1 -> Avançar para Etapa 2
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    // Etapa 2 -> Avançar para Etapa 3
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    // Etapa 3 -> Avançar para Etapa 4
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    // Etapa 4 -> Avançar para Etapa 5
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    // Na Etapa 5, deve haver os campos de input de hexadecimal
    expect(screen.getByLabelText("Hexadecimal da cor principal")).toHaveValue("#3B82F6");
    expect(screen.getByLabelText("Hexadecimal da cor secundária")).toHaveValue("#1E293B");

    // Edita o hexadecimal da cor principal
    fireEvent.change(screen.getByLabelText("Hexadecimal da cor principal"), {
      target: { value: "#0083C7" },
    });
    await waitFor(() => {
      expect(screen.getByLabelText("Hexadecimal da cor principal")).toHaveValue("#0083C7");
    });

    // Edita o hexadecimal da cor secundária
    fireEvent.change(screen.getByLabelText("Hexadecimal da cor secundária"), {
      target: { value: "#FA6305" },
    });
    await waitFor(() => {
      expect(screen.getByLabelText("Hexadecimal da cor secundária")).toHaveValue("#FA6305");
    });

    // Verifica se os seletores nativos de cor sincronizaram
    expect(screen.getByLabelText("Seletor de cor principal")).toHaveValue("#0083c7");
    expect(screen.getByLabelText("Seletor de cor secundária")).toHaveValue("#fa6305");

    // Clica em "Salvar Tudo" na etapa final
    fireEvent.click(screen.getByRole("button", { name: /salvar tudo/i }));

    // Verifica que updateOnboardingProfile foi chamado com as novas cores hexadecimais
    await waitFor(() => {
      expect(mockUpdateOnboardingProfile).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({
          primaryColor: "#0083C7",
          secondaryColor: "#FA6305",
          onboardingCompleted: true,
        })
      );
    });
  });
});

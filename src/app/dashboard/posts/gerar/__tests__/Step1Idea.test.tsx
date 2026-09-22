import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Step1Idea } from "../_components/Step1Idea";
import { WizardProvider } from "../context/WizardContext";

let mockSearchParamsMode: string | null = "concept";

// Mocking dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({
    get: vi.fn((key: string) => (key === "mode" ? mockSearchParamsMode : null)),
  }),
}));

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

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("Step1Idea Component", () => {
  it("renders correctly and allows typing an idea", () => {
    render(
      <WizardProvider>
        <Step1Idea />
      </WizardProvider>
    );

    const textarea = screen.getByPlaceholderText(/Ex: Criar um post sobre/i);
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "Minha ideia de post" } });
    expect(textarea).toHaveValue("Minha ideia de post");
  });

  it("disables advance button when empty", () => {
    render(
      <WizardProvider>
        <Step1Idea />
      </WizardProvider>
    );

    const button = screen.getByRole("button", { name: /Avançar/i });
    expect(button).toBeDisabled();
  });

  it("permite alternar entre 'Fotografia Pura' e 'Infográfico Completo' no fluxo conceito", () => {
    render(
      <WizardProvider>
        <Step1Idea />
      </WizardProvider>
    );

    // No modo conceito padronizado, os botões são: "🖼️ Fotografia Pura" e "📊 Infográfico Completo"
    const infographicBtn = screen.getByRole("button", { name: /📊 Infográfico Completo/i });
    const purePhotoBtn = screen.getByRole("button", { name: /🖼️ Fotografia Pura/i });

    // "✨ Apenas Título" não deve estar presente no modo conceito
    expect(screen.queryByRole("button", { name: /✨ Apenas Título/i })).not.toBeInTheDocument();

    // Estado inicial padrão do WizardContext é "INFOGRAPHIC" (apenas infográfico ativo em #FA6305)
    expect(infographicBtn.className).toContain("bg-[#FA6305]");
    expect(purePhotoBtn.className).not.toContain("bg-slate-800");

    // Clica em "🖼️ Fotografia Pura" -> ativa fotografia pura e desativa infográfico
    fireEvent.click(purePhotoBtn);
    expect(purePhotoBtn.className).toContain("bg-slate-800");
    expect(infographicBtn.className).not.toContain("bg-[#FA6305]");

    // Clica em "📊 Infográfico Completo" -> volta a ativar infográfico
    fireEvent.click(infographicBtn);
    expect(infographicBtn.className).toContain("bg-[#FA6305]");
    expect(purePhotoBtn.className).not.toContain("bg-slate-800");
  });

  it("renderiza o Modo de Diagramação & Textos na Arte logo abaixo da Prioridade de Foco no fluxo híbrido (pessoa + cenário)", () => {
    mockSearchParamsMode = "reference-hybrid";

    render(
      <WizardProvider>
        <Step1Idea />
      </WizardProvider>
    );

    // 1. Verifica se a Prioridade de Foco está presente
    expect(screen.getByText(/Prioridade de Foco da Geração/i)).toBeInTheDocument();
    expect(screen.getByText(/Foco em Ambos/i)).toBeInTheDocument();
    expect(screen.getByText(/Priorizar Cenário/i)).toBeInTheDocument();
    expect(screen.getByText(/Priorizar Pessoa/i)).toBeInTheDocument();

    // 2. Verifica se o Modo de Diagramação & Textos na Arte está presente
    const diagramLabels = screen.getAllByText(/Modo de Diagramação & Textos na Arte/i);
    expect(diagramLabels.length).toBeGreaterThanOrEqual(1);

    const purePhotoBtn = screen.getByRole("button", { name: /🖼️ Fotografia Pura/i });
    const titleBtn = screen.getByRole("button", { name: /✨ Apenas Título/i });
    const infographicBtn = screen.getByRole("button", { name: /📊 Infográfico Completo/i });

    expect(purePhotoBtn).toBeInTheDocument();
    expect(titleBtn).toBeInTheDocument();
    expect(infographicBtn).toBeInTheDocument();

    // 3. Verifica o campo de título/slogan opcional
    const headlineInput = screen.getByPlaceholderText(/Ex: FEITA PARA CONECTAR ou 30% OFF NO SEGUNDO ITEM/i);
    expect(headlineInput).toBeInTheDocument();

    fireEvent.change(headlineInput, { target: { value: "LANÇAMENTO RESIDENCIAL EXCLUSIVO" } });
    expect(headlineInput).toHaveValue("LANÇAMENTO RESIDENCIAL EXCLUSIVO");

    // Restaura o modo padrão para não interferir em outros testes
    mockSearchParamsMode = "concept";
  });

  it("abre o modal do vídeo tutorial no fluxo Pessoas + Cenário com a URL oficial correta", () => {
    mockSearchParamsMode = "reference-hybrid";

    render(
      <WizardProvider>
        <Step1Idea />
      </WizardProvider>
    );

    const tutorialBtn = screen.getByRole("button", { name: /Assistir Vídeo Tutorial/i });
    expect(tutorialBtn).toBeInTheDocument();

    fireEvent.click(tutorialBtn);

    expect(screen.getByText(/Tutorial: Como Criar Posts \(Pessoa \+ Cenário\)/i)).toBeInTheDocument();

    const videoSource = document.querySelector("video source");
    expect(videoSource).toBeInTheDocument();
    expect(videoSource?.getAttribute("src")).toContain("Como%20Usar%20-%20Fluxo%20Pessoa%2BCen%C3%A1rio%20V1%20(final).mp4");

    // Restaura o modo padrão
    mockSearchParamsMode = "concept";
  });
});

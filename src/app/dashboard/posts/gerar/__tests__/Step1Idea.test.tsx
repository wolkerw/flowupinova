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

  it("allows selecting both 'Apenas Título' and 'Com Infográficos' together in orange (#FA6305)", () => {
    render(
      <WizardProvider>
        <Step1Idea />
      </WizardProvider>
    );

    // No modo padrão (concept), os botões são: "🖼️ Sem Infográficos", "✨ Apenas Título", "📊 Com Infográficos"
    const titleBtn = screen.getByRole("button", { name: /✨ Apenas Título/i });
    const infographicBtn = screen.getByRole("button", { name: /📊 Com Infográficos/i });
    const purePhotoBtn = screen.getByRole("button", { name: /🖼️ Sem Infográficos/i });

    // Estado inicial padrão do WizardContext é "INFOGRAPHIC" (apenas infográfico ativo)
    expect(infographicBtn.className).toContain("bg-[#FA6305]");
    expect(titleBtn.className).not.toContain("bg-[#FA6305]");

    // Clica em "✨ Apenas Título" -> agora AMBOS devem estar ativos em LARANJA (#FA6305)
    fireEvent.click(titleBtn);
    expect(titleBtn.className).toContain("bg-[#FA6305]");
    expect(infographicBtn.className).toContain("bg-[#FA6305]");

    // Clica em "Sem Infográficos" -> limpa ambos
    fireEvent.click(purePhotoBtn);
    expect(purePhotoBtn.className).toContain("bg-slate-800");
    expect(titleBtn.className).not.toContain("bg-[#FA6305]");
    expect(infographicBtn.className).not.toContain("bg-[#FA6305]");

    // Clica em "✨ Apenas Título" -> apenas título fica em laranja
    fireEvent.click(titleBtn);
    expect(titleBtn.className).toContain("bg-[#FA6305]");
    expect(infographicBtn.className).not.toContain("bg-[#FA6305]");

    // Clica em "📊 Com Infográficos" -> ambos ficam em laranja juntos
    fireEvent.click(infographicBtn);
    expect(titleBtn.className).toContain("bg-[#FA6305]");
    expect(infographicBtn.className).toContain("bg-[#FA6305]");
  });
});

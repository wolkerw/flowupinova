import React from "react";
import { render, screen } from "@testing-library/react";
import { Step2TextSelection } from "../_components/Step2TextSelection";
import { WizardProvider } from "../context/WizardContext";

// Mocking dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
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

let mockWizardMode = "concept";
let mockGeneratedImages: string[] = [];
let mockSelectedImage: string | null = null;
let mockIsGeneratingImages = false;

vi.mock("../context/WizardContext", () => ({
  useWizard: () => ({
    generatedContent: [
      {
        titulo: "Título Sugerido",
        subtitulo: "Subtítulo sugerido",
        hashtags: ["#tag1", "#tag2"],
      },
    ],
    selectedContentId: "0",
    setSelectedContentId: vi.fn(),
    setStep: vi.fn(),
    user: { uid: "test-user-123", displayName: "Usuário Teste" },
    instagramConnection: null,
    handleGeneratePostContent: vi.fn(),
    isLoading: false,
    handleGeneratePrompts: vi.fn(),
    generatedImages: mockGeneratedImages,
    selectedImage: mockSelectedImage,
    setSelectedImage: vi.fn(),
    isGeneratingImages: mockIsGeneratingImages,
    handleDownloadImage: vi.fn(),
    mode: mockWizardMode,
    fluxImageUrl: null,
    insertTextOnImage: false,
    setInsertTextOnImage: vi.fn(),
  }),
  WizardProvider: ({ children }: any) => <div>{children}</div>,
}));

describe("Step2TextSelection", () => {
  beforeEach(() => {
    mockWizardMode = "concept";
    mockGeneratedImages = [];
    mockSelectedImage = null;
    mockIsGeneratingImages = false;
  });

  it("renders correctly in concept mode with text options", () => {
    render(<Step2TextSelection />);

    expect(screen.getByText(/Etapa 2: Sugestões da IA/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Selecione uma das opções geradas para o seu post/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Título Sugerido")).toBeInTheDocument();
  });

  it("renders ONLY image generation card in product mode (reference-photo), without content options", () => {
    mockWizardMode = "reference-photo";
    mockGeneratedImages = ["https://example.com/product-ad.jpg"];
    mockSelectedImage = "https://example.com/product-ad.jpg";

    render(<Step2TextSelection />);

    // Deve exibir o título de geração de imagem
    expect(
      screen.getByText(/Etapa 2: Criação da Imagem com IA/i)
    ).toBeInTheDocument();

    // NÃO deve exibir o card de sugestões de texto / opções de conteúdo
    expect(
      screen.queryByText(/Etapa 2: Sugestões da IA/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Selecione uma das opções geradas para o seu post/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Título Sugerido")).not.toBeInTheDocument();

    // Deve exibir o botão Avançar
    expect(screen.getByRole("button", { name: /Avançar/i })).toBeInTheDocument();
  });
});

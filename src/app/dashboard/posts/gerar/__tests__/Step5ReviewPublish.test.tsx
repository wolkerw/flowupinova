import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Step5ReviewPublish } from "../_components/Step5ReviewPublish";

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

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../_components/PostPreview", () => ({
  PostPreview: () => <div data-testid="mock-post-preview" />,
}));

const mockSetGeneratedContent = vi.fn();
const mockWizardState = {
  processedImageUrl: "https://example.com/test-image.jpg",
  setProcessedImageUrl: vi.fn(),
  selectedImage: "https://example.com/test-image.jpg",
  generatedImages: [],
  user: { uid: "test-user-123", email: "test@example.com" },
  metaConnection: null,
  instagramConnection: null,
  linkedinConnection: null,
  platforms: ["instagram"],
  setPlatforms: vi.fn(),
  setShowSchedulerModal: vi.fn(),
  handlePublish: vi.fn(),
  setStep: vi.fn(),
  isPublishing: false,
  collaborators: [],
  collaboratorsInput: "",
  setCollaborators: vi.fn(),
  setCollaboratorsInput: vi.fn(),
  userTags: [],
  userTagsInput: "",
  setUserTags: vi.fn(),
  setUserTagsInput: vi.fn(),
  generatedContent: [
    {
      titulo: "Título Inicial",
      subtitulo: "Legenda inicial de rascunho",
      hashtags: ["#produto", "#moda"],
    },
  ],
  setGeneratedContent: mockSetGeneratedContent,
  selectedContentId: "0",
  setSelectedContentId: vi.fn(),
  mode: "reference-photo",
  isGeneratingCaption: false,
  handleGenerateCaption: vi.fn(),
  businessProfile: null,
  referenceDescription: "Jaqueta de Couro",
  postSummary: "",
};

vi.mock("../context/WizardContext", () => ({
  useWizard: () => mockWizardState,
  WizardProvider: ({ children }: any) => <div>{children}</div>,
}));

describe("Step5ReviewPublish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders correctly with mock state", () => {
    render(<Step5ReviewPublish />);
    expect(screen.getByText("Editar Conteúdo")).toBeInTheDocument();
    expect(screen.getByText("Melhorar Texto com IA")).toBeInTheDocument();
  });

  it("calls /api/conteudo/melhorar-texto with format structured and updates content on click", async () => {
    const mockApiResponse = {
      titulo: "Novo Título com IA",
      legenda: "Legenda persuasiva gerada pela IA",
      hashtags: ["#novidade", "#estilo", "#incrivel"],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    render(<Step5ReviewPublish />);

    const enhanceButton = screen.getByRole("button", {
      name: /Melhorar Texto com IA/i,
    });
    expect(enhanceButton).toBeInTheDocument();

    fireEvent.click(enhanceButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/conteudo/melhorar-texto",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"format":"structured"'),
        })
      );
    });

    await waitFor(() => {
      expect(mockSetGeneratedContent).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Texto aprimorado com sucesso!",
        })
      );
    });
  });
});


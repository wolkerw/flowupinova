import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageGenerationWizard } from "../_components/ImageGenerationWizard";

// Mock router e searchParams
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue("general") }),
}));

// Mock auth estático para evitar loops infinitos (conforme AGENTS.md)
const mockAuth = {
  user: { uid: "test-user-123", email: "user@numvapt.com.br" },
  loading: false,
};
vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => mockAuth,
}));

// Mock firebase
vi.mock("@/lib/firebase", () => ({
  db: {},
  storage: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({
      name: "NumVapt Store",
      primaryColor: "#0083C7",
      brandKit: { visualGuidelines: "Design limpo e moderno" },
    }),
  }),
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock framer-motion para evitar problemas de animação em testes JSDOM
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("ImageGenerationWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renderiza a Etapa 1 com campos de briefing e opções de estilo", () => {
    render(<ImageGenerationWizard />);

    expect(screen.getByText(/Geração de Imagens com IA/i)).toBeInTheDocument();
    expect(screen.getByText(/O que você quer criar\?/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continuar com este briefing/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Usar identidade do negócio/i)).toBeInTheDocument();
  });

  it("avança para a Etapa 2 ao preencher briefing e chamar direção visual", async () => {
    const mockVisualDirection = {
      interpretation: "Uma foto cinematográfica de um café",
      subject: "Xícara de café com grãos",
      composition: "Centralizado",
      lighting: "Luz natural dourada",
      style: "Fotográfico",
      brandApplication: "Tons da marca sutis",
      textLayers: [],
      avoid: ["desfoque excessivo"],
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        visualDirection: mockVisualDirection,
        alternativeDirections: [],
      }),
    });

    render(<ImageGenerationWizard />);

    const textarea = screen.getByPlaceholderText(
      /Crie uma foto publicitária de um bolo de chocolate/i
    );
    fireEvent.change(textarea, {
      target: { value: "Uma xícara de café gourmet na mesa de madeira" },
    });

    const continueBtn = screen.getByRole("button", {
      name: /Continuar com este briefing/i,
    });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText(/Etapa 2: Direção Visual Interpretada/i)).toBeInTheDocument();
      expect(screen.getByText(/Uma foto cinematográfica de um café/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Gerar Agora com IA/i })).toBeInTheDocument();
    });
  });

  it("permite selecionar modo de infográfico e preencher headline comercial", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        visualDirection: {
          interpretation: "Cartaz infográfico",
          subject: "Café especial",
          composition: "Infográfico com badges",
          lighting: "Estúdio comercial",
          style: "Design gráfico",
          brandApplication: "",
          textLayers: [],
          avoid: [],
        },
        alternativeDirections: [],
      }),
    });

    render(<ImageGenerationWizard />);

    // Verifica que a seção de Textos e Infográficos está visível
    expect(screen.getByText(/5\. Textos e Infográficos na Imagem/i)).toBeInTheDocument();
    expect(screen.getByText(/Fotografia Pura/i)).toBeInTheDocument();
    expect(screen.getByText(/Título Comercial/i)).toBeInTheDocument();
    expect(screen.getByText(/Infográfico Completo/i)).toBeInTheDocument();

    // Clica no card de Infográfico Completo
    const infographicCard = screen.getByTestId("overlay-mode-INFOGRAPHIC");
    fireEvent.click(infographicCard);

    // O campo de título/slogan opcional deve aparecer
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/30% OFF NO SEGUNDO ITEM/i)
      ).toBeInTheDocument();
    });

    const headlineInput = screen.getByPlaceholderText(/30% OFF NO SEGUNDO ITEM/i);
    // Digita um slogan
    fireEvent.change(headlineInput, { target: { value: "O MELHOR GRÃO DO BRASIL" } });

    // Preenche briefing e avança
    const textarea = screen.getByPlaceholderText(
      /Crie uma foto publicitária de um bolo de chocolate/i
    );
    fireEvent.change(textarea, {
      target: { value: "Post de promoção de café artesanal" },
    });

    const continueBtn = screen.getByRole("button", {
      name: /Continuar com este briefing/i,
    });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/imagens/direcao-visual",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"textOverlayMode":"INFOGRAPHIC"'),
        })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/imagens/direcao-visual",
        expect.objectContaining({
          body: expect.stringContaining('"productHeadline":"O MELHOR GRÃO DO BRASIL"'),
        })
      );
    });
  });
});


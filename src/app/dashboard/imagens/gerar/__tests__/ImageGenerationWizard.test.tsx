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

// Mock toast estático
const mockToastFn = vi.fn();
const mockToastHook = { toast: mockToastFn };
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => mockToastHook,
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

  it("renderiza a Etapa 1 com campos de briefing e botão de gerar imagem direto", () => {
    render(<ImageGenerationWizard />);

    expect(screen.getByText(/Geração de Imagens com IA/i)).toBeInTheDocument();
    expect(screen.getByText(/O que você quer criar\?/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Gerar Imagem com IA/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Usar identidade do negócio/i)).toBeInTheDocument();
    // Confirma que a opção de seleção de estilo visual foi removida do front-end
    expect(screen.queryByText(/Qual o estilo visual/i)).toBeNull();
  });

  it("avança diretamente para a Etapa 2 ao preencher briefing e chamar gerar", async () => {
    const mockAsset = {
      id: "asset_test_1",
      generationId: "gen-123",
      userId: "test-user-123",
      order: 0,
      status: "ready",
      originalUrl: "https://example.com/test-image.png",
      altText: "Café gourmet",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        generationId: "gen-123",
        assets: [mockAsset],
      }),
    });

    render(<ImageGenerationWizard />);

    const textarea = screen.getByPlaceholderText(
      /Crie uma foto publicitária de um bolo de chocolate/i
    );
    fireEvent.change(textarea, {
      target: { value: "Uma xícara de café gourmet na mesa de madeira" },
    });

    const generateBtn = screen.getByRole("button", {
      name: /Gerar Imagem com IA/i,
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/imagens/gerar",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"brief":"Uma xícara de café gourmet na mesa de madeira"'),
        })
      );
      expect(screen.getByText(/Etapa 2: Sua Imagem Gerada/i)).toBeInTheDocument();
    });
  });

  it("traz modo de infográfico completo selecionado por padrão como primeira opção e permite preencher headline", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        generationId: "gen-456",
        assets: [],
      }),
    });

    render(<ImageGenerationWizard />);

    // Verifica que a seção de Textos e Infográficos está visível como item 4
    expect(screen.getByText(/4\. Textos e Infográficos na Imagem/i)).toBeInTheDocument();
    expect(screen.getByText(/Infográfico Completo/i)).toBeInTheDocument();
    expect(screen.getByText(/Título Comercial/i)).toBeInTheDocument();
    expect(screen.getByText(/Fotografia Pura/i)).toBeInTheDocument();

    // Como Infográfico Completo já vem selecionado por padrão, o campo de slogan/título já está visível
    const headlineInput = screen.getByPlaceholderText(/30% OFF NO SEGUNDO ITEM/i);
    expect(headlineInput).toBeInTheDocument();

    // Digita um slogan
    fireEvent.change(headlineInput, { target: { value: "O MELHOR GRÃO DO BRASIL" } });

    // Preenche briefing e avança direto para a geração
    const textarea = screen.getByPlaceholderText(
      /Crie uma foto publicitária de um bolo de chocolate/i
    );
    fireEvent.change(textarea, {
      target: { value: "Post de promoção de café artesanal" },
    });

    const generateBtn = screen.getByRole("button", {
      name: /Gerar Imagem com IA/i,
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/imagens/gerar",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"textOverlayMode":"INFOGRAPHIC"'),
        })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/imagens/gerar",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"style":"automatic"'),
        })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/imagens/gerar",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"productHeadline":"O MELHOR GRÃO DO BRASIL"'),
        })
      );
    });
  });

  it("avança para a Etapa 3 de Conclusão ao clicar em Avançar para Concluir", async () => {
    const mockAsset = {
      id: "asset_test_ready",
      generationId: "gen-789",
      userId: "test-user-123",
      order: 0,
      status: "ready",
      originalUrl: "https://example.com/ready.png",
      altText: "Foto Pronta",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        generationId: "gen-789",
        assets: [mockAsset],
      }),
    });

    render(<ImageGenerationWizard />);

    const textarea = screen.getByPlaceholderText(
      /Crie uma foto publicitária de um bolo de chocolate/i
    );
    fireEvent.change(textarea, { target: { value: "Bolo vulcão de brigadeiro" } });

    const generateBtn = screen.getByRole("button", { name: /Gerar Imagem com IA/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Etapa 2: Sua Imagem Gerada/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Avançar para Concluir/i })).toBeInTheDocument();
    });

    const advanceBtn = screen.getByRole("button", { name: /Avançar para Concluir/i });
    fireEvent.click(advanceBtn);

    await waitFor(() => {
      expect(screen.getByText(/Tudo Pronto! Sua imagem já está salva na Galeria/i)).toBeInTheDocument();
    });
  });
});


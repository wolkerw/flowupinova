import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BrandStudioPage from "../page";

// Mocks do Auth e Toast
const mockUser = { uid: "test-user-studio", email: "studio@numvapt.com" };
vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock do onboarding-service
vi.mock("@/lib/services/onboarding-service", () => ({
  getOnboardingProfile: vi.fn().mockResolvedValue({
    name: "Barbearia Vintage",
    category: "Barbearia e Estética Masculina",
    slogan: "Corte clássico, estilo moderno",
    primaryColor: "#0083C7",
    secondaryColor: "#FA6305",
    logo: { url: "https://exemplo.com/logo-antigo.png", width: 500, height: 500 },
  }),
  updateOnboardingProfile: vi.fn().mockResolvedValue(true),
}));

// Mock do fetch global
global.fetch = vi.fn().mockImplementation(async (url: string) => {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      imageUrl: "data:image/svg+xml;utf8,<svg>mock</svg>",
      modelUsed: "gpt-image-2.5-sunburst",
      brandPalette: { primary: "#0083C7", secondary: "#FA6305" },
      variations: [{ id: "primary", name: "Símbolo Principal" }],
    }),
  } as any;
});

describe("BrandStudioPage - Estúdio de Marca (Mini Agência NumVapt com GPT-2.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o cabeçalho, as abas de fases e preenche com os dados do Cérebro do Negócio", async () => {
    render(<BrandStudioPage />);

    expect(screen.getByText("Estúdio de Marca & Papelaria")).toBeDefined();
    expect(screen.getByText("Mini Agência NumVapt")).toBeDefined();

    // Abas de Fases e Modelo GPT-2.5
    expect(screen.getByText(/1\. Logo Studio/i)).toBeDefined();
    expect(screen.getByText("2. Papelaria & Digital")).toBeDefined();
    expect(screen.getByText("3. PDV & Credibilidade")).toBeDefined();

    // Aguarda carregar dados do Cérebro do Negócio
    await waitFor(() => {
      const inputNome = screen.getByPlaceholderText("Ex: NumVapt Marketing") as HTMLInputElement;
      expect(inputNome.value).toBe("Barbearia Vintage");
    });
  });

  it("permite alternar entre os modos e carregar / trocar logotipo para remodelação", async () => {
    render(<BrandStudioPage />);

    const btnRedesign = screen.getByText("🔄 Modernizar / Remodelar");
    fireEvent.click(btnRedesign);

    await waitFor(() => {
      expect(screen.getByText("Logotipo Atual (Para Modernização / Vetorização)")).toBeDefined();
      expect(screen.getByRole("button", { name: /Modernizar e Vetorizar Logomarca/i })).toBeDefined();
    });

    // Testar botão Trocar e Remover logotipo
    const btnTrocar = screen.getByRole("button", { name: /Trocar/i });
    expect(btnTrocar).toBeDefined();

    const btnRemover = screen.getByTitle("Remover logotipo");
    fireEvent.click(btnRemover);

    await waitFor(() => {
      expect(screen.getByText("Clique para enviar a imagem da sua logo antiga")).toBeDefined();
    });

    const btnCreate = screen.getByText("🪄 Criar do Zero");
    fireEvent.click(btnCreate);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Gerar Nova Logomarca/i })).toBeDefined();
    });
  });

  it("dispara a geração de logo por IA via GPT-2.5 e exibe o botão de salvar no Cérebro do Negócio", async () => {
    render(<BrandStudioPage />);

    await waitFor(() => {
      const btnGerar = screen.getByRole("button", { name: /Gerar Nova Logomarca/i });
      expect(btnGerar).toBeDefined();
    });

    const btnGerar = screen.getByRole("button", { name: /Gerar Nova Logomarca/i });
    fireEvent.click(btnGerar);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Definir Opção Ativa como Logo Oficial no Cérebro/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /^Baixar PNG$/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Baixar PNG \(Transparente\)/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Não gostei, gerar outra opção/i })).toBeDefined();
    });
  });

  it("permite gerar outra opção caso o usuário não goste da primeira e alternar entre as opções geradas", async () => {
    render(<BrandStudioPage />);

    await waitFor(() => {
      const btnGerar = screen.getByRole("button", { name: /Gerar Nova Logomarca/i });
      expect(btnGerar).toBeDefined();
    });

    // 1ª Geração
    fireEvent.click(screen.getByRole("button", { name: /Gerar Nova Logomarca/i }));

    await waitFor(() => {
      expect(screen.getByText("Opção 1")).toBeDefined();
      expect(screen.getByRole("button", { name: /Não gostei, gerar outra opção/i })).toBeDefined();
    });

    // 2ª Geração (caso não goste da primeira)
    fireEvent.click(screen.getByRole("button", { name: /Não gostei, gerar outra opção/i }));

    await waitFor(() => {
      expect(screen.getByText("Opção 2")).toBeDefined();
      expect(screen.getByText(/Opções Criadas para Comparar \(2\)/i)).toBeDefined();
    });

    // Clicar de volta na Opção 1 para alternar
    fireEvent.click(screen.getByText("Opção 1"));
    await waitFor(() => {
      expect(screen.getByText("Opção 1")).toBeDefined();
    });
  });

  it("permite acionar o download do logotipo em formato PNG transparente", async () => {
    render(<BrandStudioPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Gerar Nova Logomarca/i })).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: /Gerar Nova Logomarca/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Baixar PNG \(Transparente\)/i })).toBeDefined();
    });

    const btnTransparente = screen.getByRole("button", { name: /Baixar PNG \(Transparente\)/i });
    fireEvent.click(btnTransparente);

    expect(btnTransparente).toBeDefined();
  });

  it("renderiza o seletor de modelos de logomarca quando houver múltiplas logos cadastradas no negócio", async () => {
    const { getOnboardingProfile } = await import("@/lib/services/onboarding-service");
    vi.mocked(getOnboardingProfile).mockResolvedValueOnce({
      name: "Barbearia Vintage",
      category: "Barbearia e Estética Masculina",
      slogan: "Corte clássico, estilo moderno",
      primaryColor: "#0083C7",
      secondaryColor: "#FA6305",
      logos: {
        horizontal: { url: "https://exemplo.com/logo-horizontal.png", width: 500, height: 200 },
        symbol: { url: "https://exemplo.com/logo-simbolo.png", width: 300, height: 300 },
        light: { url: "https://exemplo.com/logo-clara.png", width: 500, height: 200 },
      },
    });

    render(<BrandStudioPage />);

    await waitFor(() => {
      expect(screen.getByText("Modelos de Logomarca do Negócio")).toBeInTheDocument();
      expect(screen.getByText("3 disponíveis")).toBeInTheDocument();
      expect(screen.getByText("Horizontal")).toBeInTheDocument();
      expect(screen.getByText("Símbolo / Ícone")).toBeInTheDocument();
      expect(screen.getByText("Versão Clara")).toBeInTheDocument();
    });

    // Clicar na logo Símbolo
    const simboloBtn = screen.getByText("Símbolo / Ícone");
    fireEvent.click(simboloBtn);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Logotipo Selecionado: Símbolo / Ícone",
      })
    );
  });
});

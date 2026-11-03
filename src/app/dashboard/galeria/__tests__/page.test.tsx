import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GaleriaPage from "../page";

// Mock do useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock do Auth
const mockUser = { uid: "user_galeria_123", email: "user@teste.com" };
vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

// Mock do useToast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mocks do Firebase Firestore
let mockGalleryDocs: any[] = [];
let mockPostsDocs: any[] = [];

vi.mock("@/lib/firebase", () => ({
  db: {},
  storage: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  doc: vi.fn(),
  deleteDoc: vi.fn().mockResolvedValue(true),
  addDoc: vi.fn().mockResolvedValue({ id: "new_post_id" }),
  Timestamp: {
    now: () => ({ seconds: 1730300000, nanoseconds: 0 }),
    fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }),
  },
  onSnapshot: vi.fn((queryRef, onNext) => {
    // Simula snapshot assíncrono para gallery e posts
    setTimeout(() => {
      // Se for gallery
      if (onNext) {
        onNext({
          docs: mockGalleryDocs.map((docData) => ({
            id: docData.id,
            data: () => docData,
          })),
        });
      }
    }, 0);
    return () => {};
  }),
}));

// Mock do Next/Image
vi.mock("next/image", () => ({
  default: (props: any) => {
    return <img src={props.src} alt={props.alt || "image"} />;
  },
}));

describe("GaleriaPage - Cards de Carrossel Unificados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockGalleryDocs = [];
    mockPostsDocs = [];
  });

  it("renderiza um item de carrossel estruturado como um único card com contador de fotos", async () => {
    mockGalleryDocs = [
      {
        id: "gal_carousel_1",
        url: "https://example.com/slide1.jpg",
        mediaUrls: [
          "https://example.com/slide1.jpg",
          "https://example.com/slide2.jpg",
          "https://example.com/slide3.jpg",
        ],
        itemCount: 3,
        type: "carousel",
        caption: "Sobrado dos sonhos te espera! 🏡",
        createdAt: { seconds: 1730300000 },
        isPublished: false,
      },
    ];

    render(<GaleriaPage />);

    // Aguarda o carregamento dos itens
    await waitFor(() => {
      expect(screen.getByText("Sobrado dos sonhos te espera! 🏡")).toBeDefined();
    });

    // Deve exibir o badge de carrossel com contador 1/3
    expect(screen.getByText("1/3")).toBeDefined();

    // Deve permitir navegar para a próxima foto do carrossel
    const nextBtn = screen.getByLabelText("Próxima foto");
    fireEvent.click(nextBtn);

    // O contador deve mudar para 2/3
    await waitFor(() => {
      expect(screen.getByText("2/3")).toBeDefined();
    });
  });

  it("agrupa itens legados avulsos salvos juntos com a mesma legenda em um único card", async () => {
    // 3 imagens salvas avulsas na mesma hora com a mesma legenda
    mockGalleryDocs = [
      {
        id: "loose_1",
        url: "https://example.com/quarto.jpg",
        caption: "Lindo imóvel com vista privilegiada 🌇",
        createdAt: { seconds: 1730300010 },
        type: "image",
        isPublished: false,
      },
      {
        id: "loose_2",
        url: "https://example.com/sala.jpg",
        caption: "Lindo imóvel com vista privilegiada 🌇",
        createdAt: { seconds: 1730300012 },
        type: "image",
        isPublished: false,
      },
      {
        id: "loose_3",
        url: "https://example.com/cozinha.jpg",
        caption: "Lindo imóvel com vista privilegiada 🌇",
        createdAt: { seconds: 1730300015 },
        type: "image",
        isPublished: false,
      },
    ];

    render(<GaleriaPage />);

    await waitFor(() => {
      // Deve ter apenas 1 card consolidado para a legenda compartilhada
      const captions = screen.getAllByText("Lindo imóvel com vista privilegiada 🌇");
      expect(captions.length).toBe(1);
    });

    // Deve mostrar o badge de carrossel consolidado 1/3
    expect(screen.getByText("1/3")).toBeDefined();

    // A capa oficial (Slide 1) DEVE ser a primeira enviada (quarto.jpg) e NÃO a última (cozinha.jpg)
    const img = screen.getByAltText(/Slide 1/i) as HTMLImageElement;
    expect(img.src).toContain("quarto.jpg");
  });

  it("ao clicar em 'Criar Post' em um carrossel, salva todas as fotos na sessionStorage e redireciona", async () => {
    mockGalleryDocs = [
      {
        id: "gal_carousel_2",
        url: "https://example.com/capa.jpg",
        mediaUrls: ["https://example.com/capa.jpg", "https://example.com/foto2.jpg"],
        itemCount: 2,
        type: "carousel",
        caption: "Super oportunidade de carrossel",
        createdAt: { seconds: 1730300000 },
        isPublished: false,
      },
    ];

    render(<GaleriaPage />);

    await waitFor(() => {
      expect(screen.getByText("Super oportunidade de carrossel")).toBeDefined();
    });

    const criarPostBtn = screen.getByRole("button", { name: /Criar Post/i });
    fireEvent.click(criarPostBtn);

    // Deve salvar no sessionStorage
    const stored = sessionStorage.getItem("preloaded_gallery_image");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.type).toBe("carousel");
    expect(parsed.mediaUrls).toEqual(["https://example.com/capa.jpg", "https://example.com/foto2.jpg"]);
    expect(parsed.caption).toBe("Super oportunidade de carrossel");

    // Deve redirecionar para a rota de criação
    expect(mockPush).toHaveBeenCalledWith("/dashboard/posts/criar?from_gallery=true");
  });

  it("ao clicar no botão de maximizar em um carrossel, abre o modal de visualização permitindo folhear os slides", async () => {
    mockGalleryDocs = [
      {
        id: "gal_carousel_view",
        url: "https://example.com/slide1.jpg",
        mediaUrls: [
          "https://example.com/slide1.jpg",
          "https://example.com/slide2.jpg",
        ],
        itemCount: 2,
        type: "carousel",
        caption: "Carrossel para visualização completa",
        createdAt: { seconds: 1730300000 },
        isPublished: false,
      },
    ];

    render(<GaleriaPage />);

    await waitFor(() => {
      expect(screen.getByText("Carrossel para visualização completa")).toBeDefined();
    });

    const maxBtn = screen.getByTitle("Visualizar em tamanho grande");
    fireEvent.click(maxBtn);

    // Deve abrir o modal com o badge do carrossel
    expect(screen.getByText(/Carrossel \(1 de 2\)/i)).toBeDefined();

    // Deve navegar para o próximo slide dentro do modal
    const nextModalBtn = screen.getByLabelText("Próxima foto no modal");
    fireEvent.click(nextModalBtn);

    expect(screen.getByText(/Carrossel \(2 de 2\)/i)).toBeDefined();
  });

  it("permite excluir um carrossel agrupado deletando todos os IDs e ignorando erro de storage ausente", async () => {
    mockGalleryDocs = [
      {
        id: "loose_a",
        url: "https://example.com/slideA.jpg",
        caption: "Carrossel para teste de deleção",
        createdAt: { seconds: 1730300010 },
        type: "image",
        storagePath: "users/test/missing.jpg",
        isPublished: false,
      },
      {
        id: "loose_b",
        url: "https://example.com/slideB.jpg",
        caption: "Carrossel para teste de deleção",
        createdAt: { seconds: 1730300012 },
        type: "image",
        storagePath: "users/test/missing.jpg",
        isPublished: false,
      },
    ];

    vi.spyOn(window, "confirm").mockImplementation(() => true);

    render(<GaleriaPage />);

    await waitFor(() => {
      expect(screen.getByText("Carrossel para teste de deleção")).toBeDefined();
    });

    const trashButtons = screen.getAllByRole("button");
    const trashBtn = trashButtons.find((btn) => btn.className.includes("destructive"));
    expect(trashBtn).toBeDefined();

    fireEvent.click(trashBtn!);

    await waitFor(() => {
      expect(screen.queryByText("Carrossel para teste de deleção")).toBeNull();
    });
  });
});

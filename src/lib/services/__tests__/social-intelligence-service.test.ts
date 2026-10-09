import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectSocialIntelligence } from "../social-intelligence-service";

// Mock do firebase-admin
const mockUserGet = vi.fn();
const mockConnectionGet = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockImplementation((docId: string) => ({
        get: mockUserGet,
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            get: mockConnectionGet,
          }),
        }),
      })),
    }),
  },
}));

describe("social-intelligence-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna resumo vazio quando userId não é fornecido", async () => {
    const result = await collectSocialIntelligence("");
    expect(result.hasSocialData).toBe(false);
    expect(result.combinedPromptContext).toBe("");
  });

  it("coleta dados de perfil e mídias do Instagram quando o usuário possui conexão ativa", async () => {
    mockUserGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ website: "https://minhaempresa.com.br" }),
    });

    mockConnectionGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        isConnected: true,
        accessToken: "valid-instagram-token",
        instagramUsername: "empresa_oficial",
      }),
    });

    // Mock das chamadas fetch (Graph API e Web Scraper)
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("graph.instagram.com/me?fields")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: "123",
            username: "empresa_oficial",
            name: "Empresa Oficial LTDA",
            biography: "Soluções corporativas inovadoras para o seu negócio.",
            website: "https://minhaempresa.com.br",
          }),
        });
      }

      if (url.includes("graph.instagram.com/me/media")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [
              { caption: "Novo produto lançado hoje com grande sucesso!" },
              { caption: "Confira nossos bastidores e cultura de trabalho em equipe." },
            ],
          }),
        });
      }

      if (url.includes("graph.facebook.com")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [
              {
                id: "fb-page-1",
                name: "Empresa Oficial no Face",
                about: "Página corporativa com conteúdos diários.",
                category: "Empresa de Tecnologia",
                phone: "(11) 98888-7777",
              },
            ],
          }),
        });
      }

      if (url.includes("minhaempresa.com.br")) {
        return Promise.resolve({
          ok: true,
          text: async () => `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Empresa Oficial - Tecnologia e Inovação</title>
                <meta name="description" content="Ajudamos marcas a escalarem com inteligência." />
              </head>
              <body>
                <h1>Transformação Digital para PMEs</h1>
                <p>Nossos serviços aceleram resultados com transparência e segurança.</p>
              </body>
            </html>
          `,
        });
      }

      return Promise.resolve({ ok: false });
    }) as any;

    const result = await collectSocialIntelligence("user-123");

    expect(result.hasSocialData).toBe(true);
    expect(result.instagram?.username).toBe("@empresa_oficial");
    expect(result.instagram?.name).toBe("Empresa Oficial LTDA");
    expect(result.instagram?.bio).toContain("Soluções corporativas");
    expect(result.instagram?.recentPostsCaptions.length).toBe(2);

    expect(result.facebook?.pageName).toBe("Empresa Oficial no Face");
    expect(result.facebook?.category).toBe("Empresa de Tecnologia");

    expect(result.website?.title).toContain("Empresa Oficial");
    expect(result.combinedPromptContext).toContain("[INSTAGRAM OFICIAL]: @empresa_oficial");
    expect(result.combinedPromptContext).toContain("[PÁGINA OFICIAL DO FACEBOOK]: Empresa Oficial no Face");
    expect(result.combinedPromptContext).toContain("[PRESENÇA NA WEB & SITE INSTITUCIONAL]");
  });
});

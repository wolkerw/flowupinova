import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", () => ({
  getAuthenticatedUser: vi.fn(),
}));

import { getAuthenticatedUser } from "@/lib/api-auth";

describe("API /api/ai/generate-brandbook", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-openai-key" };
  });

  it("retorna 401 se usuário não estiver autenticado", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/ai/generate-brandbook", {
      method: "POST",
      body: JSON.stringify({ imageBase64: "dGVzdA==" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Autenticação obrigatória");
  });

  it("retorna 400 se imageBase64 não for fornecido", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      uid: "user-123",
      email: "user@test.com",
    });

    const req = new NextRequest("http://localhost:3000/api/ai/generate-brandbook", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("imagem da logomarca");
  });

  it("gera o Brand Book com sucesso quando a OpenAI responde com JSON válido", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      uid: "user-123",
      email: "user@test.com",
    });

    const mockBrandBook = {
      meta: {
        brandName: "Home Produtora",
        segment: "Audiovisual",
        generatedAt: "Outubro de 2026",
        version: "1.0",
      },
      fundamentos: {
        proposito: "Dar forma visual a ideias que merecem ser lembradas.",
        missao: "Planejar e produzir conteúdo audiovisual com intenção.",
        visao: "Ser referência.",
        valores: [{ valor: "Clareza", comoApareceNaPratica: "Briefings alinhados." }],
        personalidadeCincoPalavras: ["Criativa", "Próxima", "Inteligente", "Confiável", "Dinâmica"],
        promessaDaMarca: "Processo claro e colaborativo.",
        razoesParaAcreditar: ["Processo integrado"],
      },
      posicionamento: {
        declaracaoPosicionamento: "Para empresas que precisam de impacto...",
        categoriaMentalDesejada: "Parceira audiovisual",
        propostaDeValor: "Vídeos e conteúdos com ideia e propósito.",
        diferenciais: [{ diferencial: "Pensamento antes da câmera", evidenciaPratica: "Roteiro definido", comoComunicar: "Criamos junto." }],
        posicionamentosAEvitar: ["Competir por preço"],
        taglineRecomendada: "Ideias que ganham vida em vídeos.",
        alternativasCampanhas: ["Vídeos que comunicam."],
      },
      publicosEPersonas: {
        segmentos: [{ segmento: "Marketing", oQuePrecisa: "Conteúdo", solucoesComAderencia: "Vídeos", prioridade: "Alta" }],
        personas: [{
          nome: "Mariana",
          subtitulo: "Líder de marketing",
          perfil: "35 anos",
          objetivos: "Fortalecer marca",
          dores: "Fornecedores sem processo",
          objecoes: "Como justificar",
          oQueGeraConfianca: "Portfólio",
          mensagemParaEla: "Vamos transformar seu objetivo em plano.",
        }],
        comoUsarPersonas: ["Usar na proposta"],
      },
      arquetiposEPersonalidade: {
        arquetipoPrincipal: { nome: "O Criador", descricao: "Imaginação e expressão" },
        arquetipoSecundario: { nome: "O Sábio", descricao: "Clareza" },
        tracoRelacionalDeApoio: { nome: "O Companheiro", descricao: "Colaborativo" },
        equilibrioPersonalidade: [{ aMarcaE: "Criativa", naoE: "Artística demais" }],
      },
      tomDeVoz: {
        principioVerbal: "Falamos como parceira criativa.",
        dimensoes: [{ dimensao: "Clareza", diretriz: "Direto", exemplo: "Frase exemplo" }],
        vocabularioPreferencial: ["intenção", "conexão"],
        usarComCautela: ["viral", "disruptivo"],
        regrasEditoriais: ["Começar pelo problema"],
      },
      mensagensChave: {
        mensagemCentral: "Transforma ideias em vídeos.",
        pilaresDeMensagem: [{ pilar: "Pensamos junto", oQueQueremosQueEntenda: "Escuta", provaConteudoQueSustenta: "Briefing" }],
        elevatorPitch15s: "Pitch rápido",
        apresentacao45s: "Apresentação",
        chamadasParaAcao: ["Vamos conversar"],
        exemplosPorContexto: [{ contexto: "Site", mensagemSugerida: "Vídeos com intenção" }],
      },
      identidadeVisual: {
        ideiaVisual: "Casa + play + balão",
        paletaCromatica: [{ nomeCor: "Amarelo", hex: "#FFC928", papel: "Destaque", usoSugerido: "Botões" }],
        proporcaoRecomendada: "60-30-10",
        tipografia: {
          fonteTitulos: "Montserrat",
          fonteTextos: "Inter",
          estiloGeral: "Moderno",
          hierarquia: [{ uso: "Título", fontePeso: "Bold", tamanho: "40px" }],
        },
        regrasDeUsoLogo: ["Não distorcer"],
      },
      direcaoDeArteEFotografia: {
        direcaoFotografia: "Luz natural e rostos autênticos",
        principiosVisuais: ["Humanidade"],
        elementosGraficos: "Linhas amarelas",
        diretrizesParaImagensIA: "Estúdio clean, luz suave e sombras sutis.",
      },
      estrategiaConteudoECanais: {
        pilaresEditoriais: [{ pilar: "Educar", participacaoSugerida: "25%", exemplos: "Como fazer briefing" }],
        funcaoCanais: [{ canal: "Instagram", papel: "Visibilidade", conteudoPrioritario: "Reels" }],
        ritmoInicial: "2 a 3 posts por semana",
        estruturaSugeridaCase: "Desafio -> Execução -> Resultado",
      },
      campanhasESlogans: {
        campanhaInstitucional: { titulo: "Ideias que ganham vida", ideia: "Ideia", conceito: "Conceito", cta: "Fale conosco" },
        campanhasSegmentadas: [{ segmento: "PMEs", ideia: "Mostre o valor", conceito: "Histórias reais" }],
        exemploLegendaSocial: "Um bom vídeo começa com a pergunta certa.",
        exemploBioInstagram: "Home | Audiovisual com intenção.",
        headlineSite: "Ideias que ganham vida.",
        subheadlineSite: "Planejamento e produção.",
      },
      metricasEGovernanca: {
        kpis: [{ objetivo: "Reconhecimento", indicadores: "Alcance", frequencia: "Mensal" }],
        planoImplantacao90Dias: [{ periodo: "1-15 dias", prioridades: "Validar", entregaveis: "Entrevistas" }],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(mockBrandBook),
            },
          },
        ],
      }),
    } as any);

    const req = new NextRequest("http://localhost:3000/api/ai/generate-brandbook", {
      method: "POST",
      body: JSON.stringify({
        imageBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        brandNameHint: "Home Produtora",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.brandBook.meta.brandName).toBe("Home Produtora");
    expect(data.brandBook.identidadeVisual.paletaCromatica[0].hex).toBe("#FFC928");
  });
});

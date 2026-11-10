import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrandBookGeneratorTab } from "../BrandBookGeneratorTab";

// Mock do Instagram Service
const mockGetInstagramConnection = vi.fn().mockResolvedValue({
  isConnected: true,
  instagramUsername: "numvapt_oficial",
});

vi.mock("@/lib/services/instagram-service", () => ({
  getInstagramConnection: (...args: any[]) => mockGetInstagramConnection(...args),
}));

describe("BrandBookGeneratorTab Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza a interface de upload sem exibir nomes explícitos de modelos de IA", () => {
    const mockApply = vi.fn().mockResolvedValue(undefined);

    render(
      <BrandBookGeneratorTab
        onApplyToBrain={mockApply}
        currentBrandName="Teste"
        currentSegment="Tecnologia"
      />
    );

    expect(screen.getByText("Gerador de Brand Book Completo por IA")).toBeInTheDocument();
    expect(screen.getByText(/Clique aqui ou arraste a imagem da sua logomarca/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Gerar Brand Book Completo/i })).toBeInTheDocument();

    // Regra do usuário: NUNCA exibir o nome explícito de modelos
    expect(screen.queryByText(/GPT-5/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/OpenAI/i)).not.toBeInTheDocument();
  });

  it("permite abrir os campos opcionais de refinamento", () => {
    const mockApply = vi.fn().mockResolvedValue(undefined);

    render(
      <BrandBookGeneratorTab
        onApplyToBrain={mockApply}
        currentBrandName="Minha Empresa"
        currentSegment="Varejo"
      />
    );

    const toggleBtn = screen.getByText(/Refinar análise com dados adicionais/i);
    fireEvent.click(toggleBtn);

    expect(screen.getByLabelText(/Nome da Marca \(Opcional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Segmento de Atuação \(Opcional\)/i)).toBeInTheDocument();
  });

  it("exibe indicadores de pesquisa ativa no ecossistema digital e contas conectadas", async () => {
    const mockApply = vi.fn().mockResolvedValue(undefined);

    render(
      <BrandBookGeneratorTab
        onApplyToBrain={mockApply}
        currentBrandName="NumVapt"
        currentSegment="Marketing"
        userId="user-123"
        website="https://numvapt.com.br"
      />
    );

    expect(screen.getByText(/Pesquisa Ativa no Ecossistema Digital/i)).toBeInTheDocument();
    expect(screen.getByText(/numvapt.com.br/i)).toBeInTheDocument();
    expect(screen.getByText(/Benchmark de Concorrentes Ativo/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/@numvapt_oficial/i)).toBeInTheDocument();
    });
  });
  it("exibe o banner de Brand Book ativo e as 12 seções quando initialBrandBook é fornecido", () => {
    const mockApply = vi.fn().mockResolvedValue(undefined);
    const sampleBrandBook = {
      meta: {
        brandName: "NumVapt Inova",
        segment: "Marketing Digital",
        generatedAt: "Outubro de 2026",
        version: "1.0",
      },
      fundamentos: {
        proposito: "Impulsionar negócios locais",
        missao: "Entregar IA simples",
        visao: "Liderar marketing ágil",
        valores: [{ valor: "Agilidade", comoApareceNaPratica: "Tudo em 1 clique" }],
        personalidadeCincoPalavras: ["Ágil", "Inovadora", "Confiável", "Moderna", "Acessível"],
        promessaDaMarca: "Resultados em minutos",
        razoesParaAcreditar: ["Tecnologia de ponta"],
      },
      posicionamento: {
        declaracaoPosicionamento: "Posicionamento claro",
        categoriaMentalDesejada: "Líder de IA",
        propostaDeValor: "Criativos profissionais automáticos",
        diferenciais: [{ diferencial: "Super IA", evidenciaPratica: "1 clique", comoComunicar: "Rápido e fácil" }],
        posicionamentosAEvitar: ["Genérico"],
        taglineRecomendada: "Seu marketing num vapt",
        alternativasCampanhas: ["Inovação rápida"],
      },
      publicosEPersonas: {
        segmentos: [{ segmento: "PMEs", oQuePrecisa: "Clientes", solucoesComAderencia: "Posts", prioridade: "Alta" }],
        personas: [
          {
            nome: "Ana Empreendedora",
            subtitulo: "Dona de Loja",
            perfil: "Líder de PME",
            objetivos: "Vender mais",
            dores: "Sem tempo",
            objecoes: "Custo alto",
            oQueGeraConfianca: "Depoimentos",
            mensagemParaEla: "Economize 10h por semana",
          },
        ],
        comoUsarPersonas: ["Use nos criativos"],
      },
      arquetiposEPersonalidade: {
        arquetipoPrincipal: { nome: "O Criador", descricao: "Inovação contínua" },
        arquetipoSecundario: { nome: "O Mago", descricao: "Transformação mágica" },
        tracoRelacionalDeApoio: { nome: "Amigo", descricao: "Proximidade" },
        equilibrioPersonalidade: [{ aMarcaE: "Ágil", naoE: "Apressada" }],
      },
      tomDeVoz: {
        principioVerbal: "Amigável e profissional",
        dimensoes: [{ dimensao: "Clareza", diretriz: "Direto ao ponto", exemplo: "Sem jargões" }],
        vocabularioPreferencial: ["Ágil"],
        usarComCautela: ["Difícil"],
        regrasEditoriais: ["Frases curtas"],
      },
      mensagensChave: {
        mensagemCentral: "Marketing rápido e acessível",
        pilaresDeMensagem: [{ pilar: "Velocidade", oQueQueremosQueEntenda: "É rápido", provaConteudoQueSustenta: "1 clique" }],
        elevatorPitch15s: "Crie posts em segundos",
        apresentacao45s: "A plataforma completa de IA para sua empresa",
        chamadasParaAcao: ["Comece agora"],
        exemplosPorContexto: [{ contexto: "Instagram", mensagemSugerida: "Clique no link" }],
      },
      identidadeVisual: {
        ideiaVisual: "Visual vibrante e tecnológico",
        paletaCromatica: [
          { nomeCor: "Azul NumVapt", hex: "#0083C7", papel: "Primária", usoSugerido: "Fundos e destaques" },
          { nomeCor: "Laranja Acento", hex: "#FA6305", papel: "Secundária", usoSugerido: "Botões" },
        ],
        proporcaoRecomendada: "60-30-10",
        tipografia: {
          fonteTitulos: "Poppins",
          fonteTextos: "Inter",
          estiloGeral: "Sans-serif moderno",
          hierarquia: [{ uso: "Títulos", fontePeso: "Bold", tamanho: "24px" }],
        },
        regrasDeUsoLogo: ["Manter margem segura"],
      },
      direcaoDeArteEFotografia: {
        direcaoFotografia: "Estilo comercial iluminado",
        principiosVisuais: ["Nitidez", "Luz natural"],
        elementosGraficos: "Formas arredondadas",
        diretrizesParaImagensIA: "85mm f/1.8 bokeh suave",
      },
      estrategiaConteudoECanais: {
        pilaresEditoriais: [{ pilar: "Dicas", participacaoSugerida: "40%", exemplos: "Como fazer posts" }],
        funcaoCanais: [{ canal: "Instagram", papel: "Engajamento", conteudoPrioritario: "Reels e carrosséis" }],
        ritmoInicial: "3 posts por semana",
        estruturaSugeridaCase: "Problema -> Solução -> Resultado",
      },
      campanhasESlogans: {
        campanhaInstitucional: { titulo: "Voe Alto", ideia: "Crescimento rápido", conceito: "Tecnologia", cta: "Teste grátis" },
        campanhasSegmentadas: [{ segmento: "Varejo", ideia: "Promoções", conceito: "Vendas rápidas" }],
        exemploLegendaSocial: "Seu marketing nunca mais será o mesmo!",
        exemploBioInstagram: "A IA que cria seu marketing em segundos.",
        headlineSite: "Marketing de alta performance",
        subheadlineSite: "Tudo pronto em 1 clique",
      },
      metricasEGovernanca: {
        kpis: [{ objetivo: "Alcance", indicadores: "Impressões", frequencia: "Semanal" }],
        planoImplantacao90Dias: [{ periodo: "Mês 1", prioridades: "Lançamento", entregaveis: "Brand Book e primeiros posts" }],
      },
    };

    render(
      <BrandBookGeneratorTab
        onApplyToBrain={mockApply}
        currentBrandName="NumVapt Inova"
        currentSegment="Marketing Digital"
        initialBrandBook={sampleBrandBook as any}
      />
    );

    expect(screen.getByText(/Brand Book Ativo no Cérebro do Negócio/i)).toBeInTheDocument();
    expect(screen.getByText(/NumVapt Inova • Manual Estratégico Oficial/i)).toBeInTheDocument();
    expect(screen.getByText(/BRAND BOOK OFICIAL/i)).toBeInTheDocument();
    expect(screen.getByText(/Impulsionar negócios locais/i)).toBeInTheDocument();
    expect(screen.getByText(/Ana Empreendedora/i)).toBeInTheDocument();

    expect(screen.queryByText(/Clique aqui ou arraste a imagem da sua logomarca/i)).not.toBeInTheDocument();

    const generateNewBtn = screen.getByRole("button", { name: /Gerar Nova Versão com IA/i });
    fireEvent.click(generateNewBtn);

    expect(screen.getByText(/Clique aqui ou arraste a imagem da sua logomarca/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Voltar e Ver Brand Book Atual/i })).toBeInTheDocument();
  });

  it("dispara onApplyToBrain com os dados completos do brandBook ao clicar em Aplicar", async () => {
    const mockApply = vi.fn().mockResolvedValue(undefined);
    const sampleBrandBook = {
      meta: {
        brandName: "NumVapt Inova",
        segment: "Marketing Digital",
        generatedAt: "Outubro de 2026",
        version: "1.0",
      },
      fundamentos: {
        proposito: "Impulsionar negócios locais",
        missao: "Entregar IA simples",
        visao: "Liderar marketing ágil",
        valores: [{ valor: "Agilidade", comoApareceNaPratica: "Tudo em 1 clique" }],
        personalidadeCincoPalavras: ["Ágil", "Inovadora", "Confiável", "Moderna", "Acessível"],
        promessaDaMarca: "Resultados em minutos",
        razoesParaAcreditar: ["Tecnologia de ponta"],
      },
      posicionamento: {
        declaracaoPosicionamento: "Posicionamento claro",
        categoriaMentalDesejada: "Líder de IA",
        propostaDeValor: "Criativos profissionais automáticos",
        diferenciais: [{ diferencial: "Super IA", evidenciaPratica: "1 clique", comoComunicar: "Rápido e fácil" }],
        posicionamentosAEvitar: ["Genérico"],
        taglineRecomendada: "Seu marketing num vapt",
        alternativasCampanhas: ["Inovação rápida"],
      },
      publicosEPersonas: {
        segmentos: [{ segmento: "PMEs", oQuePrecisa: "Clientes", solucoesComAderencia: "Posts", prioridade: "Alta" }],
        personas: [
          {
            nome: "Ana Empreendedora",
            subtitulo: "Dona de Loja",
            perfil: "Líder de PME",
            objetivos: "Vender mais",
            dores: "Sem tempo",
            objecoes: "Custo alto",
            oQueGeraConfianca: "Depoimentos",
            mensagemParaEla: "Economize 10h por semana",
          },
        ],
        comoUsarPersonas: ["Use nos criativos"],
      },
      arquetiposEPersonalidade: {
        arquetipoPrincipal: { nome: "O Criador", descricao: "Inovação contínua" },
        arquetipoSecundario: { nome: "O Mago", descricao: "Transformação mágica" },
        tracoRelacionalDeApoio: { nome: "Amigo", descricao: "Proximidade" },
        equilibrioPersonalidade: [{ aMarcaE: "Ágil", naoE: "Apressada" }],
      },
      tomDeVoz: {
        principioVerbal: "Amigável e profissional",
        dimensoes: [{ dimensao: "Clareza", diretriz: "Direto ao ponto", exemplo: "Sem jargões" }],
        vocabularioPreferencial: ["Ágil"],
        usarComCautela: ["Difícil"],
        regrasEditoriais: ["Frases curtas"],
      },
      mensagensChave: {
        mensagemCentral: "Marketing rápido e acessível",
        pilaresDeMensagem: [{ pilar: "Velocidade", oQueQueremosQueEntenda: "É rápido", provaConteudoQueSustenta: "1 clique" }],
        elevatorPitch15s: "Crie posts em segundos",
        apresentacao45s: "A plataforma completa de IA para sua empresa",
        chamadasParaAcao: ["Comece agora"],
        exemplosPorContexto: [{ contexto: "Instagram", mensagemSugerida: "Clique no link" }],
      },
      identidadeVisual: {
        ideiaVisual: "Visual vibrante e tecnológico",
        paletaCromatica: [
          { nomeCor: "Azul NumVapt", hex: "#0083C7", papel: "Primária", usoSugerido: "Fundos e destaques" },
          { nomeCor: "Laranja Acento", hex: "#FA6305", papel: "Secundária", usoSugerido: "Botões" },
        ],
        proporcaoRecomendada: "60-30-10",
        tipografia: {
          fonteTitulos: "Poppins",
          fonteTextos: "Inter",
          estiloGeral: "Sans-serif moderno",
          hierarquia: [{ uso: "Títulos", fontePeso: "Bold", tamanho: "24px" }],
        },
        regrasDeUsoLogo: ["Manter margem segura"],
      },
      direcaoDeArteEFotografia: {
        direcaoFotografia: "Estilo comercial iluminado",
        principiosVisuais: ["Nitidez", "Luz natural"],
        elementosGraficos: "Formas arredondadas",
        diretrizesParaImagensIA: "85mm f/1.8 bokeh suave",
      },
      estrategiaConteudoECanais: {
        pilaresEditoriais: [{ pilar: "Dicas", participacaoSugerida: "40%", exemplos: "Como fazer posts" }],
        funcaoCanais: [{ canal: "Instagram", papel: "Engajamento", conteudoPrioritario: "Reels e carrosséis" }],
        ritmoInicial: "3 posts por semana",
        estruturaSugeridaCase: "Problema -> Solução -> Resultado",
      },
      campanhasESlogans: {
        campanhaInstitucional: { titulo: "Voe Alto", ideia: "Crescimento rápido", conceito: "Tecnologia", cta: "Teste grátis" },
        campanhasSegmentadas: [{ segmento: "Varejo", ideia: "Promoções", conceito: "Vendas rápidas" }],
        exemploLegendaSocial: "Seu marketing nunca mais será o mesmo!",
        exemploBioInstagram: "A IA que cria seu marketing em segundos.",
        headlineSite: "Marketing de alta performance",
        subheadlineSite: "Tudo pronto em 1 clique",
      },
      metricasEGovernanca: {
        kpis: [{ objetivo: "Alcance", indicadores: "Impressões", frequencia: "Semanal" }],
        planoImplantacao90Dias: [{ periodo: "Mês 1", prioridades: "Lançamento", entregaveis: "Brand Book e primeiros posts" }],
      },
    };

    render(
      <BrandBookGeneratorTab
        onApplyToBrain={mockApply}
        currentBrandName="NumVapt Inova"
        currentSegment="Marketing Digital"
        initialBrandBook={sampleBrandBook as any}
      />
    );

    const applyBtn = screen.getByRole("button", { name: /Aplicar ao Cérebro do Negócio/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(mockApply).toHaveBeenCalledWith(
        expect.objectContaining({
          primaryColor: "#0083C7",
          secondaryColor: "#FA6305",
          primaryFont: "Poppins",
          secondaryFont: "Inter",
          slogan: "Seu marketing num vapt",
          brandBook: expect.objectContaining({
            meta: expect.objectContaining({
              brandName: "NumVapt Inova",
              appliedToBrain: true,
            }),
          }),
        })
      );
    });

    // Após aplicar, o botão passa a ser exibido como 'Já Aplicado ao Cérebro do Negócio' e fica desabilitado
    expect(screen.getByRole("button", { name: /Já Aplicado ao Cérebro do Negócio/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Diretrizes Já Aplicadas ao Cérebro do Negócio/i })).toBeDisabled();
  });

  it("renderiza o botão já desabilitado se o brandBook inicial já possuir appliedToBrain=true", () => {
    const mockApply = vi.fn();
    const sampleAppliedBrandBook = {
      meta: {
        brandName: "Wanna Contabilidade",
        segment: "Contabilidade",
        generatedAt: "Novembro de 2026",
        version: "1.0 Estratégica",
        appliedToBrain: true,
      },
      fundamentos: {
        proposito: "Facilitar finanças",
        missao: "Contabilidade ágil",
        visao: "Ser referência",
        valores: [],
        personalidadeCincoPalavras: ["Segurança"],
        promessaDaMarca: "Sem burocracia",
        razoesParaAcreditar: [],
      },
      posicionamento: {
        declaracaoPosicionamento: "Líder contábil",
        categoriaMentalDesejada: "Contabilidade Premium",
        propostaDeValor: "Gestão completa",
        diferenciais: [],
        posicionamentosAEvitar: [],
        taglineRecomendada: "Simples assim",
        alternativasCampanhas: [],
      },
      publicosEPersonas: { segmentos: [], personas: [], comoUsarPersonas: [] },
      arquetiposEPersonalidade: {
        arquetipoPrincipal: { nome: "Governante", descricao: "" },
        arquetipoSecundario: { nome: "Sábio", descricao: "" },
        tracoRelacionalDeApoio: { nome: "Prestativo", descricao: "" },
        equilibrioPersonalidade: [],
      },
      tomDeVoz: {
        principioVerbal: "Formal e claro",
        dimensoes: [],
        vocabularioPreferencial: [],
        usarComCautela: [],
        regrasEditoriais: [],
      },
      mensagensChave: {
        mensagemCentral: "Foco no seu crescimento",
        pilaresDeMensagem: [],
        elevatorPitch15s: "",
        apresentacao45s: "",
        chamadasParaAcao: [],
        exemplosPorContexto: [],
      },
      identidadeVisual: {
        ideiaVisual: "Verde e confiança",
        paletaCromatica: [],
        proporcaoRecomendada: "60-30-10",
        tipografia: { fonteTitulos: "Poppins", fonteTextos: "Inter", estiloGeral: "Moderno", hierarquia: [] },
        regrasDeUsoLogo: [],
      },
      direcaoDeArteEFotografia: { direcaoFotografia: "", principiosVisuais: [], elementosGraficos: "", diretrizesParaImagensIA: "" },
      estrategiaConteudoECanais: { pilaresEditoriais: [], funcaoCanais: [], ritmoInicial: "", estruturaSugeridaCase: "" },
      campanhasESlogans: {
        campanhaInstitucional: { titulo: "", ideia: "", conceito: "", cta: "" },
        campanhasSegmentadas: [],
        exemploLegendaSocial: "",
        exemploBioInstagram: "",
        headlineSite: "",
        subheadlineSite: "",
      },
      metricasEGovernanca: { kpis: [], planoImplantacao90Dias: [] },
    };

    render(
      <BrandBookGeneratorTab
        onApplyToBrain={mockApply}
        currentBrandName="Wanna Contabilidade"
        currentSegment="Contabilidade"
        initialBrandBook={sampleAppliedBrandBook as any}
      />
    );

    const appliedBtn = screen.getByRole("button", { name: /Já Aplicado ao Cérebro do Negócio/i });
    expect(appliedBtn).toBeInTheDocument();
    expect(appliedBtn).toBeDisabled();
  });
});

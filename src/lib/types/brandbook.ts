export interface BrandBookData {
  meta: {
    brandName: string;
    segment: string;
    generatedAt: string;
    version: string;
  };
  fundamentos: {
    proposito: string;
    missao: string;
    visao: string;
    valores: Array<{ valor: string; comoApareceNaPratica: string }>;
    personalidadeCincoPalavras: string[];
    promessaDaMarca: string;
    razoesParaAcreditar: string[];
  };
  posicionamento: {
    declaracaoPosicionamento: string;
    categoriaMentalDesejada: string;
    propostaDeValor: string;
    diferenciais: Array<{ diferencial: string; evidenciaPratica: string; comoComunicar: string }>;
    posicionamentosAEvitar: string[];
    taglineRecomendada: string;
    alternativasCampanhas: string[];
  };
  publicosEPersonas: {
    segmentos: Array<{ segmento: string; oQuePrecisa: string; solucoesComAderencia: string; prioridade: "Alta" | "Média" | "Baixa" }>;
    personas: Array<{
      nome: string;
      subtitulo: string;
      perfil: string;
      objetivos: string;
      dores: string;
      objecoes: string;
      oQueGeraConfianca: string;
      mensagemParaEla: string;
    }>;
    comoUsarPersonas: string[];
  };
  arquetiposEPersonalidade: {
    arquetipoPrincipal: { nome: string; descricao: string };
    arquetipoSecundario: { nome: string; descricao: string };
    tracoRelacionalDeApoio: { nome: string; descricao: string };
    equilibrioPersonalidade: Array<{ aMarcaE: string; naoE: string }>;
  };
  tomDeVoz: {
    principioVerbal: string;
    dimensoes: Array<{ dimensao: string; diretriz: string; exemplo: string }>;
    vocabularioPreferencial: string[];
    usarComCautela: string[];
    regrasEditoriais: string[];
  };
  mensagensChave: {
    mensagemCentral: string;
    pilaresDeMensagem: Array<{ pilar: string; oQueQueremosQueEntenda: string; provaConteudoQueSustenta: string }>;
    elevatorPitch15s: string;
    apresentacao45s: string;
    chamadasParaAcao: string[];
    exemplosPorContexto: Array<{ contexto: string; mensagemSugerida: string }>;
  };
  identidadeVisual: {
    ideiaVisual: string;
    paletaCromatica: Array<{
      nomeCor: string;
      hex: string;
      papel: string;
      usoSugerido: string;
    }>;
    proporcaoRecomendada: string;
    tipografia: {
      fonteTitulos: string;
      fonteTextos: string;
      estiloGeral: string;
      hierarquia: Array<{ uso: string; fontePeso: string; tamanho: string }>;
    };
    regrasDeUsoLogo: string[];
  };
  direcaoDeArteEFotografia: {
    direcaoFotografia: string;
    principiosVisuais: string[];
    elementosGraficos: string;
    diretrizesParaImagensIA: string;
  };
  estrategiaConteudoECanais: {
    pilaresEditoriais: Array<{ pilar: string; participacaoSugerida: string; exemplos: string }>;
    funcaoCanais: Array<{ canal: string; papel: string; conteudoPrioritario: string }>;
    ritmoInicial: string;
    estruturaSugeridaCase: string;
  };
  campanhasESlogans: {
    campanhaInstitucional: { titulo: string; ideia: string; conceito: string; cta: string };
    campanhasSegmentadas: Array<{ segmento: string; ideia: string; conceito: string }>;
    exemploLegendaSocial: string;
    exemploBioInstagram: string;
    headlineSite: string;
    subheadlineSite: string;
  };
  metricasEGovernanca: {
    kpis: Array<{ objetivo: string; indicadores: string; frequencia: string }>;
    planoImplantacao90Dias: Array<{ periodo: string; prioridades: string; entregaveis: string }>;
  };
}

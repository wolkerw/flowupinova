import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import type { BrandBookData } from "@/lib/types/brandbook";

export const maxDuration = 180;

const SYSTEM_PROMPT = `Você é um Diretor Executivo de Estratégia de Marcas, Designer Sênior e Chief Brand Officer renomado.
Sua missão é analisar uma imagem de LOGOMARCA enviada pelo usuário e produzir um BRAND BOOK ESTRATÉGICO COMPLETO no mais alto patamar de excelência corporativa, idêntico aos melhores manuais de grandes marcas e agências de branding do mundo.

INSTRUÇÕES DE ANÁLISE VISUAL E SEMIÓTICA:
1. Examine a logomarca detalhadamente: tipografia utilizada (serifa, sem serifa, arredondada, script), formas geométricas, ícones, elementos ocultos ou combinados (ex: casa + play + balão de fala), peso visual e equilíbrio.
2. Identifique as cores exatas presentes na imagem em códigos HEX (#RRGGBB). Sugira cores complementares/apoio e fundos ideais, respeitando contraste WCAG.
3. Se houver nome na marca, utilize-o. Se não houver nome claro ou o usuário passar um hint de nome, use o que for informado ou deduza um nome corporativo plausível.
4. Infira o segmento do negócio com alta precisão e construa uma tese de posicionamento sólida, sofisticada e orientada a resultados reais.

VOCÊ DEVE RETORNAR ESTRITAMENTE UM OBJETO JSON VÁLIDO contendo todas as 12 seções abaixo, sem introdução ou texto fora do JSON.

FORMATO DO JSON ESPERADO:
{
  "meta": {
    "brandName": "Nome da Marca",
    "segment": "Segmento de Atuação",
    "generatedAt": "Mês e Ano (Ex: Outubro de 2026)",
    "version": "1.0 Estratégica"
  },
  "fundamentos": {
    "proposito": "Frase inspiradora e impactante sobre o porquê a marca existe.",
    "missao": "Declaração de missão prática e focada no cliente.",
    "visao": "Visão de futuro reconhecível.",
    "valores": [
      { "valor": "Nome do Valor", "comoApareceNaPratica": "Explicação pragmática de como a equipe vive isso no dia a dia." }
    ],
    "personalidadeCincoPalavras": ["Palavra 1", "Palavra 2", "Palavra 3", "Palavra 4", "Palavra 5"],
    "promessaDaMarca": "O que o cliente sempre pode esperar receber com total consistência.",
    "razoesParaAcreditar": [
      "Evidência ou método 1",
      "Evidência ou método 2",
      "Evidência ou método 3"
    ]
  },
  "posicionamento": {
    "declaracaoPosicionamento": "Para [público] que precisa de [desafio], a [marca] é a [categoria] que entrega [benefício principal]. Diferente de [concorrentes genéricos], a [marca] faz [diferencial único].",
    "categoriaMentalDesejada": "Como a marca deseja ser lembrada na mente do cliente (ex: Parceira estratégica, e não fornecedor commodity).",
    "propostaDeValor": "Declaração clara do valor entregue.",
    "diferenciais": [
      { "diferencial": "Diferencial", "evidenciaPratica": "Prova concreta", "comoComunicar": "Frase de efeito prática" }
    ],
    "posicionamentosAEvitar": [
      "O que NUNCA fazer ou prometer (ex: brigar por preço, prometer milagres sem provas)"
    ],
    "taglineRecomendada": "Slogan principal marcante e sonoro.",
    "alternativasCampanhas": [
      "Tagline alternativa 1",
      "Tagline alternativa 2"
    ]
  },
  "publicosEPersonas": {
    "segmentos": [
      { "segmento": "Nome do Segmento", "oQuePrecisa": "Necessidade", "solucoesComAderencia": "Produtos/Serviços", "prioridade": "Alta" }
    ],
    "personas": [
      {
        "nome": "Nome da Persona e Cargo/Papel (Ex: Mariana, líder de marketing)",
        "subtitulo": "Frase curta definindo sua principal tensão",
        "perfil": "Idade, função, momento profissional e responsabilidades.",
        "objetivos": "O que ela busca conquistar.",
        "dores": "Problemas reais, frustrações com fornecedores anteriores e riscos que ela quer evitar.",
        "objecoes": "Dúvidas que ela tem antes de fechar negócio.",
        "oQueGeraConfianca": "Fatores concretos que a convencem.",
        "mensagemParaEla": "Frase de impacto direta e persuasiva para este decisor."
      }
    ],
    "comoUsarPersonas": [
      "Dica 1 de aplicação no comercial ou marketing",
      "Dica 2 de aplicação"
    ]
  },
  "arquetiposEPersonalidade": {
    "arquetipoPrincipal": { "nome": "O Criador (ou Sábio, Herói, etc.)", "descricao": "Por que este arquétipo traduz a marca." },
    "arquetipoSecundario": { "nome": "O Sábio (ou Governante, etc.)", "descricao": "Como ele complementa a postura." },
    "tracoRelacionalDeApoio": { "nome": "O Companheiro", "descricao": "Como a marca se relaciona sem afetação." },
    "equilibrioPersonalidade": [
      { "aMarcaE": "Traço positivo (ex: Criativa e intencional)", "naoE": "Excesso a evitar (ex: Artística a ponto de esquecer o objetivo)" }
    ]
  },
  "tomDeVoz": {
    "principioVerbal": "Resumo em uma frase de como a marca fala e se posiciona.",
    "dimensoes": [
      { "dimensao": "Clareza", "diretriz": "Diretriz prática", "exemplo": "Exemplo de frase real" },
      { "dimensao": "Proximidade", "diretriz": "Diretriz prática", "exemplo": "Exemplo de frase real" }
    ],
    "vocabularioPreferencial": ["Palavra chave 1", "Palavra chave 2"],
    "usarComCautela": ["Jargão genérico 1", "Promessa vazia 2"],
    "regrasEditoriais": [
      "Regra 1 de redação",
      "Regra 2 de redação"
    ]
  },
  "mensagensChave": {
    "mensagemCentral": "Frase mestre da narrativa da marca.",
    "pilaresDeMensagem": [
      { "pilar": "Pilar", "oQueQueremosQueEntenda": "Compreensão desejada", "provaConteudoQueSustenta": "Tipo de prova social/bastidor" }
    ],
    "elevatorPitch15s": "Discurso rápido de 15 segundos.",
    "apresentacao45s": "Apresentação completa de 45 segundos.",
    "chamadasParaAcao": ["CTA 1", "CTA 2"],
    "exemplosPorContexto": [
      { "contexto": "Site / Redes / Proposta Comercial", "mensagemSugerida": "Mensagem específica" }
    ]
  },
  "identidadeVisual": {
    "ideiaVisual": "Dissecação semiótica do símbolo da logo e o que suas formas e contrastes comunicam.",
    "paletaCromatica": [
      { "nomeCor": "Nome da Cor", "hex": "#HEX", "papel": "Papel estratégico (Destaque/Confiança/Base)", "usoSugerido": "Onde aplicar" }
    ],
    "proporcaoRecomendada": "Ex: 60% base clara, 30% contraste escuro e 10% acento vibrante.",
    "tipografia": {
      "fonteTitulos": "Nome de fonte para títulos (ex: Montserrat, Poppins)",
      "fonteTextos": "Nome de fonte para textos (ex: Inter, Open Sans)",
      "estiloGeral": "Estilo geral (ex: Moderno, geométrico e altamente legível)",
      "hierarquia": [
        { "uso": "Título Principal", "fontePeso": "Bold / ExtraBold", "tamanho": "40–56px" },
        { "uso": "Texto Corrido", "fontePeso": "Regular", "tamanho": "16–18px" }
      ]
    },
    "regrasDeUsoLogo": [
      "Regra de preservação 1 (área de proteção, contrastes)",
      "Regra de preservação 2 (o que não distorcer)"
    ]
  },
  "direcaoDeArteEFotografia": {
    "direcaoFotografia": "Estilo fotográfico ideal (iluminação, cores, temperatura, planos).",
    "principiosVisuais": ["Humanidade e autenticidade", "Planos abertos e fechados", "Bastidores e cuidado"],
    "elementosGraficos": "Formas de apoio, linhas, molduras ou texturas discretas.",
    "diretrizesParaImagensIA": "Instruções conceituais prontas para serem enviadas a geradores de imagem IA (iluminação de estúdio limpa, profundidade de campo, cores da marca sutis)."
  },
  "estrategiaConteudoECanais": {
    "pilaresEditoriais": [
      { "pilar": "Educar e Orientar", "participacaoSugerida": "25%", "exemplos": "Temas de dicas e guias" },
      { "pilar": "Mostrar o Processo", "participacaoSugerida": "25%", "exemplos": "Bastidores e métodos" },
      { "pilar": "Provar Capacidade", "participacaoSugerida": "25%", "exemplos": "Cases e depoimentos" },
      { "pilar": "Construir Conexão", "participacaoSugerida": "15%", "exemplos": "Cultura e valores" },
      { "pilar": "Converter", "participacaoSugerida": "10%", "exemplos": "Ofertas e convites diretos" }
    ],
    "funcaoCanais": [
      { "canal": "Instagram", "papel": "Visibilidade e processo", "conteudoPrioritario": "Reels, carrosséis e bastidores" },
      { "canal": "LinkedIn", "papel": "Autoridade B2B", "conteudoPrioritario": "Artigos, cases e reflexões de mercado" }
    ],
    "ritmoInicial": "Sugestão de frequência semanal sustentável.",
    "estruturaSugeridaCase": "Desafio do cliente → Insight criativo → Execução → Entregas → Resultado observado."
  },
  "campanhasESlogans": {
    "campanhaInstitucional": {
      "titulo": "Nome da Campanha Institucional",
      "ideia": "Conceito central",
      "conceito": "Como ela é executada",
      "cta": "Chamada para ação"
    },
    "campanhasSegmentadas": [
      { "segmento": "Segmento 1", "ideia": "Ideia central", "conceito": "Execução" },
      { "segmento": "Segmento 2", "ideia": "Ideia central", "conceito": "Execução" }
    ],
    "exemploLegendaSocial": "Um exemplo completo de copy de postagem para rede social pronta para publicar.",
    "exemploBioInstagram": "Bio otimizada de Instagram com proposta de valor e CTA.",
    "headlineSite": "Headline principal de alta conversão para o site.",
    "subheadlineSite": "Subheadline complementar."
  },
  "metricasEGovernanca": {
    "kpis": [
      { "objetivo": "Reconhecimento de Marca", "indicadores": "Alcance qualificado, menções e visitas", "frequencia": "Mensal" },
      { "objetivo": "Geração de Demanda", "indicadores": "Leads e orçamentos solicitados", "frequencia": "Mensal" }
    ],
    "planoImplantacao90Dias": [
      { "periodo": "Dias 1–15", "prioridades": "Validação de estratégia e clientes", "entregaveis": "Entrevistas e alinhamentos de serviços" },
      { "periodo": "Dias 16–30", "prioridades": "Padronização visual e verbal", "entregaveis": "Templates oficiais e propostas" },
      { "periodo": "Dias 31–60", "prioridades": "Estruturação de portfólio e presença", "entregaveis": "Cases estruturados e calendário ativo" },
      { "periodo": "Dias 61–90", "prioridades": "Ativação comercial e escala", "entregaveis": "Campanhas ativas e otimização por dados" }
    ]
  }
}`;

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Autenticação obrigatória para gerar o Brand Book." },
        { status: 401 }
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: "Chave da API de IA não configurada no servidor." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { imageBase64, mimeType = "image/png", brandNameHint, segmentHint } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "A imagem da logomarca em formato base64 é obrigatória." },
        { status: 400 }
      );
    }

    const cleanBase64 = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    const userPrompt = `Analise a logomarca anexada e construa o Brand Book Estratégico Completo.
${brandNameHint ? `Nome da empresa sugerido pelo usuário: "${brandNameHint}".` : "Deduza o nome da marca a partir da logomarca ou crie um nome executivo adequado se for apenas um símbolo."}
${segmentHint ? `Segmento ou contexto adicional informado: "${segmentHint}".` : "Deduza o segmento com base nos elementos visuais, paleta e linguagem do logotipo."}

Certifique-se de preencher TODAS as seções com profundidade profissional incomparável, números, tabelas, personas com dores e mensagens personalizadas, paleta de cores com códigos HEX exatos e diretrizes detalhadas de fotografia e IA. Retorne estritamente o JSON válido.`;

    const contentParts = [
      { type: "text", text: userPrompt },
      {
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${cleanBase64}`,
          detail: "high",
        },
      },
    ];

    // Modelos para tentar em ordem decrescente de capacidade
    const modelsToTry = ["gpt-5", "gpt-4o", "chatgpt-4o-latest", "gpt-4o-mini"];
    let lastError = "";

    for (const model of modelsToTry) {
      try {
        const bodyPayload: Record<string, any> = {
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: contentParts },
          ],
          response_format: { type: "json_object" },
        };

        // Modelos de raciocínio / gpt-5 utilizam temperatura padrão 1
        if (!model.startsWith("gpt-5") && !model.startsWith("o1") && !model.startsWith("o3")) {
          bodyPayload.temperature = 0.7;
        }

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (res.ok) {
          const data = await res.json();
          const rawContent = data?.choices?.[0]?.message?.content;
          if (rawContent) {
            const parsedData: BrandBookData = JSON.parse(rawContent);
            return NextResponse.json({
              success: true,
              modelUsed: model,
              brandBook: parsedData,
            });
          }
        } else {
          const errText = await res.text().catch(() => "");
          lastError = `Modelo ${model}: ${res.status} - ${errText.slice(0, 150)}`;
          console.warn(`[BrandBookGenerator] Erro com ${model}: ${res.status} - ${errText.slice(0, 150)}`);
          continue;
        }
      } catch (err: any) {
        lastError = `Erro na requisição ${model}: ${err.message}`;
        console.warn(`[BrandBookGenerator] Exceção com ${model}:`, err);
        continue;
      }
    }

    return NextResponse.json(
      { error: "Não foi possível gerar o Brand Book no momento.", details: lastError },
      { status: 502 }
    );
  } catch (err: any) {
    console.error("[BrandBookGenerator] Erro interno:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar o Brand Book.", details: err.message },
      { status: 500 }
    );
  }
}

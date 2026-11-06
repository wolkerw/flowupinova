import type {
  BrandLogoPlacement,
  Gpt5PlannerInput,
  Gpt5VisualPlanResponse,
  OrchestratorPlanResult,
} from "./types";

export interface DynamicTypographyStyle {
  id: string;
  labelPt: string;
  weightHierarchyEn: string;
  colorHarmonyEn: string;
  containerAndFrameEn: string;
  fullDirectiveEn: string;
}

export class Gpt5PromptPlanner {
  private static readonly SYSTEM_PROMPT = `
Você é o Diretor Criativo e Especialista Sênior em Planejamento Visual da NumVapt.
Sua missão é atuar como intermediário inteligente entre o briefing do usuário e o modelo gerador de imagens OpenAI (gpt-image-2).

Você deve analisar o briefing, as diretrizes de marca (BrandKit), o objetivo e as fotos enviadas na Etapa 5, e produzir um plano visual estruturado em JSON e um prompt altamente detalhado, específico e descritivo em inglês para o gpt-image-2.

DIRETRIZES FUNDAMENTAIS DE COMPOSIÇÃO DO PROMPT DO GPT IMAGE 2:
1. O prompt gerado para o gpt-image-2 deve ser rico, minucioso e estruturado em 10 blocos:
   [1. INTENDED GOAL]: Objetivo comercial/editorial claro.
   [2. SCENE & CONTEXT]: Descrição do ambiente publicitário, iluminação e atmosfera.
   [3. HERO SUBJECT]: Detalhes fiéis do sujeito, produto ou logomarca principal. Se o usuário enviou imagem na Etapa 5, examine a imagem anexada com atenção extrema:
   - Se for PESSOA: descreva com precisão as características físicas (idade, gênero, etnia, cabelo, traços, roupas).
   - Se for PRODUTO FÍSICO, EQUIPAMENTO, MÁQUINA, APARELHO, CAIXA DE SOM, VEÍCULO, PRATO OU EMBALAGEM COMERCIAL: ATIVE IMEDIATAMENTE A TRAVA ESTRUTURAL E GEOMÉTRICA DE PRODUTO (/productlock)!
     a) PRESERVAÇÃO GEOMÉTRICA E MECÂNICA 100% FIEL (PRODUCT GEOMETRY & COMPONENT LOCK): Inspecione minuciosamente cada sub-componente do produto na foto enviada (ex: em caixas de som ou equipamentos, observe se há cornetas aparentes prateadas/pretas, tweeters expostos, grades com barras horizontais vs. telas perfuradas, cores exatas das laterais do gabinete como branco ou madeira, cabos, suportes, racks e proporções). Descreva cada detalhe físico exatamente como é na foto original! É TERMINANTEMENTE PROIBIDO "modernizar", redesenhar, substituir peças expostas por telas fechadas genéricas de catálogo, mudar a cor do gabinete do produto ou alterar o formato de partes superiores/inferiores do equipamento!
     b) PROIBIÇÃO DE ALTERAR O PRODUTO POR CAUSA DO TEXTO DO BRIEFING: Se o briefing mencionar marcas de componentes internos ou adjetivos comerciais (ex: "Sistema Compact Black: 100% JBL"), use isso APENAS para os textos/títulos da arte. NUNCA redesenhe o produto físico para parecer um modelo comercial padrão da marca citada (ex: NUNCA pinte laterais brancas de preto, NUNCA cubra cornetas aparentes com tela perfurada e NUNCA invente/cole o logotipo "JBL" ou qualquer outra marca na frente do equipamento se esse logotipo não existir fisicamente na foto original enviada pelo usuário)!
     c) PRESERVAÇÃO DE RÓTULOS E EMBALAGENS ORIGINAIS: O rótulo original, o nome da marca impresso na embalagem real, a tipografia do rótulo, os pesos, selos de qualidade e ilustrações da embalagem DEVEM SER RIGOROSAMENTE PRESERVADOS E DESCRITOS com máxima fidelidade. É TERMINANTEMENTE PROIBIDO higienizar, censurar, apagar os nomes originais ou transformar o rótulo em blocos de cores lisos!
   - CRÍTICO — SE FOR UMA LOGOMARCA / LOGOTIPO ENVIADA PELO USUÁRIO NA ETAPA 5 (INSERÇÃO CRIATIVA CENOGRÁFICA SEMPRE ATIVA): Sempre que a imagem enviada na Etapa 5 for uma logomarca, logotipo ou símbolo de marca (independentemente de a logo fixa do BrandKit estar ativa ou não), você DEVE PASSAR POR CIMA (OVERRIDE) das travas anti-logo para a cena! Inspecione e descreva minuciosamente a logomarca enviada na Etapa 5 (grafia exata do nome, tipografia, ícone/símbolo e cores exatas) e integre-a de forma CRIATIVA, CENOGRÁFICA, ORGÂNICA e DIFERENTE da simples colagem de canto do BrandKit (por exemplo: bordada/estampada com perfeição no peito da camisa polo/uniforme do protagonista, exibida na tela do smartphone/notebook segurado pelo personagem, aplicada em um letreiro/fachada 3D iluminada no cenário, estampada em uma caneca/sacola/embalagem ou integrada tridimensionalmente à composição). JAMAIS escreva "no logos", "absolutely no logos" ou proíba a logo na cena quando uma logomarca for enviada na Etapa 5!
   [4. COMPOSITION & PLACEMENT]: Distribuição visual e pontos focais equilibrados. Se houver logomarca do BrandKit habilitada, respeitar estritamente a ZONA DE LIMPEZA DE LOGO dinâmica selecionada (top-left, top-right, top-center ou bottom-right, mantendo a área correspondente 100% livre de textos ou elementos conflitantes).
   [5. FRAMING & PERSPECTIVE]: Ângulo de câmera, lente (ex: 50mm, 85mm f/1.8), proporção.
   [6. LIGHTING & COLOR]: Iluminação profissional e paleta cromática harmônica inspirada nas cores da marca.
   [7. TEXTURES & FINISH]: Acabamentos de estúdio de alta fidelidade e realismo.
   [8. VISUAL STYLE]: Fotografia comercial moderna de alto padrão.
   [9. LOGO DIRECTIVE]: DIRETIVA DE LOGOMARCA DO BRANDKIT (POSICIONAMENTO DINÂMICO FLEXÍVEL) vs. RÓTULO DO PRODUTO vs. LOGOMARCA CRIATIVA DA ETAPA 5 (CENA):
   a) ZONA DE LIMPEZA DE LOGOMARCA DINÂMICA (ZERO-TEXT LOGO CLEARANCE ZONE): A logomarca do BrandKit agora alterna dinamicamente de posição entre variações (Topo Esquerdo, Topo Direito, Topo Centralizado ou Rodapé Direito) para criar composições editoriais ricas e variadas. A área designada para a logo DEVE PERMANECER 100% VAZIA E LIMPA (espaço negativo puro), sem qualquer texto, título, subtítulo, frase de efeito ou badge! Todos os textos devem ser diagramados harmonicamente fora da zona reservada para a marca.
   b) EXCEÇÃO OBRIGATÓRIA PARA RÓTULOS DE PRODUTOS FÍSICOS: As embalagens e rótulos dos produtos reais enviados pelo usuário DEVEM MANTER suas marcas impressas originais, nomes de produtos, textos, pesos e selos autênticos e legíveis.
   c) INSERÇÃO CRIATIVA CENOGRÁFICA (SEMPRE QUE O USUÁRIO ENVIAR UMA LOGOMARCA NA ETAPA 5): Se a imagem anexada na Etapa 5 for uma logomarca/logotipo enviada pelo usuário, PASSE POR CIMA da regra de proibição de logos na cena! No bloco [9. LOGO DIRECTIVE] do "imagePrompt", inclua OBRIGATORIAMENTE em inglês: "CREATIVE LOGO EXCEPTION MODE ACTIVE: The user provided a brand logo in Step 5 for creative scene integration. OVERRIDE all scene logo prohibitions and creatively, crisply, and organically integrate this exact uploaded brand logo inside the scene itself, DIFFERENT from a flat corner stamp (e.g., embroidered/printed on the protagonist's shirt chest, glowing on the smartphone/tablet screen, mounted as a 3D illuminated sign in the studio/environment, or printed on a physical prop), preserving its exact brand name spelling, typography, icon, and colors 100% faithfully while keeping the top-left header corner clean."
   [10. CRITICAL SAFE MARGINS]: REGRA DE ZERO CROP. Deixar 15% a 20% de margem de respiro livre em todas as bordas externas (superior, inferior e laterais). Nenhum texto ou elemento essencial pode encostar nas bordas. Quando houver logo de cabeçalho, manter adicionalmente a zona de respiro de 22% de altura no canto superior esquerdo para que a logomarca nunca sobreponha outros textos ou informações.

DIRETRIZES DE DIREÇÃO DE ARTE PUBLICITÁRIA PREMIADA & TRAVA ANTI-CLICHÊ (/anticliche):
Você NÃO é um diagramador de panfletos ou slides de PowerPoint — você é um Diretor de Criação premiado em Cannes Lions e D&AD! Mesmo quando o usuário escrever um briefing simples, descritivo ou listar vários serviços, eleve automaticamente o conceito visual:
1. PROIBIÇÃO EXPRESSA DE CLICHÊS DE BANCO DE IMAGENS:
   - A menos que o usuário peça literalmente "uma mão segurando um celular ao lado de um café", é TERMINANTEMENTE PROIBIDO gerar a cena clichê de "mão avulsa segurando smartphone sobre mesa bege/branca ao lado de xícara de café e vasinho de planta"! Se for utilizada perspectiva em primeira pessoa (POV) com smartphone para demonstrar uma transformação ("antes e depois" ou "da foto simples ao anúncio profissional"), essa perspectiva DEVE ser dinâmica, ativa e integrada a um ambiente real autêntico e pulsante, conectada por feixes de luz ou fita tridimensional de neon nas cores da marca.
   - É TERMINANTEMENTE PROIBIDO montar um layout de slide corporativo com 3 ou 4 retângulos brancos opacos empilhados na lateral repetindo o texto do briefing!
   - É TERMINANTEMENTE PROIBIDO desenhar botões falsos de clique de site no rodapé da arte (ex: pílulas azuis/laranjas com "Conheça todas as possibilidades >", "Saiba mais >", "Clique aqui"), exceto se o usuário pedir explicitamente um botão no briefing! Post criativo de rede social NÃO é captura de landing page!
2. PROIBIÇÃO TOTAL DE FUNDOS LISOS / VAZIOS BEGE DE ESTÚDIO (MANDATO DE AMBIENTAÇÃO REAL):
   - É TERMINANTEMENTE PROIBIDO gerar cenas com fundos lisos monocromáticos, paredes beges/cinzas sem graça ou vazios artificiais de estúdio!
   - O ambiente DEVE SEMPRE ser um espaço real, ricamente texturizado, atmosférico e autêntico ao nicho de atuação do cliente (ex: pizzaria/restaurante acolhedor com forno a lenha aceso, brasas e madeira rústica; escritório nobre com estantes de mogno e luz suave de janela; ateliê artesanal; clínica moderna com plantas naturais; ou set comercial com iluminação volumétrica dual-tone quente/fria e profundidade de campo bokeh cinematográfica).
3. REGRA DE OURO "SHOW, DON'T LIST" (MATERIALIZAÇÃO CENOGRÁFICA > LISTA DE TEXTO):
   - Se o briefing citar múltiplos entregáveis, recursos ou diferenciais (ex: "logomarcas, cartão de visitas, papel timbrado, campanhas, branding, mockups, redes sociais"), NÃO transforme essa lista em blocos de texto! MATERIALIZE esses elementos como objetos físicos tridimensionais deslumbrantes, táteis e hiper-realistas compondo a cena (ex: cartões de visita em papel algodão com relevo/verniz flutuando em 3D, mostruários cromáticos Pantone, papelaria executiva, mockups táteis e interfaces holográficas translúcidas sem bordas orbitando em profundidade cinematográfica).
4. METÁFORA VISUAL INTELIGENTE & STORYTELLING DE TRANSFORMAÇÃO:
   - Se o briefing usar expressões figuradas ou de contraste (ex: "cabe no seu bolso", "muito mais que...", "da sua foto simples ao anúncio premium", "agência completa", "tudo em um só lugar"), traduza isso em uma METÁFORA VISUAL MEMORÁVEL OU TRANSFORMAÇÃO EM PRIMEIRA PESSOA (POV) (ex: smartphone em primeiro plano capturando o produto em estado bruto, conectado por uma fita luminosa de energia neon 3D em azul e laranja vibrante que viaja pelo espaço até o profissional no seu ambiente real de trabalho com o produto pronto e perfeito, ou uma explosão cenográfica em gravidade zero com artefatos físicos e iluminação volumétrica).
   - NUNCA gere miniaturas literais ou dioramas saindo de bolsos de roupas!

DIRETRIZES DE AGÊNCIA PUBLICITÁRIA PREMIUM & TRAVA ANATÔMICA DE MÃOS E PELE REALISTA (/agencystudio & /handlock):
Você deve garantir padrão de excelência de estúdio fotográfico de campanha publicitária internacional:
1. TRAVA ANATÔMICA RIGOROSA DE MÃOS E DEDOS (/handlock):
   - MÃOS HUMANAS PRECISAS COM EXATAMENTE 5 DEDOS: Sempre que pessoas, mãos ou gestos aparecerem na cena, cada mão visível DEVE ter rigorosamente cinco dedos distintos e anatomicamente perfeitos (um polegar e quatro dedos).
   - ARTICULAÇÕES E UNHAS NATURAIS: Descreva falanges proporcionais, juntas anatômicas nítidas, unhas realistas com cutículas e curvatura natural.
   - POSTURAS ERGONÔMICAS E APOIADAS: As mãos devem estar sempre em posições ergonomicamente verossímeis e apoiadas (ex: segurando firmemente um produto ou smartphone com os dedos envolvendo o corpo do aparelho sem fusão; com as mãos nos bolsos da calça/blazer; braços cruzados relaxados; apoiadas suavemente sobre o balcão ou mesa de trabalho).
   - PROIBIÇÃO TERMINANTE: É terminantemente proibido gerar dedos extras, seis dedos (polidactilia), dedos fundidos ou colados, dedos atrofiados ou faltando, mãos com nós invertidos, dedos de borracha derretida ou mãos flutuantes sem corpo!
2. PADRÃO ESTÚDIO DE AGÊNCIA & TEXTURA DE PELE HIPER-REALISTA (/agencystudio):
   - TEXTURA DE PELE ORGÂNICA COM MICROPÓROS: Pele humana autêntica com poros naturais microscópicos, textura tátil real, penugem sutil e dispersão de luz subsuperficial (subsurface scattering).
   - PROIBIÇÃO DE PELE PLÁSTICA / CERA / BONECO: É expressamente proibido aspecto plástico, pele encerada de manequim de shopping, acabamento de boneca de porcelana ou aerografia artificial ("airbrushed look").
   - ILUMINAÇÃO DE ESTÚDIO DE CAMPANHA: Lente prime 85mm f/1.8 com profundidade de campo óptica suave, iluminação de recorte (rim light) sutil destacando a silhueta, luz principal difusa por softbox duplo e sombras de contato coerentes (ambient occlusion) onde mãos e objetos se tocam.

DIRETRIZES DE ENGENHARIA TIPOGRÁFICA PREMIUM & ALTERNÂNCIA DINÂMICA DE TEXTO (/typolayout):
- Se textOverlayMode for NONE: Instruir ZERO TEXT, fotografia conceitual pura sem letras ou legendas.
- Se textOverlayMode for TITLE_ONLY ou INFOGRAPHIC (ou BOTH):
  1. HIERARQUIA TIPOGRÁFICA E CONTRASTE DE PESOS (BOLD + BLACK + REGULAR):
     - NUNCA utilize um único peso de fonte uniforme em todo o texto!
     - Estruture a Headline principal em camadas contrastantes:
       a) Frase de Preparação / Setup: em peso Bold ou Semi-Bold (700) (ex: "Da sua foto simples", "Mais presença");
       b) Palavra-Chave de Impacto / Punchline: em peso Heavy ou Black (900) para máxima tração visual (ex: "ao anúncio premium.", "para advogar.");
       c) Subtítulo Explicativo: em peso Regular ou Light (400), com entrelinha elegante e tamanho menor proporcional (contraste de escala display vs. texto corrido).
  2. HARMONIA CROMÁTICA MULTI-TOM (DUAL-TONE COLOR HARMONY):
     - Combine cores para leitura dinâmica e magnética: texto de preparação em Branco Puro (#FFFFFF) + palavra-chave de destaque na cor vibrante da marca (ex: Laranja NumVapt #FA6305 ou Ciano Elétrico #0083C7 / #00D2FF com sutil brilho luminoso).
  3. FUNDOS, MOLDURAS, CARDS & BADGES DINÂMICOS:
     - No modo INFOGRAPHIC ou BOTH, a fotografia/cena conceitual DEVE dominar pelo menos 70% a 75% da arte!
     - Alterne dinamicamente o layout dos elementos de apoio:
       a) Card Glassmorphic Flutuante (estilo Print 2): cartão translúcido escuro de vidro fosco (25-30% de opacidade com desfoque de fundo e borda fina neon de 1px) contendo 2 a 3 tópicos com ícones circulares brilhantes;
       b) Badges em Pílula Luminosa (Capsule Pills): passos ou chamadas (ex: "1. Foto simples" / "2. Arte profissional") emoldurados em cápsulas arredondadas com borda neon sutil;
       c) Moldura de Destaque Boxed: caixa geométrica translúcida envolvendo apenas a palavra-chave central do título;
       d) Tipografia Flutuante Arquitetural: texto flutuando sobre o cenário com sombra de contato suave (drop shadow volumétrica) para 100% de legibilidade sem caixas fechadas;
       e) Linha Hairline Neon: traço sutil de 1px separando título do subtítulo.
     - JAMAIS crie listas longas em caixas brancas empilhadas e JAMAIS adicione botões falsos de CTA sem pedido explícito!
- REGRA CRÍTICA DE FIDELIDADE TIPOGRÁFICA DO BRANDKIT (/fontlock): Sempre que houver texto na arte (TITLE_ONLY, INFOGRAPHIC ou BOTH) e o BrandKit definir Fonte Primária (primaryFont), Fonte Secundária (secondaryFont) ou Estilo Tipográfico Geral (style), você DEVE OBRIGATORIAMENTE especificar essa tipografia em inglês no "imagePrompt" traduzindo sua anatomia visual exata! Como geradores de imagem não possuem arquivos .ttf de fontes comerciais específicas (como "Branding SF"), descreva explicitamente a anatomia da fonte (ex: se for "Branding SF" ou "sans-serif limpo, corporativo", exija "uniform modern geometric corporate sans-serif typeface across ALL lines of text, clean monolinear stroke terminals, ZERO serifs, ZERO semi-serifed or calligraphic flares"). Quando uma frase tiver parte em peso normal e parte em destaque/negrito, EXIJA que ambas pertençam EXATAMENTE À MESMA FAMÍLIA SANS-SERIF, mudando apenas o peso (Regular/Normal weight para o texto secundário e Bold/ExtraBold weight para o destaque principal), proibindo terminantemente misturar famílias tipográficas diferentes na mesma peça!

DIRETRIZES DE LEGENDA PARA REDES SOCIAIS (COPYWRITING DE POST):
No campo "socialCaption", crie um copywriting persuasivo e engajador em português (pt-BR) pronto para publicação comercial nas redes sociais (Instagram, Facebook, LinkedIn):
- hook: gancho inicial envolvente (1 a 2 linhas com emoji atraente);
- body: desenvolvimento comercial ou storytelling persuasivo destacando os diferenciais;
- callToAction: chamada para ação clara (ex: "Peça pelo link da bio", "Comente aqui embaixo", "Venha nos visitar");
- hashtags: array com 5 a 8 hashtags estratégicas em português (incluindo a marca, nicho e tema);
- fullPostText: o texto completo unificado e pronto para postar, com quebras de linha e o bloco de hashtags no final. NUNCA utilize instruções ou prompts de imagem como legenda.

DIRETRIZES MANDATÓRIAS DE IDENTIDADE DE CAMPANHA (SÉRIE DE POSTS / DESIGN SYSTEM):
Quando a imagem de referência for enviada no modo "campaign_identity", ela atua como a GUIA MESTRA DA SÉRIE.
Sua missão primordial é inspecionar minuciosamente a imagem anexada e transferir seu DNA visual para o "imagePrompt":
1. Cenário e Luz: Inspecione o fundo, a atmosfera e o tipo de iluminação (ex: estúdio fotográfico escuro/azulado, luzes de neon brilhantes em 3D, reflexos no chão, iluminação dramática de recorte). Replique esse mesmo ambiente e clima de luz. JAMAIS troque o cenário por um ambiente genérico (como cafeterias, escritórios comuns ou paredes brancas) se a referência de campanha possui um conceito estético marcante.
2. Elementos Gráficos de Assinatura: Se a imagem matriz possui fitas/tubos de luz neon 3D circulando os personagens, partículas brilhantes, molduras ou linhas gráficas, descreva OBRIGATORIAMENTE esses elementos para estarem presentes na nova imagem.
3. Paleta Cromática: Mantenha com fidelidade o esquema de cores e contraste da matriz (ex: azul luminoso, laranja vibrante).
4. Diagramação e Margens: Conserve a estrutura de enquadramento (ex: personagens bem posicionados, cartões/pills translúcidos e textos organizados na lateral).
5. REGRA DE OURO — NÃO CLONAR PESSOAS OU POSES (SUJEITO E CENA INÉDITOS):
   A referência serve EXCLUSIVAMENTE para extrair a identidade gráfica e estética da campanha (as fitas/traços de neon 3D luminosos, a iluminação de estúdio, o contraste cromático e os badges translúcidos).
   Em [3. HERO SUBJECT]: O sujeito DEVE SER 100% NOVO E ORIGINAL! NUNCA repita o mesmo grupo de pessoas, mesmas profissões, mesmas roupas ou mesmas poses da imagem mestre. Crie novos personagens ou uma nova composição fresca e dinâmica (ex: um único protagonista masculino em pose atlética ou profissional, ou uma nova dupla diferente) que atenda criativamente ao briefing sem duplicar a cena anterior!

REGRAS DE CONFORMIDADE:
- Responda OBRIGATORIAMENTE em formato JSON válido respeitando o schema solicitado.
- Não inclua markdown adicional ou texto fora do JSON.
- O campo "imagePrompt" (prompt em inglês para o gpt-image) DEVE SEMPRE conter a diretiva de logo — proibição explícita (Cenário B) ou mandato de integração (Cenário A). Nunca omita ou deixe essa diretiva vaga.
`;

  public static readonly CREATIVE_LOGO_ARCHETYPES = [
    {
      id: "architectural_3d_sign",
      labelPt: "Letreiro Arquitetônico 3D Iluminado (acrílico cristal e metal escovado com luz de recorte LED backlit na parede/cenário ao fundo)",
      promptEn: "mounted as a sleek 3D backlit architectural wall sign in brushed metal and glowing acrylic in the studio/environment background",
    },
    {
      id: "tabletop_acrylic_plaque",
      labelPt: "Totem / Placa Escultural de Acrílico Cristal Iluminado sobre a bancada ou mesa em primeiro/médio plano",
      promptEn: "featured on a premium edge-lit crystal acrylic tabletop brand plaque/totem resting prominently on the counter or desk in the foreground",
    },
    {
      id: "lifestyle_prop_merch",
      labelPt: "Objeto Físico de Cena & Merchandising (estampada com acabamento premium em caneca de cerâmica na mesa, ecobag estruturada, caderno executivo Moleskine ou embalagem na cena)",
      promptEn: "printed with crisp UV/screen-print finish on a hero lifestyle prop in the scene (such as a matte ceramic mug on the table, a structured premium tote bag, or an executive notebook)",
    },
    {
      id: "digital_screen_showcase",
      labelPt: "Display Digital High-Tech (exibida com nitidez em destaque na tela iluminada de um tablet, notebook aberto, monitor curvo ou smartphone voltado para a câmera)",
      promptEn: "displayed crisply on the glowing high-resolution screen of a modern laptop, tablet, curved monitor, or smartphone angled clearly toward the viewer",
    },
    {
      id: "floating_glassmorphic_emblem",
      labelPt: "Insígnia / Escultura 3D Glassmórfica Flutuante integrada às luzes de neon e à profundidade espacial do estúdio",
      promptEn: "rendered as a futuristic 3D glassmorphic floating brand emblem integrated organically with the studio's spatial depth and neon lighting",
    },
    {
      id: "apparel_embroidery",
      labelPt: "Vestuário & Bordado Executivo (bordada ou estampada com textura têxtil nítida em jaqueta, blazer, avental gourmet, boné ou camisa polo do protagonista)",
      promptEn: "applied as high-definition textile embroidery or print on the protagonist's jacket, apron, blazer lapel, cap, or polo shirt chest",
    },
    {
      id: "podium_counter_front",
      labelPt: "Cenografia de Balcão / Estação de Trabalho Moderna com a logomarca em relevo iluminado",
      promptEn: "mounted in illuminated 3D relief on the front facade of a modern reception counter, workstation podium, or frosted glass partition",
    },
    {
      id: "holographic_light_panel",
      labelPt: "Painel Holográfico / Display Translúcido Luminoso flutuando dinamicamente ao lado do sujeito na cena",
      promptEn: "projected on a crisp holographic light panel or transparent glass HUD display floating dynamically beside the subject in the scene",
    },
  ];

  public static readonly BRAND_LOGO_PLACEMENTS = [
    {
      id: "top-left" as const,
      labelPt: "Canto Superior Esquerdo (editorial clássico de cabeçalho)",
      clearanceZonePrompt: "ZERO-TEXT LOGO CLEARANCE ZONE: Keep top-left quadrant (top 22% height x left 32% width) 100% blank, empty and clean for logo overlay.",
      textPlacementPrompt: "Place headline starting below Y=22% or center/right.",
    },
    {
      id: "top-right" as const,
      labelPt: "Canto Superior Direito (editorial moderno com leitura balanceada)",
      clearanceZonePrompt: "ZERO-TEXT LOGO CLEARANCE ZONE: Keep top-right quadrant (top 22% height x right 32% width) 100% blank, empty and clean for logo overlay.",
      textPlacementPrompt: "Place headline starting on the left (below Y=22%) or center, leaving top-right clean for the brand logo.",
    },
    {
      id: "top-center" as const,
      labelPt: "Topo Centralizado (estilo capa de revista de luxo / pôster icônico)",
      clearanceZonePrompt: "ZERO-TEXT LOGO CLEARANCE ZONE: Keep top-center area (top 18% height x center 50% width) 100% blank, empty and clean for logo overlay.",
      textPlacementPrompt: "Place headline starting below Y=20% or in the midground, letting the centered top logo breathe.",
    },
    {
      id: "bottom-right" as const,
      labelPt: "Rodapé Direito (assinatura corporativa discreta e sofisticada)",
      clearanceZonePrompt: "ZERO-TEXT LOGO CLEARANCE ZONE: Keep bottom-right quadrant (bottom 16% height x right 32% width) 100% blank, empty and clean for logo overlay.",
      textPlacementPrompt: "Keep bottom-right corner completely free of text or buttons for the official brand sign-off.",
    },
  ];

  private static logoPlacementCursor = 0;

  public static getNextLogoPlacement(lastPos?: BrandLogoPlacement): (typeof Gpt5PromptPlanner.BRAND_LOGO_PLACEMENTS)[number] {
    if (!lastPos) return this.BRAND_LOGO_PLACEMENTS[0];
    const currentIdx = this.BRAND_LOGO_PLACEMENTS.findIndex((p) => p.id === lastPos);
    const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % this.BRAND_LOGO_PLACEMENTS.length : 0;
    return this.BRAND_LOGO_PLACEMENTS[nextIdx];
  }

  public static selectDynamicLogoPlacement(input: Gpt5PlannerInput) {
    if (input.logoPosition) {
      const found = this.BRAND_LOGO_PLACEMENTS.find((p) => p.id === input.logoPosition);
      if (found) return found;
    }
    // Memória Persistente do Usuário: se houver última posição registrada no Firestore, calcula a próxima da sequência
    if (input.lastLogoPosition) {
      const nextFromHistory = this.getNextLogoPlacement(input.lastLogoPosition);
      input.logoPosition = nextFromHistory.id;
      return nextFromHistory;
    }
    const idx = (this.logoPlacementCursor++) % this.BRAND_LOGO_PLACEMENTS.length;
    const selected = this.BRAND_LOGO_PLACEMENTS[idx];
    input.logoPosition = selected.id;
    return selected;
  }

  public static readonly DYNAMIC_TYPOGRAPHY_STYLES: DynamicTypographyStyle[] = [
    {
      id: "glassmorphic_duotone_glow",
      labelPt: "Card Glassmorphic Translúcido com Brilho Neon & Título Dual-Tone (Estilo Print 2)",
      weightHierarchyEn: "Dynamic weight hierarchy: Headline setup phrase in Bold/Semi-Bold (700 weight), core punchline keyword in Heavy/Black (900 weight) for maximum visual punch, and supporting subtitle in clean Regular (400 weight)",
      colorHarmonyEn: "Dual-tone color contrast: Setup words in crisp Pure White (#FFFFFF), highlighted action keyword in vibrant Electric Brand Orange (#FA6305) with subtle luminous glow, and subtitle in clean neutral light (#E2E8F0)",
      containerAndFrameEn: "Framing & containers: Left-aligned sleek dark translucent frosted glassmorphic card (25% opacity, backdrop blur, subtle 1px glowing cyan/orange neon border, rounded corners 16px) housing 2-3 feature rows with minimalist glowing circular icons, plus dual capsule pill badges ('1. Foto simples' in electric cyan / '2. Arte profissional' in warm orange)",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Glassmorphic Card & Dual-Tone Headline): Render the headline with dynamic weight alternation (Bold setup words in crisp White #FFFFFF, followed by the core punchline keyword in Heavy/Black 900 weight in radiant Electric Brand Orange #FA6305). Place an elegant, dark frosted glassmorphic card (25% opacity, soft backdrop blur, fine glowing 1px neon stroke, rounded corners 16px) containing 2-3 concise editorial feature callouts with sleek circular glowing line icons, accompanied by modern floating pill badges with subtle ambient light.",
    },
    {
      id: "architectural_frameless_bold",
      labelPt: "Tipografia Flutuante Arquitetural com Sombra de Contato & Destaque Ciano",
      weightHierarchyEn: "Bold scale and weight contrast: Lead phrase in Semi-Bold (600 weight), monumental display keyword in Heavy/Black (900 weight), and compact context subtitle in ultra-crisp Regular (400 weight)",
      colorHarmonyEn: "High-contrast electric cyan and white: Headline in crisp Pure White (#FFFFFF), core differentiator keyword in Vibrant NumVapt Electric Blue/Cyan (#0083C7 / #00D2FF), and subtitle in bright off-white",
      containerAndFrameEn: "Framing & containers: Frameless floating display typography organically integrated into the atmospheric negative space, backed by soft cinematic ambient drop shadows for 100% legibility over any textured background, with zero visual clutter and clean geometric alignment",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Architectural Floating Typography & Cyan Highlight): Render a high-impact, frameless editorial headline floating directly over the atmospheric scene with soft volumetric ambient drop shadows for razor-sharp legibility. Use monumental scale and weight contrast (lead phrase in Semi-Bold White #FFFFFF, core power keyword in Heavy/Black 900 weight in vibrant Electric Cyan #0083C7 / #00D2FF, and clean Regular 400 subtitle below).",
    },
    {
      id: "luxury_gold_boxed_accent",
      labelPt: "Moldura de Destaque Boxed na Palavra-Chave & Tom Ouro/Âmbar Quente",
      weightHierarchyEn: "Editorial weight hierarchy: Setup statement in Semi-Bold (600 weight), core value keyword in Heavy/Black (900 weight) inside an accent container, and subtitle in refined Light/Regular (300-400 weight)",
      colorHarmonyEn: "Warm luxury harmony: Warm off-white / pearl (#FFF8F0) headline text, paired with the core punchline keyword in Radiant Amber / Warm Gold (#FFB800 / #FA6305), and subtitle in soft silver-grey (#CBD5E1)",
      containerAndFrameEn: "Framing & containers: The central power keyword of the headline is enclosed in a sleek, semi-transparent frosted highlight box with a fine 1px golden/amber glowing stroke and subtle corner radius (8px), drawing immediate focal gravity, paired with clean minimalist line accents",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Boxed Keyword Highlight & Warm Amber Tone): Render an ultra-refined luxury headline where the central punchline keyword is framed inside a sleek, semi-transparent frosted glass highlight box with a delicate 1px golden/amber (#FFB800 / #FA6305) glowing outline. Alternate weights smoothly (Semi-Bold for setup text in warm pearl #FFF8F0, Heavy/Black 900 for the boxed keyword, and Light/Regular 400 for the subtitle).",
    },
    {
      id: "editorial_capsule_pills",
      labelPt: "Badges em Pílula Luminosa & Divisor Neon Hairline",
      weightHierarchyEn: "Modern badge hierarchy: Headline in Bold (700 weight), punchline keyword in Heavy/Black (900 weight), supporting features in uppercase Medium (500 weight) pill badges, and explanatory subtitle in Regular (400 weight)",
      colorHarmonyEn: "Vibrant brand dual-tone: Crisp Pure White (#FFFFFF) primary text with Brand Accent (#FA6305 / #0083C7) highlights, glowing capsule pills with subtle dark-glass fill and neon colored stroke",
      containerAndFrameEn: "Framing & containers: A delicate 1px vertical or horizontal neon hairline rule separates the headline from the subtitle, while supporting features or steps are framed inside floating rounded capsule pills with subtle ambient backlight",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Neon Capsule Pills & Hairline Rule): Render the headline with dynamic weight contrast (Bold setup in White #FFFFFF + Black 900 punchline keyword in brand orange #FA6305), anchored by a delicate 1px neon hairline accent rule. Frame supporting feature callouts inside modern rounded capsule pill badges with subtle luminous borders and dark-glass fill.",
    },
    {
      id: "clean_high_contrast_split",
      labelPt: "Diagramação Editorial Split com Contraste Extremo de Escala",
      weightHierarchyEn: "Monumental scale contrast: Large punchy display headline in Heavy/Black (900 weight) with setup words in Bold (700), paired with a compact 2-line subtitle in clean Regular (400 weight)",
      colorHarmonyEn: "Multi-tone balance: High-contrast Pure White (#FFFFFF) text paired with vivid primary and secondary brand colors (#0083C7 NumVapt Blue and #FA6305 Orange) against deep atmospheric shadows",
      containerAndFrameEn: "Framing & containers: Clean geometric layout with generous safe margins (20%), subtle floating translucent tags, and pristine typographic alignment",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Split Scale Contrast & Multi-Tone Brand Harmony): Render monumental display typography with dramatic scale and weight contrast (large punchy headline with Heavy/Black 900 power words in White #FFFFFF and Brand Accent #FA6305, paired with a compact, ultra-sharp 2-line subtitle in Regular 400 weight). Maintain 20% safe margins with pristine editorial balance.",
    },
  ];

  private static typographyStyleCursor = 0;

  public static selectDynamicTypographyStyle(input?: Gpt5PlannerInput): DynamicTypographyStyle {
    const styles = this.DYNAMIC_TYPOGRAPHY_STYLES;
    const idx = (this.typographyStyleCursor++) % styles.length;
    return styles[idx];
  }

  public static buildAgencyQualityAndAnatomyMandate(input?: Gpt5PlannerInput): string {
    return "[PREMIUM AGENCY STUDIO QUALITY & 5-FINGER HAND ANATOMY LOCK (/agencystudio & /handlock): Render with high-end commercial advertising studio standards shot on 85mm f/1.8 lens with shallow optical depth of field and soft cinematic bokeh. STRICT HUMAN HAND ANATOMY LOCK: Every human hand depicted MUST feature precisely 5 distinct, anatomically accurate fingers (one thumb and four fingers) with natural knuckles, proportional phalanges, and realistic fingernails. Hands must adopt grounded, biomechanically natural postures (firm ergonomic grip around products/smartphone, resting naturally on surfaces, or neatly in pockets) with coherent contact shadows. ZERO EXTRA FINGERS, ZERO FUSED DIGITS. AUTHENTIC SKIN TEXTURE: Render natural human skin with visible microscopic pores, subtle epidermal texture, and organic subsurface scattering. Strictly FORBIDDEN: plastic waxy skin, porcelain doll face, airbrushed mannequin sheen, deformed hands, six fingers, mutated digits, or disembodied floating hands.]";
  }

  public static buildDynamicTypographyMandate(
    input: Gpt5PlannerInput,
    style?: DynamicTypographyStyle
  ): string {
    if (!input.textOverlayMode || input.textOverlayMode === "NONE") return "";
    const selectedStyle = style || this.selectDynamicTypographyStyle(input);
    return `[DYNAMIC TYPOGRAPHIC & LAYOUT MANDATE (/typolayout): ${selectedStyle.fullDirectiveEn}. Weight contrast: ${selectedStyle.weightHierarchyEn}. Color harmony: ${selectedStyle.colorHarmonyEn}. Containers & frames: ${selectedStyle.containerAndFrameEn}.]`;
  }


  private static creativeArchetypeCursor = Math.floor(Math.random() * 8);

  public static selectCreativeLogoArchetype(userBrief = "") {
    const len = this.CREATIVE_LOGO_ARCHETYPES.length;
    const idx = this.creativeArchetypeCursor % len;
    this.creativeArchetypeCursor = (this.creativeArchetypeCursor + 1) % len;
    const primary = this.CREATIVE_LOGO_ARCHETYPES[idx];
    const secondary = this.CREATIVE_LOGO_ARCHETYPES[(idx + 3) % len];
    return { primary, secondary, userBrief };
  }

  public static readonly CREATIVE_ART_DIRECTION_ARCHETYPES = [
    {
      id: "pov_split_reality_transformation",
      labelPt: "Transformação em Primeira Pessoa (POV) com Fita de Neon 3D & Ambiente Real (estilo Print 2: smartphone em primeiro plano capturando a ação, fita dinâmica de neon 3D azul e laranja conectando ao profissional no ambiente real de trabalho com o resultado premium)",
      promptEn: "High-end commercial advertising with dynamic first-person POV transformation: in the foreground, a modern smartphone held naturally captures a raw photo of the craft/action on its screen, connected seamlessly via a glowing volumetric 3D dual-tone neon energy ribbon (electric cyan and vibrant brand orange #FA6305) sweeping across space into the razor-sharp midground where a proud, charismatic business owner or artisan smiles in their authentic, deeply textured real-world workspace (warm wood, stone, ambient embers or architectural lamplight, background bokeh) presenting the finished premium commercial masterpiece",
    },
    {
      id: "workplace_authority_in_habitat",
      labelPt: "Autoridade Profissional no Habitat Autêntico (especialista carismático em seu ambiente real ricamente texturizado — escritório nobre, cozinha gourmet, clínica moderna ou ateliê — com iluminação volumétrica e cards flutuantes glassmorphic)",
      promptEn: "Award-winning commercial portrait of an authentic, charismatic professional in their genuine, deeply textured work habitat (rich architectural textures, warm ambient window light, natural depth of field, shallow focus) complemented by subtle floating glassmorphic feature pills and cinematic brand-colored rim lighting, with absolutely zero flat studio voids",
    },
    {
      id: "hero_editorial_magazine_cover",
      labelPt: "Capa Editorial de Luxo & Iluminação Dual-Tone (enquadramento cinematográfico de alto impacto com luz de recorte azul/laranja, chiaroscuro refinado e profundidade de campo profunda)",
      promptEn: "Cinematic magazine cover hero photography: dramatic dual-tone chiaroscuro lighting (warm amber key light paired with cool electric blue rim light), rich environmental depth (85mm f/1.4 lens bokeh), tactile real-world surroundings, and bold scale contrast commanding immediate visual authority",
    },
    {
      id: "levitating_tactile_ecosystem",
      labelPt: "Explosão Cenográfica 3D em Gravidade Zero & Artefatos Físicos Táteis (entregáveis reais e interfaces translúcidas levitando em camadas com iluminação volumétrica)",
      promptEn: "High-impact zero-gravity 3D studio hero showcase: tangible, ultra-crafted physical brand deliverables and artifacts corresponding to the brief (thick textured cotton cards with spot-UV finish, bespoke merchandise, packaging, and sleek frameless glassmorphic cards) dynamically levitating across foreground bokeh, razor-sharp midground focal point, and atmospheric architectural background with volumetric brand lighting",
    },
    {
      id: "sculptural_editorial_set",
      labelPt: "Cenografia Escultural & Chiaroscuro Comercial (composição artística com texturas táteis nobres e sombras dramáticas em ambiente tridimensional rico)",
      promptEn: "Bespoke sculptural set design & luxury editorial commercial art shot at dynamic 45-degree angle with directional chiaroscuro lighting: real, touchable physical craft artifacts on textured architectural plinths (matte stone, brushed metal, heavy embossed print, dimensional brand elements) captured with authentic environmental depth",
    },
    {
      id: "tactile_macro_craftsmanship",
      labelPt: "Fotografia Sensorial Macro de Alto Impacto (foco dramático em texturas nobres, vapor/brasas/detalhes e composição de revista)",
      promptEn: "Sensory macro commercial hero photography with shallow optical depth of field, rich tactile material textures (warm glowing embers, fresh raw ingredients, embossed paper fibers, polished glass), dramatic side-key lighting, and bold award-winning composition",
    },
  ];

  private static artDirectionCursor = 0;

  public static isExplicitHandPhoneRequested(userBrief = ""): boolean {
    return /\b(mão segurando|mao segurando|segurando (um |o |seu )?(celular|smartphone|iphone|aparelho)|hand holding (a )?(phone|smartphone))\b/i.test(
      userBrief
    );
  }

  public static isExplicitCtaButtonRequested(userBrief = ""): boolean {
    return /\b(botão|botao|cta clicável|coloque um botão|adicione um botão|button)\b/i.test(
      userBrief
    );
  }

  public static selectArtDirectionConcept(input: Gpt5PlannerInput) {
    const subjectRef = input.referenceImages?.find((r) => r.role === "product_subject");
    const isStep5Logo = this.isStep5LogoUpload(input);
    if ((subjectRef && !isStep5Logo) || input.referenceMode === "campaign_identity") {
      return null;
    }

    const brief = input.userBrief || "";
    const hasPocketOrScaleMetaphor =
      /(cabe no (seu )?bolso|no seu bolso|na palma da m[ãa]o|ag[êe]ncia de bolso|compact[oa]|port[áa]til)/i.test(
        brief
      );
    const hasEcosystemOrBeyondConcept =
      /(mais (do )?que|muito al[ée]m|ag[êe]ncia completa|marketing completa|tudo em um|de ponta a ponta|ecossistema|cart[ãa]o de visita|papel timbrado|branding|mockups)/i.test(
        brief
      );

    const all = this.CREATIVE_ART_DIRECTION_ARCHETYPES;
    const cursor = this.artDirectionCursor++;

    if (hasPocketOrScaleMetaphor) {
      const pocketPool = [all[0], all[1], all[4]];
      const primary = pocketPool[cursor % pocketPool.length];
      const secondary = pocketPool[(cursor + 1) % pocketPool.length];
      return { primary, secondary, mode: "metaphor_boost" as const };
    }

    if (hasEcosystemOrBeyondConcept) {
      const ecoPool = [all[1], all[0], all[2], all[4]];
      const primary = ecoPool[cursor % ecoPool.length];
      const secondary = ecoPool[(cursor + 1) % ecoPool.length];
      return { primary, secondary, mode: "ecosystem_showcase" as const };
    }

    const primary = all[cursor % all.length];
    const secondary = all[(cursor + 2) % all.length];
    return { primary, secondary, mode: "agency_creative" as const };
  }

  public static buildAntiClicheCreativeMandate(
    input: Gpt5PlannerInput,
    artConcept?: ReturnType<typeof Gpt5PromptPlanner.selectArtDirectionConcept>
  ): string {
    const subjectRef = input.referenceImages?.find((r) => r.role === "product_subject");
    const isStep5Logo = this.isStep5LogoUpload(input);
    if ((subjectRef && !isStep5Logo) || input.referenceMode === "campaign_identity") {
      return "";
    }

    const allowHandPhone = this.isExplicitHandPhoneRequested(input.userBrief);
    const allowCtaButton = this.isExplicitCtaButtonRequested(input.userBrief);
    const conceptClause = artConcept
      ? ` Recommended Art Direction Concept (${artConcept.primary.id}): ${artConcept.primary.promptEn}.`
      : "";

    const prohibitions: string[] = [
      "SHOW, DON'T LIST: Materialize mentioned deliverables/services as stunning, tactile 3D physical artifacts inside the scene instead of listing them in plain text boxes",
      "STRICT BAN ON FLAT STUDIO WALLS & BEIGE VOIDS: Strictly FORBIDDEN to render flat monochrome studio backdrops, empty beige or grey walls, or sterile studio voids. Every scene must be grounded in an authentic, atmospheric, deeply textured real-world setting matching the profession (e.g. warm artisanal kitchen with wood and embers, prestigious mahogany office with warm lamplight, modern clinic with greenery, bespoke workshop, or cinematic architectural set with volumetric depth)",
    ];
    if (!allowHandPhone) {
      prohibitions.push(
        "NO STOCK-PHOTO CLICHÉS: Strictly FORBIDDEN to depict a generic disembodied hand holding a smartphone over a beige/white desk next to a coffee mug and potted plant. If a POV smartphone is used for transformation storytelling, it must be an active high-concept comparison with a glowing 3D neon energy ribbon connecting to an authentic real-world workspace"
      );
    }
    prohibitions.push(
      "NO POWERPOINT SLIDE BOXES: Strictly FORBIDDEN to render 3 or 4 stacked opaque white rectangular bullet-point cards on the side; let the visual scene occupy 70-75%+ of the canvas, using at most ultra-concise 2-4 word editorial micro-callouts or a sleek frosted glassmorphic card if infographic mode is active"
    );
    if (!allowCtaButton) {
      prohibitions.push(
        "NO FAKE WEBSITE CTA BUTTONS: Strictly FORBIDDEN to draw fake clickable web buttons/pills at the bottom (such as 'Saiba mais >' or 'Conheça todas as possibilidades >')"
      );
    }

    return `[AWARD-WINNING CREATIVE ART DIRECTION & ANTI-CLICHÉ MANDATE (/anticliche):${conceptClause} ${prohibitions.join(" | ")}.]`;
  }

  public static isStep5LogoUpload(input: Gpt5PlannerInput): boolean {
    const subjectRef = input.referenceImages?.find((r) => r.role === "product_subject");
    if (!subjectRef) return false;
    const combinedText = `${input.userBrief || ""} ${input.compiledPrompt || ""} ${subjectRef.description || ""} ${subjectRef.url || ""}`;
    return /\b(logo|logomarca|logotipo|emblema|símbolo da marca|simbolo da marca|marca enviada|minha marca|camisa da marca)\b/i.test(
      combinedText
    );
  }

  public static buildBrandTypographyMandate(input: Gpt5PlannerInput): string {
    if (!input.textOverlayMode || input.textOverlayMode === "NONE") return "";
    const fonts = input.brandKit?.enabled ? input.brandKit?.fonts : undefined;
    if (!fonts || (!fonts.primaryFont && !fonts.secondaryFont && !fonts.style)) return "";

    const primary = fonts.primaryFont?.trim() || "Modern Geometric Sans-Serif Bold";
    const secondary = fonts.secondaryFont?.trim() || "Modern Geometric Sans-Serif Regular";
    const style = fonts.style?.trim() || "Clean modern corporate sans-serif, highly legible";
    const isSansSerif =
      /sans-serif|sans serif|branding sf|montserrat|inter|poppins|roboto|helvetica|arial|futura|gotham|gilroy|myriad|eras|corporativo|moderno|limpo/i.test(
        `${primary} ${secondary} ${style}`
      ) && !/\b(serifa|serifada|classic serif|times|garamond|playfair|bodoni)\b/i.test(`${primary} ${secondary} ${style}`);

    return `[CRITICAL MANDATE — BRAND KIT TYPOGRAPHY LOCK (/fontlock): All rendered text MUST strictly follow the brand's official typography system — Primary Font (Titles / Bold Highlights): "${primary}"; Secondary Font (Body / Setup Text): "${secondary}"; General Typographic Style: "${style}". ${
      isSansSerif
        ? "ANATOMICAL FONT ENFORCEMENT: Render ALL text lines using a SINGLE unified, clean, modern corporate geometric sans-serif typeface family (matching Branding SF / Montserrat / Inter aesthetics) with crisp straight terminals and uniform stroke geometry. Differentiate setup lines vs. bold emphasis lines STRICTLY by font weight (Normal/Regular weight vs. Bold/ExtraBold weight of the EXACT SAME sans-serif family). It is STRICTLY FORBIDDEN to use serifs, semi-serifed flared terminals, humanist calligraphic strokes, slab serifs, or mix two different font families in the same text block!"
        : "ANATOMICAL FONT ENFORCEMENT: Maintain 100% typographic family consistency across all text lines, differentiating hierarchy strictly by weight (Normal vs. Bold) within the exact specified brand typeface family."
    }]`;
  }


  public static async plan(input: Gpt5PlannerInput): Promise<OrchestratorPlanResult> {
    const startTime = Date.now();
    const openaiKey = process.env.OPENAI_API_KEY;

    // Tentar planejamento com GPT-5 (ou gpt-4o como fallback) com suporte multimodal se houver foto
    if (openaiKey) {
      try {
        const baseModels = ["gpt-6.1-sol", "gpt-5", "gpt-4o", "gpt-4o-mini"];
        const modelsToTry = input.preferredModel
          ? [input.preferredModel, ...baseModels.filter((m) => m !== input.preferredModel)]
          : baseModels;

        const userPrompt = this.buildUserPrompt(input);
        // Montar mensagem multimodal para que o GPT-6.1-sol / GPT-5 veja as fotos de sujeito, estilo/campanha e logo
        const contentParts: any[] = [{ type: "text", text: userPrompt }];
        const subjectImage = input.referenceImages?.find((r) => r.role === "product_subject");
        if (subjectImage && subjectImage.base64) {
          contentParts.push({
            type: "image_url",
            image_url: {
              url: `data:${subjectImage.mimeType};base64,${subjectImage.base64}`,
              detail: "high",
            },
          });
        }
        const styleImage = input.referenceImages?.find((r) => r.role === "style_reference");
        if (styleImage && styleImage.base64) {
          contentParts.push({
            type: "image_url",
            image_url: {
              url: `data:${styleImage.mimeType};base64,${styleImage.base64}`,
              detail: "high",
            },
          });
        }
        // NOTA CRÍTICA: A logo oficial do BrandKit (business_logo / official_logo) é aplicada digitalmente via Jimp
        // no pós-processamento (BrandLogoApplier). NUNCA anexamos a imagem da logo do BrandKit na visão do LLM
        // para impedir que a IA tente redesenhá-la em placas de acrílico, totens ou paredes dentro da cena!

        for (const model of modelsToTry) {
          try {
            const bodyPayload: Record<string, any> = {
              model,
              messages: [
                { role: "system", content: this.SYSTEM_PROMPT },
                { role: "user", content: contentParts.length > 1 ? contentParts : userPrompt },
              ],
              response_format: { type: "json_object" },
            };
            // gpt-6, gpt-5 e modelos da série 'o' da OpenAI não aceitam temperature diferente do padrão (1)
            if (
              !model.startsWith("gpt-6") &&
              !model.startsWith("gpt-5") &&
              !model.startsWith("o1") &&
              !model.startsWith("o3")
            ) {
              bodyPayload.temperature = 0.7;
            }

            // Ativa esforço de raciocínio padrão balanceado para modelos da família de raciocínio profundo
            if (model.startsWith("gpt-6") || model.startsWith("o1") || model.startsWith("o3")) {
              bodyPayload.reasoning_effort = "medium";
            }

            const res = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiKey}`,
              },
              body: JSON.stringify(bodyPayload),
            });

            if (res && res.ok) {
              const data = await res.json();
              const rawContent = data?.choices?.[0]?.message?.content;
              if (rawContent) {
                const parsedPlan = this.validateAndNormalizePlan(JSON.parse(rawContent), input);
                const duration = Date.now() - startTime;
                return {
                  plannerModelUsed: model,
                  plannerDurationMs: duration,
                  visualPlan: parsedPlan,
                  compiledImagePrompt: parsedPlan.imagePrompt,
                  compiledNegativePrompt: parsedPlan.negativePrompt,
                };
              }
            } else if (res) {
              const errTxt = await res.text().catch(() => "");
              console.warn(`[Gpt5PromptPlanner] Erro na OpenAI (${model}): ${res.status} - ${errTxt.slice(0, 150)}`);
              // Se o projeto não tiver acesso ao modelo (ex: 403/404 em gpt-5), tenta o próximo (gpt-4o)
              continue;
            }
          } catch (modelErr) {
            console.warn(`[Gpt5PromptPlanner] Exceção ao tentar ${model}:`, modelErr);
            continue;
          }
        }
      } catch (err) {
        console.warn("[Gpt5PromptPlanner] Falha geral no provedor OpenAI:", err);
      }
    }

    // Fallback inteligente: construtor sintético robusto garantindo conformidade sem travar a pipeline
    const fallbackPlan = this.createDeterministicPlan(input);
    return {
      plannerModelUsed: "deterministic-rules-engine",
      plannerDurationMs: Date.now() - startTime,
      visualPlan: fallbackPlan,
      compiledImagePrompt: fallbackPlan.imagePrompt,
      compiledNegativePrompt: fallbackPlan.negativePrompt,
    };
  }

  private static buildUserPrompt(input: Gpt5PlannerInput): string {
    const brand = input.brandKit;
    const selectedPlacement = this.selectDynamicLogoPlacement(input);
    const brandSection =
      brand && brand.enabled
        ? `
BRANDKIT DO CLIENTE:
- Nome da Empresa: ${brand.businessName}
- Segmento: ${brand.segment || "Geral"}
- Cores Primárias: ${brand.primaryColors.join(", ")}
- Cores Secundárias: ${brand.secondaryColors.join(", ")}
- Estilo Visual: ${brand.visualStyle || "Moderno e profissional"}
- Tom de Voz: ${brand.toneOfVoice || "Corporativo e confiável"}
- Fonte Primária (Títulos / Destaques Bold): ${brand.fonts?.primaryFont || "Não especificada (usar Sans-Serif Geométrica Bold)"}
- Fonte Secundária (Textos / Corpo Normal): ${brand.fonts?.secondaryFont || "Não especificada (usar Sans-Serif Geométrica Regular)"}
- Estilo Tipográfico Geral: ${brand.fonts?.style || "Moderno sans-serif limpo, corporativo e altamente legível"}
- Restrições: ${brand.restrictions?.join("; ") || "Nenhuma"}
`
        : "BrandKit: Desativado ou não fornecido pelo usuário.";

    const subjectImage = input.referenceImages?.find((r) => r.role === "product_subject");
    const styleImage = input.referenceImages?.find((r) => r.role === "style_reference");
    const selectedArchetypes = subjectImage
      ? this.selectCreativeLogoArchetype(input.userBrief)
      : null;

    let referencesSection = "";
    if (subjectImage && styleImage) {
      referencesSection = `
DUAS FOTOS ANEXADAS NA ETAPA 5 (IMAGEM 1: SUJEITO/PRODUTO/LOGOMARCA + IMAGEM 2: REFERÊNCIA DE ESTILO/CAMPANHA):
1. IMAGEM 1 DA ETAPA 5 (SUJEITO, PRODUTO OU LOGOMARCA ENVIADA PELO USUÁRIO):
   - Se for PESSOA: preserve a fisionomia, idade aproximada, etnia, cabelo e estilo.
   - Se for PRODUTO FÍSICO, EQUIPAMENTO, CAIXA DE SOM, APARELHO OU EMBALAGEM COMERCIAL (TRAVA /productlock ATIVA): preserve integralmente 100% da geometria, formato superior e inferior, peças aparentes (cornetas, tweeters, alto-falantes, grades em barras, botões, cabos), cores exatas de cada lateral/gabinete, frasco/pote e O RÓTULO ORIGINAL COMPLETO. É TERMINANTEMENTE PROIBIDO remodelar partes do equipamento (como trocar cornetas expostas por telas metálicas fechadas), mudar a cor do gabinete ou estampar logotipos de marcas citadas no texto (ex: "JBL") sobre o produto se não existirem na foto real enviada! Altere apenas o cenário ao fundo, o piso e a iluminação.
   - Se for UMA LOGOMARCA / LOGOTIPO / SÍMBOLO DE MARCA: ATIVE IMEDIATAMENTE O MODO EXCEÇÃO CRIATIVA COM ALTERNÂNCIA DINÂMICA! Passe por cima de qualquer proibição de logomarcas e INTEGRE ESSA LOGOMARCA ENVIADA DE FORMA CRIATIVA, NÍTIDA E EM DESTAQUE na nova imagem!
     * ARQUÉTIPO CRIATIVO SORTEADO PARA ESTA GERAÇÃO (PRIORIDADE): ${selectedArchetypes?.primary.labelPt} (${selectedArchetypes?.primary.promptEn})
     * OPÇÃO CRIATIVA ALTERNATIVA (CASO SE ADAPTE MELHOR AO NICHO): ${selectedArchetypes?.secondary.labelPt} (${selectedArchetypes?.secondary.promptEn})
     * (Se o usuário pediu explicitamente no briefing um local específico para a logo, siga o pedido do usuário; caso contrário, aplique o Arquétipo Criativo Sorteado acima para garantir variedade máxima entre gerações, reproduzindo 100% fielmente o nome, tipografia, símbolo e cores da logomarca enviada!)
2. ${
  input.referenceMode === "campaign_identity"
    ? `REFERÊNCIA MESTRA DE IDENTIDADE DE CAMPANHA (LAYOUT & DESIGN SYSTEM): Replique a arquitetura visual, diagramação geométrica, enquadramento de cena, molduras, faixas de neon e atmosfera da imagem de referência de estilo para que a arte resultante forme uma série consistente de publicidade, mantendo um protagonista/cena inéditos.`
    : `FOTO DE ESTILO/INSPIRAÇÃO: Utilize a paleta de cores, iluminação e atmosfera da imagem de referência como inspiração de luz e clima.`
}
`;
    } else if (subjectImage) {
      referencesSection = `
FOTO DA ETAPA 5 ANEXADA (SUJEITO, PRODUTO OU LOGOMARCA ENVIADA PELO USUÁRIO):
Existe uma imagem anexada enviada pelo usuário na Etapa 5.
INSTRUÇÃO OBRIGATÓRIA:
1. Examine a imagem anexada detalhadamente:
   - Se for uma PESSOA: preserve a fisionomia, idade aproximada, etnia, cabelo e estilo.
   - Se for um PRODUTO FÍSICO, EQUIPAMENTO, CAIXA DE SOM, APARELHO OU EMBALAGEM COMERCIAL (TRAVA /productlock ATIVA): preserve com 100% de fidelidade a estrutura mecânica e geométrica real (incluindo partes superiores e inferiores, cornetas aparentes, tweeters, grades em barras, cabos, botões e cores exatas das laterais do gabinete), a embalagem real E O RÓTULO ORIGINAL COMPLETO. É TERMINANTEMENTE PROIBIDO remodelar ou "modernizar" partes do produto, cobrir componentes expostos com telas genéricas ou estampar no equipamento logotipos de marcas citadas apenas no título/briefing (ex: "JBL") se não estiverem fisicamente na foto original! Mude apenas o cenário ao fundo, o piso e a iluminação.
   - Se for UMA LOGOMARCA / LOGOTIPO / SÍMBOLO DE MARCA: ATIVE O MODO EXCEÇÃO CRIATIVA COM ALTERNÂNCIA DINÂMICA! Passe por cima de todas as regras de proibição de logos e integre essa logomarca enviada de forma CRIATIVA, ORGÂNICA, NÍTIDA e EM DESTAQUE na nova imagem:
     * ARQUÉTIPO CRIATIVO SORTEADO PARA ESTA GERAÇÃO (PRIORIDADE): ${selectedArchetypes?.primary.labelPt} (${selectedArchetypes?.primary.promptEn})
     * OPÇÃO CRIATIVA ALTERNATIVA (CASO SE ADAPTE MELHOR AO NICHO): ${selectedArchetypes?.secondary.labelPt} (${selectedArchetypes?.secondary.promptEn})
     * (Se o usuário pediu explicitamente no briefing um local específico para a logo, siga o pedido do usuário; caso contrário, aplique o Arquétipo Criativo Sorteado acima, preservando fielmente a grafia exata do nome da marca, o ícone e as cores!)
2. Descreva esse elemento com detalhes no bloco [3. HERO SUBJECT] e [9. LOGO DIRECTIVE].
`;
    } else if (styleImage) {
      referencesSection =
        input.referenceMode === "campaign_identity"
          ? `
FOTO DE REFERÊNCIA DE IDENTIDADE DE CAMPANHA (DESIGN SYSTEM DE SÉRIE PUBLICITÁRIA) ANEXADA:
Esta imagem enviada na Etapa 5 é a REFERÊNCIA MESTRA DE DESIGN E IDENTIDADE DA SÉRIE.
Sua missão NÚMERO 1 é garantir que a nova arte seja imediatamente reconhecida como da MESMA CAMPANHA PUBLICITÁRIA:
1. CENÁRIO, FUNDO E ILUMINAÇÃO: Inspecione com atenção extrema a atmosfera, profundidade e esquema de luz da imagem mestre (ex: estúdio azul/escuro com chão reflexivo, iluminação cinematográfica de recorte, contrastes marcantes). NUNCA mude para um ambiente genérico comum (como cafeterias, escritórios descaracterizados ou paredes brancas) se a referência de campanha possui um estúdio com conceito estético marcante.
2. ELEMENTOS GRÁFICOS DE ASSINATURA: Se a imagem matriz possui elementos visuais característicos (como tubos/fitas de neon 3D brilhantes circulando os personagens, partículas de luz volumétrica, anéis luminosos, etc.), esses elementos são a MARCA REGISTRADA da campanha e DEVEM OBRIGATORIAMENTE ser descritos no imagePrompt para estarem presentes na nova imagem!
3. PALETA CROMÁTICA: Preserve com fidelidade o esquema de cores e contraste da matriz (ex: azul luminoso, laranja vibrante, tons azuis de estúdio).
5. REGRA DE OURO — SUJEITO E CENA INÉDITOS (NÃO COPIAR PESSOAS OU POSES): É TERMINANTEMENTE PROIBIDO clonar as mesmas pessoas, profissões, roupas ou poses da imagem de referência! Esta é uma NOVA peça da campanha. Crie um protagonista ou composição totalmente novos (ex: novo modelo masculino em pose autêntica, nova dinâmica humana) mantendo apenas os elementos visuais característicos (fitas de neon 3D, atmosfera azul de estúdio) e o design system que dão unidade à campanha.
`
          : "FOTO DE ESTILO/INSPIRAÇÃO ANEXADA: Utilize a paleta de cores e atmosfera da imagem como referência de luz e clima estético.";
    } else {
      referencesSection = "Nenhuma foto externa anexada na Etapa 5.";
    }

    // REGRA INVIOLÁVEL: hasLogo é TRUE apenas se a imagem da logo do BrandKit foi EFETIVAMENTE
    // carregada como referência real (base64 presente) para sobreposição fixa via Jimp.
    const logoRef = input.referenceImages?.find(
      (r) => (r.role === "business_logo" || r.role === "official_logo") && Boolean(r.base64)
    );
    const hasLogo = Boolean(logoRef);

    const isStep5Logo = this.isStep5LogoUpload(input);
    const logoDirectiveText = subjectImage
      ? `REGRA CONDICIONAL ESTRITA PARA A IMAGEM ENVIADA NA ETAPA 5 (PRODUTO FÍSICO vs. LOGOMARCA):
Inspecione visualmente a imagem enviada na Etapa 5 (product_subject) e retorne no JSON o campo "detectedStep5AssetType" como "product_or_person" (se for produto físico, equipamento, caixa de som, objeto, alimento ou pessoa) OU "brand_logo" (somente se a imagem enviada na Etapa 5 for o design gráfico isolado de uma logomarca/logotipo).
- CASO A — SE A IMAGEM DA ETAPA 5 FOR UM PRODUTO FÍSICO, EQUIPAMENTO, CAIXA DE SOM OU PESSOA ("product_or_person"):
  1. NÃO APLIQUE NENHUM ARQUÉTIPO DE LOGOMARCA! IGNORE completamente placas de acrílico, totens de bancada ou letreiros 3D!
  2. PROIBIÇÃO ABSOLUTA DE DESENHAR LOGOMARCAS NA CENA: É TERMINANTEMENTE PROIBIDO desenhar, inventar, renderizar ou estampar qualquer logomarca da empresa (como "${brand?.businessName || 'NumVapt'}") em placas de acrílico na mesa/balcão, totens, paredes ou equipamentos! ${
    hasLogo
      ? `A logomarca do BrandKit será aplicada via software na posição (${selectedPlacement.id}): mantenha a zona designada 100% LIMPA e VAZIA (${selectedPlacement.clearanceZonePrompt}).`
      : "Mantenha o canto superior limpo e NÃO desenhe nenhuma logomarca na cena."
  }
  3. TRAVA /productlock: Preserve 100% da geometria, partes superiores e inferiores, peças aparentes e cores reais do produto enviado.
- CASO B — SOMENTE SE A IMAGEM ENVIADA NA ETAPA 5 FOR UMA LOGOMARCA / LOGOTIPO ISOLADO ("brand_logo" — isStep5Logo=${isStep5Logo}):
  1. MODO EXCEÇÃO CRIATIVA COM ROTAÇÃO DINÂMICA (${selectedArchetypes?.primary.id}): Aí sim, mantenha o sorteio de arquétipos e integre essa logomarca enviada na Etapa 5 de forma criativa na cena aplicando preferencialmente: "${selectedArchetypes?.primary.promptEn}" (ou "${selectedArchetypes?.secondary.promptEn}"), reproduzindo fielmente o nome, símbolo e cores da logomarca enviada!`
      : hasLogo
        ? `REGRA MANDATÓRIA DE LOGOMARCA DO BRANDKIT (POSICIONAMENTO DINÂMICO FLEXÍVEL: ${selectedPlacement.labelPt}):
A imagem da logomarca oficial do BrandKit foi anexada para aplicação DIGITAL no pós-processamento pelo sistema. Portanto, no "imagePrompt" você DEVE OBRIGATORIAMENTE INSTRUIR A IA A:\n1. ${selectedPlacement.clearanceZonePrompt} ${selectedPlacement.textPlacementPrompt}\n2. PROIBIR que a IA desenhe logotipos soltos ou marcas fictícias no layout. Rótulos de produtos físicos reais continuam autênticos e intactos.`
        : `REGRA ABSOLUTA DE LOGOMARCAS DE CABEÇALHO / POST:
NENHUMA logomarca oficial foi fornecida. É TERMINANTEMENTE PROIBIDO inventar, desenhar ou renderizar qualquer logotipo solto, badge de marca no layout, mascote, florzinha ou solzinho flutuante no topo da arte. Deixe o canto superior da imagem COMPLETAMENTE LIMPO (espaço negativo livre).`;

    const artConcept = this.selectArtDirectionConcept(input);
    const creativeDirectionSection = artConcept
      ? [
          "DIREÇÃO DE ARTE PUBLICITÁRIA SORTEADA PARA ELEVAR A CRIATIVIDADE (/anticliche ATIVO):",
          `- Conceito Visual Principal Sugerido (${artConcept.primary.id}): ${artConcept.primary.labelPt}`,
          `  -> Diretriz em inglês: "${artConcept.primary.promptEn}"`,
          `- Alternativa Criativa (${artConcept.secondary.id}): ${artConcept.secondary.labelPt}`,
          "- INSTRUÇÃO CRÍTICA AO PLANEJADOR: Transforme o briefing do usuário em uma peça publicitária extraordinária, conceitual e memorável usando essa direção de arte (ou uma metáfora visual equivalente ainda mais genial para o tema). Materialize os itens citados pelo usuário fisicamente na cena ('Show, Don't List')!",
          "- PROIBIDO GERAR FUNDO LISO OU VAZIO BEGE DE ESTÚDIO: crie sempre um ambiente real autêntico e texturizado!",
          !this.isExplicitHandPhoneRequested(input.userBrief) ? "- PROIBIDO usar o clichê de mão avulsa com smartphone sobre mesa clara com café e plantinha (use apenas POV de transformação autêntica com fita 3D de neon)!" : "",
          "- PROIBIDO criar 3 ou 4 caixas brancas empilhadas estilo slide de PowerPoint!",
          !this.isExplicitCtaButtonRequested(input.userBrief) ? "- PROIBIDO desenhar botão falso de clique de site no rodapé (ex: 'Conheça todas as possibilidades >' ou 'Saiba mais >')!" : "",
        ].filter(Boolean).join("\n")
      : "";

    const dynamicTypo = input.textOverlayMode && input.textOverlayMode !== "NONE"
      ? this.selectDynamicTypographyStyle(input)
      : null;
    const typographySection = dynamicTypo
      ? `
ESTILO TIPOGRÁFICO & LAYOUT DINÂMICO SELECIONADO (/typolayout):
- Arquétipo Tipográfico: ${dynamicTypo.labelPt}
- Hierarquia de Pesos: ${dynamicTypo.weightHierarchyEn}
- Harmonia Cromática: ${dynamicTypo.colorHarmonyEn}
- Molduras, Cards & Fundos: ${dynamicTypo.containerAndFrameEn}
- Diretiva em Inglês para o imagePrompt: "${dynamicTypo.fullDirectiveEn}"
- INSTRUÇÃO OBRIGATÓRIA: Garanta alternância dinâmica de pesos (Bold no setup + Black no punchline) e contraste de cores no imagePrompt!`
      : "";

    return `
BRIEFING ORIGINAL DO USUÁRIO:
"${input.userBrief}"

PARÂMETROS DE PRODUÇÃO:
- Objetivo: ${input.objective}
- Formato: ${input.format} (${input.width}x${input.height})
- Estilo Selecionado: ${input.stylePreference}
- Modo de Sobreposição de Texto: ${input.textOverlayMode || "NONE"}
- Título/Headline Desejada: ${input.productHeadline || "Não especificada"}
- Instruções Negativas do Usuário: ${input.negativeInstructions || "Nenhuma"}

${brandSection}
${referencesSection}
${creativeDirectionSection}
${typographySection}
DIRETRIZES DE AGÊNCIA DE ELITE & ANATOMIA DE MÃOS (/handlock & /agencystudio):
- Garanta anatomia humana perfeita: exatamente 5 dedos por mão (1 polegar e 4 dedos), articulações naturais, unhas proporcionais e pegada ergonômica verossímil.
- Proíba dedos extras, 6 dedos, dedos colados, mãos atrofiadas ou soltas.
- Aplique acabamento de estúdio publicitário com lente 85mm f/1.8, bokeh suave, iluminação de recorte e pele hiper-realista com microporos (banindo aspecto plástico ou encerado).

${input.compiledPrompt ? `\nDIRETRIZES TÉCNICAS PRÉ-COMPILADAS:\n${input.compiledPrompt}\n` : ""}

${logoDirectiveText}

Gere o JSON completo e estruturado conforme o schema com o prompt em inglês perfeito para gpt-image-2.
`;
  }

  private static validateAndNormalizePlan(raw: any, input: Gpt5PlannerInput): Gpt5VisualPlanResponse {
    const brand = input.brandKit;
    const selectedPlacement = this.selectDynamicLogoPlacement(input);
    const safeAspect = input.format === "portrait" ? "1024x1280" : input.format === "story" ? "864x1536" : "1024x1024";
    const logoRef = input.referenceImages?.find(
      (r) => (r.role === "business_logo" || r.role === "official_logo") && Boolean(r.base64)
    );
    // REGRA: hasLogo é verdadeiro apenas se a imagem foi carregada como referência real (base64 disponível)
    const hasLogo = Boolean(logoRef);

    return {
      schemaVersion: "1.0",
      requestType: "generate",
      confidence: typeof raw.confidence === "number" ? raw.confidence : 0.95,
      needsClarification: Boolean(raw.needsClarification),
      clarifyingQuestions: Array.isArray(raw.clarifyingQuestions) ? raw.clarifyingQuestions : [],
      interpretation: {
        goal: raw.interpretation?.goal || input.objective,
        subject: raw.interpretation?.subject || input.userBrief.slice(0, 100),
        intendedUse: raw.interpretation?.intendedUse || `Arte publicitária para ${input.format}`,
        audience: raw.interpretation?.audience || brand?.audience || "Público geral",
      },
      visualPlan: {
        scene: raw.visualPlan?.scene || "Ambiente moderno e iluminado de alto padrão comercial.",
        composition:
          raw.visualPlan?.composition ||
          (hasLogo
            ? "Composição equilibrada com 20% de margens seguras e logomarca oficial da empresa integrada harmonicamente no topo ou canto superior."
            : "Composição central equilibrada com 20% de margens seguras e espaço limpo no topo para logo manual."),
        framing: raw.visualPlan?.framing || "Enquadramento comercial aberto garantindo que nenhum elemento seja cortado.",
        lighting: raw.visualPlan?.lighting || "Iluminação suave de estúdio com luz de preenchimento.",
        materialsAndTextures: Array.isArray(raw.visualPlan?.materialsAndTextures)
          ? raw.visualPlan.materialsAndTextures
          : ["Texturas realistas de alta definição"],
        colorDirection: Array.isArray(raw.visualPlan?.colorDirection)
          ? raw.visualPlan.colorDirection
          : brand?.primaryColors || ["#0083C7", "#FA6305"],
        style: raw.visualPlan?.style || input.stylePreference,
        mood: raw.visualPlan?.mood || "Confiável, profissional e inspirador",
      },
      brandApplication: {
        enabled: Boolean(brand?.enabled),
        useColors: Boolean(brand?.enabled),
        useLogo: hasLogo,
        logoPosition: raw.visualPlan?.brandApplication?.logoPosition || selectedPlacement.id,
        brandElementsToPreserve: hasLogo
          ? ["Logomarca oficial da empresa integrada à arte", "Cores oficiais da marca"]
          : ["Cores oficiais e espaço reservado para logo manual"],
      },
      referenceInstructions: Array.isArray(raw.referenceInstructions) ? raw.referenceInstructions : [],
      textLayers: Array.isArray(raw.textLayers) ? raw.textLayers : [],
      socialCaption:
        raw.socialCaption &&
        typeof raw.socialCaption.fullPostText === "string" &&
        raw.socialCaption.fullPostText.trim().length > 20
          ? {
              title: raw.socialCaption.title || input.productHeadline || "Post Oficial",
              hook: raw.socialCaption.hook || "",
              body: raw.socialCaption.body || "",
              callToAction: raw.socialCaption.callToAction || "",
              hashtags: Array.isArray(raw.socialCaption.hashtags)
                ? raw.socialCaption.hashtags
                : [],
              fullPostText: raw.socialCaption.fullPostText.trim(),
            }
          : this.generateFallbackSocialCaption(input),
      imagePrompt: (() => {
        let prompt = raw.imagePrompt || this.buildFallbackImagePrompt(input);
        const hasSubject = Boolean(input.referenceImages?.find((r) => r.role === "product_subject"));
        if (hasSubject) {
          // Garantir que sempre que o usuário anexar imagem/logo na Etapa 5,
          // nenhuma frase contraditória como "absolutely no logos" sabote a inserção criativa da logo enviada na cena
          prompt = prompt
            .replace(/,?\s*absolutely no logos/gi, "")
            .replace(/—no real apps or logos/gi, "")
            .replace(/\(no real apps or logos\)/gi, "")
            .replace(/Do NOT place any brand logo text within the layout\.?/gi, "")
            .replace(/with zero digital logos or floating brand marks\.?/gi, "while creatively integrating any uploaded Step 5 reference logo into the scene.");
          if (!prompt.includes("STRICT PRODUCT GEOMETRY") && !prompt.includes("/productlock")) {
            prompt += " [STRICT PRODUCT GEOMETRY & COMPONENT LOCK (/productlock): For any physical product or equipment in the reference photo, preserve 100% of its exact geometry, upper and lower structures, exposed components (horns, tweeters, bar grilles, knobs, cables), and exact cabinet side colors. Do NOT redesign parts into generic mesh grilles or stamp brand names mentioned in the headline onto the hardware if not present on the original photo.]";
          }
        }
        const fontMandate = this.buildBrandTypographyMandate(input);
        if (fontMandate && !prompt.includes("/fontlock")) {
          prompt += ` ${fontMandate}`;
        }
        const typoMandate = this.buildDynamicTypographyMandate(input);
        if (typoMandate && !prompt.includes("/typolayout")) {
          prompt += ` ${typoMandate}`;
        }
        const antiClicheMandate = this.buildAntiClicheCreativeMandate(input);
        if (antiClicheMandate && !prompt.includes("/anticliche")) {
          prompt += ` ${antiClicheMandate}`;
        }
        const agencyMandate = this.buildAgencyQualityAndAnatomyMandate(input);
        if (agencyMandate && !prompt.includes("/handlock")) {
          prompt += ` ${agencyMandate}`;
        }
        return prompt;
      })(),
      negativePrompt: (() => {
        const hasSubject = Boolean(input.referenceImages?.find((r) => r.role === "product_subject"));
        if (raw.negativePrompt) {
          if (hasSubject) {
            return String(raw.negativePrompt)
              .replace(/,?\s*no floating brand marks/gi, "")
              .replace(/,?\s*no [a-zA-Z0-9_-]+ logo drawn in the poster/gi, "")
              .replace(/,?\s*no logos?/gi, "");
          }
          const anatomicalNegatives = ", extra fingers, six fingers, 6 fingers, fused fingers, webbed fingers, missing fingers, mutated hands, malformed hands, deformed fingers, extra limbs, extra hands, missing thumb, backwards hands, melted fingers, unnatural hand poses, poorly drawn hands, disembodied hands floating, plastic skin, waxy skin, airbrushed skin, mannequin skin, porcelain doll face, bad anatomy, bad proportions, unnatural joints";
          const extraAntiCliche = !this.isExplicitHandPhoneRequested(input.userBrief)
            ? ", generic stock photo cliché, disembodied hand holding smartphone over beige desk with coffee mug and potted plant, stacked opaque white PowerPoint bullet boxes, fake website CTA button pill at bottom"
            : "";
          return `${raw.negativePrompt}${anatomicalNegatives}${extraAntiCliche}`;
        }
        const anatomicalNegatives = ", extra fingers, six fingers, 6 fingers, fused fingers, webbed fingers, missing fingers, mutated hands, malformed hands, deformed fingers, extra limbs, extra hands, missing thumb, backwards hands, melted fingers, unnatural hand poses, poorly drawn hands, disembodied hands floating, plastic skin, waxy skin, airbrushed skin, mannequin skin, porcelain doll face, bad anatomy, bad proportions, unnatural joints";
        return hasSubject
          ? `redesigned product geometry, altered speaker top cabinets, generic mesh grille replacing exposed horns, stamping headline brand logos onto hardware, changed cabinet side colors, competitor trademarks, blank product label, erased packaging typography, missing label text, blurry label, censored product packaging, solid color block label, cropped headline, cut off borders, low quality, artifacts${anatomicalNegatives}`
          : hasLogo
            ? `distorted logo, warped branding, text overlapping logo, typography in top-left corner, headline in top-left corner, title overlapping logo, competitor trademarks, fake text, cropped headline, cut off borders, blank product label, erased packaging text, low quality, artifacts${anatomicalNegatives}`
            : `logo, brand logo, company logo, emblem, corporate symbol, fake logo, invented logo, watermark, signature, mascot, cartoon rocket, rocket icon, cartoon character, invented branding, badge, shield, crest, monogram, seal, stylized company name, circle with letters, brand mark, brand symbol, arbitrary logo, made-up logo, placeholder logo, distorted text logo, cropped headline, cut off borders, low quality, artifacts${anatomicalNegatives}`;
      })(),
      preserve: hasLogo
        ? ["Logomarca oficial do negócio", "Foto/Logomarca criativa da Etapa 5", "Margens seguras"]
        : ["Foto/Logomarca da Etapa 5", "Integração criativa na cena", "Margens seguras"],
      generationParameters: {
        model: "gpt-image-2",
        quality: "high",
        size: safeAspect,
        background: "opaque",
        outputFormat: "png",
      },
      accessibility: {
        altText: raw.accessibility?.altText || input.userBrief.slice(0, 120),
        suggestedTitle: raw.accessibility?.suggestedTitle || "Arte visual NumVapt",
      },
    };
  }

  private static createDeterministicPlan(input: Gpt5PlannerInput): Gpt5VisualPlanResponse {
    const brand = input.brandKit;
    const selectedPlacement = this.selectDynamicLogoPlacement(input);
    const safeAspect = input.format === "portrait" ? "1024x1280" : input.format === "story" ? "864x1536" : "1024x1024";
    const logoRef = input.referenceImages?.find(
      (r) => (r.role === "business_logo" || r.role === "official_logo") && Boolean(r.base64)
    );
    // REGRA: hasLogo é verdadeiro apenas se a imagem foi carregada como referência real (base64 disponível)
    const hasLogo = Boolean(logoRef);
    const hasSubject = Boolean(input.referenceImages?.find((r) => r.role === "product_subject"));

    return {
      schemaVersion: "1.0",
      requestType: "generate",
      confidence: 0.9,
      needsClarification: false,
      clarifyingQuestions: [],
      interpretation: {
        goal: input.objective,
        subject: input.userBrief.slice(0, 100),
        intendedUse: `Publicação profissional em formato ${input.format}`,
        audience: brand?.audience || "Público-alvo qualificado",
      },
      visualPlan: {
        scene: "Estúdio fotográfico comercial profissional com iluminação equilibrada e fundo limpo.",
        composition: hasLogo
          ? "Composição harmônica com ponto focal nítido, margens seguras e logomarca oficial do negócio integrada de forma visível e nítida no canto superior ou topo."
          : "Composição harmônica com ponto focal nítido, margens seguras e integração criativa dos elementos enviados.",
        framing: "Plano médio com respiro de 20% em todas as bordas para evitar corte de conteúdo.",
        lighting: "Luz suave de softbox com destaques pontuais de contraste.",
        materialsAndTextures: ["Acabamento premium", "Texturas orgânicas fiéis"],
        colorDirection: brand?.primaryColors.length ? brand.primaryColors : ["#0083C7", "#FA6305"],
        style: input.stylePreference,
        mood: "Profissional, atraente e moderno",
      },
      brandApplication: {
        enabled: Boolean(brand?.enabled),
        useColors: Boolean(brand?.enabled),
        useLogo: hasLogo,
        logoPosition: selectedPlacement.id,
        brandElementsToPreserve: hasLogo
          ? ["Logomarca oficial da empresa integrada à arte", "Cores oficiais"]
          : ["Cores oficiais", "Elemento/Logo enviado na Etapa 5"],
      },
      textLayers: (() => {
        if (!input.productHeadline && input.textOverlayMode === "NONE") return [];
        const rawHeadline = input.productHeadline?.trim() || (input.textOverlayMode === "INFOGRAPHIC" ? "Solução Inteligente" : "");
        if (!rawHeadline) return [];
        const parts = rawHeadline.split(/(?<=[.!?])\s+|\s+—\s+|\s+-\s+/);
        if (parts.length >= 2) {
          return [
            { text: parts[0], type: "headline" as const, position: "top" },
            { text: parts.slice(1).join(" "), type: "subtitle" as const, position: "top" },
          ];
        }
        return [{ text: rawHeadline, type: "headline" as const, position: "top" }];
      })(),
      socialCaption: this.generateFallbackSocialCaption(input),
      imagePrompt: this.buildFallbackImagePrompt(input),
      negativePrompt: (() => {
        const anatomicalNegatives = ", extra fingers, six fingers, 6 fingers, fused fingers, webbed fingers, missing fingers, mutated hands, malformed hands, deformed fingers, extra limbs, extra hands, missing thumb, backwards hands, melted fingers, unnatural hand poses, poorly drawn hands, disembodied hands floating, plastic skin, waxy skin, airbrushed skin, mannequin skin, porcelain doll face, bad anatomy, bad proportions, unnatural joints";
        return hasSubject
          ? this.isStep5LogoUpload(input)
            ? `competitor trademarks, distorted logo, warped branding, cropped typography, text touching borders, amateur framing${anatomicalNegatives}`
            : `acrylic logo plaque on counter, tabletop logo totem, 3D wall logo sign, invented brand logo in scene, floating company emblem, redesigned product geometry, altered speaker top cabinets, generic mesh grille replacing exposed horns, stamping headline brand logos onto hardware, changed cabinet side colors, competitor trademarks, blank product label, erased packaging typography, missing label text, blurry label, censored product packaging, solid color block label, cropped typography, text touching borders, amateur framing${anatomicalNegatives}`
          : hasLogo
            ? `distorted logo, warped branding, text overlapping logo, typography in top-left corner, headline in top-left corner, title overlapping logo, competitor trademarks, fake text, generic stock photo hand holding smartphone with coffee cup, stacked opaque white PowerPoint bullet boxes, fake website CTA button pill at bottom, cropped typography, text touching borders, blank product label, erased packaging text, low quality, artifacts${anatomicalNegatives}`
            : `logo, brand logo, company logo, emblem, corporate symbol, fake logo, invented logo, watermark, signature, mascot, cartoon rocket, rocket icon, cartoon character, invented branding, badge, shield, crest, monogram, seal, stylized company name, circle with letters, brand mark, brand symbol, arbitrary logo, made-up logo, placeholder logo, distorted text logo, generic stock photo hand holding smartphone with coffee cup, stacked opaque white PowerPoint bullet boxes, fake website CTA button pill at bottom, cropped typography, text touching borders, amateur framing${anatomicalNegatives}`;
      })(),
      preserve: hasLogo
        ? ["Logomarca oficial do negócio", "Foto/Logomarca criativa da Etapa 5", "Margem segura de 20%"]
        : ["Foto/Logomarca da Etapa 5", "Integração criativa na cena", "Margem segura de 20%"],
      generationParameters: {
        model: "gpt-image-2",
        quality: "high",
        size: safeAspect,
        background: "opaque",
        outputFormat: "png",
      },
      accessibility: {
        altText: input.userBrief.slice(0, 100),
        suggestedTitle: "Design Publicitário NumVapt",
      },
    };
  }

  private static buildFallbackImagePrompt(input: Gpt5PlannerInput): string {
    const brand = input.brandKit;
    const isInfographic =
      input.textOverlayMode === "INFOGRAPHIC" || input.textOverlayMode === "BOTH";
    const isTitle = input.textOverlayMode === "TITLE_ONLY";
    const logoRef = input.referenceImages?.find(
      (r) => (r.role === "business_logo" || r.role === "official_logo") && Boolean(r.base64)
    );
    // REGRA: hasLogo é verdadeiro apenas se a imagem foi carregada como referência real (base64 disponível)
    const hasLogo = Boolean(logoRef);
    const subjectRef = input.referenceImages?.find((r) => r.role === "product_subject");

    const selectedPlacement = this.selectDynamicLogoPlacement(input);
    const typoStyle = this.selectDynamicTypographyStyle(input);
    let textInstruction =
      "[CRITICAL MANDATE — ZERO TEXT: Clean photography with zero typography, letters or watermarks.]";
    if (isTitle) {
      const headline = input.productHeadline?.trim() || "Headline em português";
      textInstruction = hasLogo
        ? `[DYNAMIC HEADLINE DIRECTIVE & LOGO CLEARANCE (/typolayout): Render premium multi-weight typography in Portuguese (pt-BR) saying "${headline}". ${typoStyle.weightHierarchyEn}. ${typoStyle.colorHarmonyEn}. ${typoStyle.containerAndFrameEn}. ${selectedPlacement.clearanceZonePrompt} ${selectedPlacement.textPlacementPrompt} Maintain generous breathing room and 20% safe margins.]`
        : `[DYNAMIC HEADLINE DIRECTIVE (/typolayout): Render premium multi-weight typography in Portuguese (pt-BR) saying "${headline}". ${typoStyle.weightHierarchyEn}. ${typoStyle.colorHarmonyEn}. ${typoStyle.containerAndFrameEn}. Maintain generous breathing room and 20% safe margins.]`;
    } else if (isInfographic) {
      const headline = input.productHeadline?.trim() || "Solução Inteligente";
      textInstruction = hasLogo
        ? `[DYNAMIC MODERN INFOGRAPHIC DIRECTIVE & LOGO CLEARANCE (/typolayout): Clean editorial layout in Portuguese (pt-BR) with headline "${headline}". ${typoStyle.weightHierarchyEn}. ${typoStyle.colorHarmonyEn}. ${typoStyle.containerAndFrameEn}. 20% safe margins from all outer borders. ${selectedPlacement.clearanceZonePrompt} ${selectedPlacement.textPlacementPrompt}]`
        : `[DYNAMIC MODERN INFOGRAPHIC DIRECTIVE (/typolayout): Clean editorial layout in Portuguese (pt-BR) with headline "${headline}". ${typoStyle.weightHierarchyEn}. ${typoStyle.colorHarmonyEn}. ${typoStyle.containerAndFrameEn}. 20% safe margins from all outer borders.]`;
    }

    const brandInstruction =
      brand && brand.enabled
        ? `Color palette harmonized with ${brand.primaryColors.join(", ")}.`
        : "";

    const isStep5Logo = this.isStep5LogoUpload(input);
    const fallbackArchetype = subjectRef && isStep5Logo
      ? this.selectCreativeLogoArchetype(input.userBrief)
      : null;

    const logoMandate = subjectRef && isStep5Logo
      ? `[CRITICAL MANDATE — CREATIVE LOGO / SUBJECT EXCEPTION MODE (${fallbackArchetype?.primary.id}): The uploaded Step 5 reference image is a brand logo or emblem. OVERRIDE all scene logo restrictions and creatively, crisply, and organically integrate that exact uploaded brand logo inside the scene itself (different from any flat corner BrandKit stamp — specifically ${fallbackArchetype?.primary.promptEn}, or alternatively ${fallbackArchetype?.secondary.promptEn}) preserving its exact spelling, icon, and colors while keeping the top-left header corner clean.]`
      : hasLogo
        ? `[CRITICAL MANDATE — MANDATORY LOGO INTEGRATION & ZERO-TEXT CLEARANCE ZONE (${selectedPlacement.id.toUpperCase()}): The official business logo is composited digitally. The diffusion AI MUST obey ${selectedPlacement.clearanceZonePrompt} ${selectedPlacement.textPlacementPrompt} ABSOLUTE PROHIBITION: Do NOT place any text, titles, subtitles, eyebrows, dates, or badges in the designated logo area. Do NOT draw, render, paint or invent any floating company logos, brand names as logos (including NumVapt), acrylic tabletop plaques on counters, totens, wall signs, flower icons, sun icons, or decorative badges in the poster layout. Real product packaging labels must remain authentic.]`
        : "[CRITICAL MANDATE — ZERO LOGOS IN POST LAYOUT & EMPTY HEADER SPACE: NO floating logo, company header emblem, acrylic tabletop plaque, counter totem, wall sign, layout badge, watermark, mascot, or artificial trademark graphics in the poster background or corners. The top corner MUST remain completely empty and clean for manual logo insertion.]";

    const subjectMandate = subjectRef
      ? "[CRITICAL MANDATE — STRICT PRODUCT GEOMETRY & COMPONENT LOCK (/productlock) + HERO SUBJECT PRESERVATION & UPLOADED LOGO INTEGRATION: Faithfully preserve 100% of the exact physical geometry, silhouette, upper and lower structures, exposed components (such as visible horns, tweeters, bar grilles, knobs, cables), exact cabinet side-panel colors, packaging, authentic printed label details, or uploaded brand logo graphics (brand name spelling, typography, colors, icon) from the user's reference image and integrate them prominently into the scene. Do NOT redesign, modernize, cover exposed parts with generic mesh grilles, change cabinet colors, or stamp brand logos mentioned in the text headline onto the product hardware if they are not physically present on the original photo.]"
      : "";

    if (input.compiledPrompt) {
      let p = input.compiledPrompt;
      if (subjectRef) {
        if (!p.includes("CREATIVE LOGO")) {
          p += ` ${logoMandate}`;
        }
      } else if (hasLogo) {
        if (p.includes("ZERO LOGOS") || p.includes("ABSOLUTE PROHIBITION")) {
          p = p.replace(/\[(CRITICAL MANDATE — ZERO LOGOS|ABSOLUTE PROHIBITION) [^\]]+\]/g, logoMandate);
        } else if (!p.includes("MANDATORY LOGO")) {
          p += ` ${logoMandate}`;
        }
      } else {
        if (!p.includes("ZERO LOGOS") && !p.includes("ABSOLUTE PROHIBITION") && !p.includes("CREATIVE LOGO")) {
          p += ` ${logoMandate}`;
        }
      }
      if (subjectRef && !p.includes("HERO SUBJECT")) {
        p += ` ${subjectMandate}`;
      }
      if (!p.includes("SAFE MARGINS")) {
        p += " [SAFE MARGINS MANDATE: Maintain 15% to 20% safe margin clearance around all borders. Absolutely no text, logo, or focal subjects touching the edges.]";
      }
      const fontMandate = this.buildBrandTypographyMandate(input);
      if (fontMandate && !p.includes("/fontlock")) {
        p += ` ${fontMandate}`;
      }
      const typoMandate = this.buildDynamicTypographyMandate(input, typoStyle);
      if (typoMandate && !p.includes("/typolayout")) {
        p += ` ${typoMandate}`;
      }
      const fallbackConcept = this.selectArtDirectionConcept(input);
      const antiCliche = this.buildAntiClicheCreativeMandate(input, fallbackConcept);
      if (antiCliche && !p.includes("/anticliche")) {
        p += ` ${antiCliche}`;
      }
      const agencyMandate = this.buildAgencyQualityAndAnatomyMandate(input);
      if (agencyMandate && !p.includes("/handlock")) {
        p += ` ${agencyMandate}`;
      }
      return p;
    }

    const thumbMandate = input.objective === "thumbnail"
      ? " [HIGH-PERFORMANCE VIDEO THUMBNAIL MANDATE: Dynamic magnetic video cover composition with dramatic high-contrast lighting, intense facial or subject focus, vibrant saturated color scheme, and extreme curiosity-inducing visual hook for maximum click-through rate (CTR) on YouTube, Reels, and TikTok.]"
      : "";

    const fallbackConcept = this.selectArtDirectionConcept(input);
    const creativeSceneLead = fallbackConcept
      ? `Award-winning conceptual advertising campaign (${fallbackConcept.primary.promptEn}) inspired by brief: ${input.userBrief}.`
      : `Commercial advertising artwork: ${input.userBrief}. Modern studio photography, crisp details, natural lighting, elegant atmosphere.`;
    const antiCliche = this.buildAntiClicheCreativeMandate(input, fallbackConcept);

    const agencyMandate = this.buildAgencyQualityAndAnatomyMandate(input);
    return `${creativeSceneLead} ${brandInstruction} ${thumbMandate} ${subjectMandate} ${textInstruction} ${this.buildBrandTypographyMandate(input)} ${this.buildDynamicTypographyMandate(input, typoStyle)} ${antiCliche} ${agencyMandate} ${logoMandate} [SAFE MARGINS MANDATE: Maintain 15% to 20% safe margin clearance around all borders. Absolutely no text or focal subjects touching the edges.]`;
  }

  public static generateFallbackSocialCaption(input: Gpt5PlannerInput) {
    const brandName = input.brandKit?.businessName || "Nosso Negócio";
    const segment = input.brandKit?.segment || "";
    // Limpar prefixos comuns de comandos como "crie uma imagem que..."
    const cleanBrief = input.userBrief
      .replace(/^(crie|gere|faça|monte|produza)\s+(uma?\s+)?(imagem|arte|foto|post|design)?\s+(que\s+)?(contextualize|traga|mostre|apresente|com|sobre|de)?/i, "")
      .trim();

    const title = input.productHeadline?.trim() || cleanBrief.slice(0, 60);

    // Gerar hashtags estratégicas
    const cleanTag = (str: string) => str.replace(/[^a-zA-Z0-9À-ÿ]/g, "");
    const tagsSet = new Set<string>();

    if (brandName && brandName !== "Empresa" && brandName !== "Nosso Negócio") {
      tagsSet.add(`#${cleanTag(brandName)}`);
    }
    if (segment) {
      tagsSet.add(`#${cleanTag(segment)}`);
    }

    // Extrair palavras-chave relevantes do briefing
    const stopWords = ["para", "com", "uma", "sobre", "mais", "trazendo", "acao", "ramo", "ideia", "negocio", "imagem"];
    const keywords = cleanBrief
      .toLowerCase()
      .split(/\s+/)
      .map((w) => cleanTag(w))
      .filter((w) => w.length > 3 && !stopWords.includes(w));

    keywords.slice(0, 3).forEach((k) => {
      tagsSet.add(`#${k.charAt(0).toUpperCase() + k.slice(1)}`);
    });

    tagsSet.add("#NegocioLocal");
    tagsSet.add("#Qualidade");
    tagsSet.add("#Inovacao");
    tagsSet.add("#Empreendedorismo");

    const hashtags = Array.from(tagsSet).slice(0, 7);

    const hook = input.productHeadline?.trim()
      ? `✨ ${input.productHeadline.trim()}!`
      : `✨ Transforme a experiência do seu dia a dia com soluções pensadas para você!`;

    const body = cleanBrief
      ? `Aqui no ${brandName}, cada detalhe é planejado com dedicação e profissionalismo. Trabalhamos constantemente para oferecer o melhor padrão de qualidade, atendimento acolhedor e resultados que superam suas expectativas.`
      : `No ${brandName}, colocamos qualidade, dedicação e excelência em primeiro lugar para encantar você a cada momento!`;

    const cta = `👉 Venha conferir de perto ou fale conosco pelo link da bio!`;

    const fullPostText = `${hook}\n\n${body}\n\n${cta}\n\n${hashtags.join(" ")}`;

    return {
      title: title || "Publicação Especial",
      hook,
      body,
      callToAction: cta,
      hashtags,
      fullPostText,
    };
  }
}

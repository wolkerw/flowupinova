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

export type DynamicHeadlineTreatmentId =
  | "classic_contrast_pure_white"
  | "brand_duotone_split"
  | "brand_duotone_with_solid_stripe"
  | "single_brand_color_with_stripe"
  | "brand_pill_badge_invert";

export interface DynamicHeadlineTreatment {
  id: DynamicHeadlineTreatmentId;
  labelPt: string;
  directivePt: string;
  treatmentDirectiveEn: string;
}

export type DynamicPersonaDiversityId =
  | "latina_executive_mid30s"
  | "afro_descendant_male_leader"
  | "caucasian_female_specialist"
  | "latino_male_entrepreneur_mid30s"
  | "afro_descendant_female_entrepreneur"
  | "latino_male_director_mature"
  | "caucasian_male_innovator"
  | "latina_female_creative_lead"
  | "afro_descendant_male_consultant"
  | "senior_female_executive"
  | "young_adult_tech_specialist"
  | "collaborative_diverse_duo";

export interface DynamicPersonaDiversityProfile {
  id: DynamicPersonaDiversityId;
  labelPt: string;
  genderPt: string;
  ageBracketPt: string;
  directiveEn: string;
}

export class Gpt5PromptPlanner {
  private static readonly SYSTEM_PROMPT = `
Você é o Diretor Criativo e Especialista Sênior em Planejamento Visual da NumVapt.
Sua missão é atuar como intermediário inteligente entre o briefing do usuário e o modelo gerador de imagens OpenAI (gpt-image-2).

Você deve analisar o briefing, as diretrizes de marca (BrandKit), o objetivo e as fotos enviadas na Etapa 5, e produzir um plano visual estruturado em JSON e um prompt altamente detalhado, específico e descritivo em inglês para o gpt-image-2.

DIRETRIZES FUNDAMENTAIS DE COMPOSIÇÃO DO PROMPT DO GPT IMAGE 2:
1. O prompt gerado para o gpt-image-2 deve ser rico, minucioso e estruturado em 10 blocos:
   [1. INTENDED GOAL]: Objetivo comercial/editorial claro e personalidade de direção de arte conforme a Etapa 3 (Vender Produto, Post para Redes, Anúncio/Oferta, Empresa & Serviços, Conceito Criativo ou Thumb de Alta Performance). REGRA ANTI-VIÉS CONSERVADOR: Mesmo quando o objetivo for "commercial" (Vender Produto), "presentation" (Empresa & Serviços) ou "ad" (Anúncio/Oferta), é TERMINANTEMENTE PROIBIDO adotar um layout engessado, careta ou com título sempre reto e centralizado no topo! Todos os objetivos devem exibir direção de arte ousada de agência internacional e liberdade espacial de títulos (/typolayout), priorizando 100% as fontes do BrandKit (/fontlock).
   [2. SCENE & CONTEXT]: Descrição do ambiente publicitário, iluminação e atmosfera.
   [3. HERO SUBJECT]: Detalhes fiéis do sujeito, produto ou logomarca principal.
   - DIVERSIDADE HUMANA E ALTERNÂNCIA DINÂMICA DE PERSONAGENS (/personadiversity): Sempre que a cena retratar pessoas/profissionais (a menos que uma foto de pessoa real tenha sido enviada na Etapa 5 ou especificada no briefing):
     * É TERMINANTEMENTE PROIBIDO gerar sempre a mesma mulher de blazer escuro e traços latinos repetidamente!
     * Alterne e especifique detalhadamente no prompt para a IA de difusão características humanas ricas e variadas entre as gerações: gênero (homens carismáticos, mulheres executivas, duplas profissionais colaborativas), etnias autênticas (afrodescendentes, pardos/latinos, asiáticos, caucasianos), faixas etárias reais (profissionais jovens e dinâmicos de 28-35 anos, executivos sêniores de 45-55 anos com cabelos grisalhos e autoridade madura), estilos de vestuário e penteados variados.
     * Se houver fotos ou personas cadastradas no BrandKit, integre a diversidade dessas personas de forma rotativa e autêntica.
   - Se o usuário enviou imagem na Etapa 5, examine a imagem anexada com atenção extrema:
   - Se for PESSOA: descreva com precisão as características físicas (idade, gênero, etnia, cabelo, traços, roupas) preservando a fisionomia da foto enviada.
   - Se for PRODUTO FÍSICO, EQUIPAMENTO, MÁQUINA, APARELHO, CAIXA DE SOM, VEÍCULO, PRATO, POTE, PACOTE OU EMBALAGEM COMERCIAL: ATIVE IMEDIATAMENTE A TRAVA ESTRUTURAL E DE CLONAGEM 1:1 DE EMBALAGEM E RÓTULO (/productlock & /labellock)!
     a) PRESERVAÇÃO GEOMÉTRICA E MECÂNICA 100% FIEL (PRODUCT GEOMETRY & COMPONENT LOCK): Inspecione minuciosamente cada sub-componente do produto na foto enviada (formato do pote/pacote/frasco, tampa, transparência, textura interna do produto, ou em equipamentos: cornetas aparentes, tweeters, grades, cores exatas das laterais e proporções). Descreva cada detalhe físico exatamente como é na foto original! É TERMINANTEMENTE PROIBIDO "modernizar", redesenhar ou alterar o formato físico do produto ou da embalagem!
     b) PROIBIÇÃO DE ALTERAR O PRODUTO POR CAUSA DO TEXTO DO BRIEFING: Se o briefing mencionar marcas de componentes internos ou adjetivos comerciais, use isso APENAS para os textos/títulos da arte. NUNCA redesenhe o produto físico para parecer um modelo genérico de catálogo!
     c) CLONAGEM FOTOGRÁFICA 1:1 DE RÓTULOS E EMBALAGENS ORIGINAIS (/labellock — REGRA INVIOLÁVEL): Quando a foto enviada pelo usuário mostrar uma embalagem, pote, pacote, garrafa ou saco plástico com rótulo impresso:
        - O rótulo original, a logomarca impressa dentro do rótulo, a tipografia do produto, as cores de cada faixa/borda do rótulo, os pesos (ex: 1kg, 500g, 90g), os selos de qualidade e as fotos/ilustrações impressas na embalagem DEVEM SER CLONADOS E PRESERVADOS COM 100% DE FIDELIDADE FOTOGRÁFICA!
        - PROIBIÇÃO DE REDESENHAR A LOGO DO RÓTULO: Se o logotipo no rótulo original for composto por um ícone limpo (ex: folhinha/gota solta) + texto direto sem moldura, é TERMINANTEMENTE PROIBIDO inventar uma elipse/oval verde, escudo, faixa ou brasão de supermercado ao redor do nome da marca no rótulo!
        - PROIBIÇÃO DE ALTERAR CORES E FAIXAS DO RÓTULO: Se o rótulo original possui laterais brancas com marca d'água e faixa central vertical roxa com base roxa, mantenha exatamente essa arquitetura cromática (JAMAIS pinte a base ou as laterais de dourado e JAMAIS altere o design do selo "qualidade PREMIUM sabor" para letra cursiva preta ou diferente da foto!).
        - PROIBIÇÃO DE ALTERAR FOTOS IMPRESSAS NO RÓTULO: Mantenha exatamente a mesma ilustração/foto impressa no rótulo original (ex: duas cabeças de alho inteiras fechadas, sem inventar dentes soltos ou mudar o desenho original da embalagem).
        - IMPORTANTE: A regra que proíbe desenhar logotipos soltos no fundo do post NUNCA se aplica ao rótulo físico da embalagem enviada na Etapa 5! A marca impressa na embalagem do produto é SAGRADA e deve permanecer 100% idêntica à foto de referência!
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
- EXCEÇÃO OFICIAL PARA O OBJETIVO "flyer" (Panfleto Digital / Flyer de Alta Densidade): Quando o objetivo for "flyer", a trava anti-lista e a trava anti-botão são expressamente suspensas! A IA é instruída a gerar um panfleto comercial completo com coluna lateral de 3 a 5 benefícios com ícones circulares, tela de smartphone rica com UI do app/produto e rodapé com selo e botão de CTA, rigorosamente submisso às fontes e cores do BrandKit.
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

DIRETRIZES DE ENGENHARIA TIPOGRÁFICA PREMIUM & LIBERDADE DE DIREÇÃO DE ARTE DE TÍTULOS (/typolayout):
- Se textOverlayMode for NONE: Instruir ZERO TEXT, fotografia conceitual pura sem letras ou legendas.
- Se textOverlayMode for TITLE_ONLY ou INFOGRAPHIC (ou BOTH):
  Você NÃO deve aplicar uma fórmula mecânica e previsível a todos os títulos! Atue como um Diretor de Arte Tipográfico Sênior e surpreenda com composições visuais variadas, autorais e ricas:
  1. DIVERSIDADE DE ARQUITETURAS E LAYOUTS ESPACIAIS DE TÍTULOS (12 ARQUÉTIPOS COM PRIORIDADE TOTAL ÀS FONTES DO BRANDKIT):
     - Priorize rigorosamente a família tipográfica oficial do BrandKit (/fontlock), mas exercite LIBERDADE TOTAL na geometria, posicionamento e arquitetura espacial do layout do título para nunca gerar artes monótonas ou sempre no mesmo bloco horizontal:
     - EXCEÇÃO TEMÁTICA NA HEADLINE (/thematictypo): Se o objetivo for "thematic" ou o briefing pedir um tema estilístico/cultural (anos 80, anos 2000, Senhor dos Anéis, fantasia, medieval, gibi, cyberpunk, etc.), libere a tipografia da headline para adotar o estilo artístico do tema com texturas e efeitos 3D, preservando o BrandKit em todas as demais informações da arte.
       a) Pôster Monumental Big-Type: Headline de grande escala display ocupando a área superior ou lateral com presença imponente, contraste extremo entre palavra-chave colossal e linha de apoio compacta;
       b) Profundidade 3D Estilo Capa de Revista (Magazine Depth Layering): Headline monumental posicionada na camada de plano médio, passando sutilmente por trás do topo dos ombros/cabeça do protagonista ou produto em primeiro plano (efeito Time / GQ / Vogue), mantendo 100% de leitura das palavras;
       c) Terço Inferior Cinematográfico (Cinematic Lower-Third Hero): Topo e centro livres para a fotografia respirar, ancorando o título de forma imponente no terço inferior da composição com barra de acento e subtítulo alinhado;
       d) Diagramação em "L" / Âncora em Cantos Opostos (Asymmetric Corner Anchor): Frase de preparação ancorada na zona superior livre e palavra de impacto gigante ou fechamento ancorado na base ou lateral oposta, abraçando a cena fotográfica;
       e) Capa Editorial de Luxo: Composição editorial refinada respeitando a caixa (sentence case ou uppercase conforme o título) e as cores oficiais do BrandKit;
       f) Tarja / Pill Geométrico Sólido Invertido: Palavra-chave de impacto dentro de uma tarja sólida nas cores oficiais do BrandKit com letras em alto contraste;
       g) Micro-Callouts Limpos & Badges de Marca: Pílulas limpas de 2 a 4 palavras conectadas ao produto/sujeito real, mantendo o título principal 100% livre de caixas escuras;
       h) Tipografia Espacial Integrada: Letras interagindo harmonicamente com a perspectiva e profundidade do ambiente;
       i) Diagramação Split em Duas Colunas: Palavra-líder gigante à esquerda separada por divisor vertical na cor do BrandKit de um bloco compacto à direita;
       j) Assinatura Lateral Vertical + Headline de Impacto (Vertical Sidebar Editorial): Rótulo editorial lateral combinado com a headline principal horizontal nas fontes do BrandKit;
       k) Entrelaçamento Espacial 3D em Profundidade (Spatial Depth Interlocking): Título interagindo entre planos sem perder legibilidade;
       l) Grid Contemporâneo Suíço (Swiss Editorial / Neue Grafik): Grid arquitetônico assimétrico minimalista com generoso respiro de espaço negativo.
  2. LIBERDADE CROMÁTICA, CONTRASTE ADAPTATIVO E TRATAMENTO DINÂMICO DOS TÍTULOS PRINCIPAIS (/headlinetreatment):
     - REGRA INVIOLÁVEL DE CONTRASTE ADAPTATIVO LIMPO (ZERO MANCHA PRETA / ZERO CAIXA ESCURA IMPROVISADA):
       * Se a região do cenário onde o título ficará posicionado for CLARA / ILUMINADA (ex: parede clara de escritório, cozinha iluminada, bancada clara, céu claro): você DEVE OBRIGATORIAMENTE renderizar o título na COR PRIMÁRIA/ESCURA OFICIAL DO BRANDKIT (ex: roxo, azul escuro, verde escuro ou cor principal da marca) diretamente sobre o fundo claro! É TERMINANTEMENTE PROIBIDO pintar o título de branco sobre fundo claro e jogar uma mancha/borrão/fumaça preta esfumaçada atrás das letras (NO dark smoke smudge, NO heavy black drop-shadow blur) e PROIBIDO prender o título principal dentro de retângulos ou caixas pretas/escuras na bancada!
       * Se o fundo for ESCURO / NOTURNO / PROFUNDO: utilize Branco Puro (#FFFFFF) combinado com as cores vibrantes do BrandKit.
     - Alterne dinamicamente o tratamento cromático e estrutural do título principal entre os seguintes modos sorteados:
       * 1) Contraste Puro Adaptativo da Marca (Clean Adaptive Brand Contrast): Em fundo claro, título 100% na Cor Primária/Forte do BrandKit limpa e sem sombra borrada; em fundo escuro, título em Branco Puro (#FFFFFF) nítido.
       * 2) Título em Duas Cores do BrandKit (Brand Duotone Split): Título dividido em duas cores oficiais da marca (Cor Primária + Cor Secundária em fundo claro, ou Branco Puro + Cor Primária em fundo escuro).
       * 3) Título em Duas Cores com Faixa/Tarja Sólida em uma das palavras (Brand Duotone with Stripe/Highlight): Uma parte do título limpa (na cor de contraste da marca) e a palavra de ação/destaque encasulada sobre uma faixa/tarja retangular sólida na Cor Primária/Secundária do BrandKit.
       * 4) Título Monocromático com Faixa/Tarja atrás de uma das palavras (Single Brand Color with Stripe): Título estilizado acompanhado por uma faixa/tarja sólida atrás de uma das palavras-chave.
       * 5) Tarja / Pill Sólido Invertido (Brand Pill Badge Invert): Frase de entrada limpa e palavra principal totalmente invertida dentro de uma cápsula/tag sólida na cor da marca.
  3. HIERARQUIA E PROPORÇÃO:
     - Crie contraste dramático de escala (palavras principais maiores e de impacto; frases de apoio mais compactas e elegantes).
     - No modo INFOGRAPHIC ou BOTH, a fotografia/cena conceitual DEVE dominar pelo menos 70% a 75% da arte.
     - JAMAIS crie caixas brancas empilhadas estilo PowerPoint, JAMAIS crie caixas escuras com borda dourada/neon ao redor do título principal sem pedido explícito e JAMAIS adicione botões falsos de CTA!
- REGRA DE FIDELIDADE ÀS FONTES DO BRANDKIT (/fontlock) COM EXCEÇÃO TEMÁTICA NA HEADLINE (/thematictypo):
  1. Para peças corporativas normais, sempre que houver texto na arte (TITLE_ONLY, INFOGRAPHIC ou BOTH) e o BrandKit definir fontes oficiais, exija no "imagePrompt" EXATAMENTE as fontes cadastradas pelo usuário.
  2. EXCEÇÃO CIRÚRGICA DE ALTA CRIATIVIDADE NO TÍTULO HEAD (/thematictypo): Quando o objetivo for "thematic" ou o briefing solicitar estilos artísticos, épocas ou cultura pop (ex: anos 80, anos 2000, Senhor dos Anéis, cinema, fantasia, cyberpunk, gibi, datas sazonais), a HEADLINE PRINCIPAL fica liberada da trava de fonte simples! O título principal deve ser desenhado sob medida com a tipografia, extrusão 3D, neon cromado, ouro élfico ou estilo do tema solicitado.
  3. TODAS AS DEMAIS INFORMAÇÕES (cards, subtítulos, tópicos de benefícios, rodapés e badges de contato) DEVEM permanecer rigorosamente fiéis às fontes limpas do BrandKit e a zona de respiro da logo oficial deve permanecer 100% limpa.
  4. Preserve a legibilidade e contraste adaptativo limpo da arte.
- REGRA DE OURO TIPOGRÁFICA — PROIBIÇÃO DE PONTO FINAL EM HEADLINES (/noendingperiod):
  1. Títulos principais, mastheads, slogans e headlines publicitárias JAMAIS devem terminar com ponto final (".")!
  2. É TERMINANTEMENTE PROIBIDO desenhar ponto final após a última palavra da headline (exemplo: desenhe "NOVOS TEMPOS", e NUNCA "NOVOS TEMPOS.").
  3. Headlines são chamadas de impacto abertas e dinâmicas, não frases de texto corrido. Remova qualquer ponto final do final do título principal.

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
      clearanceZonePrompt: "ZERO-TEXT LOGO CLEARANCE ZONE: Keep top-left quadrant (top 24% height x left 38% width) 100% blank, empty and clean for the prominent official BrandKit logo overlay.",
      textPlacementPrompt: "Place headline starting below Y=24% or center/right.",
    },
    {
      id: "top-right" as const,
      labelPt: "Canto Superior Direito (editorial moderno com leitura balanceada)",
      clearanceZonePrompt: "ZERO-TEXT LOGO CLEARANCE ZONE: Keep top-right quadrant (top 24% height x right 38% width) 100% blank, empty and clean for the prominent official BrandKit logo overlay.",
      textPlacementPrompt: "Place headline starting on the left (below Y=24%) or center, leaving top-right clean for the brand logo.",
    },
    {
      id: "top-center" as const,
      labelPt: "Topo Centralizado (estilo capa de revista de luxo / pôster icônico)",
      clearanceZonePrompt: "ZERO-TEXT LOGO CLEARANCE ZONE: Keep top-center area (top 20% height x center 56% width) 100% blank, empty and clean for the prominent official BrandKit logo overlay.",
      textPlacementPrompt: "Place headline starting below Y=22% or in the midground, letting the centered top logo breathe.",
    },
    {
      id: "bottom-right" as const,
      labelPt: "Rodapé Direito (assinatura corporativa discreta e sofisticada)",
      clearanceZonePrompt: "ZERO-TEXT LOGO CLEARANCE ZONE: Keep bottom-right quadrant (bottom 18% height x right 38% width) 100% blank, empty and clean for the prominent official BrandKit logo overlay.",
      textPlacementPrompt: "Keep bottom-right corner completely free of text or buttons for the official brand sign-off.",
    },
  ];

  private static logoPlacementCursor = 0;

  public static getNextLogoPlacement(lastPos?: BrandLogoPlacement): (typeof Gpt5PromptPlanner.BRAND_LOGO_PLACEMENTS)[number] {
    if (!lastPos) {
      const randomIdx = Math.floor(Math.random() * this.BRAND_LOGO_PLACEMENTS.length);
      return this.BRAND_LOGO_PLACEMENTS[randomIdx];
    }
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
      id: "display_monumental_poster",
      labelPt: "Pôster Monumental Big-Type (Escala Display Imponente com Letras Gigantes & Contraste Dramático)",
      weightHierarchyEn: "Dramatic scale & display dominance using the BrandKit typeface family: Monumental headline with massive display scale anchoring the visual space, bold power words in ExtraBold/Black weight (900), accompanied by a razor-sharp compact subtitle in Regular weight (400)",
      colorHarmonyEn: "Clean adaptive brand contrast: On light/bright walls or backgrounds, render typography directly in the BrandKit Primary Color with zero dark smoke/smudge shadows; on dark backgrounds, use crisp Pure White (#FFFFFF) display typography",
      containerAndFrameEn: "Framing & space: Frameless, monumental typography floating cleanly without dark boxes or blurry black shadows, with generous breathing room and geometric precision",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Monumental Big-Type Poster): Using the exact BrandKit font family, render a striking, monumental display headline with dramatic scale dominance and clean adaptive brand contrast (BrandKit Primary Color on light backgrounds, Pure White on dark backgrounds, with zero murky black drop-shadow smudges).",
    },
    {
      id: "magazine_depth_layering",
      labelPt: "Camada de Profundidade 3D Estilo Capa de Revista (Título Monumental no Plano Médio Integrado Atrás dos Ombros do Sujeito)",
      weightHierarchyEn: "Magazine-cover depth hierarchy: Colossal ExtraBold (900 weight) display headline in the midground plane paired with a crisp foreground supporting subline in Medium weight (500), strictly adhering to the BrandKit typeface anatomy",
      colorHarmonyEn: "High-contrast editorial BrandKit Primary Color (on light scenes) or Pure White (#FFFFFF, on dark scenes) display letters where the foreground subject slightly overlaps the bottom 10-15% of the giant letters without ever obscuring word legibility",
      containerAndFrameEn: "Framing & 3D depth: Iconic Time/GQ/Vogue magazine cover layering where the monumental title sits between the background environment and the hero subject's shoulders, creating authentic 3D spatial depth",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (3D Magazine Cover Depth Layering): Render a monumental BrandKit headline in the midground plane right behind the top of the hero subject's shoulders (Time/GQ cover depth effect), keeping 100% of every letter and word unmistakably legible.",
    },
    {
      id: "cinematic_lower_third_hero",
      labelPt: "Terço Inferior Cinematográfico de Campanha (Topo Livre para Fotografia & Título Imponente na Base)",
      weightHierarchyEn: "Cinematic movie-poster hierarchy: Leave the upper and central canvas open to showcase the photography, anchoring a powerful ExtraBold (800-900 weight) headline in the lower-third zone accompanied by an aligned Regular (400 weight) subtitle",
      colorHarmonyEn: "Clean lower-third contrast: Crisp Pure White (#FFFFFF) or BrandKit Primary Color headline paired with a warm Brand Accent vertical bar, without enclosing the headline inside a dark box",
      containerAndFrameEn: "Framing & space: Frameless lower-third architectural composition (Y=68% to Y=84%) structured by a 3px vertical brand-colored accent bar on the left margin, leaving the top 65% of the artwork pure and uncluttered",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Cinematic Lower-Third Campaign Layout): Keep the upper canvas open for the hero photography and anchor the BrandKit headline cleanly in the lower-third zone, structured by a sleek vertical brand-colored accent bar without dark container boxes.",
    },
    {
      id: "asymmetric_corner_anchor",
      labelPt: "Diagramação em 'L' / Âncora Assimétrica em Cantos Opostos (Abertura no Topo & Fechamento de Impacto na Base)",
      weightHierarchyEn: "Dynamic split-zone hierarchy: Setup phrase in clean Medium/Semi-Bold (600 weight) anchored in the upper editorial zone, counterbalanced by the core punchline in massive ExtraBold (900 weight) anchored in the opposite lower zone",
      colorHarmonyEn: "Balanced editorial contrast: Adaptive BrandKit Primary Color (on light walls) or Crisp White (#FFFFFF, on dark scenes) paired with Brand Accent highlights framing the central hero subject",
      containerAndFrameEn: "Framing & space: Architectural L-shaped / diagonal-corner editorial balance that frames the central action from two opposing zones without crowding the middle of the scene",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Asymmetric Dual-Zone Corner Anchor): Break away from a single static text block by splitting the BrandKit headline into an editorial L-frame: place the setup phrase cleanly in the upper zone and anchor the monumental punchline in the lower/opposite zone, framing the hero subject dynamically.",
    },
    {
      id: "editorial_luxury_magazine",
      labelPt: "Capa Editorial de Luxo & Elegância Minimalista",
      weightHierarchyEn: "Refined editorial hierarchy: High-contrast BrandKit lettering in Bold (700 weight) preserving its natural case and proportions, paired with an understated, ultra-clean Regular/Medium subline",
      colorHarmonyEn: "Noble adaptive palette: BrandKit Primary Color on light backgrounds or pristine Pure White (#FFFFFF) on dark backgrounds for pure high-end sophistication with zero dark smoke smudges",
      containerAndFrameEn: "Framing & space: Pure architectural negative space, generous margins (22%), delicate 1px hairline rule accent, and impeccable editorial magazine balance",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Luxury Magazine Editorial): Render an ultra-refined editorial title strictly using the BrandKit typeface and natural letter proportions with clean adaptive contrast and a delicate 1px hairline divider.",
    },
    {
      id: "solid_badge_highlight_invert",
      labelPt: "Tarja / Pill Geométrico Sólido Invertido (Palavra-Chave em Bloco Sólido na Cor da Marca)",
      weightHierarchyEn: "Punchy block contrast: Setup phrase in clean Bold (700 weight), while the core punchline keyword is encased in a solid geometric tag/pill with ExtraBold negative cutout lettering",
      colorHarmonyEn: "High-impact brand block: Setup words in clean high-contrast BrandKit color or Pure White (#FFFFFF), and the central keyword enclosed in a vibrant solid block in Brand Accent with crisp white text inside",
      containerAndFrameEn: "Framing & space: Modern solid geometric rectangular pill tag on the single highlighted keyword only, keeping the rest of the headline frameless and clean",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Solid Inverted Brand Highlight Tag): Render the BrandKit headline with a modern inverted block accent: house the core keyword inside a vibrant solid brand-colored tag/pill with crisp negative white text, while setup text floats cleanly beside or above it.",
    },
    {
      id: "glassmorphic_duotone_glow",
      labelPt: "Título Dual-Tone Clean & Destaque Cromático da Marca",
      weightHierarchyEn: "Dynamic weight hierarchy: Headline setup phrase in Bold/Semi-Bold (700 weight), core punchline keyword in Heavy/Black (900 weight) for maximum visual punch, and supporting subtitle in clean Regular (400 weight)",
      colorHarmonyEn: "Dual-tone color contrast: Setup words in BrandKit Primary Color (on light backgrounds) or Pure White (#FFFFFF, on dark backgrounds), and highlighted action keyword in vibrant Brand Secondary/Accent Color",
      containerAndFrameEn: "Framing & space: Frameless, clean floating headline directly integrated over the natural scene without enclosing the main title inside dark boxes or gold-bordered rectangles",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Clean Dual-Tone Brand Headline): Render a frameless BrandKit headline with dynamic weight and dual-tone color alternation (setup words in BrandKit Primary Color on light backgrounds or White on dark backgrounds, and core punchline in Heavy/Black 900 weight in Brand Secondary Color) with zero dark boxes around the title.",
    },
    {
      id: "spatial_architectural_light",
      labelPt: "Tipografia Espacial Integrada à Perspectiva e Profundidade",
      weightHierarchyEn: "Three-dimensional weight integration: Bold architectural BrandKit letterforms with physical presence, seamlessly harmonized with the environment's perspective and depth",
      colorHarmonyEn: "Clean adaptive contrast: Crisp BrandKit Primary Color on bright backgrounds or Pure White (#FFFFFF) on dark scenes, without artificial dark smudge backdrops",
      containerAndFrameEn: "Framing & space: Frameless spatial placement interacting naturally with the scene's depth of field, background bokeh, and architectural lines",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Spatial Environmental Typography): Render high-impact BrandKit letterforms organically embedded in the 3D space, interacting cleanly with the scene's depth and lighting.",
    },
    {
      id: "split_column_editorial",
      labelPt: "Diagramação Editorial em Duas Colunas Assimétricas com Barra Vertical da Marca",
      weightHierarchyEn: "Asymmetric editorial contrast: Large display lead word on the left in ExtraBold (900 weight), paired with a compact, ultra-sharp two-line sub-phrase in Regular/Medium weight aligned along a vertical divider",
      colorHarmonyEn: "High-contrast dynamic balance: BrandKit Primary Color (on light scenes) or Pure White (#FFFFFF, on dark scenes) text anchored by a Brand Accent vertical rule",
      containerAndFrameEn: "Framing & space: Delicate 2px vertical brand-colored rule structuring a frameless two-column editorial layout with architectural precision and generous breathing space",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Asymmetric Two-Column Split Editorial): Render an asymmetrical two-column BrandKit headline structured by a vertical brand-colored rule, pairing a giant lead word on the left with a sharp multi-line continuation on the right.",
    },
    {
      id: "vertical_sidebar_editorial",
      labelPt: "Eixo Lateral Vertical + Headline Principal de Impacto (Editorial Sidebar Architecture)",
      weightHierarchyEn: "Editorial sidebar contrast: A sleek vertical category/eyebrow accent along the side margin in Medium weight, paired with a bold horizontal ExtraBold main headline",
      colorHarmonyEn: "Refined agency palette: Vertical sidebar tag in Brand Accent paired with BrandKit Primary Color (on light scenes) or Pure White (#FFFFFF, on dark scenes) main display typography",
      containerAndFrameEn: "Framing & space: Contemporary design-magazine grid combining a vertical margin axis line with an asymmetric frameless horizontal display block",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Vertical Sidebar Axis & Display Headline): Create a contemporary agency grid using the exact BrandKit typeface: pair a sleek vertical editorial eyebrow/tag along the safe side margin with a bold, high-contrast horizontal main headline.",
    },
    {
      id: "floating_depth_interlocking",
      labelPt: "Entrelaçamento Espacial 3D em Profundidade (Palavras Interagindo em Camadas com o Sujeito e Elementos de Cena)",
      weightHierarchyEn: "Multi-depth typographic weaving: Headline split into dynamic spatial tiers using the BrandKit typeface family, where key punchline words weave between the hero subject and midground planes without sacrificing legibility",
      colorHarmonyEn: "Clean adaptive contrast: BrandKit Primary Color on bright backgrounds or Crisp Pure White (#FFFFFF) on dark scenes, with zero murky black drop shadows",
      containerAndFrameEn: "Framing & space: Organic 3D depth integration weaving seamlessly around the hero subject while preserving a generous 20% safe margin from all outer borders",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Spatial Interlocking & Depth Weaving): Create an award-winning editorial poster where the BrandKit headline weaves organically through the scene's spatial planes with 100% legibility.",
    },
    {
      id: "swiss_minimalist_grid",
      labelPt: "Grid Contemporâneo Suíço & Diagramação Assimétrica (Swiss Editorial Design / Neue Grafik)",
      weightHierarchyEn: "Pure Swiss editorial hierarchy: High-contrast BrandKit typography structured on a clean asymmetric grid, pairing a monumental bold title block with generous negative space",
      colorHarmonyEn: "Noble minimalist palette: BrandKit Primary Color (on light walls/scenes) or Pure White (#FFFFFF, on dark scenes) paired with a single Brand Accent element and subtle 1px architectural hairline dividers",
      containerAndFrameEn: "Framing & space: Strict architectural alignment, frameless negative space (at least 25% open breathing room), and impeccable 20% safe margins",
      fullDirectiveEn: "PREMIUM TYPOGRAPHY ARCHETYPE (Contemporary Swiss Grid / Neue Grafik): Render a sophisticated, design-magazine worthy title layout strictly using the BrandKit typeface, leveraging bold scale contrast, clean asymmetric alignment, and luxurious negative space.",
    },
  ];

  private static typographyStyleCursor = 0;

  public static selectDynamicTypographyStyle(input?: Gpt5PlannerInput): DynamicTypographyStyle {
    const styles = this.DYNAMIC_TYPOGRAPHY_STYLES;
    const idx = (this.typographyStyleCursor++) % styles.length;
    return styles[idx];
  }

  public static readonly DYNAMIC_HEADLINE_TREATMENTS: DynamicHeadlineTreatment[] = [
    {
      id: "classic_contrast_pure_white",
      labelPt: "Contraste Puro Adaptativo da Marca (Clean Brand / White Adaptive Contrast)",
      directivePt:
        "Em fundos claros/iluminados (paredes claras, cozinhas, escritórios claros), renderize o título 100% na Cor Primária/Escura oficial do BrandKit de forma limpa e sem sombra preta borrada; em fundos escuros, renderize em Branco Puro (#FFFFFF).",
      treatmentDirectiveEn:
        "Clean Adaptive Brand Contrast: If the background behind the title is light or bright (such as a light wall, bright office, or sunlit kitchen), render the entire primary headline cleanly in the client's official BrandKit Primary/Dark color with ZERO black smudge or smoke shadows behind the text! If the background is dark, render the headline in crisp Pure White (#FFFFFF).",
    },
    {
      id: "brand_duotone_split",
      labelPt: "Título em Duas Cores (Brand Duotone Split)",
      directivePt:
        "Título dividido harmonicamente em duas cores da paleta do BrandKit (Cor Primária + Cor Secundária em fundos claros, ou Branco Puro + Cor Primária em fundos escuros), sem manchas pretas.",
      treatmentDirectiveEn:
        "Dynamic Brand Duotone Split: Render the headline dynamically in two harmonized brand colors — on light backgrounds use the BrandKit Primary Color + BrandKit Secondary Accent Color (or Pure White #FFFFFF + BrandKit Primary Color on dark backgrounds), with zero dark smudge shadows or boxes.",
    },
    {
      id: "brand_duotone_with_solid_stripe",
      labelPt: "Título em Duas Cores com Faixa/Tarja em uma das Palavras (Brand Duotone with Stripe)",
      directivePt:
        "Título em duas cores respeitando o contraste do fundo, onde a palavra de maior impacto é destacada sobre uma faixa/tarja retangular sólida na Cor do BrandKit.",
      treatmentDirectiveEn:
        "Brand Duotone with Solid Highlight Stripe: Render the setup words cleanly (in BrandKit Primary Color on light backgrounds or Pure White #FFFFFF on dark backgrounds), and encase ONLY the single primary impact keyword inside a solid rectangular highlight stripe filled with the BrandKit accent color.",
    },
    {
      id: "single_brand_color_with_stripe",
      labelPt: "Título com Uma Cor e Faixa/Tarja atrás de uma das Palavras (Single Brand Color with Stripe)",
      directivePt:
        "Título estruturado em uma cor dominante do BrandKit (ou branco em fundo escuro) com uma faixa/tarja sólida atrás de uma das palavras-chave.",
      treatmentDirectiveEn:
        "Single Dominant Color with Solid Backdrop Stripe: Render the headline text in a unified high-contrast BrandKit color (or Pure White on dark scenes), placing a vibrant solid geometric highlight band/stripe (filled with the BrandKit accent color) directly behind one decisive power word.",
    },
    {
      id: "brand_pill_badge_invert",
      labelPt: "Palavra-Chave em Tarja/Pill Sólido Invertido (Brand Inverted Pill Badge)",
      directivePt:
        "Palavra principal invertida dentro de uma cápsula/tag sólida nas cores oficiais da marca com texto vazado e frase de preparação limpa.",
      treatmentDirectiveEn:
        "Modern Brand Inverted Pill Tag: Setup words float cleanly (in BrandKit Primary Color on light backgrounds or crisp White #FFFFFF on dark backgrounds), while the single core power keyword is encased inside a modern solid brand-colored rectangular pill/tag with crisp cutout letters.",
    },
  ];

  private static headlineTreatmentCursor = 0;

  public static selectDynamicHeadlineTreatment(input?: Gpt5PlannerInput): DynamicHeadlineTreatment {
    const treatments = this.DYNAMIC_HEADLINE_TREATMENTS;
    const idx = (this.headlineTreatmentCursor++) % treatments.length;
    return treatments[idx];
  }

  public static buildDynamicHeadlineTreatmentMandate(
    input: Gpt5PlannerInput,
    treatment?: DynamicHeadlineTreatment
  ): string {
    if (!input.textOverlayMode || input.textOverlayMode === "NONE") return "";
    const selected = treatment || this.selectDynamicHeadlineTreatment(input);
    const brandColors = input.brandKit?.primaryColors?.length
      ? input.brandKit.primaryColors.join(", ")
      : "#0083C7 / #FA6305";
    const secondaryColors = input.brandKit?.secondaryColors?.length
      ? `, Secondary: ${input.brandKit.secondaryColors.join(", ")}`
      : "";
    return `[DYNAMIC HEADLINE CHROMATIC & STRIPE TREATMENT (/headlinetreatment — ${selected.id}): Selected Treatment: ${selected.labelPt}. Directive: ${selected.treatmentDirectiveEn} Brand Color Reference: Primary ${brandColors}${secondaryColors}. CRITICAL CONTRAST RULE: Never place white text with a dirty black/grey smoke smudge over a light wall, and never trap the main headline inside an unrequested dark/gold-bordered box on a table/counter! On light backgrounds, always render the headline directly in the BrandKit Primary Color cleanly.]`;
  }

  public static readonly DYNAMIC_PERSONA_PROFILES: DynamicPersonaDiversityProfile[] = [
    {
      id: "latina_executive_mid30s",
      labelPt: "Executiva Latina Carismática (32-38 anos, cabelos ondulados castanhos, alfaiataria elegante)",
      genderPt: "Feminino",
      ageBracketPt: "32-38 anos",
      directiveEn: "Authentic, charismatic Latina businesswoman in her mid-30s with natural wavy dark hair, warm approachable confident smile, professional smart-casual tailored blazer, real human skin texture with microscopic pores",
    },
    {
      id: "afro_descendant_male_leader",
      labelPt: "Líder Masculino Afrodescendente (35-42 anos, corte degradê impecável, presença imponente)",
      genderPt: "Masculino",
      ageBracketPt: "35-42 anos",
      directiveEn: "Distinguished, charismatic Black male entrepreneur/executive in his late 30s with sharp tailored fade haircut, trimmed neat beard, inspiring vision, wearing a modern structured tailored jacket over a crisp shirt, commanding modern authority",
    },
    {
      id: "caucasian_female_specialist",
      labelPt: "Especialista Feminina Contemporânea (28-34 anos, visual dinâmico e inovador)",
      genderPt: "Feminino",
      ageBracketPt: "28-34 anos",
      directiveEn: "Energetic, modern female specialist in her early 30s with natural chestnut or auburn hair tied in a chic professional ponytail, engaging warm gaze, wearing a minimalist modern blouse and tailored vest, radiating fresh agile expertise",
    },
    {
      id: "latino_male_entrepreneur_mid30s",
      labelPt: "Empreendedor Latino / Brasileiro Dinâmico (32-38 anos, estilo moderno e acessível, camisa social ou polo fina)",
      genderPt: "Masculino",
      ageBracketPt: "32-38 anos",
      directiveEn: "Dynamic, charismatic Brazilian/Latino male entrepreneur in his mid-30s with natural short dark hair, well-groomed beard, approachable confident demeanor, wearing a modern fitted button-up shirt or fine smart-casual blazer, exuding practical business competence and warmth",
    },
    {
      id: "afro_descendant_female_entrepreneur",
      labelPt: "Empreendedora Afrodescendente Inspiradora (34-40 anos, penteado trançado ou crespo volumoso sofisticado)",
      genderPt: "Feminino",
      ageBracketPt: "34-40 anos",
      directiveEn: "Inspiring, confident Black businesswoman in her mid-to-late 30s with elegant sculpted box braids or radiant natural coily afro, expressive warm eyes, vibrant professional tailored attire in rich harmonious tones, radiating genuine warmth and executive credibility",
    },
    {
      id: "latino_male_director_mature",
      labelPt: "Diretor Executivo Maduro (48-56 anos, cabelos grisalhos distintos, máxima autoridade e solidez)",
      genderPt: "Masculino",
      ageBracketPt: "48-56 anos",
      directiveEn: "Experienced, distinguished senior male director in his early 50s with dignified salt-and-pepper hair, subtle laughter lines conveying deep market wisdom, sharp bespoke Italian blazer, relaxed yet commanding leadership posture",
    },
    {
      id: "caucasian_male_innovator",
      labelPt: "Gestor Comercial / Inovador Masculino (34-40 anos, perfil ágil, camisa clara e colete moderno)",
      genderPt: "Masculino",
      ageBracketPt: "34-40 anos",
      directiveEn: "Dynamic Caucasian male commercial manager in his mid-to-late 30s with short sandy or light brown hair, clean shaven, confident warm smile, wearing a modern light button-up shirt with sleeves rolled up, radiating approachable problem-solving drive",
    },
    {
      id: "latina_female_creative_lead",
      labelPt: "Líder Criativa e Estrategista Feminina (30-36 anos, óculos marcantes, camisa social de linho)",
      genderPt: "Feminino",
      ageBracketPt: "30-36 anos",
      directiveEn: "Smart, charismatic Latina strategic lead in her early 30s with stylish modern tortoiseshell eyeglasses, sleek straight dark hair, wearing an earthy olive or terracotta linen shirt, radiating sharp insight and authentic warmth",
    },
    {
      id: "afro_descendant_male_consultant",
      labelPt: "Consultor Técnico e Financeiro Afrodescendente (29-35 anos, corte raspado, postura focada e acolhedora)",
      genderPt: "Masculino",
      ageBracketPt: "29-35 anos",
      directiveEn: "Sharp Black male business consultant in his early 30s with clean close-shaved buzzcut, warm engaging brown eyes, dressed in a tailored navy knit polo or fine cardigan, projecting meticulous analytical competence and trustworthy advice",
    },
    {
      id: "senior_female_executive",
      labelPt: "Sócia-Diretora Executiva Sênior (50-58 anos, cabelos prateados sofisticados, autoridade nobre)",
      genderPt: "Feminino",
      ageBracketPt: "50-58 anos",
      directiveEn: "Prestigious, accomplished senior female partner/executive in her mid-50s with stylishly cut silver-grey hair, subtle refined pearl earrings, elegant tailored beige or cream jacket, commanding deep respect, warmth and supreme financial/corporate authority",
    },
    {
      id: "young_adult_tech_specialist",
      labelPt: "Especialista Jovem em Soluções Digitais (26-31 anos, visual limpo e contemporâneo)",
      genderPt: "Masculino",
      ageBracketPt: "26-31 anos",
      directiveEn: "Forward-thinking young professional in his late 20s with neat textured modern hairstyle, genuine smile, wearing a high-end minimalist crewneck and smart trousers, representing next-generation efficiency and digital simplicity",
    },
    {
      id: "collaborative_diverse_duo",
      labelPt: "Dupla Profissional Colaborativa Diversa (parceria consultiva e dinâmica de trabalho em equipe)",
      genderPt: "Dupla Mista",
      ageBracketPt: "30-45 anos",
      directiveEn: "Dynamic, collaborative professional duo — one female and one male specialist from diverse ethnic backgrounds reviewing deliverable strategies together with authentic synergy, engaged body language, and shared satisfaction in a high-end textured environment",
    },
  ];

  private static personaDiversityCursor = 0;

  public static getNextPersonaProfile(lastPersonaId?: string): (typeof Gpt5PromptPlanner.DYNAMIC_PERSONA_PROFILES)[number] {
    const profiles = this.DYNAMIC_PERSONA_PROFILES;
    if (!lastPersonaId) {
      const randomIdx = Math.floor(Math.random() * profiles.length);
      return profiles[randomIdx];
    }
    const currentIdx = profiles.findIndex((p) => p.id === lastPersonaId);
    const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % profiles.length : 0;
    return profiles[nextIdx];
  }

  public static selectDynamicPersonaProfile(input?: Gpt5PlannerInput): DynamicPersonaDiversityProfile {
    const profiles = this.DYNAMIC_PERSONA_PROFILES;
    if (input?.personaId) {
      const found = profiles.find((p) => p.id === input.personaId);
      if (found) return found;
    }
    // Memória Persistente do Usuário: se houver última persona registrada no Firestore, calcula a próxima da sequência
    if (input?.lastPersonaId) {
      const nextFromHistory = this.getNextPersonaProfile(input.lastPersonaId);
      input.personaId = nextFromHistory.id;
      return nextFromHistory;
    }
    const randomIdx = Math.floor(Math.random() * profiles.length);
    const selected = profiles[randomIdx];
    if (input) input.personaId = selected.id;
    return selected;
  }

  public static buildPersonaDiversityMandate(
    input: Gpt5PlannerInput,
    profile?: DynamicPersonaDiversityProfile
  ): string {
    const subjectRef = input.referenceImages?.find((r) => r.role === "product_subject");
    const isStep5Logo = this.isStep5LogoUpload(input);

    // Se o usuário enviou uma foto real de PESSOA na Etapa 5 (não sendo produto nem logo), preserva a pessoa enviada
    if (subjectRef && !isStep5Logo) {
      return "[HERO SUBJECT INTEGRATION: User provided reference photo in Step 5 — preserve facial identity, ethnicity, and gender from the uploaded reference.]";
    }

    const selected = profile || this.selectDynamicPersonaProfile(input);
    const brandPersonas = input.brandKit?.personas;
    let personaHint = "";
    if (brandPersonas && Array.isArray(brandPersonas) && brandPersonas.length > 0) {
      const pIdx = (this.personaDiversityCursor) % brandPersonas.length;
      const bp = brandPersonas[pIdx];
      if (bp?.name || bp?.profile) {
        personaHint = ` Target Buyer Persona Alignment: Connect authentically with brand persona "${bp.name || 'Cliente'}" (${bp.profile || ''}).`;
      }
    }

    return `[DYNAMIC PERSONA DIVERSITY & HUMAN ROTATION (/personadiversity — ${selected.id}): CRITICAL ANTI-MONOTONY RULE: Avoid generating the exact same brunette woman in a dark blazer on every single image! Rotated Protagonist Archetype (${selected.labelPt}): ${selected.directiveEn}.${personaHint} Ensure authentic natural human skin texture, natural expressions, 5 distinct fingers, and zero generic stock-photo clone repetition across campaign posts.]`;
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
    const brandFonts = input.brandKit?.fonts;
    const fontLockDirective =
      brandFonts && (brandFonts.primaryFont || brandFonts.secondaryFont || brandFonts.style)
        ? ` STRICT BRANDKIT FONT LOCK (/fontlock): Adhere 100% to the official BrandKit typeface system (Primary Title Font: "${brandFonts.primaryFont || brandFonts.secondaryFont || 'Brand Primary Font'}", Secondary Body Font: "${brandFonts.secondaryFont || brandFonts.primaryFont || 'Brand Secondary Font'}", Style: "${brandFonts.style || 'Brand official typography'}") — preserve the exact letterform anatomy, curvature, and weight hierarchy without inventing unrequested font families.`
        : "";
    return `[DYNAMIC TYPOGRAPHIC & LAYOUT FREEDOM (/typolayout): Act as an award-winning typographic art director with creative visual diversity! Typographic Concept (${selectedStyle.id}): ${selectedStyle.fullDirectiveEn}. Scale & hierarchy: ${selectedStyle.weightHierarchyEn}. Chromatic harmony: ${selectedStyle.colorHarmonyEn}. Containers & framing: ${selectedStyle.containerAndFrameEn}.${fontLockDirective} MANDATE — MAXIMUM TITLE LAYOUT DESIGN FREEDOM, CLEAN CONTRAST & ZERO ENDING PERIOD (/noendingperiod): Avoid repetitive generic formulas; liberate the title layout from monotonous top-centered banners! PROHIBITION OF ENDING PERIOD ON HEADLINES: Main headlines and title mastheads must NEVER end with a period or full-stop dot (e.g. render "NOVOS TEMPOS" and NEVER "NOVOS TEMPOS."). On light backgrounds, render the headline cleanly in the BrandKit Primary Color with ZERO black smudge/smoke shadows and ZERO dark boxes around the title; on dark backgrounds, use crisp Pure White (#FFFFFF) and BrandKit colors, maintaining 100% legibility and 20% safe margins.]`;
  }

  public static readonly OBJECTIVE_CREATIVE_PROFILES: Record<
    string,
    { labelPt: string; directivePt: string; mandateEn: string }
  > = {
    commercial: {
      labelPt: "Vender Produto (Vitrine Flagship de Desejo & Hero Product Editorial)",
      directivePt:
        "Foco em desejo imediato pelo produto/entregável com fotografia de vitrine internacional. PROIBIDO criar layout de panfleto comum ou travar o título no topo: posicione a tipografia do BrandKit de forma autoral (terço inferior cinematográfico, profundidade 3D atrás do produto, moldura em L ou duas colunas) valorizando a presença física do produto.",
      mandateEn:
        "[OBJECTIVE-DRIVEN SCENE & TITLE DYNAMICS (/objectivelayout — COMMERCIAL HERO PRODUCT): Craft a flagship desire-driven product showcase with tactile lighting. Strictly avoid generic supermarket flyer layouts or repetitive top-centered titles; deploy bold spatial title placement (lower-third, 3D midground depth behind product, L-frame, or split-column) strictly using the BrandKit typeface family.]",
    },
    social: {
      labelPt: "Post para Redes (Editorial Lifestyle & Scroll-Stopping de Feed)",
      directivePt:
        "Estética de revista contemporânea e conexão humana autêntica que interrompe o scroll no Instagram/LinkedIn. Integre o título com ritmo editorial moderno (camada de profundidade 3D estilo capa Time/GQ atrás dos ombros, eixo lateral vertical a 90° + headline ou cantos opostos), priorizando 100% as fontes do BrandKit.",
      mandateEn:
        "[OBJECTIVE-DRIVEN SCENE & TITLE DYNAMICS (/objectivelayout — SOCIAL SCROLL-STOPPING EDITORIAL): Design a contemporary magazine-worthy social feed visual with authentic human connection and dynamic editorial title architecture (3D magazine-cover depth behind subject shoulders, 90-degree vertical sidebar axis, or asymmetric corner anchor) strictly using the BrandKit typeface family.]",
    },
    ad: {
      labelPt: "Anúncio / Oferta (Campanha de Alta Conversão & Impacto Publicitário)",
      directivePt:
        "Alta energia visual, ponto focal magnético e leitura instantânea em 1 segundo para tráfego pago. Aplique arquitetura tipográfica de alto impacto (palavra-chave em tarja/pill geométrico sólido invertido nas cores da marca, pôster monumental big-type ou contraste extremo de escala), mantendo 100% a anatomia das fontes do BrandKit.",
      mandateEn:
        "[OBJECTIVE-DRIVEN SCENE & TITLE DYNAMICS (/objectivelayout — HIGH-CONVERSION AD CAMPAIGN): Engineer an immediate-impact paid-traffic visual hook with high-contrast focal energy and punchy title architecture (solid inverted brand-colored pill/tag highlight, monumental big-type poster scale, or asymmetric split hierarchy) strictly using the BrandKit typeface family.]",
    },
    presentation: {
      labelPt: "Empresa & Serviços (Autoridade Executiva Contemporânea & Key Visual de Marca)",
      directivePt:
        "Credibilidade, solidez e inovação dignas de capa da Forbes, Monocle e Architectural Digest no habitat real do negócio. PROIBIDO viés corporativo careta, monótono ou título estático no topo: aplique diagramação editorial nobre (terço inferior com barra vertical de acento, capa de luxo com tracking refinado ou duas colunas assimétricas) com as fontes do BrandKit.",
      mandateEn:
        "[OBJECTIVE-DRIVEN SCENE & TITLE DYNAMICS (/objectivelayout — EXECUTIVE AUTHORITY & BRAND KEY VISUAL): Project prestigious Forbes/Architectural Digest editorial authority in an authentic workspace. Strictly forbid stiff, boring corporate banner layouts; structure the title with refined architectural grid precision (cinematic lower-third with vertical accent rule, luxury tracked masthead, or split-column editorial) strictly using the BrandKit typeface family.]",
    },
    institutional: {
      labelPt: "Empresa & Serviços (Autoridade Executiva Contemporânea & Key Visual de Marca)",
      directivePt:
        "Credibilidade, solidez e inovação dignas de capa da Forbes e Architectural Digest no habitat real do negócio, sem viés corporativo engessado, priorizando as fontes do BrandKit.",
      mandateEn:
        "[OBJECTIVE-DRIVEN SCENE & TITLE DYNAMICS (/objectivelayout — EXECUTIVE AUTHORITY & BRAND KEY VISUAL): Project prestigious Forbes/Architectural Digest editorial authority with refined architectural title grid precision strictly using the BrandKit typeface family.]",
    },
    concept: {
      labelPt: "Conceito Criativo (Direção de Arte Conceitual Premiada Cannes Lions / D&AD)",
      directivePt:
        "Liberdade artística e poética máxima, metáfora visual surpreendente e iluminação dramática dual-tone. O título deve atuar como parte viva e tridimensional da obra (tipografia espacial 3D interagindo com a luz volumétrica da cena, profundidade entre planos ou pôster monumental) fiel às fontes do BrandKit.",
      mandateEn:
        "[OBJECTIVE-DRIVEN SCENE & TITLE DYNAMICS (/objectivelayout — CANNES LIONS CONCEPTUAL ART DIRECTION): Unleash maximum conceptual storytelling, visual metaphor, and dramatic dual-tone lighting, integrating the BrandKit typeface family spatially as a living 3D graphic element within the scene's depth and volumetric light.]",
    },
    creative: {
      labelPt: "Conceito Criativo (Direção de Arte Conceitual Premiada Cannes Lions / D&AD)",
      directivePt:
        "Liberdade artística e poética máxima com metáfora visual surpreendente e título integrado espacialmente à cena usando as fontes do BrandKit.",
      mandateEn:
        "[OBJECTIVE-DRIVEN SCENE & TITLE DYNAMICS (/objectivelayout — CANNES LIONS CONCEPTUAL ART DIRECTION): Unleash maximum conceptual storytelling and integrate the BrandKit typeface family spatially within the scene's depth and volumetric light.]",
    },
    thumbnail: {
      labelPt: "Thumb de Alta Performance (Capa Magnética de Alto CTR para YouTube / Reels / TikTok)",
      directivePt:
        "Composição magnética de altíssimo CTR com foco dramático na expressão/sujeito, contraste extremo e título colossal de leitura instantânea em telas móveis (com tarja sólida de contraste ou profundidade 3D atrás do sujeito), fiel às fontes do BrandKit.",
      mandateEn:
        "[OBJECTIVE-DRIVEN SCENE & TITLE DYNAMICS (/objectivelayout — HIGH-CTR VIDEO THUMBNAIL): Dynamic magnetic video cover composition with dramatic high-contrast lighting, intense subject focus, vibrant color contrast, and colossal instant-read BrandKit typeface family (with solid contrast badge or 3D midground depth) for maximum click-through rate.]",
    },
    flyer: {
      labelPt: "Panfleto Digital / Flyer (Alta Densidade Informativa & Vendas Diretas)",
      directivePt:
        "Layout completo de panfleto publicitário de alta conversão: título de autoridade no topo, coluna lateral estruturada com 3 a 5 benefícios acompanhados de ícones temáticos circulares, mockup de tela de aplicativo ou produto em primeiro plano ou apresentado pelo protagonista sorteado na rotação de personas, e rodapé com selo de localização e botão de CTA destacado nas cores oficiais do BrandKit. Para este objetivo, a trava anti-lista e anti-botão é expressamente destravada, mantendo submissão estrita à tipografia e paleta do BrandKit.",
      mandateEn:
        "[OBJECTIVE-DRIVEN SCENE & TITLE DYNAMICS (/objectivelayout — DIGITAL FLYER / HIGH-DENSITY COMMERCIAL POSTER): Engineer a high-density, complete commercial flyer poster layout in Portuguese (pt-BR): (1) Prominent authority headline and subtitle in the upper area strictly adhering to the BrandKit typeface family and colors; (2) Dedicated side column featuring 3 to 5 clear benefit callouts with stylized circular icons in Brand colors (#0083C7 / #FA6305); (3) Dynamic hero deliverable showcase (such as a smartphone interface mockup or the rotated persona archetype holding/presenting the solution, without fixing gender or race to any single template); (4) Structured footer banner with location badge and a prominent solid brand-colored CTA pill/button; (5) ANTICLICHE EXCEPTION: For this flyer objective, benefit lists with circular icons and footer CTA pills are explicitly AUTHORIZED and ENCOURAGED, provided they strictly follow the BrandKit font system (/fontlock), integrate the rotated human persona, and maintain 20% safe margins.]",
    },
    thematic: {
      labelPt: "Post Temático / Campanha Criativa (Alta Criatividade / Datas Sazonais / Cinema / Retrô)",
      directivePt:
        "Direção de arte cinematográfica com liberdade estética máxima inspirada no tema solicitado (retrô anos 80/2000, cinema/fantasia, sazonal ou cultural). EXCEÇÃO CIRÚRGICA DE TIPOGRAFIA NO TÍTULO HEAD (/thematictypo): A headline principal ganha tipografia temática autoral (ouro épico, neon cromado, tipo gibi, 3D ou rústico conforme o tema), enquanto todos os demais textos de apoio, ícones e rodapé permanecem submissos à legibilidade limpa do BrandKit com logotipo oficial preservado.",
      mandateEn:
        "[OBJECTIVE-DRIVEN SCENE & TITLE DYNAMICS (/objectivelayout — THEMATIC & CREATIVE CAMPAIGN ARCHITECTURE /thematictypo): Unleash full thematic and cinematic art direction inspired directly by the user's creative prompt (80s/2000s retro, cinematic fantasy, comic book, seasonal/cultural holiday). THEMATIC HEADLINE EXCEPTION: (1) Render the primary headline/title with authentic, bespoke thematic typography tailored to the theme (e.g., golden fantasy serif, neon-chrome tubular 80s lettering, 3D bubbly Y2K retro, or rustic carved medieval letters) with artistic 3D depth and textures; (2) PRESERVE BRANDKIT FIDELITY FOR ALL SUPPORTING DATA: All supporting details, list cards, icons and footers must strictly adhere to the clean, legible BrandKit corporate typography and colors, with the designated logo quadrant remaining pristine.]",
    },
  };

  public static buildObjectiveCreativeMandate(input: Gpt5PlannerInput): string {
    const objKey = (input?.objective || "commercial").toLowerCase();
    const profile =
      this.OBJECTIVE_CREATIVE_PROFILES[objKey] || this.OBJECTIVE_CREATIVE_PROFILES.commercial;
    return profile.mandateEn;
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

  public static isThematicStyleRequested(text = ""): boolean {
    return /\b(anos 80|anos 90|anos 2000|anos 70|anos 60|anos 50|80s|90s|2000s|70s|retr[oô]|vintage|disco|synthwave|vaporwave|y2k|cyberpunk|steampunk|art d[eé]co|pop art|senhor dos an[eé]is|lord of the rings|star wars|harry potter|matrix|marvel|dc|cinema|filme|hollywood|halloween|festa junina|s[aã]o jo[aã]o|carnaval|natal|p[aá]scoa|oktoberfest|medieval|faroeste|western|g[oó]tico|viking|mitolog|fantasia|r[uú]stico|estilo gibi|estilo hq|quadrinhos|cartoon)\b/i.test(
      text
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

    const isFlyer = input.objective === "flyer";
    const allowHandPhone = isFlyer || this.isExplicitHandPhoneRequested(input.userBrief);
    const allowCtaButton = isFlyer || this.isExplicitCtaButtonRequested(input.userBrief);

    if (isFlyer) {
      const brandFonts = input.brandKit?.fonts;
      const fontLock = brandFonts && (brandFonts.primaryFont || brandFonts.secondaryFont)
        ? ` STRICT BRANDKIT FONT LOCK (/fontlock): Render all titles, list items and footer labels strictly adhering to "${brandFonts.primaryFont || 'Geometric Sans-Serif Bold'}" and "${brandFonts.secondaryFont || 'Geometric Sans-Serif Regular'}" with zero font deviations.`
        : "";
      return `[AWARD-WINNING CREATIVE ART DIRECTION & HIGH-DENSITY FLYER ARCHITECTURE (/anticliche — FLYER EXCEPTION): For this Panfleto Digital / Flyer objective, the anti-list and anti-CTA button restrictions are UNLOCKED. Render a rich, full-fledged commercial flyer layout in Portuguese (pt-BR): (1) Authority headline at the top; (2) Side column with 3 to 5 structured benefit items with stylized circular icons in brand accent colors (#FA6305 / #0083C7); (3) Dynamic hero subject presenting a high-res app UI mockup on a smartphone or hero deliverable, strictly adhering to the dynamic rotated persona archetype (/personadiversity); (4) Structured footer banner with location badge and a prominent brand-colored CTA button/pill; (5)${fontLock} Ban flat sterile beige walls; ground the flyer in a real, atmospheric environment with 20% safe margins.]`;
    }

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

    const primary = fonts.primaryFont?.trim() || fonts.secondaryFont?.trim() || "Brand Primary Font";
    const secondary = fonts.secondaryFont?.trim() || fonts.primaryFont?.trim() || "Brand Secondary Font";
    const style = fonts.style?.trim() || "Clean, highly legible brand typography";
    const normPrimary = primary.toLowerCase().replace(/\s*[-–—]?\s*(bold|normal|regular|medium|light|extrabold|black|semibold)\b/gi, "").trim();
    const normSecondary = secondary.toLowerCase().replace(/\s*[-–—]?\s*(bold|normal|regular|medium|light|extrabold|black|semibold)\b/gi, "").trim();
    const isSameFamily = normPrimary === normSecondary;
    const isSansSerif =
      /sans-serif|sans serif|branding sf|montserrat|inter|poppins|roboto|helvetica|arial|futura|gotham|gilroy|myriad|eras|corporativo|moderno|limpo/i.test(
        `${primary} ${secondary} ${style}`
      ) && !/\b(serifa|serifada|classic serif|times|garamond|playfair|bodoni)\b/i.test(`${primary} ${secondary} ${style}`);

    const brandPrimaryColor = input.brandKit?.primaryColors?.[0] || "#0083C7";

    const isThematic =
      input.objective === "thematic" ||
      this.isThematicStyleRequested(
        `${input.userBrief || ""} ${input.compiledPrompt || ""} ${input.productHeadline || ""}`
      );

    if (isThematic) {
      return `[HYBRID BRANDKIT & THEMATIC HEADLINE MANDATE (/thematictypo & /fontlock): (1) HEADLINE ONLY — BESPOKE THEMATIC ART DIRECTION: The brief calls for a specific creative/thematic aesthetic (e.g. vintage, 80s/2000s retro, Lord of the Rings/epic fantasy, rustic medieval, comic/gibi, seasonal). You are authorized and instructed to render the PRIMARY HEADLINE in an authentic, high-impact thematic display typography fully embodying this theme (such as golden fantasy serif, metallic neon-chrome tubular 80s lettering, 3D bubbly Y2K retro, or rustic carved medieval letters) with artistic 3D depth, material textures and lighting! (2) MANDATORY BRANDKIT FIDELITY FOR ALL OTHER TEXT: All supporting copy (subtitles, benefit bullet points, callouts, footer text) MUST strictly follow the clean corporate BrandKit typography ("${secondary}") with high legibility. Keep the official brand logo quadrant 100% clean and respected.]`;
    }

    return `[CRITICAL MANDATE — BRAND KIT TYPOGRAPHY LOCK & PRIORITY (/fontlock): PRIORITIZE THE BRANDKIT FONTS ABOVE ALL ELSE! All rendered text MUST strictly follow the brand's official typography system — Primary Font (Titles / Bold Highlights): "${primary}"; Secondary Font (Body / Setup Text): "${secondary}"; General Typographic Style: "${style}". ${
      isSameFamily && isSansSerif
        ? `ANATOMICAL FONT ENFORCEMENT: Render ALL text lines using a SINGLE unified, clean, modern corporate geometric sans-serif typeface family strictly matching "${primary}" / "${secondary}" (preserving its exact letterform roundness, x-height, stroke proportions, and terminal anatomy without inventing unrequested font families). Differentiate setup lines vs. bold emphasis lines STRICTLY by font weight (Normal/Regular weight vs. Bold/ExtraBold weight of the EXACT SAME typeface family).`
        : `ANATOMICAL FONT ENFORCEMENT: Strictly apply "${primary}" for primary headlines/highlights and "${secondary}" for secondary/body copy, preserving 100% of their authentic letterform anatomy, curvature, and proportions. NEVER substitute or invent unrequested generic fonts!`
    } CLEAN ADAPTIVE BRAND COLOR CONTRAST: When the background behind the text is light or bright, render the headline cleanly in the BrandKit Primary Color (${brandPrimaryColor}) with ZERO dirty black smoke/smudge drop-shadows and ZERO unrequested dark/gold boxes! CREATIVE LAYOUT FREEDOM WITHIN BRAND FONTS: While keeping 100% fidelity to the BrandKit typeface anatomy above, exercise creative freedom in the spatial layout and scale contrast of the title!]`;
  }


  public static async plan(input: Gpt5PlannerInput): Promise<OrchestratorPlanResult> {
    const startTime = Date.now();
    if (input.productHeadline) {
      input.productHeadline = input.productHeadline.trim().replace(/[\.\s]+$/, "");
    }
    const openaiKey = process.env.OPENAI_API_KEY;

    // Tentar planejamento com GPT-5 (ou gpt-4o como fallback) com suporte multimodal se houver foto
    if (openaiKey) {
      try {
        const baseModels = ["gpt-6.1-sol", "gpt-5", "gpt-4o", "gpt-4o-mini"];
        const modelsToTry = input.preferredModel
          ? [input.preferredModel, ...baseModels.filter((m) => m !== input.preferredModel)]
          : baseModels;

        const userPrompt = this.buildUserPrompt(input);
        // Montar mensagem multimodal para que o GPT-6.1-sol / GPT-5 veja TODAS as fotos de sujeito/embalagem e estilo/campanha
        const contentParts: any[] = [{ type: "text", text: userPrompt }];
        const subjectImages = input.referenceImages?.filter((r) => r.role === "product_subject" && r.base64) || [];
        for (const subjectImg of subjectImages) {
          contentParts.push({
            type: "image_url",
            image_url: {
              url: `data:${subjectImg.mimeType};base64,${subjectImg.base64}`,
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
DUAS FOTOS ANEXADAS NA ETAPA 5 (IMAGEM 1: SUJEITO/PRODUTO/EMBALAGEM/LOGOMARCA + IMAGEM 2: REFERÊNCIA DE ESTILO/CAMPANHA):
1. IMAGEM 1 DA ETAPA 5 (SUJEITO, PRODUTO, EMBALAGEM OU LOGOMARCA ENVIADA PELO USUÁRIO):
   - Se for PESSOA: preserve a fisionomia, idade aproximada, etnia, cabelo e estilo.
   - Se for PRODUTO FÍSICO, POTE, PACOTE, FRASCO, EQUIPAMENTO OU EMBALAGEM COMERCIAL (TRAVA /productlock & /labellock ATIVA): preserve integralmente 100% da geometria, formato do recipiente/pote/pacote, textura interna do produto E REALIZE CLONAGEM FOTOGRÁFICA 1:1 DO RÓTULO ORIGINAL COMPLETO! É TERMINANTEMENTE PROIBIDO redesenhar ou alterar o logotipo impresso dentro do rótulo (ex: NUNCA adicione uma elipse/oval verde ou escudo ao redor da marca no rótulo se a foto original mostrar ícone de folha + texto limpo sem moldura), PROIBIDO alterar as cores das faixas laterais/centrais/inferiores do rótulo, PROIBIDO mudar a fonte ou cor do selo "Premium" e PROIBIDO mudar a foto impressa no rótulo! Altere apenas o cenário ao fundo, a bancada/piso e a iluminação.
   - Se for UMA LOGOMARCA / LOGOTIPO / SÍMBOLO DE MARCA ISOLADO: ATIVE IMEDIATAMENTE O MODO EXCEÇÃO CRIATIVA COM ALTERNÂNCIA DINÂMICA! Passe por cima de qualquer proibição de logomarcas e INTEGRE ESSA LOGOMARCA ENVIADA DE FORMA CRIATIVA, NÍTIDA E EM DESTAQUE na nova imagem!
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
FOTO DA ETAPA 5 ANEXADA (SUJEITO, PRODUTO, EMBALAGEM OU LOGOMARCA ENVIADA PELO USUÁRIO):
Existe uma imagem anexada enviada pelo usuário na Etapa 5.
INSTRUÇÃO OBRIGATÓRIA:
1. Examine a imagem anexada detalhadamente:
   - Se for uma PESSOA: preserve a fisionomia, idade aproximada, etnia, cabelo e estilo.
   - Se for um PRODUTO FÍSICO, POTE, PACOTE, FRASCO, EQUIPAMENTO OU EMBALAGEM COMERCIAL (TRAVA /productlock & /labellock ATIVA): preserve com 100% de fidelidade a estrutura física, o recipiente/pote/pacote real E REALIZE CLONAGEM FOTOGRÁFICA 1:1 DO RÓTULO ORIGINAL COMPLETO! É TERMINANTEMENTE PROIBIDO redesenhar ou adulterar o logotipo impresso dentro do rótulo (ex: NUNCA coloque elipse/oval verde ou escudo em volta do nome da marca no rótulo se não existir na foto original), PROIBIDO alterar as cores das faixas laterais brancas, faixa central ou base do rótulo, PROIBIDO mudar o selo de qualidade ou trocar as fotos/ilustrações impressas no rótulo! Mude apenas o cenário ao fundo, a bancada/piso e a iluminação.
   - Se for UMA LOGOMARCA / LOGOTIPO / SÍMBOLO DE MARCA ISOLADO: ATIVE O MODO EXCEÇÃO CRIATIVA COM ALTERNÂNCIA DINÂMICA! Passe por cima de todas as regras de proibição de logos e integre essa logomarca enviada de forma CRIATIVA, ORGÂNICA, NÍTIDA e EM DESTAQUE na nova imagem:
     * ARQUÉTIPO CRIATIVO SORTEADO PARA ESTA GERAÇÃO (PRIORIDADE): ${selectedArchetypes?.primary.labelPt} (${selectedArchetypes?.primary.promptEn})
     * OPÇÃO CRIATIVA ALTERNATIVA (CASO SE ADAPTE MELHOR AO NICHO): ${selectedArchetypes?.secondary.labelPt} (${selectedArchetypes?.secondary.promptEn})
     * (Se o usuário pediu explicitamente no briefing um local específico para a logo, siga o pedido do usuário; caso contrário, aplique o Arquétipo Criativo Sorteado acima, preservando fielmente a grafia exata do nome da marca, o ícone e as cores!)
2. Descreva esse elemento com detalhes minuciosos no bloco [3. HERO SUBJECT] e [9. LOGO DIRECTIVE].
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
      ? `REGRA CONDICIONAL ESTRITA PARA A IMAGEM ENVIADA NA ETAPA 5 (PRODUTO FÍSICO/EMBALAGEM vs. LOGOMARCA ISOLADA):
Inspecione visualmente a imagem enviada na Etapa 5 (product_subject) e retorne no JSON o campo "detectedStep5AssetType" como "product_or_person" (se for produto físico, embalagem, pote, pacote, equipamento, caixa de som, objeto, alimento ou pessoa) OU "brand_logo" (somente se a imagem enviada na Etapa 5 for o design gráfico isolado de uma logomarca/logotipo).
- CASO A — SE A IMAGEM DA ETAPA 5 FOR UM PRODUTO FÍSICO, EMBALAGEM, POTE, PACOTE, EQUIPAMENTO OU PESSOA ("product_or_person"):
  1. NÃO APLIQUE NENHUM ARQUÉTIPO DE LOGOMARCA CENOGRÁFICA! IGNORE completamente placas de acrílico, totens de bancada ou letreiros 3D na parede!
  2. PROIBIÇÃO DE LOGOS SOLTAS NO CENÁRIO vs. PRESERVAÇÃO SAGRADA DO RÓTULO DO PRODUTO: É proibido desenhar logomarcas avulsas flutuando na parede ou em totens de mesa, PORÉM A LOGOMARCA ORIGINAL IMPRESSA NO RÓTULO DA EMBALAGEM DO PRODUTO ENVIADO DEVE SER PRESERVADA COM 100% DE FIDELIDADE FOTOGRÁFICA IDÊNTICA À FOTO ENVIADA! ${
    hasLogo
      ? `A logomarca de assinatura do post será aplicada via software na posição (${selectedPlacement.id}): mantenha a zona designada 100% LIMPA e VAZIA (${selectedPlacement.clearanceZonePrompt}).`
      : "Mantenha o canto superior limpo para assinatura."
  }
  3. TRAVA /productlock & /labellock: Preserve 100% da geometria da embalagem, transparência do pote/pacote, cores exatas de cada faixa do rótulo, design exato da logo no rótulo (sem inventar ovais/escudos verdes ao redor do nome), selos e fotos impressas no rótulo!
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

    const objKey = (input.objective || "commercial").toLowerCase();
    const objProfile =
      this.OBJECTIVE_CREATIVE_PROFILES[objKey] || this.OBJECTIVE_CREATIVE_PROFILES.commercial;
    const objectiveCreativeSection = `
DIRETRIZ CRIATIVA E TIPOGRÁFICA DO OBJETIVO SELECIONADO NA ETAPA 3 (/objectivelayout):
- Objetivo Selecionado: ${objProfile.labelPt}
- Diretriz de Cena e Título: ${objProfile.directivePt}
- REGRA ANTI-VIÉS CONSERVADOR: Independentemente do objetivo escolhido, NUNCA gere um layout engessado com título sempre reto e centralizado no topo! Combine a personalidade deste objetivo com o Arquétipo Tipográfico Sorteado abaixo, priorizando 100% as fontes do BrandKit.`;

    const dynamicTypo = input.textOverlayMode && input.textOverlayMode !== "NONE"
      ? this.selectDynamicTypographyStyle(input)
      : null;
    const dynamicTreatment = input.textOverlayMode && input.textOverlayMode !== "NONE"
      ? this.selectDynamicHeadlineTreatment(input)
      : null;
    const dynamicPersona = this.selectDynamicPersonaProfile(input);
    const typographySection = dynamicTypo
      ? `
DIREÇÃO DE ARTE TIPOGRÁFICA SELECIONADA (/typolayout):
- Conceito Visual: ${dynamicTypo.labelPt}
- Escala e Hierarquia: ${dynamicTypo.weightHierarchyEn}
- Harmonia Cromática: ${dynamicTypo.colorHarmonyEn}
- Molduras, Fundos e Espaço: ${dynamicTypo.containerAndFrameEn}
- Diretiva em Inglês para o imagePrompt: "${dynamicTypo.fullDirectiveEn}"
- TRATAMENTO CROMÁTICO E DE FAIXA/TARJA DO TÍTULO PRINCIPAL (/headlinetreatment):
  * Modo Sorteado: ${dynamicTreatment?.labelPt || "Contraste Dinâmico"}
  * Instrução Técnica: ${dynamicTreatment?.directivePt || ""}
  * Diretriz em Inglês: "${dynamicTreatment?.treatmentDirectiveEn || ""}"
- INSTRUÇÃO DE LIBERDADE CRIATIVA: Atue como Diretor de Arte Sênior! Crie uma composição tipográfica surpreendente, autoral e personalizada para este nicho, variando alinhamentos, contrastes de escala display, palavras destacadas em faixas/tarjas sólidas da marca e esquemas de cores no imagePrompt. NUNCA gere sempre a mesma fórmula repetitiva!`
      : "";

    const personaSection = `
DIRETRIZ DE DIVERSIDADE HUMANA E ALTERNÂNCIA DE PERSONAGENS (/personadiversity):
- Perfil e Arquétipo Sorteado: ${dynamicPersona.labelPt} (Gênero: ${dynamicPersona.genderPt}, Faixa Etária: ${dynamicPersona.ageBracketPt})
- Diretriz em Inglês para o Bloco [3. HERO SUBJECT]: "${dynamicPersona.directiveEn}"
- REGRA ANTI-MONOTONIA: Se a cena incluir pessoas/profissionais, aplique o arquétipo sorteado acima (ou integre de forma rotativa as personas do BrandKit). É TERMINANTEMENTE PROIBIDO gerar sempre a mesma mulher de blazer escuro em todas as artes! Varie gênero, idade, etnia, roupas e corte de cabelo.`;

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
${objectiveCreativeSection}
${creativeDirectionSection}
${personaSection}
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
        personaId: input.personaId,
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
            prompt += " [STRICT PRODUCT GEOMETRY & COMPONENT LOCK (/productlock & /labellock): For any physical product, jar, bag, bottle, or equipment in the reference photo(s), preserve 100% of its exact geometry, upper and lower structures, exposed components (horns, tweeters, bar grilles, knobs, cables), exact cabinet side colors, packaging container, and authentic printed label graphics 1:1 (including exact printed brand logo on the label without adding green ovals/ellipses around it, exact label stripe colors, seal typography, and product illustration). Do NOT redesign packaging labels or stamp brand names onto hardware if not present on the original photo.]";
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
        const headlineTreatmentMandate = this.buildDynamicHeadlineTreatmentMandate(input);
        if (headlineTreatmentMandate && !prompt.includes("/headlinetreatment")) {
          prompt += ` ${headlineTreatmentMandate}`;
        }
        const objMandate = this.buildObjectiveCreativeMandate(input);
        if (objMandate && !prompt.includes("/objectivelayout")) {
          prompt += ` ${objMandate}`;
        }
        const antiClicheMandate = this.buildAntiClicheCreativeMandate(input);
        if (antiClicheMandate && !prompt.includes("/anticliche")) {
          prompt += ` ${antiClicheMandate}`;
        }
        const personaDiversityMandate = this.buildPersonaDiversityMandate(input);
        if (personaDiversityMandate && !prompt.includes("/personadiversity")) {
          prompt += ` ${personaDiversityMandate}`;
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
        ? ["Logomarca oficial do negócio", "Foto/Embalagem/Rótulo 1:1 da Etapa 5", "Margens seguras"]
        : ["Foto/Embalagem/Rótulo 1:1 da Etapa 5", "Integração criativa na cena", "Margens seguras"],
      generationParameters: {
        model: "gpt-image-2.6-sunburst",
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
        personaId: input.personaId,
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
        model: "gpt-image-2.6-sunburst",
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
        ? `[ART-DIRECTED HEADLINE & LOGO CLEARANCE (/typolayout): Render bespoke, award-winning editorial typography in Portuguese (pt-BR) saying "${headline}". Style Concept (${typoStyle.id}): ${typoStyle.fullDirectiveEn}. Scale & hierarchy: ${typoStyle.weightHierarchyEn}. Color harmony: ${typoStyle.colorHarmonyEn}. Framing: ${typoStyle.containerAndFrameEn}. ${selectedPlacement.clearanceZonePrompt} ${selectedPlacement.textPlacementPrompt} Maintain generous breathing room and 20% safe margins.]`
        : `[ART-DIRECTED HEADLINE (/typolayout): Render bespoke, award-winning editorial typography in Portuguese (pt-BR) saying "${headline}". Style Concept (${typoStyle.id}): ${typoStyle.fullDirectiveEn}. Scale & hierarchy: ${typoStyle.weightHierarchyEn}. Color harmony: ${typoStyle.colorHarmonyEn}. Framing: ${typoStyle.containerAndFrameEn}. Maintain generous breathing room and 20% safe margins.]`;
    } else if (isInfographic) {
      const headline = input.productHeadline?.trim() || "Solução Inteligente";
      textInstruction = hasLogo
        ? `[DYNAMIC MODERN INFOGRAPHIC DIRECTIVE & LOGO CLEARANCE (/typolayout): Clean editorial layout in Portuguese (pt-BR) with headline "${headline}". Style Concept (${typoStyle.id}): ${typoStyle.fullDirectiveEn}. Scale: ${typoStyle.weightHierarchyEn}. Color harmony: ${typoStyle.colorHarmonyEn}. Framing: ${typoStyle.containerAndFrameEn}. 20% safe margins from all outer borders. ${selectedPlacement.clearanceZonePrompt} ${selectedPlacement.textPlacementPrompt}]`
        : `[DYNAMIC MODERN INFOGRAPHIC DIRECTIVE (/typolayout): Clean editorial layout in Portuguese (pt-BR) with headline "${headline}". Style Concept (${typoStyle.id}): ${typoStyle.fullDirectiveEn}. Scale: ${typoStyle.weightHierarchyEn}. Color harmony: ${typoStyle.colorHarmonyEn}. Framing: ${typoStyle.containerAndFrameEn}. 20% safe margins from all outer borders.]`;
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
      ? "[CRITICAL MANDATE — STRICT PRODUCT GEOMETRY & COMPONENT LOCK (/productlock) + 1:1 PACKAGING LABEL LOCK (/labellock) + HERO SUBJECT PRESERVATION & UPLOADED LOGO INTEGRATION: Faithfully preserve 100% of the exact physical geometry, silhouette, upper and lower structures, exposed components (such as visible horns, tweeters, bar grilles, knobs, cables), exact cabinet side-panel colors, packaging container (jar, pouch, bottle, box), authentic printed label details 1:1 (exact brand logo printed on the label without adding green ovals/ellipses or badges around it, exact label background/stripe colors, seal typography, weight text, and printed product illustration), or uploaded brand logo graphics (brand name spelling, typography, colors, icon) from all user reference images and integrate them prominently into the scene. Do NOT redesign, redraw, modernize, cover exposed parts with generic mesh grilles, change cabinet colors, or alter the packaging label.]"
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
      const headlineTreatmentMandate = this.buildDynamicHeadlineTreatmentMandate(input);
      if (headlineTreatmentMandate && !p.includes("/headlinetreatment")) {
        p += ` ${headlineTreatmentMandate}`;
      }
      const objMandate = this.buildObjectiveCreativeMandate(input);
      if (objMandate && !p.includes("/objectivelayout")) {
        p += ` ${objMandate}`;
      }
      const fallbackConcept = this.selectArtDirectionConcept(input);
      const antiCliche = this.buildAntiClicheCreativeMandate(input, fallbackConcept);
      if (antiCliche && !p.includes("/anticliche")) {
        p += ` ${antiCliche}`;
      }
      const personaDiversityMandate = this.buildPersonaDiversityMandate(input);
      if (personaDiversityMandate && !p.includes("/personadiversity")) {
        p += ` ${personaDiversityMandate}`;
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
    const headlineTreatmentMandate = this.buildDynamicHeadlineTreatmentMandate(input);
    const personaDiversityMandate = this.buildPersonaDiversityMandate(input);
    return `${creativeSceneLead} ${brandInstruction} ${thumbMandate} ${this.buildObjectiveCreativeMandate(input)} ${subjectMandate} ${textInstruction} ${this.buildBrandTypographyMandate(input)} ${this.buildDynamicTypographyMandate(input, typoStyle)} ${headlineTreatmentMandate} ${personaDiversityMandate} ${antiCliche} ${agencyMandate} ${logoMandate} [SAFE MARGINS MANDATE: Maintain 15% to 20% safe margin clearance around all borders. Absolutely no text or focal subjects touching the edges.]`;
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

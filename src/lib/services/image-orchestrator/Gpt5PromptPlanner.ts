import type {
  Gpt5PlannerInput,
  Gpt5VisualPlanResponse,
  OrchestratorPlanResult,
} from "./types";

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
   [4. COMPOSITION & PLACEMENT]: Distribuição visual e pontos focais equilibrados. Se houver logomarca do BrandKit habilitada, respeitar estritamente a ZONA DE LIMPEZA DO TOPO ESQUERDO (os primeiros 22% do topo e 30% da esquerda devem ficar 100% livres de textos ou elementos focais).
   [5. FRAMING & PERSPECTIVE]: Ângulo de câmera, lente (ex: 50mm, 85mm f/1.8), proporção.
   [6. LIGHTING & COLOR]: Iluminação profissional e paleta cromática harmônica inspirada nas cores da marca.
   [7. TEXTURES & FINISH]: Acabamentos de estúdio de alta fidelidade e realismo.
   [8. VISUAL STYLE]: Fotografia comercial moderna de alto padrão.
   [9. LOGO DIRECTIVE]: DIRETIVA DE LOGOMARCA DO BRANDKIT (CANTO) vs. RÓTULO DO PRODUTO vs. LOGOMARCA CRIATIVA DA ETAPA 5 (CENA):
   a) CANTO SUPERIOR ESQUERDO (ZONA DE LIMPEZA ABSOLUTA DE LOGO / ZERO-TEXT LOGO CLEARANCE ZONE): Se a logomarca do BrandKit estiver habilitada (ou se houver aplicação de logo fixa), o quadrante superior esquerdo (primeiros 22% de altura x 30% de largura à esquerda) DEVE PERMANECER 100% VAZIO E LIMPO (espaço negativo puro). É TERMINANTEMENTE PROIBIDO colocar qualquer texto, título, subtítulo, frase de efeito/eyebrow (ex: 'VOCÊ É NOSSO CONVIDADO'), data, selo ou badge nessa área! Todos os textos devem começar obrigatoriamente abaixo de Y=22% da imagem ou alinhados ao centro/direita, NUNCA sobrepondo a área onde a logo do BrandKit será posicionada.
   b) EXCEÇÃO OBRIGATÓRIA PARA RÓTULOS DE PRODUTOS FÍSICOS: As embalagens e rótulos dos produtos reais enviados pelo usuário DEVEM MANTER suas marcas impressas originais, nomes de produtos, textos, pesos e selos autênticos e legíveis.
   c) INSERÇÃO CRIATIVA CENOGRÁFICA (SEMPRE QUE O USUÁRIO ENVIAR UMA LOGOMARCA NA ETAPA 5): Se a imagem anexada na Etapa 5 for uma logomarca/logotipo enviada pelo usuário, PASSE POR CIMA da regra de proibição de logos na cena! No bloco [9. LOGO DIRECTIVE] do "imagePrompt", inclua OBRIGATORIAMENTE em inglês: "CREATIVE LOGO EXCEPTION MODE ACTIVE: The user provided a brand logo in Step 5 for creative scene integration. OVERRIDE all scene logo prohibitions and creatively, crisply, and organically integrate this exact uploaded brand logo inside the scene itself, DIFFERENT from a flat corner stamp (e.g., embroidered/printed on the protagonist's shirt chest, glowing on the smartphone/tablet screen, mounted as a 3D illuminated sign in the studio/environment, or printed on a physical prop), preserving its exact brand name spelling, typography, icon, and colors 100% faithfully while keeping the top-left header corner clean."
   [10. CRITICAL SAFE MARGINS]: REGRA DE ZERO CROP. Deixar 15% a 20% de margem de respiro livre em todas as bordas externas (superior, inferior e laterais). Nenhum texto ou elemento essencial pode encostar nas bordas. Quando houver logo de cabeçalho, manter adicionalmente a zona de respiro de 22% de altura no canto superior esquerdo para que a logomarca nunca sobreponha outros textos ou informações.

DIRETRIZES DE TEXTO / INFOGRÁFICO:
- Se textOverlayMode for NONE: Instruir ZERO TEXT, fotografia pura sem letras ou legendas.
- Se textOverlayMode for TITLE_ONLY: Incluir headline em português com tipografia nítida e contrastante no topo com margens de segurança.
- Se textOverlayMode for INFOGRAPHIC: Criar layout dinâmico adaptado ao briefing (badges flutuantes, callouts com linhas sutis, cards de benefícios modernos), com espaçamento generoso e textos nítidos em português (pt-BR).
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

  private static creativeArchetypeCursor = Math.floor(Math.random() * 8);

  public static selectCreativeLogoArchetype(userBrief = "") {
    const len = this.CREATIVE_LOGO_ARCHETYPES.length;
    const idx = this.creativeArchetypeCursor % len;
    this.creativeArchetypeCursor = (this.creativeArchetypeCursor + 1) % len;
    const primary = this.CREATIVE_LOGO_ARCHETYPES[idx];
    const secondary = this.CREATIVE_LOGO_ARCHETYPES[(idx + 3) % len];
    return { primary, secondary, userBrief };
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
      ? "A logomarca do BrandKit será colada via software APENAS no canto superior esquerdo (mantenha o quadrante superior esquerdo de 22% de altura x 30% de largura 100% LIMPO e VAZIO)."
      : "Mantenha o canto superior limpo e NÃO desenhe nenhuma logomarca na cena."
  }
  3. TRAVA /productlock: Preserve 100% da geometria, partes superiores e inferiores, peças aparentes e cores reais do produto enviado.
- CASO B — SOMENTE SE A IMAGEM ENVIADA NA ETAPA 5 FOR UMA LOGOMARCA / LOGOTIPO ISOLADO ("brand_logo" — isStep5Logo=${isStep5Logo}):
  1. MODO EXCEÇÃO CRIATIVA COM ROTAÇÃO DINÂMICA (${selectedArchetypes?.primary.id}): Aí sim, mantenha o sorteio de arquétipos e integre essa logomarca enviada na Etapa 5 de forma criativa na cena aplicando preferencialmente: "${selectedArchetypes?.primary.promptEn}" (ou "${selectedArchetypes?.secondary.promptEn}"), reproduzindo fielmente o nome, símbolo e cores da logomarca enviada!`
      : hasLogo
        ? `REGRA MANDATÓRIA DE LOGOMARCA DO BRANDKIT (SOBREPOSIÇÃO DIGITAL & ZONA LIVRE DE TEXTO):
A imagem da logomarca oficial do BrandKit foi anexada para aplicação DIGITAL no pós-processamento pelo sistema. Portanto, no "imagePrompt" você DEVE OBRIGATORIAMENTE INSTRUIR A IA A:\n1. MANTER O QUADRANTE SUPERIOR ESQUERDO (topo 22% de altura x esquerda 30% de largura) 100% LIMPO, VAZIO E LIVRE DE QUALQUER TEXTO, TÍTULO, SUBTÍTULO, EYEBROW (ex: frases de topo), DATA OU BADGE. Todos os textos devem começar abaixo de Y=22% ou no centro/direita.\n2. PROIBIR que a IA desenhe logotipos soltos ou marcas fictícias no layout. Rótulos de produtos físicos reais continuam autênticos e intactos.`
        : `REGRA ABSOLUTA DE LOGOMARCAS DE CABEÇALHO / POST:
NENHUMA logomarca oficial foi fornecida. É TERMINANTEMENTE PROIBIDO inventar, desenhar ou renderizar qualquer logotipo solto, badge de marca no layout, mascote, florzinha ou solzinho flutuante no topo da arte. Deixe o canto superior da imagem COMPLETAMENTE LIMPO (espaço negativo livre).`;

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
${input.compiledPrompt ? `\nDIRETRIZES TÉCNICAS PRÉ-COMPILADAS:\n${input.compiledPrompt}\n` : ""}

${logoDirectiveText}

Gere o JSON completo e estruturado conforme o schema com o prompt em inglês perfeito para gpt-image-2.
`;
  }

  private static validateAndNormalizePlan(raw: any, input: Gpt5PlannerInput): Gpt5VisualPlanResponse {
    const brand = input.brandKit;
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
          return raw.negativePrompt;
        }
        return hasSubject
          ? "redesigned product geometry, altered speaker top cabinets, generic mesh grille replacing exposed horns, stamping headline brand logos onto hardware, changed cabinet side colors, competitor trademarks, blank product label, erased packaging typography, missing label text, blurry label, censored product packaging, solid color block label, cropped headline, cut off borders, low quality, artifacts"
          : hasLogo
            ? "distorted logo, warped branding, text overlapping logo, typography in top-left corner, headline in top-left corner, title overlapping logo, competitor trademarks, fake text, cropped headline, cut off borders, blank product label, erased packaging text, low quality, artifacts"
            : "logo, brand logo, company logo, emblem, corporate symbol, fake logo, invented logo, watermark, signature, mascot, cartoon rocket, rocket icon, cartoon character, invented branding, badge, shield, crest, monogram, seal, stylized company name, circle with letters, brand mark, brand symbol, arbitrary logo, made-up logo, placeholder logo, distorted text logo, cropped headline, cut off borders, low quality, artifacts";
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
        brandElementsToPreserve: hasLogo
          ? ["Logomarca oficial da empresa integrada à arte", "Cores oficiais"]
          : ["Cores oficiais", "Elemento/Logo enviado na Etapa 5"],
      },
      textLayers: input.productHeadline
        ? [{ text: input.productHeadline, type: "headline", position: "top" }]
        : [],
      socialCaption: this.generateFallbackSocialCaption(input),
      imagePrompt: this.buildFallbackImagePrompt(input),
      negativePrompt: hasSubject
        ? this.isStep5LogoUpload(input) ? "competitor trademarks, distorted logo, warped branding, cropped typography, text touching borders, amateur framing" : "acrylic logo plaque on counter, tabletop logo totem, 3D wall logo sign, invented brand logo in scene, floating company emblem, redesigned product geometry, altered speaker top cabinets, generic mesh grille replacing exposed horns, stamping headline brand logos onto hardware, changed cabinet side colors, competitor trademarks, blank product label, erased packaging typography, missing label text, blurry label, censored product packaging, solid color block label, cropped typography, text touching borders, amateur framing"
        : hasLogo
          ? "distorted logo, warped branding, text overlapping logo, typography in top-left corner, headline in top-left corner, title overlapping logo, competitor trademarks, fake text, cropped typography, text touching borders, blank product label, erased packaging text, low quality, artifacts"
          : "logo, brand logo, company logo, emblem, corporate symbol, fake logo, invented logo, watermark, signature, mascot, cartoon rocket, rocket icon, cartoon character, invented branding, badge, shield, crest, monogram, seal, stylized company name, circle with letters, brand mark, brand symbol, arbitrary logo, made-up logo, placeholder logo, distorted text logo, cropped typography, text touching borders, amateur framing",
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

    let textInstruction =
      "[CRITICAL MANDATE — ZERO TEXT: Clean photography with zero typography, letters or watermarks.]";
    if (isTitle) {
      const headline = input.productHeadline?.trim() || "Headline em português";
      textInstruction = hasLogo
        ? `[HEADLINE POSTER DIRECTIVE & LOGO CLEARANCE: Render bold, elegant, high-contrast typography in Portuguese (pt-BR) saying "${headline}". ZERO-TEXT LOGO CLEARANCE ZONE: Keep top-left quadrant (top 22% height x left 30% width) 100% blank and clean for logo overlay; place headline starting below Y=22% or centered with generous breathing room and 20% safe margins.]`
        : `[HEADLINE POSTER DIRECTIVE: Render bold, elegant, high-contrast typography in Portuguese (pt-BR) saying "${headline}" with generous breathing room and 20% safe margins.]`;
    } else if (isInfographic) {
      const headline = input.productHeadline?.trim() || "Solução Inteligente";
      textInstruction = hasLogo
        ? `[DYNAMIC MODERN INFOGRAPHIC DIRECTIVE & LOGO CLEARANCE: Clean editorial layout in Portuguese (pt-BR) with headline "${headline}", modern floating callout badges or sleek highlight tags, minimalist line icons, and 20% safe margins from all outer borders. ZERO-TEXT LOGO CLEARANCE ZONE: The top-left quadrant (top 22% height x left 30% width) MUST remain 100% blank negative space. All headlines, badges, and text callouts must start below Y=22% or center/right so they never overlap the brand logo.]`
        : `[DYNAMIC MODERN INFOGRAPHIC DIRECTIVE: Clean editorial layout in Portuguese (pt-BR) with headline "${headline}", modern floating callout badges or sleek highlight tags, minimalist line icons, and 20% safe margins from all outer borders.]`;
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
        ? "[CRITICAL MANDATE — MANDATORY LOGO INTEGRATION & ZERO-TEXT CLEARANCE ZONE: The official business logo is composited digitally. The diffusion AI MUST keep the top-left quadrant (top 22% height x left 30% width) 100% CLEAN, BLANK and EMPTY negative space. ABSOLUTE PROHIBITION: Do NOT place any text, titles, subtitles, eyebrows, dates, or badges in the top-left area. Do NOT draw, render, paint or invent any floating company logos, brand names as logos (including NumVapt), acrylic tabletop plaques on counters, totens, wall signs, flower icons, sun icons, or decorative badges in the poster layout. Real product packaging labels must remain authentic.]"
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
      return p;
    }

    const thumbMandate = input.objective === "thumbnail"
      ? " [HIGH-PERFORMANCE VIDEO THUMBNAIL MANDATE: Dynamic magnetic video cover composition with dramatic high-contrast lighting, intense facial or subject focus, vibrant saturated color scheme, and extreme curiosity-inducing visual hook for maximum click-through rate (CTR) on YouTube, Reels, and TikTok.]"
      : "";

    return `Commercial advertising artwork: ${input.userBrief}. Modern studio photography, crisp details, natural lighting, elegant atmosphere. ${brandInstruction} ${thumbMandate} ${subjectMandate} ${textInstruction} ${this.buildBrandTypographyMandate(input)} ${logoMandate} [SAFE MARGINS MANDATE: Maintain 15% to 20% safe margin clearance around all borders. Absolutely no text or focal subjects touching the edges.]`;
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

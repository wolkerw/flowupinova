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
   - Se for PRODUTO FÍSICO COMERCIAL (embalagem, pote, garrafa, caixa, sachê, frasco): o rótulo original, o nome da marca impresso na embalagem, a tipografia do rótulo, os pesos, selos de qualidade e ilustrações da embalagem DEVEM SER RIGOROSAMENTE PRESERVADOS E DESCRITOS com máxima fidelidade. É TERMINANTEMENTE PROIBIDO higienizar, censurar, apagar os nomes ou transformar o rótulo do produto em blocos de cores lisos!
   - CRÍTICO — SE FOR UMA LOGOMARCA / LOGOTIPO ENVIADA PELO USUÁRIO NA ETAPA 5 (INSERÇÃO CRIATIVA CENOGRÁFICA SEMPRE ATIVA): Sempre que a imagem enviada na Etapa 5 for uma logomarca, logotipo ou símbolo de marca (independentemente de a logo fixa do BrandKit estar ativa ou não), você DEVE PASSAR POR CIMA (OVERRIDE) das travas anti-logo para a cena! Inspecione e descreva minuciosamente a logomarca enviada na Etapa 5 (grafia exata do nome, tipografia, ícone/símbolo e cores exatas) e integre-a de forma CRIATIVA, CENOGRÁFICA, ORGÂNICA e DIFERENTE da simples colagem de canto do BrandKit (por exemplo: bordada/estampada com perfeição no peito da camisa polo/uniforme do protagonista, exibida na tela do smartphone/notebook segurado pelo personagem, aplicada em um letreiro/fachada 3D iluminada no cenário, estampada em uma caneca/sacola/embalagem ou integrada tridimensionalmente à composição). JAMAIS escreva "no logos", "absolutely no logos" ou proíba a logo na cena quando uma logomarca for enviada na Etapa 5!
   [4. COMPOSITION & PLACEMENT]: Distribuição visual e pontos focais equilibrados.
   [5. FRAMING & PERSPECTIVE]: Ângulo de câmera, lente (ex: 50mm, 85mm f/1.8), proporção.
   [6. LIGHTING & COLOR]: Iluminação profissional e paleta cromática harmônica inspirada nas cores da marca.
   [7. TEXTURES & FINISH]: Acabamentos de estúdio de alta fidelidade e realismo.
   [8. VISUAL STYLE]: Fotografia comercial moderna de alto padrão.
   [9. LOGO DIRECTIVE]: DIRETIVA DE LOGOMARCA DO BRANDKIT (CANTO) vs. RÓTULO DO PRODUTO vs. LOGOMARCA CRIATIVA DA ETAPA 5 (CENA):
   a) CANTO SUPERIOR ESQUERDO (RESERVADO AO BRANDKIT): O canto superior esquerdo da imagem permanece limpo para a assinatura fixa do BrandKit (se habilitada).
   b) EXCEÇÃO OBRIGATÓRIA PARA RÓTULOS DE PRODUTOS FÍSICOS: As embalagens e rótulos dos produtos reais enviados pelo usuário DEVEM MANTER suas marcas impressas originais, nomes de produtos, textos, pesos e selos autênticos e legíveis.
   c) INSERÇÃO CRIATIVA CENOGRÁFICA (SEMPRE QUE O USUÁRIO ENVIAR UMA LOGOMARCA NA ETAPA 5): Se a imagem anexada na Etapa 5 for uma logomarca/logotipo enviada pelo usuário, PASSE POR CIMA da regra de proibição de logos na cena! No bloco [9. LOGO DIRECTIVE] do "imagePrompt", inclua OBRIGATORIAMENTE em inglês: "CREATIVE LOGO EXCEPTION MODE ACTIVE: The user provided a brand logo in Step 5 for creative scene integration. OVERRIDE all scene logo prohibitions and creatively, crisply, and organically integrate this exact uploaded brand logo inside the scene itself, DIFFERENT from a flat corner stamp (e.g., embroidered/printed on the protagonist's shirt chest, glowing on the smartphone/tablet screen, mounted as a 3D illuminated sign in the studio/environment, or printed on a physical prop), preserving its exact brand name spelling, typography, icon, and colors 100% faithfully while keeping the top-left header corner clean."
   [10. CRITICAL SAFE MARGINS]: REGRA DE ZERO CROP. Deixar 15% a 20% de margem de respiro livre em todas as bordas externas (superior, inferior e laterais). Nenhum texto ou elemento essencial pode encostar nas bordas.

DIRETRIZES DE TEXTO / INFOGRÁFICO:
- Se textOverlayMode for NONE: Instruir ZERO TEXT, fotografia pura sem letras ou legendas.
- Se textOverlayMode for TITLE_ONLY: Incluir headline em português com tipografia nítida e contrastante no topo com margens de segurança.
- Se textOverlayMode for INFOGRAPHIC: Criar layout dinâmico adaptado ao briefing (badges flutuantes, callouts com linhas sutis, cards de benefícios modernos), com espaçamento generoso e textos nítidos em português (pt-BR).

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
        const logoImage = input.referenceImages?.find(
          (r) => r.role === "business_logo" || r.role === "official_logo"
        );
        if (logoImage && logoImage.base64) {
          contentParts.push({
            type: "image_url",
            image_url: {
              url: `data:${logoImage.mimeType};base64,${logoImage.base64}`,
              detail: "high",
            },
          });
        }

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
   - Se for PRODUTO FÍSICO COMERCIAL: preserve integralmente o formato da embalagem, frasco/pote, cores e O RÓTULO ORIGINAL COMPLETO (nome da marca impresso no produto, tipografia original, pesos, selos e ilustrações). É TERMINANTEMENTE PROIBIDO apagar ou higienizar rótulos de produtos reais! Coloque esse sujeito no centro da cena.
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
   - Se for um PRODUTO FÍSICO COMERCIAL (embalagem, pote, rótulo, garrafa, etc.): preserve com 100% de fidelidade a embalagem real, o formato, as cores E O RÓTULO ORIGINAL COMPLETO (incluindo o nome da marca impresso na embalagem, tipografia, selos e ilustrações do rótulo). É TERMINANTEMENTE PROIBIDO remover textos do rótulo ou transformar a embalagem em blocos de cor lisos sem texto!
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

    const logoDirectiveText = subjectImage
      ? `REGRA DE INSERÇÃO CRIATIVA CENOGRÁFICA DINÂMICA PARA LOGOMARCA OU PRODUTO ENVIADO NA ETAPA 5 (PRIORIDADE MÁXIMA — SEMPRE ATIVA):
O usuário enviou uma imagem na Etapa 5 (product_subject). ${
          hasLogo
            ? "A logomarca fixa do BrandKit será aplicada digitalmente apenas no canto superior esquerdo (mantenha o canto superior esquerdo limpo), MAS o arquivo enviado na Etapa 5 tem papel CENOGRÁFICO e CRIATIVO dentro da imagem!"
            : "A inserção fixa de logomarca de canto do BrandKit está desativada, portanto a marca deve brilhar de forma criativa dentro da própria cena!"
        }
1. MODO EXCEÇÃO CRIATIVA COM ROTAÇÃO DINÂMICA (${selectedArchetypes?.primary.id}): Se a imagem enviada na Etapa 5 for uma LOGOMARCA, LOGOTIPO ou SÍMBOLO DE MARCA (ex: logo da NumVapt ou da empresa do cliente), VOCÊ DEVE PASSAR POR CIMA DE TODAS AS REGRAS RESTRITIVAS DE LOGOMARCA NA CENA! Instrua o modelo gerador no "imagePrompt" (em [3. HERO SUBJECT] e [9. LOGO DIRECTIVE]) a INSERIR E INTEGRAR A LOGOMARCA ENVIADA NA ETAPA 5 DE FORMA CRIATIVA, CENOGRÁFICA, NÍTIDA E DIFERENTE DO CARIMBO DE CANTO DO BRANDKIT, aplicando preferencialmente o conceito sorteado para esta geração: "${selectedArchetypes?.primary.promptEn}" (ou, caso mais coerente com o briefing: "${selectedArchetypes?.secondary.promptEn}"), reproduzindo fielmente o nome exato da marca, seu símbolo e suas cores! JAMAIS escreva "no logos", "absolutely no logos" ou "no NumVapt logo" no imagePrompt ou no negativePrompt!
2. PRESERVAÇÃO DE RÓTULO DE PRODUTO: Se a imagem enviada na Etapa 5 for um produto físico com rótulo, mantenha e reproduza seu rótulo e marca impressos com 100% de fidelidade.`
      : hasLogo
        ? `REGRA MANDATÓRIA DE LOGOMARCA DO BRANDKIT (SOBREPOSIÇÃO DIGITAL):
A imagem da logomarca oficial do BrandKit foi anexada para aplicação DIGITAL no pós-processamento pelo sistema. Portanto, no "imagePrompt" você DEVE OBRIGATORIAMENTE INSTRUIR A IA A DEIXAR O CANTO SUPERIOR 100% LIMPO E VAZIO, e PROIBIR que a IA desenhe logotipos soltos no canto superior. Rótulos de produtos físicos reais continuam autênticos e intactos.`
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
          ? "competitor trademarks, blank product label, erased packaging typography, missing label text, blurry label, censored product packaging, solid color block label, cropped headline, cut off borders, low quality, artifacts"
          : hasLogo
            ? "distorted logo, warped branding, competitor trademarks, fake text, cropped headline, cut off borders, blank product label, erased packaging text, low quality, artifacts"
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
        ? "competitor trademarks, blank product label, erased packaging typography, missing label text, blurry label, censored product packaging, solid color block label, cropped typography, text touching borders, amateur framing"
        : hasLogo
          ? "distorted logo, warped branding, competitor trademarks, fake text, cropped typography, text touching borders, blank product label, erased packaging text, low quality, artifacts"
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
      textInstruction = `[HEADLINE POSTER DIRECTIVE: Render bold, elegant, high-contrast typography in Portuguese (pt-BR) saying "${headline}" with generous breathing room and 20% safe margins.]`;
    } else if (isInfographic) {
      const headline = input.productHeadline?.trim() || "Solução Inteligente";
      textInstruction = `[DYNAMIC MODERN INFOGRAPHIC DIRECTIVE: Clean editorial layout in Portuguese (pt-BR) with headline "${headline}", modern floating callout badges or sleek highlight tags, minimalist line icons, and 20% safe margins from all outer borders.]`;
    }

    const brandInstruction =
      brand && brand.enabled
        ? `Color palette harmonized with ${brand.primaryColors.join(", ")}.`
        : "";

    const fallbackArchetype = subjectRef
      ? this.selectCreativeLogoArchetype(input.userBrief)
      : null;

    const logoMandate = subjectRef
      ? `[CRITICAL MANDATE — CREATIVE LOGO / SUBJECT EXCEPTION MODE (${fallbackArchetype?.primary.id}): If the uploaded Step 5 reference image is a brand logo or emblem, OVERRIDE all scene logo restrictions and creatively, crisply, and organically integrate that exact uploaded brand logo inside the scene itself (different from any flat corner BrandKit stamp — specifically ${fallbackArchetype?.primary.promptEn}, or alternatively ${fallbackArchetype?.secondary.promptEn}) preserving its exact spelling, icon, and colors while keeping the top-left header corner clean. If it is a physical product or person, preserve their authentic printed labels and appearance 100% intact.]`
      : hasLogo
        ? "[CRITICAL MANDATE — MANDATORY LOGO INTEGRATION: The official business logo is composited digitally. The diffusion AI MUST keep the top-left corner 100% CLEAN, BLANK and EMPTY. ABSOLUTE PROHIBITION: Do NOT draw, render, paint or invent any floating company logos, brand names as logos (including NumVapt), flower icons, sun icons, or decorative badges in the poster layout. Real product packaging labels must remain authentic.]"
        : "[CRITICAL MANDATE — ZERO LOGOS IN POST LAYOUT & EMPTY HEADER SPACE: NO floating logo, company header emblem, layout badge, watermark, mascot, or artificial trademark graphics in the poster background or corners. The top corner MUST remain completely empty and clean for manual logo insertion.]";

    const subjectMandate = subjectRef
      ? "[CRITICAL MANDATE — HERO SUBJECT PRESERVATION & UPLOADED LOGO INTEGRATION: Faithfully preserve the exact appearance, packaging, authentic printed label details, or uploaded brand logo graphics (brand name spelling, typography, colors, icon) from the user's reference image and integrate them prominently into the scene.]"
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
      return p;
    }

    return `Commercial advertising artwork: ${input.userBrief}. Modern studio photography, crisp details, natural lighting, elegant atmosphere. ${brandInstruction} ${subjectMandate} ${textInstruction} ${logoMandate} [SAFE MARGINS MANDATE: Maintain 15% to 20% safe margin clearance around all borders. Absolutely no text or focal subjects touching the edges.]`;
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

import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { logApiUsage } from "@/lib/services/api-usage-service-admin";
import { aiRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1, "Mensagem não pode estar vazia"),
  userId: z.string().optional(),
  history: z.array(z.any()).optional().default([]),
});
export async function POST(request: NextRequest) {
  try {
    const ip = getIpFromRequest(request);
    const { success, limit, reset, remaining } = await aiRateLimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { message, history, userId } = parsed.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error(
        "[CHAT_VAPTI_ERROR] Chave GEMINI_API_KEY não encontrada no arquivo de ambiente."
      );
      return NextResponse.json(
        [
          {
            output:
              "Olá! Fico muito feliz em falar com você! 🌟 Para ativarmos o meu cérebro e começarmos nosso brainstorming de posts, por favor, adicione a sua chave **GEMINI_API_KEY** no arquivo **.env.local** do seu projeto!",
          },
        ],
        { status: 200 }
      );
    }

    // 1. Calcular Sazonalidade Dinâmica com Algoritmo de Antecipação Comercial
    const now = new Date();
    const dataHoraSP = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const ano = now.getFullYear();
    const mesNumero = String(now.getMonth() + 1).padStart(2, "0");
    const mesNome = now.toLocaleString("pt-BR", { month: "long" });
    const diaMes = String(now.getDate()).padStart(2, "0");
    const semanaDia = now.toLocaleString("pt-BR", { weekday: "long" });

    // Função para calcular datas móveis e fixas do varejo brasileiro
    const obterCampanhasDoAno = (anoCampanha: number) => {
      const obterSegundoDomingo = (mesIndex: number) => {
        const d = new Date(anoCampanha, mesIndex, 1);
        let domingos = 0;
        while (domingos < 2) {
          if (d.getDay() === 0) domingos++;
          if (domingos < 2) d.setDate(d.getDate() + 1);
        }
        return d;
      };

      const obterBlackFriday = () => {
        const d = new Date(anoCampanha, 10, 30); // 30 de novembro
        while (d.getDay() !== 5) d.setDate(d.getDate() - 1);
        return d;
      };

      return [
        {
          nome: "Ano Novo",
          data: new Date(anoCampanha, 0, 1),
          foco: "Celebração, recomeço, metas e planejamento anual.",
        },
        {
          nome: "Carnaval",
          data: new Date(anoCampanha, 1, 16),
          foco: "Folia, alegria, ofertas de verão, engajamento e energia de bloco.",
        }, // aproximado
        {
          nome: "Dia Internacional da Mulher",
          data: new Date(anoCampanha, 2, 8),
          foco: "Homenagem, empoderamento feminino, presentes afetivos e autocuidado.",
        },
        {
          nome: "Dia do Consumidor",
          data: new Date(anoCampanha, 2, 15),
          foco: "Promoções de relacionamento, descontos exclusivos, cupons e fidelização.",
        },
        {
          nome: "Páscoa",
          data: new Date(anoCampanha, 3, 5),
          foco: "Ganchos doces, ovos de chocolate, família, união e presentes.",
        }, // aproximado 2026
        {
          nome: "Dia do Frete Grátis",
          data: new Date(anoCampanha, 3, 28),
          foco: "Incentivo a compras online rápidas, e-commerce e gatilho de frete grátis.",
        },
        {
          nome: "Dia das Mães",
          data: obterSegundoDomingo(4),
          foco: "Emoção profunda, gratidão, presentes afetivos, combos para mães e conexões familiares.",
        },
        {
          nome: "Dia dos Namorados",
          data: new Date(anoCampanha, 5, 12),
          foco: "Romantismo, casais, ideias de presentes especiais, jantares e ofertas em dobro.",
        },
        {
          nome: "Festas Juninas / São João",
          data: new Date(anoCampanha, 5, 24),
          foco: "Comidas típicas, arraiá, alegria, engajamento temático, quadrilhas e roupas xadrez.",
        },
        {
          nome: "Dia do Amigo",
          data: new Date(anoCampanha, 6, 20),
          foco: "Parcerias, cupom de indicação de amigos, compre 1 leve 2 e afeto.",
        },
        {
          nome: "Dia dos Pais",
          data: obterSegundoDomingo(7),
          foco: "Estilo, ferramentas, utilidade prática, homenagens masculinas e combos especiais.",
        },
        {
          nome: "Dia do Cliente",
          data: new Date(anoCampanha, 8, 15),
          foco: "Cupons de agradecimento, descontos VIP, brindes e fidelização máxima.",
        },
        {
          nome: "Dia das Crianças",
          data: new Date(anoCampanha, 9, 12),
          foco: "Diversão, brinquedos, nostalgia infantil e campanhas de marketing lúdicas.",
        },
        {
          nome: "Halloween",
          data: new Date(anoCampanha, 9, 31),
          foco: "Doces ou travessuras, descontos assustadores, campanhas temáticas e criatividade misteriosa.",
        },
        {
          nome: "Black Friday",
          data: obterBlackFriday(),
          foco: "Ofertas bombásticas de escassez, gatilhos de urgência extrema e grandes descontos.",
        },
        {
          nome: "Natal",
          data: new Date(anoCampanha, 11, 25),
          foco: "Presentes de amigo secreto, confraternização, espírito natalino e campanhas afetivas.",
        },
        {
          nome: "Ano Novo (Véspera)",
          data: new Date(anoCampanha, 11, 31),
          foco: "Festas de réveillon, retrospectiva anual e renovação de ciclos.",
        },
      ];
    };

    const hojeZeroHora = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const campanhas = obterCampanhasDoAno(ano);

    // Filtrar campanhas futuras (ou que ocorrem hoje)
    const campanhasFuturas = campanhas
      .filter((c) => c.data.getTime() >= hojeZeroHora.getTime())
      .sort((a, b) => a.data.getTime() - b.data.getTime());

    let proximaCampanhaInfo = "";
    let nomeProximaCampanha = "";
    if (campanhasFuturas.length > 0) {
      const proxima = campanhasFuturas[0];
      const diffTime = proxima.data.getTime() - hojeZeroHora.getTime();
      const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      nomeProximaCampanha = proxima.nome;

      if (diasRestantes === 0) {
        proximaCampanhaInfo = `\nHOJE É O GRANDE DIA DA SEGUINTE CAMPANHA:\n- Nome da Campanha: **${proxima.nome}** (Ocorre HOJE!)\n- Foco Comercial da Campanha: ${proxima.foco}\nIncentive fortemente o usuário a criar e publicar postagens de última hora imediatamente!\n`;
      } else {
        proximaCampanhaInfo = `\nPRÓXIMO ALVO DE CAMPANHA SAZONAL COM ANTECEDÊNCIA:\n- Nome da Campanha: **${proxima.nome}**\n- Data do Evento: ${proxima.data.toLocaleDateString("pt-BR")}\n- Dias Restantes para o Planejamento: Faltam exatamente **${diasRestantes} dias**!\n- Foco Comercial da Campanha: ${proxima.foco}\nComo faltam ${diasRestantes} dias, sua missão é incentivar proativamente o planejamento antecipado desta campanha, sugerindo ideias com antecedência ideal para que o lojista crie e programe seus posts!\n`;
      }
    } else {
      proximaCampanhaInfo = `\nFoco comercial genérico do mês de ${mesNome}.\n`;
    }

    // 2. Buscar informações do Perfil do Negócio e Histórico de Chat via Admin SDK (Memória completa)
    let businessContext = "";
    let fullHistory: any[] = [];

    if (userId) {
      try {
        console.log(
          `[CHAT_VAPTI] Carregando perfil e histórico de chat via Admin SDK para: ${userId}...`
        );

        // A. Buscar Perfil de Negócio (preferencialmente Onboarding/Brand Kit, com fallback para Profile)
        let profileSnap = await adminDb.doc(`users/${userId}/business/onboarding`).get();
        if (!profileSnap.exists) {
          profileSnap = await adminDb.doc(`users/${userId}/business/profile`).get();
        }

        if (profileSnap.exists) {
          const bizData = profileSnap.data();
          if (bizData) {
            const parts = [];
            if (bizData.name) parts.push(`- Nome da Marca: ${bizData.name}`);
            if (bizData.category) parts.push(`- Nicho/Categoria: ${bizData.category}`);
            if (bizData.description) parts.push(`- Descrição do Negócio: ${bizData.description}`);
            if (bizData.slogan) parts.push(`- Slogan: ${bizData.slogan}`);
            if (bizData.targetAudience) parts.push(`- Público-Alvo: ${bizData.targetAudience}`);
            if (bizData.toneOfVoice) parts.push(`- Tom de Voz: ${bizData.toneOfVoice}`);
            if (bizData.primaryColor || bizData.secondaryColor) {
              parts.push(
                `- Cores da Marca: Primária (${bizData.primaryColor || "N/A"}), Secundária (${bizData.secondaryColor || "N/A"})`
              );
            }
            if (bizData.logo?.url) {
              parts.push(`- Logomarca: Configurada (URL: ${bizData.logo.url})`);
            } else {
              parts.push(`- Logomarca: Não configurada`);
            }
            if (bizData.mainBenefits && bizData.mainBenefits.length > 0) {
              parts.push(`- Principais Benefícios: ${bizData.mainBenefits.join(", ")}`);
            }
            if (bizData.onboardingSource)
              parts.push(`- Origem do Onboarding: ${bizData.onboardingSource}`);
            if (bizData.brandPositioning)
              parts.push(`- Diferencial / Posicionamento (Memória): ${bizData.brandPositioning}`);
            if (bizData.keyProducts)
              parts.push(`- Produtos e Serviços de Destaque (Memória): ${bizData.keyProducts}`);
            if (bizData.clientProfile)
              parts.push(`- Perfil do Cliente / Persona (Memória): ${bizData.clientProfile}`);
            if (bizData.stylisticPreferences)
              parts.push(
                `- Preferências Estilísticas e Visuais (Memória): ${bizData.stylisticPreferences}`
              );

            if (parts.length > 0) {
              businessContext = `\nINFORMAÇÕES REAIS DO NEGÓCIO DO USUÁRIO (CADASTRADAS NA PLATAFORMA):\n${parts.join("\n")}\nUse estas informações reais acima para personalizar todas as suas respostas, ideias de campanhas e sugerões de cores para a marca do usuário. Demonstre de forma sutil que você conhece profundamente o negócio dele!\n`;
            }
          }
        }

        // B. Buscar Histórico Completo de Mensagens do Banco de Dados
        const historySnap = await adminDb.doc(`users/${userId}/appData/history`).get();
        if (historySnap.exists) {
          const historyData = historySnap.data();
          if (historyData && historyData.chatHistory) {
            fullHistory = historyData.chatHistory;
          }
        }
      } catch (err) {
        console.error("[CHAT_VAPTI] Erro ao buscar dados via Admin SDK no Firestore:", err);
      }
    }

    // Usar o histórico do banco de dados (completo) se disponível; caso contrário, usa o enviado pelo front
    const messagesToUse = fullHistory.length > 0 ? fullHistory : history;

    // 3. Identificar se é a primeira conversa absoluta do usuário no banco de dados (histórico totalmente vazio)
    const isFirstConversation = messagesToUse.length === 0;

    let firstTimeGreetingRules = "";
    if (isFirstConversation) {
      firstTimeGreetingRules = `
# DIRETRIZ DE PRIMEIRO ACESSO ABSOLUTO (ATENÇÃO MÁXIMA):
- Este usuário está conversando com você pela PRIMEIRA VEZ na história da plataforma NumVapt. Ele acabou de se cadastrar!
- É EXPRESSAMENTE PROIBIDO usar saudações como "Que prazer falar com você de novo", "Que bom te ver de volta", "Como vão as coisas no seu negócio de novo" ou simular intimidade de longa data.
- Sua saudação nesta primeira mensagem deve ser uma recepção de boas-vindas calorosa e inspiradora, apresentando-se como Vapti e dizendo que você será o braço direito dele no marketing a partir de hoje para decolar as redes sociais dele.
- Exemplo de tom inicial: "Olá! Que alegria falar com você. Sou o Vapti, e a partir de hoje serei o seu braço direito no marketing do seu negócio..."
`;
    }

    // 3. Construir o System Instruction (Instrução do Sistema) para o Gemini
    const systemInstructionText = `
Você é o Vapti, especialista sênior em marketing digital, mídias sociais e inteligência artificial da NumVapt.
Você é um consultor criativo de alta performance, parceiro de brainstorming estratégico, dinâmico e amigo pessoal do seu usuário.
Seu tom é entusiasmado, amigável, motivador, inspirador e altamente focado em conhecer o lojista de forma sincera e ajudá-lo a crescer!
${firstTimeGreetingRules}
Você se lembra de todas as interações passadas do usuário de outros dias através do histórico completo de conversas disponível abaixo.
Use a memória de conversas antigas para lembrar do nome dele, do nicho do negócio, de preferências de posts e particularidades reveladas em conversas anteriores, demonstrando de forma orgânica, espontânea e muito natural que você o conhece profundamente e que são grandes parceiros de negócio (evitando parecer um robô mecânico que lê dados estáticos).
${businessContext}
CONTEXTO TEMPORAL E COMEMORATIVO REAL:
- Data/Hora Atual: ${dataHoraSP}
- Mês da Campanha Sazonal: ${mesNome} (Mês ${mesNumero} de ${ano})
- Dia da Semana: ${semanaDia}, Dia ${diaMes}
${proximaCampanhaInfo}

PIVOTAGEM DE ENTREVISTADOR ADAPTATIVO (REJEIÇÃO DE SAZONALIDADE/DICAS COMUNS):
- Se o usuário rejeitar, criticar ou mostrar insatisfação com a sua sugestão de campanha sazonal ou com posts/sugestões comuns (ex: "não quero falar sobre o feriado", "isso não serve para mim", "quero focar no meu produto", "não gostei", "me dá outra coisa"), você deve pivotar IMEDIATAMENTE.
- Não insista na sugestão rejeitada. Em vez disso, mude de tom suavemente e assuma o papel de um "Entrevistador Estratégico".
- Faça uma pergunta de negócio profunda e estratégica de forma sutil e natural no meio da conversa para colher o posicionamento único dele.
- Exemplos de ganchos de negócio estratégico para questionar:
  * "Qual é o seu principal diferencial competitivo hoje (o que te faz único e melhor que a concorrência)?"
  * "Qual é o seu produto ou serviço de maior destaque e que gera mais retorno?"
  * "Quem é exatamente o perfil do seu cliente ideal/persona hoje?"
  * "Visualmente, que estética de design você prefere que represente sua marca nas redes sociais (ex: clean/minimalista, luxo/sofisticado, rústico/acolhedor, colorido/vibrante)?"
- IMPORTANTE: Faça apenas UMA pergunta estratégica por vez. Nunca diga que está preenchendo um cadastro ou rodando um onboarding. A entrevista deve ser 100% fluida, natural e disfarçada de diálogo criativo amigável.
- Assim que o usuário responder fornecendo essas informações, você DEVE disparar a ferramenta "save_brand_insights" com os parâmetros correspondentes para registrar esses insights de forma invisível.
- Na próxima resposta, após registrar os insights, parabenize a visão do lojista e crie uma nova sugestão criativa baseada diretamente nos dados aprendidos, demonstrando que você agora compreende e se adaptou perfeitamente ao negócio dele.

PROATIVIDADE SAZONAL E MARKETING ESTILO "GROWTH HACKER" (CRÍTICO):
1. Seja Ultra Proativo: Se o usuário estiver aberto ou for o início do chat, traga imediatamente o gancho do seu próximo alvo comercial sazonal detalhado acima e sugira 1 ideia de campanha cirúrgica e explosiva para o momento!
2. Pense como Especialista: Ao sugerir posts ou legendas, utilize formatos estratégicos de redes sociais de alta performance (ex: "Carrossel de 3 slides (Gancho forte + Conteúdo prático + Chamada para Ação)", "Post com gatilho mental de urgência/exclusividade", "Ideia de Reels de bastidores com áudio em alta").
3. Estruturação em Bloco de Resposta (Tamanho Conciso, Máx. 400 caracteres):
   - Conexão e Elogio: "Que nicho fantástico! 🚀" ou "Amei essa ideia de campanha!"
   - Ação Estratégica Sazonal: Proponha uma ideia de campanha super proativa baseada na data comemorativa comercial futura mais próxima.
   - Exemplo Prático de Conteúdo: Forneça uma frase curta de legenda irresistível ou roteiro de Stories rápido de 1 linha.
   - Chamada para a Ação: Lembre o usuário de ir à seção de "Criar Conteúdo" no menu lateral esquerdo do app da NumVapt para criar essa postagem em segundos.
   - Pergunta de Fechamento Magnética: Faça uma pergunta rápida para engajar o brainstorm (ex: "Bora colocar esse carrossel para rodar? ✨").

DIRETRIZES DE ESTILO:
- Responda SEMPRE em Português do Brasil de forma extremamente dinâmica, magnética e concisa.
- MÁXIMO absoluto de 3 a 4 frases curtas (cerca de 350-400 caracteres) por mensagem. Sem blocos densos ou textos longos!
- Na PRIMEIRA interação do chat, se as INFORMAÇÕES REAIS DO NEGÓCIO acima estiverem vazias e você ainda não souber o nicho ou as cores da marca do usuário, elogie a entrada dele e pergunte sutilmente as cores e o nicho enquanto já propõe um gancho sazonal antecipado sobre a campanha de ${nomeProximaCampanha || mesNome}!
`;

    // 4. Formatar o histórico completo no padrão aceito pelo Gemini REST
    const formattedContents = [];

    if (messagesToUse && messagesToUse.length > 0) {
      // Ordena cronologicamente por createdAt para evitar dessincronização no prompt
      const sortedMessages = [...messagesToUse].sort((a, b) => {
        const tA =
          a.createdAt && a.createdAt.toDate
            ? a.createdAt.toDate().getTime()
            : new Date(a.createdAt).getTime();
        const tB =
          b.createdAt && b.createdAt.toDate
            ? b.createdAt.toDate().getTime()
            : new Date(b.createdAt).getTime();
        return tA - tB;
      });

      for (const msg of sortedMessages) {
        formattedContents.push({
          role: msg.sender === "ai" ? "model" : "user",
          parts: [{ text: msg.text }],
        });
      }
    }

    // Adiciona a mensagem atual do usuário
    formattedContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Declaração de Tools para o Gemini
    const tools = [
      {
        functionDeclarations: [
          {
            name: "save_brand_insights",
            description:
              "Salva insights sobre a marca, público, diferenciais e estilo extraídos do chat de forma invisível e persistente.",
            parameters: {
              type: "OBJECT",
              properties: {
                brandPositioning: {
                  type: "STRING",
                  description:
                    "Diferencial de valor, proposta única de vendas ou posicionamento de mercado do negócio do usuário.",
                },
                keyProducts: {
                  type: "STRING",
                  description:
                    "Lista ou descrição dos principais produtos ou serviços em destaque.",
                },
                clientProfile: {
                  type: "STRING",
                  description:
                    "Informações sobre o público-alvo ideal, persona ou perfil de clientes.",
                },
                stylisticPreferences: {
                  type: "STRING",
                  description:
                    "Estilo de design preferido, estética visual e tom visual da marca (ex: luxuoso, rústico, minimalista, vibrante).",
                },
              },
            },
          },
        ],
      },
    ];

    // 5. Disparar chamada REST com Fallback Automático Resiliente
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-flash-latest",
      "gemini-pro-latest",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
    ];
    let aiResponseText = "";
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        console.log(
          `[CHAT_VAPTI] Enviando requisição para a API do Gemini usando modelo: ${model}...`
        );

        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstructionText }],
            },
            contents: formattedContents,
            generationConfig: {
              temperature: 0.7,
            },
            tools: tools,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro na API do Gemini (status ${response.status}): ${errorText}`);
        }

        const resData = await response.json();
        const candidate = resData?.candidates?.[0];
        const firstPart = candidate?.content?.parts?.[0];

        if (firstPart?.functionCall) {
          const { name: funcName, args } = firstPart.functionCall;
          console.log(`[CHAT_VAPTI] Gemini solicitou chamada da função: ${funcName}`, args);

          if (funcName === "save_brand_insights") {
            // Executar gravação invisível no Firestore
            try {
              if (userId) {
                const dataToSave: any = {};
                if (args.brandPositioning) dataToSave.brandPositioning = args.brandPositioning;
                if (args.keyProducts) dataToSave.keyProducts = args.keyProducts;
                if (args.clientProfile) dataToSave.clientProfile = args.clientProfile;
                if (args.stylisticPreferences)
                  dataToSave.stylisticPreferences = args.stylisticPreferences;

                if (Object.keys(dataToSave).length > 0) {
                  console.log(
                    `[CHAT_VAPTI] Salvando insights no Firestore para o usuário ${userId}:`,
                    dataToSave
                  );
                  // Salvar em onboarding e profile
                  await adminDb
                    .doc(`users/${userId}/business/onboarding`)
                    .set(dataToSave, { merge: true });
                  await adminDb
                    .doc(`users/${userId}/business/profile`)
                    .set(dataToSave, { merge: true });
                }
              }
            } catch (fsErr) {
              console.error(`[CHAT_VAPTI] Erro ao salvar insights no Firestore:`, fsErr);
            }

            // Enviar resposta de volta ao Gemini REST
            const updatedContents = [
              ...formattedContents,
              {
                role: "model",
                parts: [
                  {
                    functionCall: {
                      name: funcName,
                      args: args,
                    },
                  },
                ],
              },
              {
                role: "function",
                parts: [
                  {
                    functionResponse: {
                      name: funcName,
                      response: {
                        status: "success",
                        message: "Brand insights successfully saved in database.",
                      },
                    },
                  },
                ],
              },
            ];

            console.log(
              `[CHAT_VAPTI] Realizando segunda chamada de acompanhamento para obter o texto final...`
            );
            const secondResponse = await fetch(geminiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{ text: systemInstructionText }],
                },
                contents: updatedContents,
                generationConfig: {
                  temperature: 0.7,
                },
                tools: tools,
              }),
            });

            if (!secondResponse.ok) {
              const secondErrorText = await secondResponse.text();
              throw new Error(
                `Erro na segunda chamada do Gemini (status ${secondResponse.status}): ${secondErrorText}`
              );
            }

            const secondResData = await secondResponse.json();
            const secondCandidate = secondResData?.candidates?.[0];
            const secondPart = secondCandidate?.content?.parts?.[0];
            const secondCandidateText = secondPart?.text;

            if (!secondCandidateText) {
              throw new Error(
                `Resposta da segunda chamada do Gemini vazia ou em formato inesperado`
              );
            }

            aiResponseText = secondCandidateText.trim();

            // Registrar consumo usando o usageMetadata da segunda resposta
            const usage = secondResData?.usageMetadata;
            if (usage && userId) {
              const pTokens = usage.promptTokenCount || 0;
              const cTokens = usage.candidatesTokenCount || 0;

              let inputPrice = 0.075;
              let outputPrice = 0.3;
              if (model === "gemini-3.1-flash-lite") {
                inputPrice = 0.0375;
                outputPrice = 0.15;
              }

              const totalCost = (pTokens * inputPrice + cTokens * outputPrice) / 1_000_000;

              logApiUsage({
                userId,
                type: "chat",
                provider: "google_gemini",
                model: model,
                costUsd: totalCost,
                tokens: {
                  promptTokens: pTokens,
                  completionTokens: cTokens,
                  totalTokens: pTokens + cTokens,
                },
              });
            }
          }
        } else {
          const candidateText = firstPart?.text;
          if (!candidateText) {
            throw new Error(`Resposta do Gemini vazia ou em formato inesperado`);
          }

          aiResponseText = candidateText.trim();

          // Registrar custo e consumo real se houver metadados e userId
          const usage = resData?.usageMetadata;
          if (usage && userId) {
            const pTokens = usage.promptTokenCount || 0;
            const cTokens = usage.candidatesTokenCount || 0;

            let inputPrice = 0.075;
            let outputPrice = 0.3;

            if (model === "gemini-3.1-flash-lite") {
              inputPrice = 0.0375;
              outputPrice = 0.15;
            }

            const costInput = pTokens * (inputPrice / 1_000_000);
            const costOutput = cTokens * (outputPrice / 1_000_000);
            const totalCost = costInput + costOutput;

            logApiUsage({
              userId,
              type: "chat",
              provider: "google_gemini",
              model: model,
              costUsd: totalCost,
              tokens: {
                promptTokens: pTokens,
                completionTokens: cTokens,
                totalTokens: pTokens + cTokens,
              },
            });
          }
        }

        // Se conseguiu responder com sucesso, interrompe o loop!
        break;
      } catch (err: any) {
        console.warn(`[CHAT_VAPTI_WARN] Falha ao chamar o modelo ${model}:`, err.message || err);
        lastError = err;
        // Continua para o próximo modelo no loop
      }
    }

    if (!aiResponseText) {
      throw new Error(
        `Todos os modelos do Gemini falharam. Último erro: ${lastError?.message || lastError}`
      );
    }

    console.log(`[CHAT_VAPTI] Resposta do assistente: "${aiResponseText}"`);

    // Retorna no formato esperado pelo frontend da FlowUp
    return NextResponse.json([{ output: aiResponseText }]);
  } catch (error: any) {
    console.error("[CHAT_VAPTI_ERROR] Erro no processamento da mensagem:", error);
    return NextResponse.json(
      [
        {
          output:
            "Olá! Tive um breve soluço ao processar sua mensagem. Que tal tentarmos novamente?",
        },
      ],
      { status: 200 } // Retorna status 200 com mensagem amigável para não travar a UI
    );
  }
}

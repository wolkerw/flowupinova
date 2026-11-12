import type { WhatsAppKnowledgeTopic } from "@/lib/types/whatsapp-knowledge";

/**
 * Data da última revisão dos tópicos padrão abaixo.
 * Atualize sempre que alterar o conteúdo de algum tópico padrão: o painel admin
 * usa os tópicos padrão para oferecer "Importar novos tópicos" e "Restaurar padrão".
 */
export const DEFAULTS_UPDATED_AT = "2026-11-12T00:00:00.000Z";

/**
 * Tópicos oficiais da Central de Informações da Maia (WhatsApp e Instagram Direct).
 * Usados para semear o Firestore (coleção whatsapp_knowledge_base) e como fallback.
 * Tópicos com o marcador [PREENCHER] dependem de dados do negócio e ficam inativos
 * até um administrador completá-los no painel.
 */
export const DEFAULT_KNOWLEDGE_TOPICS: WhatsAppKnowledgeTopic[] = [
  {
    id: "topic_planos",
    category: "planos",
    title: "Planos e Preços Oficiais NumVapt",
    content:
      "• Plano Mensal: R$ 490,00/mês (sem fidelidade, cancele quando quiser).\n• Plano Trimestral: R$ 441,00/mês (10% de desconto | R$ 1.323,00 por trimestre).\n• Plano Semestral: R$ 416,50/mês (15% de desconto | R$ 2.499,00 por semestre).\n• Plano Anual (Cobrança Mensal no Cartão + 1 Mês Grátis): R$ 399,00/mês (13 meses de acesso — 12 meses pagos + 1 mês bônus gratuito! Neste plano o valor mensal fica R$ 368,30 se dividirmos o valor total da assinatura de R$ 4.788,00 por 13 meses).\n• Plano Tudo Pronto: R$ 699,00/mês. Oferece todas as funcionalidades dos outros planos porém com o plus de fazermos toda a execução da plataforma pra você. É ideal para aqueles empresários que precisam de marketing mas não tem tempo para executar (ou simplesmente não querem). Nossa equipe faz toda a gestão da plataforma NumVapt, desde integração, configuração do negócio, criação de posts, agendamento e criação de campanhas de anúncios. O usuário recebe um acesso de 'cliente aprovador' e só precisa aprovar as criações feitas por nossa equipe.\nIMPORTANTE SOBRE O PAGAMENTO DO PLANO ANUAL:\n- A cobrança é feita de forma MENSAL no cartão de crédito (R$ 399,00 por mês).\n- NÃO compromete nem trava o limite total de R$ 4.788,00 no cartão do cliente! Todo mês entra apenas a parcela de R$ 399,00.\n- Não oferecemos parcelamento do valor total de R$ 4.788,00 em 12x, oferecemos exclusivamente essa modalidade mensal recorrente de R$ 399/mês que não bloqueia o limite do cartão.\n- Link de Assinatura Oficial: https://www.asaas.com/c/2unkh9p3t6apkcvm\n- Link de Cadastro para Teste: https://numvapt.com.br/acesso/cadastro",
    isActive: true,
    order: 1,
    updatedAt: DEFAULTS_UPDATED_AT,
  },
  {
    id: "topic_contrato",
    category: "contrato",
    title: "Garantia e Segurança Contratual",
    content:
      "• Contrato digital formal de 19 cláusulas com aceite consciente.\n• 7 dias de garantia incondicional Risco Zero (direito de arrependimento) com devolução de 100% do valor pago.\n• Pagamento via Cartão de Crédito na modalidade mensal recorrente (sem travar o limite total) ou Pix com liberação imediata.",
    isActive: true,
    order: 2,
    updatedAt: DEFAULTS_UPDATED_AT,
  },
  {
    id: "topic_empresa",
    category: "empresa",
    title: "Sobre a NumVapt e Funcionalidades",
    content:
      "A NumVapt é a plataforma inteligente que automatiza o marketing digital de empresas e empreendedores:\n- Cria posts profissionais com texto persuasivo, legendas e hashtags em segundos.\n- Gera fotos profissionais de produtos com Inteligência Artificial, preservando rótulo e embalagem originais.\n- Estúdio de Marca: criação e modernização de logomarcas, mockups e materiais de papelaria e ponto de venda.\n- Agendamento e publicação automática no Instagram, Facebook, LinkedIn, TikTok e Google Meu Negócio.\n- Criação e acompanhamento de campanhas de anúncios na Meta (Instagram e Facebook) e no Google Ads.\n- Relatórios de desempenho das redes e das campanhas.\n- Relacionamento: cadastro e gestão de leads e clientes.\n- Vitrine Digital automatizada para vendas.",
    isActive: true,
    order: 3,
    updatedAt: DEFAULTS_UPDATED_AT,
  },
  {
    id: "topic_atendimento",
    category: "duvidas",
    title: "Regra de Atendimento Humano",
    content:
      "Se o cliente solicitar expressamente falar com um atendente humano, suporte ou pessoa física, a Maia deve confirmar cordialmente que um consultor da equipe humana da NumVapt foi notificado e responderá por este mesmo número de WhatsApp em breve.",
    isActive: true,
    order: 4,
    updatedAt: DEFAULTS_UPDATED_AT,
  },
  {
    id: "topic_passo_a_passo",
    category: "funcionalidades",
    title: "Passo a Passo: Como Publicar e Agendar Posts (5 Etapas)",
    content:
      "Roteiro completo em 5 etapas para publicação no app da NumVapt:\n• Etapa 1: Ir na aba Posts (https://numvapt.com.br/dashboard/posts) no menu lateral e escolher o fluxo desejado (Manual ou IA).\n• Etapa 2: Adicionar foto/vídeo do celular/computador ou da Galeria (opção de retocar com Editor GPT para alterações com IA ou Editor Manual para retoques de pincel).\n• Etapa 3: Escrever legenda atrativa com gancho, chamada para ação, emojis e hashtags do nicho.\n• Etapa 4: Selecionar as redes sociais conectadas (Instagram, Facebook, LinkedIn, TikTok, Google Meu Negócio).\n• Etapa 5: Clicar em 'Publicar Agora' para postar na hora ou agendar data e hora no calendário.",
    isActive: true,
    order: 5,
    updatedAt: DEFAULTS_UPDATED_AT,
  },
  {
    id: "topic_cerebro",
    category: "funcionalidades",
    title: "Cérebro do Negócio e Configurações da Marca",
    content:
      "Como configurar o Cérebro do Negócio (https://numvapt.com.br/dashboard/configuracoes):\n• O Cérebro do Negócio calibra a inteligência artificial para que os posts tenham a identidade visual e o tom de voz autênticos da empresa.\n• Preencher: Nome Comercial, Categoria/Nicho, Descrição do Negócio, WhatsApp e Redes Sociais.\n• Identidade Visual: Upload das logomarcas (horizontal, vertical, símbolo, avatar) e paleta de cores primária e secundária.\n• Estratégia: Cadastro do Público-Alvo, Personas, Diferenciais Competitivos e Tom de Voz.\n• Brand Book com IA: Possibilidade de enviar o PDF da marca ou responder às perguntas do Vapti para preenchimento automático.\n• Regra de Ouro para Produtos: Instrução expressa para a IA preservar fielmente rótulo, embalagem, cores e proporção real de produtos físicos.",
    isActive: true,
    order: 6,
    updatedAt: DEFAULTS_UPDATED_AT,
  },
  {
    id: "topic_fluxos_criacao",
    category: "funcionalidades",
    title: "Os 5 Fluxos de Criação de Posts na NumVapt",
    content:
      "Na aba Posts (https://numvapt.com.br/dashboard/posts), o cliente conta com 5 formas especializadas de criar:\n1. Fluxo Manual: Para fotos ou vídeos próprios já prontos, com suporte ao Editor GPT (alterações com IA) e Editor Manual (retoques de pincel).\n2. Fluxo Conceito: Criação de campanhas institucionais e ideias de nicho a partir de temas livres.\n3. Fluxo Produto: Envio de foto real do produto para a IA criar cenários comerciais profissionais mantendo o rótulo e embalagem originais intactos.\n4. Fluxo Pessoa + Cenário: Combina a selfie/retrato da equipe com cenários de estúdio ou ambientes personalizados.\n5. Fluxo Geral: Geração aberta com suporte ao modo 'Identidade de Campanha', que replica o design system e estética de uma arte de referência.",
    isActive: true,
    order: 7,
    updatedAt: DEFAULTS_UPDATED_AT,
  },
  {
    id: "topic_recursos",
    category: "funcionalidades",
    title: "Recursos da Plataforma: Galeria, Aprovações e Redes Conectadas",
    content:
      "Outras ferramentas essenciais da plataforma:\n• Galeria de Mídias (https://numvapt.com.br/dashboard/galeria): Nuvem para salvar e baixar criativos em alta definição e criar posts com 1 clique.\n• Central de Aprovações (https://numvapt.com.br/dashboard/aprovacoes): Visualização de prévia e aprovação em 1 clique para clientes e gestores no modo Concierge.\n• Foto Profissional / Avatar IA (https://numvapt.com.br/dashboard/avatar): Fotos de estúdio e retratos corporativos a partir de selfies mantendo fidelidade facial rigorosa.\n• Conexões Sociais: Integração com Instagram, Facebook, LinkedIn, TikTok e Google Meu Negócio.",
    isActive: true,
    order: 8,
    updatedAt: DEFAULTS_UPDATED_AT,
  },
  {
    id: "topic_novidades",
    category: "novidades",
    title: "Novidades Recentes da Plataforma",
    content:
      "Novidades recentes da NumVapt (revisado em novembro de 2026):\n• Artes com pessoas: a IA alterna entre perfis diversos de empreendedores brasileiros, para que os posts representem o público real do negócio.\n• Produtos com rótulo preservado: no Fluxo Produto, embalagem, rótulo e cores originais são mantidos fielmente na arte final.\n• Logomarcas mais legíveis: logos horizontais com slogan são aplicadas em escala maior e com área de respiro.\n• Títulos com mais variedade visual: a IA alterna cores e faixas de destaque nos títulos das artes, sempre seguindo a paleta da marca.\nUse este tópico quando o cliente perguntar o que há de novo na plataforma.",
    isActive: true,
    order: 9,
    updatedAt: DEFAULTS_UPDATED_AT,
    channel: "ambos",
    audience: "todos",
    expiresAt: null,
  },
  {
    id: "topic_anuncios",
    category: "funcionalidades",
    title: "Anúncios na Meta e no Google",
    content:
      "Anúncios (https://numvapt.com.br/dashboard/anuncios):\n• Criação e gestão de campanhas na Meta (Instagram e Facebook) e no Google Ads direto pela NumVapt, sem precisar entrar no Gerenciador de Anúncios.\n• A IA sugere o público ideal com base no Cérebro do Negócio e estima o alcance antes de publicar.\n• É possível criar anúncios que levam o cliente direto para o WhatsApp da empresa.\n• Acompanhamento dos resultados com relatório detalhado por campanha e por criativo.\nIMPORTANTE: o valor investido nos anúncios (verba de mídia) NÃO está incluso na assinatura da NumVapt. Ele é cobrado diretamente pela Meta ou pelo Google, na forma de pagamento cadastrada na conta de anúncios do próprio cliente.",
    isActive: true,
    order: 10,
    updatedAt: DEFAULTS_UPDATED_AT,
    channel: "ambos",
    audience: "todos",
    expiresAt: null,
  },
  {
    id: "topic_relatorios",
    category: "funcionalidades",
    title: "Relatórios de Desempenho",
    content:
      "Relatórios (https://numvapt.com.br/dashboard/relatorios):\n• Painel com o desempenho das redes sociais conectadas e das campanhas de anúncios (Meta e Google Ads).\n• Ajuda o cliente a entender o que está funcionando e a decidir os próximos conteúdos e investimentos.",
    isActive: true,
    order: 11,
    updatedAt: DEFAULTS_UPDATED_AT,
    channel: "ambos",
    audience: "todos",
    expiresAt: null,
  },
  {
    id: "topic_relacionamento",
    category: "funcionalidades",
    title: "Relacionamento com Leads e Clientes",
    content:
      "Relacionamento (https://numvapt.com.br/dashboard/relacionamento):\n• Cadastro e gestão dos leads e clientes da empresa (nome, e-mail e WhatsApp).\n• Indicadores de total de contatos, leads ativos, taxa de abertura e conversão.",
    isActive: true,
    order: 12,
    updatedAt: DEFAULTS_UPDATED_AT,
    channel: "ambos",
    audience: "todos",
    expiresAt: null,
  },
  {
    id: "topic_estudio_marca",
    category: "funcionalidades",
    title: "Estúdio de Marca: Logos, Mockups e Papelaria",
    content:
      "Estúdio de Marca (https://numvapt.com.br/dashboard/estudio-marca):\n• Logo Studio: cria logomarcas profissionais do zero com IA (estilos minimalista, emblema, monograma, abstrato ou orgânico) ou moderniza um logo antigo de baixa qualidade.\n• Prévia do logo em fundo claro, escuro e transparente, com download em PNG de fundo transparente.\n• Mockups e materiais de papelaria e ponto de venda com a identidade visual da marca.",
    isActive: true,
    order: 13,
    updatedAt: DEFAULTS_UPDATED_AT,
    channel: "ambos",
    audience: "todos",
    expiresAt: null,
  },
  {
    id: "topic_requisitos_conexao",
    category: "suporte",
    title: "Requisitos para Conectar as Redes Sociais",
    content:
      "Requisitos para conectar as redes (em Configurações: https://numvapt.com.br/dashboard/configuracoes):\n• Instagram: a conta precisa ser Profissional (Comercial ou Criador de conteúdo). Contas pessoais não permitem publicação automática.\n• Facebook: é preciso ser administrador da Página da empresa.\n• Anúncios na Meta: é necessária uma conta de anúncios com forma de pagamento cadastrada.\n• Google Meu Negócio: o perfil da empresa precisa estar verificado no Google.",
    isActive: true,
    order: 14,
    updatedAt: DEFAULTS_UPDATED_AT,
    channel: "ambos",
    audience: "todos",
    expiresAt: null,
  },
  {
    id: "topic_problemas_comuns",
    category: "suporte",
    title: "Problemas Comuns e Como Resolver",
    content:
      "Problemas comuns de clientes e como orientar:\n• 'Meu post não foi publicado': confira o status do post em Posts (https://numvapt.com.br/dashboard/posts). Se aparecer falha, reconecte a rede em Configurações e publique novamente.\n• 'A conexão com a rede caiu': as redes pedem nova autorização de tempos em tempos. Basta reconectar a conta em Configurações (https://numvapt.com.br/dashboard/configuracoes).\n• 'A imagem não ficou como eu queria': gere uma nova versão ou use o Editor GPT para ajustar só a parte desejada, sem refazer a arte toda.\n• 'A arte não parece com a minha marca': complete o Cérebro do Negócio (logos, cores, fontes e tom de voz). Quanto mais completo, mais fiel o resultado.\n• Se o problema continuar, transfira para o atendimento humano.",
    isActive: true,
    order: 15,
    updatedAt: DEFAULTS_UPDATED_AT,
    channel: "ambos",
    audience: "cliente",
    expiresAt: null,
  },
  {
    id: "topic_objecoes",
    category: "duvidas",
    title: "Respostas para Objeções Frequentes",
    content:
      "Respostas para objeções de quem ainda não é cliente:\n• 'Já uso o Canva': no Canva a pessoa ainda cria, escreve e publica tudo sozinha. Na NumVapt a IA cria a arte e o texto com a identidade da marca, e o post já sai agendado nas redes.\n• 'Prefiro contratar uma agência': o plano Tudo Pronto entrega a execução feita pela nossa equipe, com o cliente apenas aprovando os posts, sem o custo de montar uma equipe própria.\n• 'A IA vai errar minha marca?': o Cérebro do Negócio guarda logos, cores, fontes e tom de voz, e o Fluxo Produto preserva rótulo e embalagem originais.\n• 'Não tenho tempo': os posts são criados em minutos e podem ser agendados para o mês inteiro.\n• 'E se eu não gostar?': há 7 dias de garantia com devolução de 100% do valor pago.",
    isActive: true,
    order: 16,
    updatedAt: DEFAULTS_UPDATED_AT,
    channel: "ambos",
    audience: "lead",
    expiresAt: null,
  },
  {
    id: "topic_carrossel",
    category: "funcionalidades",
    title: "Carrossel com IA (5 ou 7 Slides)",
    content:
      "[PREENCHER] Ative somente depois que o Carrossel com IA estiver publicado em produção; confirme o link abaixo e apague esta linha.\nCarrossel com IA (https://numvapt.com.br/dashboard/posts/gerar?mode=carousel):\n• Cria posts carrossel de 5 ou 7 slides no formato 1080×1350.\n• A capa é uma arte criada pela IA com uma chamada que prende a atenção; os demais slides desenvolvem o assunto da capa com o mesmo visual.\n• Ideal para dicas, listas passo a passo, comparativos e conteúdos educativos, que geram mais salvamentos e compartilhamentos.\n• O texto de cada slide pode ser editado livremente antes de publicar.\n• Publicação direta no Instagram como carrossel ou agendamento no calendário.",
    isActive: false,
    order: 17,
    updatedAt: DEFAULTS_UPDATED_AT,
    channel: "ambos",
    audience: "todos",
    expiresAt: null,
  },
  {
    id: "topic_teste_gratis",
    category: "planos",
    title: "Teste Grátis",
    content:
      "[PREENCHER] Duração do teste grátis, o que fica liberado durante o teste, se é preciso cartão para começar e o que acontece ao final do período.\nLink de cadastro: https://numvapt.com.br/acesso/cadastro",
    isActive: false,
    order: 18,
    updatedAt: DEFAULTS_UPDATED_AT,
    channel: "ambos",
    audience: "lead",
    expiresAt: null,
  },
  {
    id: "topic_limites_planos",
    category: "planos",
    title: "Limites e Recursos de Cada Plano",
    content:
      "[PREENCHER] Quantidade de posts e de imagens com IA por mês em cada plano, e se todos os planos têm os mesmos recursos (exceto a execução feita pela equipe no plano Tudo Pronto).",
    isActive: false,
    order: 19,
    updatedAt: DEFAULTS_UPDATED_AT,
    channel: "ambos",
    audience: "todos",
    expiresAt: null,
  },
  {
    id: "topic_cancelamento",
    category: "contrato",
    title: "Cancelamento e Privacidade dos Dados",
    content:
      "[PREENCHER] Como o cliente cancela a assinatura, o que acontece com os posts já agendados e com a galeria após o cancelamento, e como os dados são tratados (LGPD).",
    isActive: false,
    order: 20,
    updatedAt: DEFAULTS_UPDATED_AT,
    channel: "ambos",
    audience: "cliente",
    expiresAt: null,
  },
  {
    id: "topic_horario_suporte",
    category: "suporte",
    title: "Horário do Atendimento Humano",
    content:
      "[PREENCHER] Dias e horários do atendimento humano e prazo médio de resposta.\nCanal oficial: WhatsApp (51) 92004-4035 (https://wa.me/5551920044035).",
    isActive: false,
    order: 21,
    updatedAt: DEFAULTS_UPDATED_AT,
    channel: "ambos",
    audience: "todos",
    expiresAt: null,
  },
  {
    id: "topic_marketplace",
    category: "funcionalidades",
    title: "Marketplace de Módulos",
    content:
      "[PREENCHER] Confirme se os módulos do Marketplace (https://numvapt.com.br/dashboard/marketplace) já estão à venda, quais são e os preços. Atenção: a Maia bloqueia respostas que contenham alguns valores (por exemplo R$ 79) para evitar preços inventados; revise essa regra antes de ativar este tópico.",
    isActive: false,
    order: 22,
    updatedAt: DEFAULTS_UPDATED_AT,
    channel: "ambos",
    audience: "cliente",
    expiresAt: null,
  },
];

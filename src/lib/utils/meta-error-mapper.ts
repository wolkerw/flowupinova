export interface MappedMetaError {
  title: string;
  description: string;
  actionText?: string;
  isRecoverable: boolean;
  code?: number;
  subcode?: number;
}

export interface AccountStatusInfo {
  status: number;
  label: string;
  statusText: string;
  colorClass: string;
  badgeClass: string;
  isUsable: boolean;
  warningMessage?: string;
}

/**
 * Retorna informações amigáveis sobre o status de uma conta de anúncios da Meta.
 * Status da Meta:
 * 1 = ACTIVE (Ativa)
 * 2 = DISABLED (Desativada)
 * 3 = UNSETTLED (Pendente de pagamento / fatura em aberto)
 * 7 = PENDING_REVIEW (Em análise de segurança/política)
 * 9 = IN_GRACE_PERIOD (Período de carência de pagamento)
 * 100 = PENDING_CLOSURE (Em processo de encerramento)
 * 101 = CLOSED (Encerrada)
 */
export function getAccountStatusInfo(status?: number | null): AccountStatusInfo {
  const currentStatus = status ?? 1;

  switch (currentStatus) {
    case 1:
      return {
        status: 1,
        label: "Ativa",
        statusText: "🟢 Ativa",
        colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
        badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
        isUsable: true,
      };

    case 2:
      return {
        status: 2,
        label: "Desativada na Meta",
        statusText: "🔴 Desativada na Meta",
        colorClass: "text-red-700 bg-red-50 border-red-200",
        badgeClass: "bg-red-500/10 text-red-600 border-red-200",
        isUsable: false,
        warningMessage:
          "Esta conta de anúncios foi desativada pela Meta por inatividade ou violação de políticas. Para reativá-la, acesse o Gerenciador de Anúncios do Facebook.",
      };

    case 3:
      return {
        status: 3,
        label: "Pagamento Pendente",
        statusText: "⚠️ Pagamento Pendente na Meta",
        colorClass: "text-amber-800 bg-amber-50 border-amber-200",
        badgeClass: "bg-amber-500/10 text-amber-600 border-amber-200",
        isUsable: false,
        warningMessage:
          "Esta conta possui faturas pendentes ou forma de pagamento recusada no Facebook Ads. Regularize o pagamento no Facebook para veicular anúncios.",
      };

    case 7:
      return {
        status: 7,
        label: "Em Análise pela Meta",
        statusText: "⏳ Em Análise na Meta",
        colorClass: "text-blue-700 bg-blue-50 border-blue-200",
        badgeClass: "bg-blue-500/10 text-blue-600 border-blue-200",
        isUsable: false,
        warningMessage:
          "Esta conta de anúncios está sob análise de segurança ou de políticas pela equipe da Meta. Aguarde a liberação.",
      };

    case 9:
      return {
        status: 9,
        label: "Período de Carência",
        statusText: "⚠️ Carência de Pagamento",
        colorClass: "text-amber-800 bg-amber-50 border-amber-200",
        badgeClass: "bg-amber-500/10 text-amber-600 border-amber-200",
        isUsable: false,
        warningMessage:
          "A Meta identificou uma pendência na forma de pagamento e concedeu um prazo limite para regularização.",
      };

    case 100:
    case 101:
      return {
        status: currentStatus,
        label: "Encerrada",
        statusText: "🔴 Encerrada",
        colorClass: "text-slate-600 bg-slate-100 border-slate-200",
        badgeClass: "bg-slate-500/10 text-slate-600 border-slate-200",
        isUsable: false,
        warningMessage:
          "Esta conta de anúncios foi encerrada definitivamente. Por favor, selecione outra conta ativa.",
      };

    default:
      return {
        status: currentStatus,
        label: "Status Desconhecido",
        statusText: "⚪ Indisponível",
        colorClass: "text-slate-600 bg-slate-100 border-slate-200",
        badgeClass: "bg-slate-500/10 text-slate-600 border-slate-200",
        isUsable: true,
      };
  }
}

/**
 * Mapeia erros brutos da Meta Graph API (códigos, mensagens, objetos de erro)
 * para mensagens claras, amigáveis, não técnicas e orientadas à solução em Português.
 */
export function parseMetaError(error: any): MappedMetaError {
  if (!error) {
    return {
      title: "Erro Inesperado na Meta",
      description:
        "Ocorreu um erro temporário de comunicação com os servidores do Facebook. Por favor, tente novamente em alguns instantes.",
      actionText: "Tentar Novamente",
      isRecoverable: true,
    };
  }

  // Extrair propriedades de objeto de erro da Graph API ou objeto customizado
  const metaObj = error?.error || error;
  const code: number | undefined = typeof metaObj?.code === "number" ? metaObj.code : undefined;
  const subcode: number | undefined =
    typeof metaObj?.error_subcode === "number"
      ? metaObj.error_subcode
      : typeof metaObj?.subcode === "number"
        ? metaObj.subcode
        : undefined;

  const rawMsg: string =
    typeof error === "string"
      ? error
      : metaObj?.message || error?.message || metaObj?.error_user_msg || "";

  const lowerMsg = rawMsg.toLowerCase();

  // 1. Sessão Expirada / Token Inválido (Codes 190, 102)
  if (
    code === 190 ||
    code === 102 ||
    subcode === 460 ||
    subcode === 463 ||
    subcode === 467 ||
    lowerMsg.includes("session has expired") ||
    lowerMsg.includes("invalid oauth access token") ||
    lowerMsg.includes("token has expired")
  ) {
    if (subcode === 463 || subcode === 467) {
      return {
        title: "Senha do Facebook Alterada",
        description:
          "Como a senha da sua conta do Facebook foi alterada ou você encerrou as sessões ativas, a conexão com o NumVapt foi desativada por segurança.",
        actionText: "Reconectar Facebook",
        isRecoverable: true,
        code,
        subcode,
      };
    }
    return {
      title: "Sessão da Meta Expirada",
      description:
        "Sua autorização de acesso ao Facebook expirou por razões de segurança. Por favor, clique em 'Conectar Facebook' para renovar sua conexão.",
      actionText: "Renovar Conexão",
      isRecoverable: true,
      code,
      subcode,
    };
  }

  // 2. Permissão de Anúncios Não Concedida / Acesso Negado (Codes 200, 10, 272, 1885006)
  if (
    code === 200 ||
    code === 272 ||
    subcode === 1885006 ||
    lowerMsg.includes("permission") ||
    lowerMsg.includes("not authorized") ||
    lowerMsg.includes("does not have permissions") ||
    lowerMsg.includes("permissão")
  ) {
    return {
      title: "Permissão de Anúncios Não Concedida",
      description:
        "Durante o login no Facebook, a autorização de acesso às Contas de Anúncios ou Páginas não foi permitida. Reconecte garantindo que todas as caixas de permissões solicitadas estejam marcadas.",
      actionText: "Conectar e Conceder Permissão",
      isRecoverable: true,
      code,
      subcode,
    };
  }

  // 3. Rate Limit / Muitas Requisições na Meta (Codes 80004, 2446079, 17, 613)
  if (
    code === 80004 ||
    code === 17 ||
    code === 613 ||
    subcode === 2446079 ||
    lowerMsg.includes("too many calls") ||
    lowerMsg.includes("rate limit") ||
    lowerMsg.includes("user request limit reached")
  ) {
    return {
      title: "Limite de Consultas na Meta Atingido",
      description:
        "A Meta limitou temporariamente as consultas para esta conta devido ao volume de requisições. Aguarde cerca de 5 a 10 minutos para que o sistema do Facebook libere o acesso.",
      actionText: "Aguardar e Tentar Novamente",
      isRecoverable: true,
      code,
      subcode,
    };
  }

  // 4. Erros de Parâmetro ou Objeto Não Encontrado (Code 100)
  if (code === 100 || lowerMsg.includes("unsupported request") || lowerMsg.includes("does not exist")) {
    return {
      title: "Conta ou Página Não Localizada",
      description:
        "A conta de anúncios ou página selecionada não está mais acessível no seu perfil do Facebook Ads. Selecione outra conta válida ou reconecte sua integração.",
      actionText: "Verificar Seleção",
      isRecoverable: true,
      code,
      subcode,
    };
  }

  // 5. Conta de Anúncios Desativada ou com Restrição Financeira
  if (subcode === 1885050 || lowerMsg.includes("disabled ad account") || lowerMsg.includes("unsettled")) {
    return {
      title: "Conta de Anúncios Restrita na Meta",
      description:
        "Esta conta de anúncios possui pendências financeiras ou restrições administrativas registradas no Facebook Ads Manager. Acesse o painel da Meta para regularizar.",
      actionText: "Abrir Meta Business",
      isRecoverable: false,
      code,
      subcode,
    };
  }

  // 6. Nenhuma Conta de Anúncios Encontrada
  if (lowerMsg.includes("nenhuma conta") || lowerMsg.includes("no ad accounts")) {
    return {
      title: "Nenhuma Conta de Anúncios Encontrada",
      description:
        "Seu perfil no Facebook está autenticado, porém não possui vínculo de Administrador ou Anunciante com nenhuma conta de anúncios ativa no Meta Business Manager.",
      actionText: "Criar Conta na Meta",
      isRecoverable: true,
    };
  }

  // Mensagem genérica fallback com texto didático e polido
  return {
    title: "Atenção ao Conectar Meta Ads",
    description:
      rawMsg.length > 0 && rawMsg.length < 150
        ? `Não foi possível concluir a ação no Facebook: ${rawMsg}`
        : "Ocorreu uma instabilidade momentânea na integração com a Meta. Por favor, recarregue a página ou tente reconectar seu perfil do Facebook.",
    actionText: "Tentar Novamente",
    isRecoverable: true,
    code,
    subcode,
  };
}

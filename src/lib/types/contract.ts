export type SubscriptionPlanModalidade = "mensal" | "trimestral" | "semestral" | "anual";

export type PaymentMethodType = "pix" | "cartao_credito";

export interface ContractClause19Aceites {
  modalidadeEValor: boolean;
  prazoAcesso: boolean;
  valorTotalCiclo: boolean;
  descontosEBeneficios: boolean;
  desistencia7Dias: boolean;
  direitoArrependimento: boolean;
  regrasCancelamento: boolean;
  multaCompensatoria10: boolean;
  semPromessaResultado: boolean;
  politicaPrivacidade: boolean;
}

export interface ContractPartyInfo {
  nomeOuRazaoSocial: string;
  cpfOuCnpj: string;
  email: string;
}

export interface UserContractDoc {
  id: string;
  userId: string;
  userEmail: string;
  assinante: ContractPartyInfo;
  modalidade: SubscriptionPlanModalidade;
  valorMensalReferencia: number;
  valorTotalCiclo: number;
  periodoMeses: number;
  formaPagamento: PaymentMethodType;
  aceites: ContractClause19Aceites;
  signedAt: any;
  signedAtFormatted?: string;
  ipAddress?: string;
  userAgent?: string;
  contractVersion: string;
  status: "signed" | "active" | "cancelled";
  createdAt?: any;
}

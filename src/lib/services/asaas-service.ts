/**
 * Serviço de Integração com o Gateway de Pagamento Asaas (v3)
 * Documentação: https://docs.asaas.com/
 */

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
}

export interface CreatePaymentLinkParams {
  name: string;
  description?: string;
  value: number;
  billingType?: "CREDIT_CARD" | "PIX" | "BOLETO" | "UNDEFINED";
  chargeType?: "DETACHED" | "INSTALLMENT" | "RECURRENT";
  subscriptionCycle?: "MONTHLY" | "WEEKLY" | "BIWEEKLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY";
  maxInstallmentCount?: number;
  dueDateLimitDays?: number;
  externalReference?: string;
  notificationEnabled?: boolean;
}

export interface AsaasPaymentLinkResponse {
  id: string;
  name: string;
  value: number;
  active: boolean;
  chargeType: string;
  url: string;
  billingType: string;
  description?: string;
  maxInstallmentCount?: number;
  externalReference?: string;
}

export interface AsaasWebhookPayment {
  id: string;
  customer: string;
  dateCreated: string;
  dueDate: string;
  value: number;
  netValue: number;
  billingType: "CREDIT_CARD" | "PIX" | "BOLETO" | string;
  status:
    | "PENDING"
    | "RECEIVED"
    | "CONFIRMED"
    | "OVERDUE"
    | "REFUNDED"
    | "RECEIVED_IN_CASH"
    | "REFUND_REQUESTED"
    | "CHARGEBACK_REQUESTED"
    | "CHARGEBACK_DISPUTE"
    | "AWAITING_CHARGEBACK_REVERSAL"
    | "DUNNING_REQUESTED"
    | "DUNNING_RECEIVED"
    | "AWAITING_RISK_ANALYSIS";
  paymentLink?: string;
  externalReference?: string;
  installment?: string;
  creditCard?: {
    creditCardNumber?: string;
    creditCardBrand?: string;
    creditCardToken?: string;
  };
}

export interface AsaasWebhookPayload {
  id?: string;
  event:
    | "PAYMENT_CREATED"
    | "PAYMENT_AWAITING_RISK_ANALYSIS"
    | "PAYMENT_APPROVED_BY_RISK_ANALYSIS"
    | "PAYMENT_REPROVED_BY_RISK_ANALYSIS"
    | "PAYMENT_UPDATED"
    | "PAYMENT_CONFIRMED"
    | "PAYMENT_RECEIVED"
    | "PAYMENT_ANTICIPATED"
    | "PAYMENT_OVERDUE"
    | "PAYMENT_DELETED"
    | "PAYMENT_RESTORED"
    | "PAYMENT_REFUNDED"
    | "PAYMENT_PARTIALLY_REFUNDED"
    | "PAYMENT_REFUND_IN_PROGRESS"
    | "PAYMENT_RECEIVED_IN_CASH_UNDONE"
    | "PAYMENT_CHARGEBACK_REQUESTED"
    | "PAYMENT_CHARGEBACK_DISPUTE"
    | "PAYMENT_AWAITING_CHARGEBACK_REVERSAL"
    | "PAYMENT_DUNNING_RECEIVED"
    | "PAYMENT_DUNNING_REQUESTED"
    | "PAYMENT_BANK_SLIP_VIEWED"
    | "PAYMENT_CHECKOUT_VIEWED";
  dateCreated?: string;
  payment: AsaasWebhookPayment;
}

export class AsaasService {
  private static getApiKey(): string {
    const key = process.env.ASAAS_API_KEY || "";
    if (!key) {
      console.warn("[ASAAS_SERVICE] Chave ASAAS_API_KEY não configurada no ambiente.");
    }
    return key;
  }

  private static getApiUrl(): string {
    return process.env.ASAAS_API_URL || "https://api.asaas.com/v3";
  }

  /**
   * Executa requisição autenticada à API v3 do Asaas
   */
  private static async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<{ ok: boolean; status: number; data: T }> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getApiUrl().replace(/\/$/, "");
    const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

    const headers: Record<string, string> = {
      access_token: apiKey,
      "User-Agent": "NumVapt-App",
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const text = await response.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    } catch (error: any) {
      console.error(`[ASAAS_SERVICE_ERROR] Falha na requisição para ${path}:`, error.message);
      throw error;
    }
  }

  /**
   * Localiza um cliente pelo e-mail ou CPF/CNPJ
   */
  static async findCustomer(query: { email?: string; cpfCnpj?: string }): Promise<AsaasCustomer | null> {
    if (!query.email && !query.cpfCnpj) return null;

    let path = "/customers?";
    if (query.email) path += `email=${encodeURIComponent(query.email)}&`;
    if (query.cpfCnpj) path += `cpfCnpj=${encodeURIComponent(query.cpfCnpj)}&`;

    const res = await this.request<{ data: AsaasCustomer[] }>(path);
    if (res.ok && res.data?.data && res.data.data.length > 0) {
      return res.data.data[0];
    }
    return null;
  }

  /**
   * Cria ou obtém cliente no Asaas
   */
  static async findOrCreateCustomer(customerData: {
    name: string;
    email: string;
    cpfCnpj?: string;
    phone?: string;
    externalReference?: string;
  }): Promise<AsaasCustomer> {
    const existing = await this.findCustomer({
      email: customerData.email,
      cpfCnpj: customerData.cpfCnpj,
    });

    if (existing) {
      return existing;
    }

    const res = await this.request<AsaasCustomer>("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: customerData.name,
        email: customerData.email,
        cpfCnpj: customerData.cpfCnpj,
        phone: customerData.phone,
        mobilePhone: customerData.phone,
        externalReference: customerData.externalReference,
        notificationDisabled: false,
      }),
    });

    if (!res.ok) {
      console.error("[ASAAS_SERVICE] Erro ao criar cliente:", res.data);
      throw new Error((res.data as any)?.errors?.[0]?.description || "Falha ao criar cliente no Asaas");
    }

    return res.data;
  }

  /**
   * Cria um link de pagamento (PaymentLink) com suporte a cartão de crédito e parcelamento
   */
  static async createPaymentLink(params: CreatePaymentLinkParams): Promise<AsaasPaymentLinkResponse> {
    const payload: any = {
      name: params.name,
      description: params.description,
      value: params.value,
      billingType: params.billingType || "CREDIT_CARD",
      chargeType: params.chargeType || "DETACHED",
      maxInstallmentCount: params.maxInstallmentCount || 1,
      dueDateLimitDays: params.dueDateLimitDays || 3,
      externalReference: params.externalReference,
      notificationEnabled: params.notificationEnabled ?? true,
    };

    if (params.subscriptionCycle) {
      payload.subscriptionCycle = params.subscriptionCycle;
    }

    const res = await this.request<AsaasPaymentLinkResponse>("/paymentLinks", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("[ASAAS_SERVICE] Erro ao criar link de pagamento:", res.data);
      throw new Error((res.data as any)?.errors?.[0]?.description || "Falha ao criar link de pagamento no Asaas");
    }

    return res.data;
  }

  /**
   * Busca detalhes de um pagamento pelo ID
   */
  static async getPayment(paymentId: string): Promise<AsaasWebhookPayment> {
    const res = await this.request<AsaasWebhookPayment>(`/payments/${paymentId}`);
    if (!res.ok) {
      throw new Error(`Falha ao obter pagamento ${paymentId} do Asaas`);
    }
    return res.data;
  }

  /**
   * Configuração de valores e parcelas oficiais para cada plano
   */
  static getPlanConfig(plan: "mensal" | "trimestral" | "semestral" | "anual" | "anual_recorrente") {
    switch (plan) {
      case "mensal":
        return {
          name: "NumVapt Pro - Plano Mensal",
          description: "Assinatura Mensal da plataforma NumVapt com todas as ferramentas de IA e marketing liberadas.",
          totalValue: 490.0,
          installmentCount: 1,
          chargeType: "DETACHED" as const,
          durationDays: 30,
        };
      case "trimestral":
        return {
          name: "NumVapt Pro - Plano Trimestral",
          description: "Assinatura Trimestral NumVapt (10% OFF). Parcele em até 3x de R$ 441,00 sem juros no cartão.",
          totalValue: 1323.0,
          installmentCount: 3,
          chargeType: "INSTALLMENT" as const,
          durationDays: 90,
        };
      case "semestral":
        return {
          name: "NumVapt Pro - Plano Semestral",
          description: "Assinatura Semestral NumVapt (15% OFF). Parcele em até 6x de R$ 416,50 sem juros no cartão.",
          totalValue: 2499.0,
          installmentCount: 6,
          chargeType: "INSTALLMENT" as const,
          durationDays: 180,
        };
      case "anual":
      case "anual_recorrente":
        return {
          name: "NumVapt Pro - Plano Anual (Cobrança Mensal + 1 Mês Grátis)",
          description: "Benefícios completos do plano anual com cobrança de apenas R$ 400,00 por mês no cartão, sem comprometer o limite total (+ 1 mês grátis)!",
          totalValue: 400.0,
          installmentCount: 1,
          chargeType: "RECURRENT" as const,
          subscriptionCycle: "MONTHLY" as const,
          durationDays: 30, // Renovado a cada mensalidade de R$ 400
        };
    }
  }
}

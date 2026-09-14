import { describe, it, expect, vi, beforeEach } from "vitest";
import { AsaasService } from "../asaas-service";

describe("AsaasService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      ASAAS_API_KEY: "test_asaas_key_123",
      ASAAS_API_URL: "https://api.asaas.com/v3",
    };
  });

  describe("getPlanConfig", () => {
    it("retorna as configurações corretas para o plano Mensal", () => {
      const config = AsaasService.getPlanConfig("mensal");
      expect(config.name).toContain("Mensal");
      expect(config.totalValue).toBe(490.0);
      expect(config.installmentCount).toBe(1);
      expect(config.chargeType).toBe("DETACHED");
      expect(config.durationDays).toBe(30);
    });

    it("retorna as configurações corretas para o plano Trimestral com até 3 parcelas", () => {
      const config = AsaasService.getPlanConfig("trimestral");
      expect(config.name).toContain("Trimestral");
      expect(config.totalValue).toBe(1323.0);
      expect(config.installmentCount).toBe(3);
      expect(config.chargeType).toBe("INSTALLMENT");
      expect(config.durationDays).toBe(90);
    });

    it("retorna as configurações corretas para o plano Semestral com até 6 parcelas", () => {
      const config = AsaasService.getPlanConfig("semestral");
      expect(config.name).toContain("Semestral");
      expect(config.totalValue).toBe(2499.0);
      expect(config.installmentCount).toBe(6);
      expect(config.chargeType).toBe("INSTALLMENT");
      expect(config.durationDays).toBe(180);
    });

    it("retorna as configurações corretas para o plano Anual com até 12 parcelas e 13 meses", () => {
      const config = AsaasService.getPlanConfig("anual");
      expect(config.name).toContain("Anual");
      expect(config.totalValue).toBe(4800.0);
      expect(config.installmentCount).toBe(12);
      expect(config.chargeType).toBe("INSTALLMENT");
      expect(config.durationDays).toBe(395);
    });
  });

  describe("createPaymentLink", () => {
    it("envia os dados corretos para a API do Asaas e retorna o link gerado", async () => {
      const mockResponse = {
        id: "link_test_123",
        name: "NumVapt Pro - Plano Anual",
        value: 4800,
        active: true,
        url: "https://www.asaas.com/c/link_test_123",
        billingType: "CREDIT_CARD",
        chargeType: "INSTALLMENT",
        maxInstallmentCount: 12,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await AsaasService.createPaymentLink({
        name: "NumVapt Pro - Plano Anual",
        value: 4800,
        chargeType: "INSTALLMENT",
        maxInstallmentCount: 12,
        externalReference: "user123:anual",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.asaas.com/v3/paymentLinks",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            access_token: "test_asaas_key_123",
            "User-Agent": "NumVapt-App",
          }),
        })
      );
      expect(result.url).toBe("https://www.asaas.com/c/link_test_123");
      expect(result.id).toBe("link_test_123");
    });
  });
});

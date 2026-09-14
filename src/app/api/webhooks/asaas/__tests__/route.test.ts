import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

const mockUserSet = vi.fn().mockResolvedValue({});
const mockTransSet = vi.fn().mockResolvedValue({});
const mockUserDoc = {
  set: mockUserSet,
  get: vi.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
};
const mockTransDoc = { set: mockTransSet };

vi.mock("@/lib/firebase-admin", () => ({
  admin: {
    firestore: {
      FieldValue: {
        serverTimestamp: () => "mock-timestamp",
      },
      Timestamp: {
        fromDate: (date: Date) => ({ toDate: () => date, toISOString: () => date.toISOString() }),
      },
    },
  },
  adminDb: {
    collection: vi.fn((collName: string) => ({
      doc: vi.fn((docId: string) => {
        if (collName === "users") return mockUserDoc;
        return mockTransDoc;
      }),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
    })),
  },
}));

describe("Asaas Webhook Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ASAAS_WEBHOOK_TOKEN = "test_webhook_token";
  });

  it("recusa requisição com token de webhook inválido", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/asaas", {
      method: "POST",
      headers: {
        "asaas-access-token": "token_errado",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event: "PAYMENT_RECEIVED", payment: { id: "pay_1" } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("processa PAYMENT_RECEIVED e ativa o usuário como Pro", async () => {
    const payload = {
      event: "PAYMENT_RECEIVED",
      payment: {
        id: "pay_xyz_999",
        customer: "cus_12345",
        value: 4800,
        netValue: 4700,
        billingType: "CREDIT_CARD",
        status: "RECEIVED",
        externalReference: "user_test_abc:anual:1700000000000",
        creditCard: {
          creditCardBrand: "MASTERCARD",
        },
      },
    };

    const req = new NextRequest("http://localhost:3000/api/webhooks/asaas", {
      method: "POST",
      headers: {
        "asaas-access-token": "test_webhook_token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.paymentId).toBe("pay_xyz_999");

    // Verifica se o usuário foi ativado como PRO
    expect(mockUserSet).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "pro",
        subscriptionStatus: "active",
        subscriptionPlan: "anual",
      }),
      { merge: true }
    );

    // Verifica se a transação foi aprovada
    expect(mockTransSet).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "asaas_pay_xyz_999",
        status: "approved",
        gateway: "asaas",
        plan: "anual",
      }),
      { merge: true }
    );
  });

  it("processa PAYMENT_REFUNDED e desativa a assinatura do usuário", async () => {
    const payload = {
      event: "PAYMENT_REFUNDED",
      payment: {
        id: "pay_refund_123",
        customer: "cus_12345",
        value: 490,
        externalReference: "user_test_abc:mensal:1700000000000",
      },
    };

    const req = new NextRequest("http://localhost:3000/api/webhooks/asaas", {
      method: "POST",
      headers: {
        "asaas-access-token": "test_webhook_token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockUserSet).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "free",
        subscriptionStatus: "inactive",
      }),
      { merge: true }
    );
  });

  it("processa PAYMENT_RECEIVED para plano anual_recorrente e define billingCycle monthly_recurrent", async () => {
    const payload = {
      event: "PAYMENT_RECEIVED",
      payment: {
        id: "pay_rec_400",
        customer: "cus_12345",
        value: 400,
        netValue: 390,
        billingType: "CREDIT_CARD",
        status: "RECEIVED",
        externalReference: "user_test_abc:anual_recorrente:1700000000000",
      },
    };

    const req = new NextRequest("http://localhost:3000/api/webhooks/asaas", {
      method: "POST",
      headers: {
        "asaas-access-token": "test_webhook_token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockUserSet).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "pro",
        subscriptionStatus: "active",
        subscriptionPlan: "anual",
        billingCycle: "monthly_recurrent",
      }),
      { merge: true }
    );
  });
});

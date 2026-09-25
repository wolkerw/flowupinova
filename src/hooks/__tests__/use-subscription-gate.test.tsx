import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSubscriptionGate } from "../use-subscription-gate";

// Mocks estáticos
const mockToast = vi.fn();
let mockUser: { uid: string; email: string } | null = { uid: "user-123", email: "teste@flowup.com" };
let mockFirestoreData: Record<string, any> = { plan: "mensal", paymentStatus: "active" };

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn().mockReturnValue({ id: "user-123" }),
  onSnapshot: vi.fn((_docRef, onNext) => {
    setTimeout(() => {
      onNext({
        exists: () => Boolean(mockFirestoreData),
        data: () => mockFirestoreData,
      });
    }, 0);
    return () => {};
  }),
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

describe("useSubscriptionGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { uid: "user-123", email: "teste@flowup.com" };
    mockFirestoreData = { plan: "mensal", paymentStatus: "active" };
  });

  it("retorna isSubscribed = true quando usuário tem plano pago e ativo", async () => {
    const { result } = renderHook(() => useSubscriptionGate());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.userPlan).toBe("mensal");
    expect(result.current.paymentStatus).toBe("active");

    const allowed = result.current.checkSubscriptionOrPrompt("criar um post");
    expect(allowed).toBe(true);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("retorna isSubscribed = false e dispara modal quando usuário tem plano free", async () => {
    mockFirestoreData = { plan: "free", paymentStatus: "inactive" };

    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

    const { result } = renderHook(() => useSubscriptionGate());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.userPlan).toBe("free");

    const allowed = result.current.checkSubscriptionOrPrompt("conectar redes sociais");
    expect(allowed).toBe(false);
    expect(dispatchEventSpy).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Recurso Exclusivo para Assinantes",
        description: expect.stringContaining("conectar redes sociais"),
      })
    );
  });

  it("retorna isSubscribed = false quando usuário não está logado", async () => {
    mockUser = null;

    const { result } = renderHook(() => useSubscriptionGate());

    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.userPlan).toBe("free");
  });
});

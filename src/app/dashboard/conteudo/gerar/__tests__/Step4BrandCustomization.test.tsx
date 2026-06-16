import React from "react";
import { render, screen } from "@testing-library/react";
import { Step4BrandCustomization } from "../_components/Step4BrandCustomization";
import { WizardProvider } from "../context/WizardContext";

// Mocking dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}));

vi.mock("@/components/auth/auth-provider", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    user: { uid: "test-user-123", email: "test@example.com" },
    loading: false,
    loginWithEmail: vi.fn().mockResolvedValue(undefined),
    signUpWithEmail: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("Step4BrandCustomization", () => {
  it("renders correctly with provider", () => {
    render(
      <WizardProvider>
        <Step4BrandCustomization />
      </WizardProvider>
    );
  });
});

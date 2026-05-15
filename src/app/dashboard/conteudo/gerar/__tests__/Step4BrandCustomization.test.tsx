import React from "react";
import { render, screen } from "@testing-library/react";
import { Step4BrandCustomization } from "../_components/Step4BrandCustomization";
import { WizardProvider } from "../context/WizardContext";

// Mocking dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn().mockReturnValue(null) }),
}));

jest.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({ user: { uid: "test-user-123" } }),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
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

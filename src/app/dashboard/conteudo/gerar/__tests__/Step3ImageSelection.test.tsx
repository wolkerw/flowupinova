import React from "react";
import { render, screen } from "@testing-library/react";
import { Step3ImageSelection } from "../_components/Step3ImageSelection";
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

describe("Step3ImageSelection", () => {
  it("renders correctly with provider", () => {
    render(
      <WizardProvider>
        <Step3ImageSelection />
      </WizardProvider>
    );
  });
});

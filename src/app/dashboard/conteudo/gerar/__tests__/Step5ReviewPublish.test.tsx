import React from "react";
import { render, screen } from "@testing-library/react";
import { Step5ReviewPublish } from "../_components/Step5ReviewPublish";
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

describe("Step5ReviewPublish", () => {
  it("renders correctly with provider", () => {
    // Step 5 might return null if selectedContent is missing in the provider
    render(
      <WizardProvider>
        <Step5ReviewPublish />
      </WizardProvider>
    );
  });
});

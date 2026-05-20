import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Step1Idea } from "../_components/Step1Idea";
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

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("Step1Idea Component", () => {
  it("renders correctly and allows typing an idea", () => {
    render(
      <WizardProvider>
        <Step1Idea />
      </WizardProvider>
    );

    const textarea = screen.getByPlaceholderText(/Ex: Criar um post sobre/i);
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "Minha ideia de post" } });
    expect(textarea).toHaveValue("Minha ideia de post");
  });

  it("disables advance button when empty", () => {
    render(
      <WizardProvider>
        <Step1Idea />
      </WizardProvider>
    );

    const button = screen.getByRole("button", { name: /Avançar/i });
    expect(button).toBeDisabled();
  });
});

import React from "react";
import { render, act, screen } from "@testing-library/react";
import { WizardProvider, useWizard } from "../context/WizardContext";

// Mocking dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn().mockReturnValue("concept") }), // Mocking search params
}));

jest.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({ user: { uid: "test-user-123" } }),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock("@/lib/services/posts-service", () => ({
  schedulePost: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("@/lib/services/meta-service", () => ({
  getMetaConnection: jest.fn().mockResolvedValue({ isConnected: true }),
}));

jest.mock("@/lib/services/instagram-service", () => ({
  getInstagramConnection: jest.fn().mockResolvedValue({ isConnected: true }),
}));

jest.mock("@/lib/services/business-profile-service", () => ({
  getBusinessProfile: jest.fn().mockResolvedValue({ name: "Test Business" }),
}));

jest.mock("@/lib/services/user-data-service", () => ({
  getUnusedImages: jest.fn().mockResolvedValue([]),
  saveUnusedImages: jest.fn().mockResolvedValue(true),
  getContentHistory: jest.fn().mockResolvedValue([]),
  saveContentHistory: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/lib/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn().mockResolvedValue({ id: "test-post-id" }),
  serverTimestamp: jest.fn(),
}));

const TestComponent = () => {
  const { step, setStep, postSummary, setPostSummary } = useWizard();
  return (
    <div>
      <span data-testid="step">{step}</span>
      <span data-testid="summary">{postSummary}</span>
      <button onClick={() => setStep(2)}>Next Step</button>
      <button onClick={() => setPostSummary("New Idea")}>Set Summary</button>
    </div>
  );
};

describe("WizardContext", () => {
  it("provides initial state and allows updates", async () => {
    render(
      <WizardProvider>
        <TestComponent />
      </WizardProvider>
    );

    expect(screen.getByTestId("step")).toHaveTextContent("1");
    
    await act(async () => {
      screen.getByText("Next Step").click();
    });
    
    expect(screen.getByTestId("step")).toHaveTextContent("2");

    await act(async () => {
      screen.getByText("Set Summary").click();
    });
    
    expect(screen.getByTestId("summary")).toHaveTextContent("New Idea");
  }, 30000);
});

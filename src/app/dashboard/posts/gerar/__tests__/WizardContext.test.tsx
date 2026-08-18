import React from "react";
import { render, act, screen } from "@testing-library/react";
import { WizardProvider, useWizard } from "../context/WizardContext";
import { vi, describe, it, expect } from "vitest";

// Mocking dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue("concept") }),
}));

const mockUser = { uid: "test-user-123", email: "test@example.com" };
const mockAuth = {
  user: mockUser,
  loading: false,
  loginWithEmail: vi.fn().mockResolvedValue(undefined),
  signUpWithEmail: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/components/auth/auth-provider", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => mockAuth,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/services/posts-service", () => ({
  schedulePost: vi.fn().mockResolvedValue({ success: true }),
  deletePost: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/services/meta-service", () => ({
  getMetaConnection: vi.fn().mockResolvedValue({ isConnected: true }),
}));

vi.mock("@/lib/services/instagram-service", () => ({
  getInstagramConnection: vi.fn().mockResolvedValue({ isConnected: true }),
}));

vi.mock("@/lib/services/onboarding-service", () => ({
  getOnboardingProfile: vi.fn().mockResolvedValue({
    name: "Test Business",
    category: "",
    address: "",
    phone: "",
    website: "",
    instagram: "",
    description: "",
    logo: { url: "" },
    primaryColor: "#3b82f6",
    secondaryColor: "#1e293b",
    onboardingCompleted: true,
  }),
  updateOnboardingProfile: vi.fn().mockResolvedValue(undefined),
  resetOnboardingProfile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/services/user-data-service", () => ({
  getUnusedImages: vi.fn().mockResolvedValue([]),
  saveUnusedImages: vi.fn().mockResolvedValue(true),
  getContentHistory: vi.fn().mockResolvedValue([]),
  saveContentHistory: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
  storage: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: "test-post-id" }),
  serverTimestamp: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  arrayUnion: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}));

const TestComponent = () => {
  const { step, setStep, postSummary, setPostSummary, layoutStyle, setLayoutStyle, insertTextOnImage, setInsertTextOnImage } = useWizard();
  return (
    <div>
      <span data-testid="step">{step}</span>
      <span data-testid="summary">{postSummary}</span>
      <span data-testid="layout-style">{layoutStyle}</span>
      <span data-testid="insert-text">{String(insertTextOnImage)}</span>
      <button onClick={() => setStep(2)}>Next Step</button>
      <button onClick={() => setPostSummary("New Idea")}>Set Summary</button>
      <button onClick={() => setLayoutStyle("CINEMATIC")}>Set Cinematic</button>
      <button onClick={() => setInsertTextOnImage(false)}>Disable Insert Text</button>
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
    expect(screen.getByTestId("layout-style")).toHaveTextContent("");
    expect(screen.getByTestId("insert-text")).toHaveTextContent("true");

    await act(async () => {
      screen.getByText("Next Step").click();
    });

    expect(screen.getByTestId("step")).toHaveTextContent("2");

    await act(async () => {
      screen.getByText("Set Summary").click();
    });

    expect(screen.getByTestId("summary")).toHaveTextContent("New Idea");

    await act(async () => {
      screen.getByText("Set Cinematic").click();
    });

    expect(screen.getByTestId("layout-style")).toHaveTextContent("CINEMATIC");

    await act(async () => {
      screen.getByText("Disable Insert Text").click();
    });

    expect(screen.getByTestId("insert-text")).toHaveTextContent("false");
  });
});

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PlannerPage from "../page";

const mockAuth = {
  user: { uid: "user-123", email: "teste@numvapt.com" },
  loading: false,
};

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => mockAuth,
}));

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, fill, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt || ""} {...props} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockGetScheduledPosts = vi.fn();
vi.mock("@/lib/services/posts-service", () => ({
  getScheduledPosts: (...args: any[]) => mockGetScheduledPosts(...args),
  deletePost: vi.fn(),
  updateScheduledPost: vi.fn(),
  publishScheduledPostNow: vi.fn(),
  schedulePost: vi.fn(),
}));

vi.mock("@/lib/services/meta-service", () => ({
  getMetaConnection: vi.fn().mockResolvedValue({ isConnected: false }),
}));
vi.mock("@/lib/services/instagram-service", () => ({
  getInstagramConnection: vi.fn().mockResolvedValue({ isConnected: false }),
}));
vi.mock("@/lib/services/google-service", () => ({
  getGoogleConnection: vi.fn().mockResolvedValue({ isConnected: false }),
}));
vi.mock("@/lib/services/linkedin-service", () => ({
  getLinkedInConnection: vi.fn().mockResolvedValue({ isConnected: false }),
}));
vi.mock("@/lib/services/tiktok-service", () => ({
  getTikTokConnection: vi.fn().mockResolvedValue({ isConnected: false }),
}));

describe("PlannerPage (/dashboard/planner)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o Planner de Agendamentos e o Histórico de Posts separadamente", async () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 86400000 * 2);
    const pastDate = new Date(now.getTime() - 3600000);

    mockGetScheduledPosts.mockResolvedValueOnce([
      {
        success: true,
        post: {
          id: "sched-1",
          text: "Post agendado para a próxima campanha",
          status: "scheduled",
          scheduledAt: futureDate.toISOString(),
          platforms: ["instagram"],
          imageUrl: "https://example.com/future.jpg",
        },
      },
      {
        success: true,
        post: {
          id: "pub-1",
          text: "Post já publicado no histórico",
          status: "published",
          scheduledAt: pastDate.toISOString(),
          platforms: ["facebook"],
          imageUrl: "https://example.com/past.jpg",
        },
      },
    ]);

    render(<PlannerPage />);

    expect(
      screen.getByRole("heading", { name: /Planner de Agendamentos/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText("Histórico de Posts")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Criar Novo Post/i })).toHaveAttribute(
      "href",
      "/dashboard/posts"
    );

    await waitFor(() => {
      expect(screen.getByText("Post agendado para a próxima campanha")).toBeInTheDocument();
      expect(screen.getByText("Post já publicado no histórico")).toBeInTheDocument();
    });
  });

  it("exibe estados vazios quando não há posts agendados nem no histórico", async () => {
    mockGetScheduledPosts.mockResolvedValueOnce([]);

    render(<PlannerPage />);

    await waitFor(() => {
      expect(screen.getByText("Nenhum post agendado no momento")).toBeInTheDocument();
      expect(screen.getByText("Nenhuma publicação encontrada no histórico.")).toBeInTheDocument();
    });
  });
});

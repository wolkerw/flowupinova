"use client";

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AdminConteudoPage from "../page";
import { vi, describe, it, expect } from "vitest";

const mockObserver = {
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
};
global.ResizeObserver = vi.fn().mockImplementation(() => mockObserver);

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

const mockUsersData = {
  users: [
    {
      uid: "user-1",
      email: "teste@numvapt.com",
      displayName: "Usuário Teste",
      imagesCount: 15,
      postsCount: 10,
    },
  ],
};

const mockStatsData = {
  stats: {
    totalImagesGenerated: 45,
    totalPostsPublished: 30,
    totalPostsFailed: 2,
  },
};

const mockPostsData = {
  posts: [
    {
      id: "post-1",
      userId: "user-1",
      text: "Post de teste incrível",
      imageUrl: "https://example.com/image.jpg",
      imageUrls: ["https://example.com/image.jpg"],
      status: "published",
      platforms: ["instagram"],
      createdAt: "2026-07-25T10:00:00Z",
      scheduledAt: null,
      publishedAt: "2026-07-25T10:00:00Z",
      failureReason: null,
    },
  ],
};

const mockDailyStatsData = {
  stats: [{ date: "25/07/2026", geracoes: 10 }],
  total: 10,
};

global.fetch = vi.fn().mockImplementation((url: string) => {
  let responseData = {};
  if (url.includes("/api/admin/users")) responseData = mockUsersData;
  else if (url.includes("/api/admin/stats")) responseData = mockStatsData;
  else if (url.includes("/api/admin/posts")) responseData = mockPostsData;
  else if (url.includes("/api/admin/daily-stats")) responseData = mockDailyStatsData;

  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(responseData),
  });
});

describe("AdminConteudoPage", () => {
  it("renders the content dashboard, period filter (30D default), and header", async () => {
    render(<AdminConteudoPage />);

    await waitFor(() => {
      expect(screen.getByText("Conteúdo Gerado")).toBeInTheDocument();
    });

    expect(screen.getByText("30D")).toBeInTheDocument();
    expect(screen.getByText("7D")).toBeInTheDocument();
    expect(screen.getByText("24h")).toBeInTheDocument();
  });

  it("handles period button click and refresh button click", async () => {
    render(<AdminConteudoPage />);

    await waitFor(() => {
      expect(screen.getByText("Conteúdo Gerado")).toBeInTheDocument();
    });

    const button7D = screen.getByText("7D");
    fireEvent.click(button7D);

    const refreshBtn = screen.getByText("Atualizar");
    fireEvent.click(refreshBtn);
  });

  it("handles daily stats filters (year, month, day)", async () => {
    render(<AdminConteudoPage />);

    await waitFor(() => {
      expect(screen.getByText("Histórico de Gerações por Dia")).toBeInTheDocument();
    });

    const selects = screen.getAllByRole("combobox");
    if (selects.length >= 3) {
      fireEvent.change(selects[0], { target: { value: "15" } });
      fireEvent.change(selects[1], { target: { value: "05" } });
      fireEvent.change(selects[2], { target: { value: "2026" } });
    }
  });

  it("handles tab switching between Painel Geral and Explorar Gerações", async () => {
    render(<AdminConteudoPage />);

    await waitFor(() => {
      expect(screen.getByText("Conteúdo Gerado")).toBeInTheDocument();
    });

    const exploreTab = screen.getByText(/Explorar Gerações/i);
    fireEvent.click(exploreTab);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Pesquisar por legenda/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Pesquisar por legenda/i);
    fireEvent.change(searchInput, { target: { value: "Post de teste" } });
  });
});

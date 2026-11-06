import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminInstagramPage from "../page";

const mockChats = [
  {
    id: "1273295114888232",
    senderId: "1273295114888232",
    username: "luizfernando",
    contactName: "Luiz Fernando Gonçalves",
    lastMessageText: "Mas quanto custa por mês?",
    lastMessageAt: "2026-09-21T21:19:00Z",
    aiEnabled: true,
    humanTakeover: false,
    status: "active",
  },
];

const mockMessages = [
  {
    id: "msg-user-1",
    role: "user",
    text: "Mas quanto custa por mês?",
    timestamp: "2026-09-21T21:19:00Z",
    senderName: "Luiz Fernando Gonçalves",
  },
  {
    id: "msg-ai-1",
    role: "assistant",
    text: "O plano mensal oficial da NumVapt é R$ 490,00/mês. ✨",
    timestamp: "2026-09-21T21:19:05Z",
    senderName: "Maia (NumVapt IA)",
  },
];

describe("AdminInstagramPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    global.confirm = vi.fn().mockReturnValue(true);
    global.fetch = vi.fn().mockImplementation(async (url: string, options?: any) => {
      if (url.includes("/api/admin/instagram?senderId=")) {
        if (options?.method === "DELETE") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ messages: mockMessages }),
        };
      }
      if (url === "/api/admin/instagram") {
        return {
          ok: true,
          status: 200,
          json: async () => ({ chats: mockChats }),
        };
      }
      if (url === "/api/admin/whatsapp/knowledge") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            topics: [
              {
                id: "topic_planos",
                title: "Planos e Preços Oficiais NumVapt",
                category: "planos",
                content: "• Plano Mensal: R$ 490,00/mês",
                isActive: true,
                order: 1,
              },
            ],
          }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    });
  });

  it("renderiza a lista de conversas do Instagram e abre o chat selecionado", async () => {
    render(<AdminInstagramPage />);

    await waitFor(() => {
      expect(screen.getByText("Luiz Fernando Gonçalves")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Luiz Fernando Gonçalves"));

    await waitFor(() => {
      expect(screen.getByText("O plano mensal oficial da NumVapt é R$ 490,00/mês. ✨")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Limpar Chat/i })).toBeInTheDocument();
    });
  });

  it("permite limpar o histórico do chat selecionado", async () => {
    render(<AdminInstagramPage />);

    await waitFor(() => {
      expect(screen.getByText("Luiz Fernando Gonçalves")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Luiz Fernando Gonçalves"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Limpar Chat/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Limpar Chat/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("clearAll=true"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});

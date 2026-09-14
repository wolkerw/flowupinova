import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminWhatsAppPage from "../page";

const mockChats = [
  {
    phone: "51920044035",
    cleanPhone: "51920044035",
    contactName: "Cliente Teste",
    lastMessageText: "Qual o valor do plano?",
    lastMessageAt: "2026-09-11T18:00:00Z",
    aiEnabled: true,
    humanTakeover: false,
    status: "active",
  },
  {
    phone: "51988887777",
    cleanPhone: "51988887777",
    contactName: "Mariana Silva",
    lastMessageText: "Preciso falar com um atendente",
    lastMessageAt: "2026-09-11T18:05:00Z",
    aiEnabled: false,
    humanTakeover: true,
    status: "waiting_human",
  },
];

const mockMessages = [
  {
    id: "msg-1",
    role: "user",
    text: "Qual o valor do plano?",
    timestamp: "2026-09-11T18:00:00Z",
    senderName: "Cliente Teste",
  },
  {
    id: "msg-2",
    role: "assistant",
    text: "Olá! O plano anual da *NumVapt* é o mais vantajoso! ✨",
    timestamp: "2026-09-11T18:00:05Z",
    senderName: "Maia (NumVapt IA)",
  },
];

describe("AdminWhatsAppPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/api/admin/whatsapp?phone=")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ messages: mockMessages }),
        };
      }
      if (url === "/api/admin/whatsapp") {
        return {
          ok: true,
          status: 200,
          json: async () => ({ chats: mockChats }),
        };
      }
      return { ok: true, status: 200, json: async () => ({ success: true }) };
    });
  });

  it("renderiza o header com o número oficial do WhatsApp e a lista de conversas", async () => {
    render(<AdminWhatsAppPage />);

    expect(screen.getByText("Atendimento WhatsApp & IA")).toBeInTheDocument();
    expect(screen.getByText("(51) 92004-4035")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Cliente Teste")).toBeInTheDocument();
      expect(screen.getByText("Mariana Silva")).toBeInTheDocument();
      expect(screen.getByText("IA Maia Ativa")).toBeInTheDocument();
      expect(screen.getByText("Aguardando Atendente")).toBeInTheDocument();
    });
  });

  it("abre a janela do chat ao selecionar uma conversa e exibe as mensagens", async () => {
    render(<AdminWhatsAppPage />);

    await waitFor(() => {
      expect(screen.getByText("Cliente Teste")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Cliente Teste"));

    await waitFor(() => {
      expect(screen.getAllByText("Qual o valor do plano?").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/O plano anual da/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^IA Ativa$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Atendimento Humano/i })).toBeInTheDocument();
    });
  });

  it("permite enviar uma resposta manual no chat", async () => {
    render(<AdminWhatsAppPage />);

    await waitFor(() => {
      expect(screen.getByText("Cliente Teste")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Cliente Teste"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Escreva para responder manualmente/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Escreva para responder manualmente/i);
    fireEvent.change(input, { target: { value: "Olá, estou aqui para te ajudar!" } });

    const sendBtn = screen.getByRole("button", { name: /Enviar/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/whatsapp",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });
});

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WeeklyPlanningTopicsCard } from "../WeeklyPlanningTopicsCard";

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe("WeeklyPlanningTopicsCard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renderiza o título, o seletor de mês e as 4 semanas", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        topics: {
          month: "2026-11",
          week1: "",
          week2: "",
          week3: "",
          week4: "",
          notes: "",
        },
      }),
    } as any);

    render(<WeeklyPlanningTopicsCard isApproverRole={true} />);

    expect(screen.getByText("Pautas Semanais do Mês")).toBeInTheDocument();
    expect(
      screen.getByText("Defina os assuntos e prioridades que você deseja ver publicados em cada semana deste mês.")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Semana 1")).toBeInTheDocument();
      expect(screen.getByText("Semana 2")).toBeInTheDocument();
      expect(screen.getByText("Semana 3")).toBeInTheDocument();
      expect(screen.getByText("Semana 4")).toBeInTheDocument();
    });

    expect(screen.getByText("0 de 4 semanas preenchidas")).toBeInTheDocument();
  });

  it("carrega e exibe pautas já salvas no Firestore", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        topics: {
          month: "2026-11",
          week1: "Lançamento da nova linha de dermocosméticos",
          week2: "Depoimentos de pacientes e resultados",
          week3: "Mitos e verdades sobre skincare",
          week4: "Condição especial de Black Friday",
          notes: "Focar em público de 25 a 45 anos",
          updatedAt: "2026-11-18T10:00:00.000Z",
          updatedBy: "cliente@clinica.com",
          updatedByRole: "client_approver",
        },
      }),
    } as any);

    render(<WeeklyPlanningTopicsCard isApproverRole={false} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Lançamento da nova linha de dermocosméticos")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Depoimentos de pacientes e resultados")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Mitos e verdades sobre skincare")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Condição especial de Black Friday")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Focar em público de 25 a 45 anos")).toBeInTheDocument();
    });

    expect(screen.getByText("4 de 4 semanas definidas")).toBeInTheDocument();
    expect(screen.getByText(/cliente@clinica\.com/)).toBeInTheDocument();
  });

  it("habilita botão Salvar ao editar um campo e envia POST ao clicar", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        topics: {
          month: "2026-11",
          week1: "",
          week2: "",
          week3: "",
          week4: "",
        },
      }),
    } as any);

    render(<WeeklyPlanningTopicsCard isApproverRole={true} workspaceId="ws-test-123" />);

    await waitFor(() => {
      expect(screen.getByText("Semana 1")).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /Salvar Pautas/i });
    expect(saveButton).toBeDisabled();

    // Digita na Semana 1
    const textareas = screen.getAllByRole("textbox");
    fireEvent.change(textareas[0], {
      target: { value: "Tema prioritário: Novo produto" },
    });

    expect(saveButton).not.toBeDisabled();

    // Mock do POST de salvamento
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        topics: {
          month: "2026-11",
          week1: "Tema prioritário: Novo produto",
          week2: "",
          week3: "",
          week4: "",
          updatedAt: "2026-11-18T12:00:00.000Z",
          updatedBy: "cliente@teste.com",
          updatedByRole: "client_approver",
        },
      }),
    } as any);

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/concierge/topics",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Pautas Semanais Salvas!",
        })
      );
    });
  });

  it("permite descartar alterações não salvas", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        topics: {
          month: "2026-11",
          week1: "Conteúdo original",
          week2: "",
          week3: "",
          week4: "",
        },
      }),
    } as any);

    render(<WeeklyPlanningTopicsCard isApproverRole={false} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Conteúdo original")).toBeInTheDocument();
    });

    const textareas = screen.getAllByRole("textbox");
    fireEvent.change(textareas[0], {
      target: { value: "Alteração que não quero salvar" },
    });

    expect(screen.getByDisplayValue("Alteração que não quero salvar")).toBeInTheDocument();

    const discardBtn = screen.getByRole("button", { name: /Descartar/i });
    fireEvent.click(discardBtn);

    expect(screen.getByDisplayValue("Conteúdo original")).toBeInTheDocument();
  });

  it("recolhe e expande ao clicar no botão de alternância", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        topics: { month: "2026-11" },
      }),
    } as any);

    render(<WeeklyPlanningTopicsCard />);

    await waitFor(() => {
      expect(screen.getByText("Semana 1")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByRole("button", { name: /Recolher pautas semanais/i });
    fireEvent.click(toggleBtn);

    expect(screen.queryByText("Semana 1")).not.toBeInTheDocument();

    const expandBtn = screen.getByRole("button", { name: /Expandir pautas semanais/i });
    fireEvent.click(expandBtn);

    expect(screen.getByText("Semana 1")).toBeInTheDocument();
  });
});

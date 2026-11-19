import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScheduledPostsPlanner, type PlannerPostItem } from "../ScheduledPostsPlanner";

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="mock-dialog">{children}</div> : null,
  DialogContent: ({ children, className }: any) => (
    <div className={className} data-testid="mock-dialog-content">
      {children}
    </div>
  ),
  DialogHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
  DialogDescription: ({ children, className }: any) => <p className={className}>{children}</p>,
  DialogFooter: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, fill, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt || ""} {...props} />;
  },
}));

describe("ScheduledPostsPlanner Component", () => {
  const futureDate1 = new Date(Date.now() + 86400000 * 2); // 2 days ahead
  const futureDate2 = new Date(Date.now() + 86400000 * 5); // 5 days ahead

  const samplePosts: PlannerPostItem[] = [
    {
      id: "post-1",
      text: "Lançamento do novo produto exclusivo!",
      date: futureDate1,
      formattedDate: "21/11/2026",
      formattedTime: "10:30",
      status: "scheduled",
      platforms: ["instagram", "facebook"],
      imageUrl: "https://example.com/banner1.jpg",
      instagramUsername: "minha_marca",
      pageName: "Minha Página",
    },
    {
      id: "post-2",
      text: "Dicas de produtividade e foco semanal",
      date: futureDate2,
      formattedDate: "24/11/2026",
      formattedTime: "18:00",
      status: "scheduled",
      platforms: ["linkedin"],
      imageUrl: "https://example.com/dicas.png",
      pageName: "LinkedIn Company",
    },
  ];

  const defaultProps = {
    posts: samplePosts,
    isLoading: false,
    onUpdateSchedule: vi.fn().mockResolvedValue(undefined),
    onPublishNow: vi.fn().mockResolvedValue(undefined),
    onDeletePost: vi.fn(),
    onRepublish: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o estado vazio quando não há posts agendados", () => {
    render(<ScheduledPostsPlanner {...defaultProps} posts={[]} />);

    expect(screen.getByText("Nenhum post agendado no momento")).toBeInTheDocument();
    expect(
      screen.getByText(/Crie uma publicação manual ou gere um carrossel completo com IA/i)
    ).toBeInTheDocument();
  });

  it("renderiza o cabeçalho, contador de posts e a lista no modo Linha do Tempo", () => {
    render(<ScheduledPostsPlanner {...defaultProps} />);

    expect(screen.getByText("Planner de Agendamentos")).toBeInTheDocument();
    expect(screen.getByText(/2 publicações na fila/i)).toBeInTheDocument();
    expect(screen.getByText("Lançamento do novo produto exclusivo!")).toBeInTheDocument();
    expect(screen.getByText("Dicas de produtividade e foco semanal")).toBeInTheDocument();
  });

  it("alterna entre modo Linha do Tempo e Grade Visual", () => {
    render(<ScheduledPostsPlanner {...defaultProps} />);

    const gridButton = screen.getByTitle("Modo Grade Visual");
    fireEvent.click(gridButton);

    // Na visualização em grade, os posts continuam visíveis
    expect(screen.getByText("Lançamento do novo produto exclusivo!")).toBeInTheDocument();

    const timelineButton = screen.getByTitle("Modo Linha do Tempo");
    fireEvent.click(timelineButton);

    expect(screen.getByText("Lançamento do novo produto exclusivo!")).toBeInTheDocument();
  });

  it("filtra posts pelo campo de busca de texto", () => {
    render(<ScheduledPostsPlanner {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Buscar agendamento/i);
    fireEvent.change(searchInput, { target: { value: "produtividade" } });

    expect(screen.getByText("Dicas de produtividade e foco semanal")).toBeInTheDocument();
    expect(screen.queryByText("Lançamento do novo produto exclusivo!")).not.toBeInTheDocument();
  });

  it("filtra posts pela plataforma selecionada", () => {
    render(<ScheduledPostsPlanner {...defaultProps} />);

    // Clica no filtro de LinkedIn
    const linkedinFilter = screen.getByRole("button", { name: /LinkedIn/i });
    fireEvent.click(linkedinFilter);

    expect(screen.getByText("Dicas de produtividade e foco semanal")).toBeInTheDocument();
    expect(screen.queryByText("Lançamento do novo produto exclusivo!")).not.toBeInTheDocument();
  });

  it("abre a janela de Prévia ao clicar no botão de prévia", () => {
    render(<ScheduledPostsPlanner {...defaultProps} />);

    const previewButtons = screen.getAllByTitle("Ver prévia ampliada");
    fireEvent.click(previewButtons[0]);

    expect(screen.getByText("Prévia da Publicação Agendada")).toBeInTheDocument();
    expect(screen.getByText(/Programada para/i)).toBeInTheDocument();
  });

  it("abre o modal de edição ao clicar em Editar", () => {
    render(<ScheduledPostsPlanner {...defaultProps} />);

    const editButtons = screen.getAllByTitle("Editar data, horário ou legenda");
    fireEvent.click(editButtons[0]);

    expect(screen.getByText("Editar Agendamento")).toBeInTheDocument();
    expect(screen.getByText("Data da Publicação")).toBeInTheDocument();
    expect(screen.getByText("Sugestões de Horários com Maior Engajamento:")).toBeInTheDocument();
  });

  it("aciona confirmação e executa 'Publicar Agora'", async () => {
    render(<ScheduledPostsPlanner {...defaultProps} />);

    const publishNowButtons = screen.getAllByTitle("Publicar agora mesmo sem esperar o horário");
    fireEvent.click(publishNowButtons[0]);

    expect(screen.getByText("Publicar Imediatamente?")).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: /Confirmar e Publicar Agora/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(defaultProps.onPublishNow).toHaveBeenCalledWith(samplePosts[0]);
    });
  });

  it("chama onDeletePost ao clicar no botão de excluir", () => {
    render(<ScheduledPostsPlanner {...defaultProps} />);

    const deleteButtons = screen.getAllByTitle("Cancelar e excluir agendamento");
    fireEvent.click(deleteButtons[0]);

    expect(defaultProps.onDeletePost).toHaveBeenCalledWith("post-1");
  });
});

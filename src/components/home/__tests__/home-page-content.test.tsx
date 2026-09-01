import React from "react";
import { render, screen } from "@testing-library/react";
import { HomePageContent } from "../home-page-content";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, prop: string) => {
        return ({ children, ...props }: any) => React.createElement(prop, props, children);
      },
    }
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

describe("HomePageContent", () => {
  it("renders header navigation links matching page content", () => {
    render(<HomePageContent />);

    // Verifica botões de navegação no cabeçalho
    expect(screen.getByRole("link", { name: "Como funciona" })).toHaveAttribute(
      "href",
      "#como-funciona"
    );
    expect(screen.getByRole("link", { name: "Recursos" })).toHaveAttribute("href", "#recursos");
    expect(screen.getByRole("link", { name: "Planos" })).toHaveAttribute("href", "#planos");
    expect(screen.getByRole("link", { name: "Dúvidas" })).toHaveAttribute("href", "#duvidas");
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/acesso/login");
    expect(screen.getByRole("link", { name: "Começar Grátis" })).toHaveAttribute(
      "href",
      "/acesso/cadastro"
    );
  });

  it("renders home page elements and footer links without support or linkedin button", () => {
    const { container } = render(<HomePageContent />);

    // Verifica links do footer presentes
    expect(screen.getByText("Termos de Uso")).toBeInTheDocument();
    expect(screen.getByText("Privacidade")).toBeInTheDocument();

    // Garante que o link/botão de suporte foi removido
    expect(screen.queryByRole("link", { name: /^suporte$/i })).not.toBeInTheDocument();

    // Garante que o ícone do Linkedin não está presente
    expect(container.querySelector(".lucide-linkedin")).not.toBeInTheDocument();

    // Garante que o botão destacado do Instagram existe e aponta para a URL correta
    const instagramLink = screen.getByLabelText("Instagram NumVapt");
    expect(instagramLink).toBeInTheDocument();
    expect(instagramLink).toHaveAttribute("href", "https://www.instagram.com/numvapt/");
    expect(instagramLink).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Siga @numvapt")).toBeInTheDocument();
  });
});

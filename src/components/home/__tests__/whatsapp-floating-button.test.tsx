import React from "react";
import { render, screen } from "@testing-library/react";
import { WhatsAppFloatingButton } from "../whatsapp-floating-button";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, prop: string) => {
        return ({ children, whileHover, whileTap, initial, animate, transition, ...props }: any) =>
          React.createElement(prop, props, children);
      },
    }
  ),
}));

describe("WhatsAppFloatingButton", () => {
  it("renders with default phone number and message", () => {
    render(<WhatsAppFloatingButton />);

    const callout = screen.getByLabelText("Tire dúvidas pelo WhatsApp");
    expect(callout).toBeInTheDocument();
    expect(callout).toHaveAttribute(
      "href",
      "https://wa.me/5551920044035?text=Ol%C3%A1!%20Gostaria%20de%20tirar%20d%C3%BAvidas%20sobre%20a%20NumVapt."
    );
    expect(callout).toHaveAttribute("target", "_blank");

    const circleButton = screen.getByLabelText("Fale conosco no WhatsApp para tirar dúvidas");
    expect(circleButton).toBeInTheDocument();
    expect(circleButton).toHaveAttribute(
      "href",
      "https://wa.me/5551920044035?text=Ol%C3%A1!%20Gostaria%20de%20tirar%20d%C3%BAvidas%20sobre%20a%20NumVapt."
    );
    expect(circleButton).toHaveAttribute("target", "_blank");

    expect(screen.getByText("Dúvidas? Fale no WhatsApp")).toBeInTheDocument();
  });

  it("renders with custom phone number and message when provided", () => {
    render(
      <WhatsAppFloatingButton
        phoneNumber="5511999999999"
        defaultMessage="Quero mais informações."
      />
    );

    const callout = screen.getByLabelText("Tire dúvidas pelo WhatsApp");
    expect(callout).toHaveAttribute(
      "href",
      "https://wa.me/5511999999999?text=Quero%20mais%20informa%C3%A7%C3%B5es."
    );
  });
});

import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

// Mock framer-motion globally to avoid animation issues in tests
vi.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: ({ children, ...props }: any) => React.createElement("div", props, children),
      h1: ({ children, ...props }: any) => React.createElement("h1", props, children),
      p: ({ children, ...props }: any) => React.createElement("p", props, children),
      button: ({ children, ...props }: any) => React.createElement("button", props, children),
      span: ({ children, ...props }: any) => React.createElement("span", props, children),
      section: ({ children, ...props }: any) => React.createElement("section", props, children),
      nav: ({ children, ...props }: any) => React.createElement("nav", props, children),
      header: ({ children, ...props }: any) => React.createElement("header", props, children),
      footer: ({ children, ...props }: any) => React.createElement("footer", props, children),
      a: ({ children, ...props }: any) => React.createElement("a", props, children),
    },
    AnimatePresence: ({ children }: any) => children,
    useScroll: () => ({ scrollYProgress: { toJSON: () => 0 } }),
    useTransform: (value: any) => value,
    useSpring: (value: any) => value,
  };
});

// Expor o jest globalmente apontando para o vi para compatibilidade com mocks inline
globalThis.jest = vi as any;

// Mock next/image globalmente
vi.mock("next/image", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => {
      // eslint-disable-next-line @next/next/no-img-element, react/display-name
      return React.createElement("img", props);
    },
  };
});

// Mock next/link globalmente
vi.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children, href, ...props }: any) => {
      return React.createElement("a", { href, ...props }, children);
    },
  };
});


// Mock next/font/google globalmente para evitar erros de fontes
vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "inter-font", variable: "--font-inter" }),
  Poppins: () => ({ className: "poppins-font", variable: "--font-poppins" }),
}));

import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

// Mock framer-motion globally to avoid animation issues in tests
vi.mock("framer-motion", () => {
  const React = require("react");
  const motion = new Proxy(
    {},
    {
      get: (_target, prop) => {
        return ({ children, ...props }: any) => {
          // Destructure framer-motion specific props that standard React elements don't accept
          const {
            animate,
            transition,
            variants,
            initial,
            exit,
            whileHover,
            whileTap,
            whileInView,
            viewport,
            onAnimationStart,
            onAnimationComplete,
            ...restProps
          } = props;
          return React.createElement(prop as string, restProps, children);
        };
      },
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: any) => children,
    useScroll: () => ({ scrollYProgress: { toJSON: () => 0 } }),
    useTransform: (value: any) => value,
    useSpring: (value: any) => value,
  };
});

// Expor o jest globalmente apontando para o vi para compatibilidade com mocks inline
(globalThis as any).jest = vi;

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

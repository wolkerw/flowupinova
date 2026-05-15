import "@testing-library/jest-dom";
import React from "react";

// Mock lucide-react icons without using requireActual to avoid ESM issues
jest.mock("lucide-react", () => {
  return new Proxy({}, {
    get: (target, prop) => {
      // Return a simple SVG component for any icon requested
      // eslint-disable-next-line react/display-name
      return (props: any) => React.createElement("svg", { 
        ...props, 
        "data-testid": `icon-${String(prop)}` 
      });
    }
  });
});

// Mock framer-motion globally to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement("div", props, children),
    h1: ({ children, ...props }: any) => React.createElement("h1", props, children),
    p: ({ children, ...props }: any) => React.createElement("p", props, children),
    button: ({ children, ...props }: any) => React.createElement("button", props, children),
  },
  AnimatePresence: ({ children }: any) => children,
}));

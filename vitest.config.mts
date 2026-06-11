import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    exclude: [...configDefaults.exclude, "tests/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 90,
        functions: 85,
        branches: 90,
        statements: 90,
      },
      include: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.spec.ts",
        "src/**/*.spec.tsx",
      ],
      exclude: [
        "node_modules/**",
        ".next/**",
        "tests/**",
        "vitest.config.ts",
        "vitest.setup.ts",
        "next.config.ts",
        "tailwind.config.ts",
        "postcss.config.mjs",
        "jest.config.js",
        "jest.config.mjs",
      ],
    },
  },
});

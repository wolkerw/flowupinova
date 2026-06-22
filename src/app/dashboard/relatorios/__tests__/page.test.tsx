"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import Relatorios from "../page";
import { AuthProvider } from "@/components/auth/auth-provider";
import { vi, describe, it, expect } from "vitest";

vi.mock("@/components/auth/auth-provider", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    user: { uid: "test-user" },
  }),
}));

vi.mock("@/lib/services/meta-service", () => ({
  getMetaConnection: vi.fn().mockResolvedValue({ isConnected: false }),
}));

// Mock Recharts to prevent errors during server-side rendering in tests
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  BarChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  Line: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  Pie: () => null,
  Cell: () => null,
}));

describe("Relatorios Page", () => {
  it("renders the main title", () => {
    render(
      <AuthProvider>
        <Relatorios />
      </AuthProvider>
    );
    expect(screen.getByText("Relatórios")).toBeInTheDocument();
    expect(screen.getByText("Análise detalhada de performance")).toBeInTheDocument();
  });
});

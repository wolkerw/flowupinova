"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import { LinkedInPostsViewer } from "../_components/LinkedInPostsViewer";
import { vi, describe, it, expect } from "vitest";

describe("LinkedInPostsViewer Component", () => {
  it("renders disconnected state when connection is not active", () => {
    render(<LinkedInPostsViewer connection={{ isConnected: false }} />);

    expect(screen.getByText("Conta do LinkedIn não conectada")).toBeInTheDocument();
    expect(screen.getByText("Conectar LinkedIn")).toBeInTheDocument();
  });

  it("renders connected dashboard with metrics and posts when connected", () => {
    render(
      <LinkedInPostsViewer
        connection={{
          isConnected: true,
          personName: "Empresa Teste",
          publishTarget: "organization",
        }}
      />
    );

    expect(screen.getByText("Empresa Teste")).toBeInTheDocument();
    expect(screen.getByText("Impressões B2B")).toBeInTheDocument();
    expect(screen.getByText("Reações Totais")).toBeInTheDocument();
    expect(screen.getByText("Comentários B2B")).toBeInTheDocument();
    expect(screen.getByText("Compartilhamentos")).toBeInTheDocument();
    expect(
      screen.getByText("Insights B2B & Estratégia LinkedIn (IA NumVapt)")
    ).toBeInTheDocument();
  });
});

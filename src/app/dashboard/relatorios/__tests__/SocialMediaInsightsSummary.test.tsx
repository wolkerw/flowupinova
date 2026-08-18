"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import { SocialMediaInsightsSummary } from "../_components/SocialMediaInsightsSummary";
import { describe, it, expect } from "vitest";

describe("SocialMediaInsightsSummary Component", () => {
  it("renders the 3 main metrics cards and platform name", () => {
    render(
      <SocialMediaInsightsSummary
        platformName="Instagram"
        totalReach={15000}
        totalInteractions={2400}
        avgEngagementRate="12.5%"
      />
    );

    expect(screen.getByText("Alcance Total (Instagram)")).toBeInTheDocument();
    expect(screen.getByText("15.000")).toBeInTheDocument();
    expect(screen.getByText("Interações Totais")).toBeInTheDocument();
    expect(screen.getByText("2.400")).toBeInTheDocument();
    expect(screen.getByText("Taxa de Engajamento")).toBeInTheDocument();
    expect(screen.getByText("12.5%")).toBeInTheDocument();
  });
});

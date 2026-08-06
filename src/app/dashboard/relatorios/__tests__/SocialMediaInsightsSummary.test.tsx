"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import { SocialMediaInsightsSummary } from "../_components/SocialMediaInsightsSummary";
import { vi, describe, it, expect } from "vitest";
import { Heart } from "lucide-react";

describe("SocialMediaInsightsSummary Component", () => {
  it("renders metrics cards, platform name, and recommendations", () => {
    render(
      <SocialMediaInsightsSummary
        platformName="Instagram"
        totalReach={15000}
        totalInteractions={2400}
        avgEngagementRate="12.5%"
        topPostTitle="Post Teste"
        aiRecommendations={[
          {
            id: "1",
            title: "Dica de IA",
            description: "Conteúdo descritivo de IA",
            actionText: "Criar Post",
            badge: "Novo",
            badgeColor: "bg-blue-100 text-blue-800",
          },
        ]}
        achievements={[
          {
            id: "1",
            title: "Recorde Conquistado",
            description: "Alcançou 10k acessos",
            date: "Hoje",
            icon: Heart,
            color: "bg-[#0083C7] text-white",
          },
        ]}
      />
    );

    expect(screen.getByText("Alcance Total (Instagram)")).toBeInTheDocument();
    expect(screen.getByText("15.000")).toBeInTheDocument();
    expect(screen.getByText("2.400")).toBeInTheDocument();
    expect(screen.getByText("12.5%")).toBeInTheDocument();
    expect(screen.getByText("Dica de IA")).toBeInTheDocument();
    expect(screen.getByText("Recorde Conquistado")).toBeInTheDocument();
  });
});

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  Heart,
  TrendingUp,
  Zap,
} from "lucide-react";

export interface SocialMediaInsightsSummaryProps {
  platformName: "Facebook" | "Instagram";
  totalReach: number;
  totalInteractions: number;
  avgEngagementRate: string;
  topPostTitle?: string;
  aiRecommendations?: any[];
  achievements?: any[];
}

export function SocialMediaInsightsSummary({
  platformName,
  totalReach,
  totalInteractions,
  avgEngagementRate,
}: SocialMediaInsightsSummaryProps) {
  const iconColor = platformName === "Instagram" ? "text-pink-600" : "text-[#1877F2]";
  const bgColor = platformName === "Instagram" ? "bg-pink-50" : "bg-blue-50";

  return (
    <div className="mb-8 font-sans">
      {/* 3 Cards de Desempenho do Perfil */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Alcance Total ({platformName})
              </span>
              <div className={`rounded-lg ${bgColor} p-2 ${iconColor}`}>
                <Eye className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-3xl font-bold text-slate-900">
                {totalReach.toLocaleString("pt-BR")}
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-600">
                <TrendingUp className="mr-0.5 h-3.5 w-3.5" /> +21.5%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Contas únicas alcançadas</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Interações Totais
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Heart className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-3xl font-bold text-slate-900">
                {totalInteractions.toLocaleString("pt-BR")}
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-600">
                <TrendingUp className="mr-0.5 h-3.5 w-3.5" /> +16.8%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Curtidas, comentários & salvos</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Taxa de Engajamento
              </span>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-poppins text-3xl font-bold text-slate-900">
                {avgEngagementRate}
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-600">
                <TrendingUp className="mr-0.5 h-3.5 w-3.5" /> Acima da média
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Interações / Alcance</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Flame,
  Trophy,
  ArrowUpRight,
  Zap,
} from "lucide-react";

export interface SocialMediaInsightsSummaryProps {
  platformName: "Facebook" | "Instagram";
  totalReach: number;
  totalInteractions: number;
  avgEngagementRate: string;
  topPostTitle?: string;
  aiRecommendations: {
    id: string;
    title: string;
    description: string;
    actionText: string;
    badge: string;
    badgeColor: string;
  }[];
  achievements: {
    id: string;
    title: string;
    description: string;
    date: string;
    icon: React.ElementType;
    color: string;
  }[];
}

export function SocialMediaInsightsSummary({
  platformName,
  totalReach,
  totalInteractions,
  avgEngagementRate,
  topPostTitle,
  aiRecommendations,
  achievements,
}: SocialMediaInsightsSummaryProps) {
  const brandColor = platformName === "Instagram" ? "bg-pink-500 text-white" : "bg-[#1877F2] text-white";
  const iconColor = platformName === "Instagram" ? "text-pink-600" : "text-[#1877F2]";
  const bgColor = platformName === "Instagram" ? "bg-pink-50" : "bg-blue-50";

  return (
    <div className="space-y-6 mb-8 font-sans">
      {/* Cards de Desempenho do Perfil */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Post em Alta 🔥
              </span>
              <div className="rounded-lg bg-orange-50 p-2 text-[#FA6305]">
                <Flame className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="font-poppins text-sm font-bold text-slate-900 line-clamp-1">
                {topPostTitle || "Publicação mais engajada"}
              </p>
              <Badge className="mt-1 bg-orange-100 text-orange-800 border-orange-200 text-[10px]">
                Top 1% de Alcance
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Conquistas e IA Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Conquistas */}
        <Card className="border border-amber-200 bg-gradient-to-r from-amber-50/50 to-orange-50/40 shadow-xs lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-poppins text-base font-bold text-amber-900">
              <Trophy className="h-4 w-4 text-amber-600" />
              Conquistas no {platformName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((ach) => {
              const IconComp = ach.icon;
              return (
                <div
                  key={ach.id}
                  className="flex items-start gap-3 rounded-lg border border-amber-200 bg-white p-3 shadow-2xs"
                >
                  <div className={`rounded-lg p-2.5 ${ach.color}`}>
                    <IconComp className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">{ach.title}</h5>
                    <p className="mt-0.5 text-[11px] text-slate-600">{ach.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* IA Insights */}
        <Card className="border border-blue-200 bg-gradient-to-r from-blue-50/60 to-white shadow-xs lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className={`rounded-lg ${brandColor} p-1.5 shadow-2xs`}>
                <Sparkles className="h-4 w-4" />
              </div>
              <CardTitle className="font-poppins text-base font-bold text-slate-900">
                Insights de IA NumVapt ({platformName})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {aiRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <Badge className={rec.badgeColor}>{rec.badge}</Badge>
                    <Sparkles className="h-3.5 w-3.5 text-[#FA6305]" />
                  </div>
                  <h5 className="font-poppins font-bold text-xs text-slate-900">{rec.title}</h5>
                  <p className="mt-1 text-xs text-slate-600">{rec.description}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                  <Button className="bg-[#0083C7] hover:bg-[#006ca7] text-white text-[11px] h-7 px-3 font-semibold">
                    {rec.actionText} <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

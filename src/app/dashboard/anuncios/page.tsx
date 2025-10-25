
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function Anuncios() {
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Anúncios Online</h1>
          <p className="text-gray-600 mt-1">Crie e gerencie suas campanhas pagas na Meta</p>
        </div>
      </div>
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Em Breve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-600 p-8">
            <p className="text-lg mb-2">Estamos preparando algo incrível para você!</p>
            <p>A funcionalidade de criação e gestão de anúncios está em desenvolvimento e será lançada em breve.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

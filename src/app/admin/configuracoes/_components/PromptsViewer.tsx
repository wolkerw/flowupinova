"use client";

import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Bot, Image as ImageIcon, Workflow, Sparkles, MessageSquare, Save, Loader2, Megaphone, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function PromptsViewer() {
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/prompts");
      const data = await res.json();
      if (res.ok) {
        setPrompts(data);
      } else {
        setError("Erro ao carregar os prompts.");
      }
    } catch (err) {
      setError("Erro de rede ao carregar os prompts.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    try {
      setSaving(true);
      setSuccess("");
      setError("");
      
      const res = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [key]: prompts[key] }),
      });

      if (res.ok) {
        setSuccess("Prompt salvo com sucesso!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Erro ao salvar o prompt.");
      }
    } catch (err) {
      setError("Erro de rede ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setPrompts((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/60 p-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Biblioteca de Prompts (Agentes IA)</h2>
        </div>
      </div>
      
      <p className="mb-6 text-sm text-slate-400">
        Aqui estão os "cérebros" por trás das inteligências artificiais do app. Edite as instruções abaixo 
        para ajustar o comportamento de cada agente. Cuidado ao alterar as variáveis entre colchetes como [TEXTO_AQUI].
      </p>

      {error && <div className="mb-4 rounded-md bg-red-500/20 p-3 text-sm text-red-200">{error}</div>}
      {success && <div className="mb-4 rounded-md bg-emerald-500/20 p-3 text-sm text-emerald-200">{success}</div>}

      <Accordion type="single" collapsible className="w-full space-y-4">
        {/* Botão Conceito */}
        <AccordionItem
          value="conceito"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Agente: Gerar Imagem Conceito (UGC)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Este agente constrói o prompt avançado em inglês focando na estética UGC, evitando rostos cortados 
              e repassando ao gerador de imagem (Flux Kontext).
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[300px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.ugc_prompt || ""}
                onChange={(e) => handleChange("ugc_prompt", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("ugc_prompt")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Agente: Diretor de Arte - Fluxo Conceito & Infográficos */}
        <AccordionItem
          value="conceito_prompts_system"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <PenTool className="h-4 w-4 text-cyan-400" />
              Agente: Diretor de Arte (Fluxo Conceito & Infográficos)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Instrui a IA a planejar a diagramação infográfica, proibindo repetição de logomarcas em múltiplos elementos e alternando entre Opção 1 (limpa para edição) e Opção 2 (com logo oficial discreta).
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[300px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.conceito_prompts_system || ""}
                onChange={(e) => handleChange("conceito_prompts_system", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("conceito_prompts_system")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Botão Foto de Produto */}
        <AccordionItem
          value="produto"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-4 w-4 text-blue-400" />
              Agente: Gerar com Foto de Produto
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Instrui a preservar perfeitamente marcas e formatos originais, 
              posicionando o item num cenário fotográfico de alto padrão.
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[300px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.produto_prompt || ""}
                onChange={(e) => handleChange("produto_prompt", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("produto_prompt")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Botão Híbrido */}
        <AccordionItem
          value="hibrido"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Workflow className="h-4 w-4 text-pink-400" />
              Agente: Geração Híbrida
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Neste fluxo, o sistema junta sua imagem com uma referência. O modelo entende
              prioridades com base no que você selecionou e injeta a regra no placeholder `[REGRA_DA_OPCAO_ESCOLHIDA]`.
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[300px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.hibrido_prompt || ""}
                onChange={(e) => handleChange("hibrido_prompt", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("hibrido_prompt")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Gerador de Ideias */}
        <AccordionItem
          value="textos"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              Agente: Gerador de Ideias e Textos (Interno)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Este é o prompt mestre executado internamente pela IA (nas etapas iniciais de criação do post) para formular as 3 sugestões de copy.
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[200px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.ideias_post_prompt || ""}
                onChange={(e) => handleChange("ideias_post_prompt", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("ideias_post_prompt")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Melhorador de Textos */}
        <AccordionItem
          value="melhorador"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <PenTool className="h-4 w-4 text-cyan-400" />
              Agente: Melhorador de Textos
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Refina e corrige gramaticalmente a legenda fornecida pelo usuário, adicionando tom persuasivo.
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[200px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.melhorar_texto_prompt || ""}
                onChange={(e) => handleChange("melhorar_texto_prompt", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("melhorar_texto_prompt")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Copilot de Anúncios */}
        <AccordionItem
          value="copilot"
          className="overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/50 px-4"
        >
          <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline">
            <div className="flex items-center gap-3">
              <Megaphone className="h-4 w-4 text-orange-400" />
              Agente: Copilot de Anúncios (Meta Ads)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 text-slate-400">
            <p className="mb-4 text-xs">
              Cria headlines e copys focadas em conversão de anúncios pagos na Meta.
            </p>
            <div className="flex flex-col gap-3">
              <Textarea 
                className="min-h-[300px] bg-slate-950 font-mono text-xs text-slate-300 border-slate-700" 
                value={prompts.copilot_ads_prompt || ""}
                onChange={(e) => handleChange("copilot_ads_prompt", e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSave("copilot_ads_prompt")}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Prompt
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Trash2,
  Power,
  Layers,
  Camera,
  Sun,
  Maximize2,
  Tag,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { PromptUploadModal } from "./_components/PromptUploadModal";
import { StyleCommandsTab } from "./_components/StyleCommandsTab";
import {
  PROMPT_DEFAULT_CATEGORIES,
  type AIPromptKnowledgeItem,
} from "@/lib/types/ai-prompt-knowledge";
import { Zap } from "lucide-react";

export default function AdminPromptsPage() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"references" | "commands">("references");
  const [prompts, setPrompts] = useState<AIPromptKnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prompts");
      const data = await res.json();
      if (res.ok && data.items) {
        setPrompts(data.items);
      } else {
        throw new Error(data.error || "Erro ao carregar prompts.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar prompts",
        description: err.message || "Tente recarregar a página.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !currentActive }),
      });

      if (!res.ok) throw new Error("Falha ao atualizar status.");

      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: !currentActive } : p))
      );

      toast({
        title: !currentActive ? "Prompt ativado!" : "Prompt desativado",
        description: !currentActive
          ? "Este modelo agora está ativo no enriquecimento de imagens."
          : "Este modelo não será acionado no motor de busca.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao alternar status",
        description: err.message,
      });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o prompt "${title}" da central?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/prompts?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Falha ao remover prompt.");

      setPrompts((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: "Prompt excluído com sucesso",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: err.message,
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filtragem dos prompts
  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rawPrompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.triggerKeywords.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "ALL" || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const activeCount = prompts.filter((p) => p.active).length;
  const categoriesCount = new Set(prompts.map((p) => p.category)).size;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-accent" />
            Central de Conhecimento de Prompts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cadastre os melhores prompts do mercado e gerencie comandos de estilo fotográficos para enriquecer as criações dos usuários.
          </p>
        </div>

        {activeTab === "references" && (
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl gap-2 shadow-sm shrink-0 h-11 px-5"
          >
            <Plus className="h-5 w-5" />
            Enviar Print de Prompt (Ctrl+V)
          </Button>
        )}
      </div>

      {/* Seletor de Abas da Central */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("references")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "references"
              ? "bg-primary text-white shadow-xs"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Prompts de Referência</span>
          <Badge
            className={`ml-1 text-xs border-none ${
              activeTab === "references" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            {prompts.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("commands")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "commands"
              ? "bg-primary text-white shadow-xs"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Zap className="h-4 w-4 text-amber-300" />
          <span>Comandos de Estilo</span>
          <Badge
            className={`ml-1 text-xs border-none ${
              activeTab === "commands" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            40+
          </Badge>
        </button>
      </div>

      {/* Conteúdo da Aba 2: Comandos de Estilo */}
      {activeTab === "commands" && <StyleCommandsTab />}

      {/* Conteúdo da Aba 1: Prompts de Referência */}
      {activeTab === "references" && (
        <div className="space-y-6">
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-gray-200/80 shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-100 text-accent flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total de Prompts</p>
              <h3 className="text-2xl font-black text-gray-900">{prompts.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prompts Ativos</p>
              <h3 className="text-2xl font-black text-gray-900">{activeCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-2xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 text-primary flex items-center justify-center shrink-0">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categorias Cadastradas</p>
              <h3 className="text-2xl font-black text-gray-900">{categoriesCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, termo ou palavra-chave..."
            className="pl-10 rounded-xl text-sm border-gray-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-accent focus:ring-accent w-full sm:w-60"
          >
            <option value="ALL">Todas as Categorias</option>
            {PROMPT_DEFAULT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Listagem de Prompts */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm font-medium text-gray-500">Carregando a central de prompts...</p>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-300 space-y-4">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-orange-50 text-accent">
            <Sparkles className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Nenhum prompt encontrado</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {searchTerm || selectedCategory !== "ALL"
                ? "Tente ajustar seus termos de busca ou remover o filtro de categoria."
                : "A sua central está vazia. Cole o primeiro print com Ctrl+V para começar a enriquecer as artes dos usuários!"}
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Primeiro Prompt
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrompts.map((item) => (
            <Card
              key={item.id}
              className={`rounded-2xl border-2 transition-all flex flex-col justify-between overflow-hidden ${
                item.active
                  ? "border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs"
                  : "border-gray-100 bg-gray-50/70 opacity-70"
              }`}
            >
              <CardContent className="p-5 space-y-4">
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-bold border-orange-200 text-accent bg-orange-50">
                        {item.category}
                      </Badge>
                      {item.targetUse && (
                        <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200">
                          {item.targetUse}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug">{item.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={item.active}
                      onCheckedChange={() => handleToggleActive(item.id, item.active)}
                      aria-label="Ativar/Desativar"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={deletingId === item.id}
                      className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 p-0 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Prompt em largura total sem necessidade de thumb */}
                <div className="w-full">
                  <p className="text-xs text-gray-700 line-clamp-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/70 font-mono">
                    {item.rawPrompt}
                  </p>
                </div>

                {/* Especificações Técnicas Extraídas */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-gray-100">
                  {item.sections.lighting && (
                    <div className="flex items-center gap-1.5 text-gray-600 truncate">
                      <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{item.sections.lighting}</span>
                    </div>
                  )}
                  {item.sections.cameraAndLens && (
                    <div className="flex items-center gap-1.5 text-gray-600 truncate">
                      <Camera className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{item.sections.cameraAndLens}</span>
                    </div>
                  )}
                </div>

                {/* Palavras-Chave Gatilho */}
                {item.triggerKeywords.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <Tag className="h-3 w-3 text-gray-400 shrink-0" />
                    {item.triggerKeywords.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </div>
      )}

      {/* Modal de Upload via Ctrl+V */}
      <PromptUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchPrompts}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  Loader2,
  SlidersHorizontal,
  Code2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { AIStyleCommand } from "@/lib/types/ai-prompt-knowledge";

export function StyleCommandsTab() {
  const { toast } = useToast();

  const [commands, setCommands] = useState<AIStyleCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [editingCommand, setEditingCommand] = useState<AIStyleCommand | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [formCommand, setFormCommand] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("Iluminação");
  const [formIconEmoji, setFormIconEmoji] = useState("✨");
  const [formPromptInjection, setFormPromptInjection] = useState("");
  const [formNegativeInjection, setFormNegativeInjection] = useState("");
  const [formTriggerKeywords, setFormTriggerKeywords] = useState("");

  const normalizedFormCommand = formCommand.trim().startsWith("/")
    ? formCommand.trim().toLowerCase()
    : `/${formCommand.trim().toLowerCase()}`;

  const isDuplicateCommand =
    Boolean(formCommand.trim()) &&
    formCommand.trim() !== "/" &&
    commands.some(
      (c) =>
        c.command.toLowerCase() === normalizedFormCommand &&
        c.id !== editingCommand?.id
    );

  const fetchCommands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prompts/commands");
      const data = await res.json();
      if (res.ok && data.items) {
        setCommands(data.items);
      } else {
        throw new Error(data.error || "Erro ao carregar comandos.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar comandos",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  const handleOpenCreate = () => {
    setEditingCommand(null);
    setFormCommand("/");
    setFormLabel("");
    setFormDescription("");
    setFormCategory("Iluminação");
    setFormIconEmoji("✨");
    setFormPromptInjection("");
    setFormNegativeInjection("");
    setFormTriggerKeywords("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cmd: AIStyleCommand) => {
    setEditingCommand(cmd);
    setFormCommand(cmd.command);
    setFormLabel(cmd.label);
    setFormDescription(cmd.description);
    setFormCategory(cmd.category);
    setFormIconEmoji(cmd.iconEmoji || "✨");
    setFormPromptInjection(cmd.promptInjection);
    setFormNegativeInjection(cmd.negativePromptInjection || "");
    setFormTriggerKeywords(cmd.triggerKeywords.join(", "));
    setIsModalOpen(true);
  };

  const handleSaveCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCommand.trim() || !formLabel.trim() || !formPromptInjection.trim()) {
      toast({
        variant: "destructive",
        title: "Preencha os campos obrigatórios",
        description: "Comando, nome amigável e prompt técnico são necessários.",
      });
      return;
    }

    if (isDuplicateCommand) {
      toast({
        variant: "destructive",
        title: "Código de estilo repetido",
        description: `O código de comando "${normalizedFormCommand}" já está cadastrado no sistema. Escolha outro código exclusivo.`,
      });
      return;
    }

    setIsSaving(true);
    try {
      const keywordsArray = formTriggerKeywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch("/api/admin/prompts/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCommand?.id,
          command: formCommand.trim(),
          label: formLabel.trim(),
          description: formDescription.trim(),
          category: formCategory,
          iconEmoji: formIconEmoji,
          promptInjection: formPromptInjection.trim(),
          negativePromptInjection: formNegativeInjection.trim(),
          triggerKeywords: keywordsArray,
          active: editingCommand ? editingCommand.active : true,
          order: editingCommand ? editingCommand.order : commands.length + 1,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao salvar comando.");
      }

      toast({
        title: editingCommand ? "Comando atualizado! ✨" : "Novo comando criado! 🚀",
        description: `O comando ${data.item.command} está pronto para ser usado no matching.`,
      });

      setIsModalOpen(false);
      fetchCommands();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar comando",
        description: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const target = commands.find((c) => c.id === id);
      if (!target) return;

      const res = await fetch("/api/admin/prompts/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...target,
          active: !currentActive,
        }),
      });

      if (!res.ok) throw new Error("Falha ao alternar status.");

      setCommands((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active: !currentActive } : c))
      );

      toast({
        title: !currentActive ? "Comando ativado! ✨" : "Comando desativado",
        description: !currentActive
          ? `O comando ${target.command} agora é identificado automaticamente na IA.`
          : `O comando ${target.command} foi pausado temporariamente.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: err.message,
      });
    }
  };

  const handleDelete = async (id: string, commandName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o comando ${commandName}?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/prompts/commands?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Falha ao excluir comando.");

      setCommands((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Comando excluído com sucesso" });
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

  const categories = Array.from(new Set(commands.map((c) => c.category))).filter(Boolean);

  const filteredCommands = commands.filter((cmd) => {
    const matchesCategory = selectedCategory === "ALL" || cmd.category === selectedCategory;
    const matchesSearch =
      cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.triggerKeywords.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const activeCount = commands.filter((c) => c.active).length;

  return (
    <div className="space-y-6">
      {/* Barra de Ações & Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por /comando, efeito ou palavra-chave..."
            className="pl-10 rounded-xl text-sm border-gray-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-accent focus:ring-accent w-full sm:w-52"
          >
            <option value="ALL">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <Button
            onClick={handleOpenCreate}
            className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl gap-2 shadow-sm shrink-0 h-10 px-4 text-xs sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            Novo Comando
          </Button>
        </div>
      </div>

      {/* Grid de Cards de Comandos (Inspirado no visual da referência) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm font-medium text-gray-500">Carregando galeria de comandos de estilo...</p>
        </div>
      ) : filteredCommands.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-300 space-y-4">
          <p className="text-sm text-gray-500">Nenhum comando encontrado com os filtros atuais.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredCommands.map((cmd) => (
            <div
              key={cmd.id}
              className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                cmd.active
                  ? "bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs"
                  : "bg-gray-50/70 border-gray-200/50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {/* Ícone Redondo com Numeração/Emoji */}
                <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                  <span>{cmd.iconEmoji || "✨"}</span>
                  <span className="absolute -top-1.5 -left-1.5 h-5 w-5 bg-slate-800 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {cmd.order || 1}
                  </span>
                </div>

                {/* Textos: Comando e Efeito */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-gray-900 tracking-tight">
                      {cmd.command}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-gray-200 text-gray-500">
                      {cmd.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 font-medium truncate mt-0.5">
                    {cmd.description || cmd.label}
                  </p>
                </div>
              </div>

              {/* Ações: Switch e Editar */}
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={cmd.active}
                  onCheckedChange={() => handleToggleActive(cmd.id, cmd.active)}
                  aria-label="Ativar/Desativar comando"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(cmd)}
                  className="text-gray-400 hover:text-gray-700 hover:bg-slate-100 h-8 w-8 p-0 rounded-lg"
                  title="Editar prompt e palavras-chave"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(cmd.id, cmd.command)}
                  disabled={deletingId === cmd.id}
                  className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 p-0 rounded-lg"
                  title="Excluir comando"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição de Comando */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <form onSubmit={handleSaveCommand}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                {editingCommand ? `Editar ${editingCommand.command}` : "Novo Comando de Estilo"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Configure o gatilho, as palavras-chave que a IA reconhecerá e as diretivas fotográficas técnicas injetadas no modelo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cmdCode" className="text-xs font-bold text-gray-700">
                      Comando (com barra) *
                    </Label>
                    {isDuplicateCommand && (
                      <span className="text-[10px] font-semibold text-rose-600 animate-pulse">
                        Código já cadastrado
                      </span>
                    )}
                  </div>
                  <Input
                    id="cmdCode"
                    value={formCommand}
                    onChange={(e) => setFormCommand(e.target.value)}
                    placeholder="Ex: /bokeh ou /naturallight"
                    className={`font-mono text-sm rounded-xl transition-colors ${
                      isDuplicateCommand
                        ? "border-rose-500 focus-visible:ring-rose-400 bg-rose-50/40 text-rose-900"
                        : ""
                    }`}
                  />
                  {isDuplicateCommand && (
                    <p className="text-[11px] font-medium text-rose-600 mt-1">
                      ⚠️ Este código já existe no sistema. Escolha outro para evitar conflitos.
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cmdEmoji" className="text-xs font-bold text-gray-700">
                    Ícone Emoji
                  </Label>
                  <Input
                    id="cmdEmoji"
                    value={formIconEmoji}
                    onChange={(e) => setFormIconEmoji(e.target.value)}
                    placeholder="✨"
                    className="text-center text-lg rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="cmdLabel" className="text-xs font-bold text-gray-700">
                  Nome Amigável *
                </Label>
                <Input
                  id="cmdLabel"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Ex: Luzes Desfocadas (Bokeh)"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cmdDesc" className="text-xs font-bold text-gray-700">
                  Descrição Curta do Efeito
                </Label>
                <Input
                  id="cmdDesc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Cria luzes desfocadas e profundidade de campo cinematográfica"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cmdCat" className="text-xs font-bold text-gray-700">
                  Categoria
                </Label>
                <Input
                  id="cmdCat"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Ex: Iluminação, Câmera & Lentes, Pessoas & Retrato"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cmdInjection" className="text-xs font-bold text-gray-700">
                  Prompt Técnico Injetado na IA *
                </Label>
                <Textarea
                  id="cmdInjection"
                  rows={3}
                  value={formPromptInjection}
                  onChange={(e) => setFormPromptInjection(e.target.value)}
                  placeholder="Ex: Cinematic shallow depth of field, creamy circular bokeh blur, f/1.4 prime lens..."
                  className="font-mono text-xs rounded-xl"
                />
                <p className="text-[11px] text-gray-400">
                  Instruções em inglês ou português que garantem a execução da técnica visual pela IA.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="cmdNegative" className="text-xs font-bold text-gray-700">
                  Prompt Negativo (O que evitar)
                </Label>
                <Input
                  id="cmdNegative"
                  value={formNegativeInjection}
                  onChange={(e) => setFormNegativeInjection(e.target.value)}
                  placeholder="Ex: flat focus, busy distracting background"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cmdKeywords" className="text-xs font-bold text-gray-700">
                  Palavras-Chave Gatilho (separadas por vírgula)
                </Label>
                <Input
                  id="cmdKeywords"
                  value={formTriggerKeywords}
                  onChange={(e) => setFormTriggerKeywords(e.target.value)}
                  placeholder="Ex: bokeh, fundo desfocado, luzes desfocadas, desfoque"
                  className="text-xs rounded-xl"
                />
                <p className="text-[11px] text-gray-400">
                  Quando o usuário usar uma dessas palavras no briefing normal, o sistema ativará este comando automaticamente.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isDuplicateCommand}
                className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl text-xs gap-1.5 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Salvar Comando
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

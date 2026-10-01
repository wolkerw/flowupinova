"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  Check,
  Undo2,
  AlertCircle,
  HelpCircle,
  Type,
  TrendingUp,
  DollarSign,
  Palette,
  Maximize2,
} from "lucide-react";
import type { AIImageFormat } from "@/lib/types/ai-image-general";

interface ImageAiEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  format?: AIImageFormat;
  onSuccess: (newImageUrl: string) => void;
  title?: string;
}

const QUICK_SUGGESTIONS = [
  {
    icon: Type,
    label: "Trocar Título",
    template: "Altere o título principal para: [DIGITE O NOVO TÍTULO]. Mantenha a mesma tipografia, tamanho e alinhamento visual.",
  },
  {
    icon: TrendingUp,
    label: "Texto de Infográfico",
    template: "Atualize o texto/dado do infográfico para: [DIGITE A NOVA INFORMAÇÃO]. Preserve todos os outros itens e o estilo gráfico idênticos.",
  },
  {
    icon: DollarSign,
    label: "Mudar Preço ou Oferta",
    template: "Altere o valor em destaque para [DIGITE O NOVO PREÇO]. Mantenha o selo, cores e contraste perfeitamente nítidos.",
  },
  {
    icon: Palette,
    label: "Ajustar Cores da Arte",
    template: "Ajuste os tons secundários da arte para tons mais quentes/harmoniosos, preservando os elementos centrais e o layout.",
  },
];

export const ImageAiEditorModal: React.FC<ImageAiEditorModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  format = "portrait",
  onSuccess,
  title = "Editar Imagem com GPT-image-2.5",
}) => {
  const [instruction, setInstruction] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editedUrl, setEditedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"after" | "before">("after");

  const handleApplyEdit = async () => {
    if (!instruction.trim()) {
      setError("Por favor, digite a instrução de alteração desejada.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/imagens/editar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          instruction: instruction.trim(),
          format,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao editar a imagem com IA.");
      }

      if (data.url) {
        setEditedUrl(data.url);
        setActiveTab("after");
      } else {
        throw new Error("Nenhuma imagem retornada pelo modelo.");
      }
    } catch (err: any) {
      console.error("[IMAGE_AI_EDITOR_MODAL] Erro:", err);
      setError(err.message || "Erro inesperado ao processar a edição.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (editedUrl) {
      onSuccess(editedUrl);
      onClose();
    }
  };

  const handleReset = () => {
    setEditedUrl(null);
    setInstruction("");
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Refinamento cirúrgico de títulos, infográficos e elementos com OpenAI GPT-image-2.5
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[11px] font-semibold px-2.5 py-0.5">
              GPT 2.5 Image-to-Image
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
          {/* Coluna da Esquerda: Preview da Imagem */}
          <div className="flex flex-col items-center">
            {editedUrl && (
              <div className="flex w-full mb-2 p-1 bg-slate-100 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("after")}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeTab === "after"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  ✨ Nova Versão (Editada)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("before")}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeTab === "before"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Original
                </button>
              </div>
            )}

            <div className="relative w-full aspect-[4/5] bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <Loader2 className="h-10 w-10 text-amber-400 animate-spin" />
                  <p className="text-white text-sm font-bold">
                    Refinando arte com GPT-image-2.5...
                  </p>
                  <span className="text-slate-400 text-xs max-w-xs">
                    Preservando estilo e aplicando ajustes cirúrgicos no texto e infográfico
                  </span>
                </div>
              ) : (
                <img
                  src={editedUrl && activeTab === "after" ? editedUrl : imageUrl}
                  alt="Pré-visualização da imagem"
                  className="w-full h-full object-contain"
                />
              )}

              {editedUrl && !loading && (
                <div className="absolute top-2.5 left-2.5">
                  <Badge
                    className={
                      activeTab === "after"
                        ? "bg-emerald-500 text-white text-xs font-bold border-none"
                        : "bg-slate-700 text-white text-xs font-bold border-none"
                    }
                  >
                    {activeTab === "after" ? "✓ Versão Nova" : "Original"}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Coluna da Direita: Instruções de Ajuste */}
          <div className="flex flex-col justify-between space-y-4">
            {!editedUrl ? (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                      <span>O que você deseja alterar nesta arte?</span>
                      <span className="text-[11px] font-normal text-gray-500">Ex: texto, números, infográfico</span>
                    </label>
                    <Textarea
                      rows={4}
                      value={instruction}
                      onChange={(e) => {
                        setInstruction(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Ex: Altere o título principal para '5 Passos para o Crescimento' e substitua o segundo item do infográfico por 'Automação Inteligente'..."
                      className="mt-1.5 text-xs rounded-xl resize-none focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>

                  {/* Sugestões Rápidas */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-gray-500 block">
                      Sugestões rápidas de edição:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {QUICK_SUGGESTIONS.map((sug, idx) => {
                        const Icon = sug.icon;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setInstruction(sug.template)}
                            className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors text-xs text-gray-700"
                          >
                            <Icon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span className="truncate font-medium">{sug.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dica:</strong> O modelo preserva as cores, fontes e estilo geral da imagem original, alterando cirurgicamente os textos solicitados.
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <Check className="h-4 w-4" />
                    Edição concluída com sucesso!
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    A imagem foi refinada pelo GPT-image-2.5 com base na sua instrução. Compare com a versão original no alternador acima.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Instrução aplicada:</p>
                  <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 italic">
                    "{instruction}"
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="w-full text-xs rounded-xl font-semibold border-slate-200"
                >
                  <Undo2 className="h-3.5 w-3.5 mr-1.5" />
                  Fazer outro ajuste nesta arte
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="text-xs rounded-xl text-gray-500"
          >
            Fechar
          </Button>

          {!editedUrl ? (
            <Button
              type="button"
              disabled={loading || !instruction.trim()}
              onClick={handleApplyEdit}
              className="bg-accent hover:bg-orange-600 text-white font-bold text-xs rounded-xl h-10 px-5 shadow-sm flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processando com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Aplicar Alteração com IA</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleConfirm}
              className="bg-primary hover:bg-blue-600 text-white font-bold text-xs rounded-xl h-10 px-5 shadow-sm flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Usar Imagem Editada</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

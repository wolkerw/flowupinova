"use client";

import React, { useState, useRef, useCallback } from "react";
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
  Eraser,
  Scissors,
  Crosshair,
  X,
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

interface AreaBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const QUICK_SUGGESTIONS = [
  {
    id: "title",
    icon: Type,
    label: "Trocar Título",
    template: "Altere o título principal para: [DIGITE O NOVO TÍTULO]. Mantenha a mesma tipografia, tamanho e alinhamento visual.",
  },
  {
    id: "infographic",
    icon: TrendingUp,
    label: "Texto de Infográfico",
    template: "Atualize o texto/dado do infográfico para: [DIGITE A NOVA INFORMAÇÃO]. Preserve todos os outros itens e o estilo gráfico idênticos.",
  },
  {
    id: "price",
    icon: DollarSign,
    label: "Mudar Preço ou Oferta",
    template: "Altere o valor em destaque para [DIGITE O NOVO PREÇO]. Mantenha o selo, cores e contraste perfeitamente nítidos.",
  },
  {
    id: "colors",
    icon: Palette,
    label: "Ajustar Cores da Arte",
    template: "Ajuste os tons secundários da arte para tons mais quentes/harmoniosos, preservando os elementos centrais e o layout.",
  },
  {
    id: "erase_area",
    icon: Eraser,
    label: "Apagar Área Selecionada",
    isAreaAction: true,
    actionType: "erase" as const,
    template: "Remova e apague completamente o elemento localizado na área selecionada da imagem. Preencha o espaço harmonizando com a textura, iluminação e cores do fundo original.",
  },
  {
    id: "replace_area",
    icon: Scissors,
    label: "Substituir Área Selecionada",
    isAreaAction: true,
    actionType: "replace" as const,
    template: "Na área selecionada da imagem, substitua o conteúdo atual por: [DIGITE O NOVO ELEMENTO/TEXTO]. Mantenha a mesma iluminação, sombras e integração visual.",
  },
];

function getAreaDescription(box: AreaBox): string {
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  let vPos = "região central";
  if (centerY < 33) vPos = "topo / parte superior";
  else if (centerY > 67) vPos = "base / rodapé";

  let hPos = "ao centro";
  if (centerX < 33) hPos = "lado esquerdo";
  else if (centerX > 67) hPos = "lado direito";

  return `${vPos}, ${hPos} (aprox. ${Math.round(box.x)}% a ${Math.round(box.x + box.width)}% largura, ${Math.round(box.y)}% a ${Math.round(box.y + box.height)}% altura)`;
}

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

  // Estados de Seleção de Área (Inpainting)
  const [isSelectingArea, setIsSelectingArea] = useState<boolean>(false);
  const [areaAction, setAreaAction] = useState<"erase" | "replace" | null>(null);
  const [selectedBox, setSelectedBox] = useState<AreaBox | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Calcula coordenadas percentuais relativas à tag <img>
  const getRelativeCoords = useCallback((clientX: number, clientY: number) => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelectingArea) return;
    const coords = getRelativeCoords(e.clientX, e.clientY);
    if (!coords) return;

    setIsDragging(true);
    setDragStart(coords);
    setSelectedBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    const coords = getRelativeCoords(e.clientX, e.clientY);
    if (!coords) return;

    const minX = Math.min(dragStart.x, coords.x);
    const minY = Math.min(dragStart.y, coords.y);
    const width = Math.abs(coords.x - dragStart.x);
    const height = Math.abs(coords.y - dragStart.y);

    setSelectedBox({ x: minX, y: minY, width, height });
  };

  const updateInstructionForBox = useCallback(
    (box: AreaBox, action: "erase" | "replace") => {
      const desc = getAreaDescription(box);
      if (action === "erase") {
        setInstruction(
          `Remova e apague completamente o elemento localizado na área selecionada (${desc}). Preencha o espaço de forma natural e invisível, harmonizando com a textura, iluminação e cores do fundo da imagem original.`
        );
      } else {
        setInstruction(
          `Na área selecionada (${desc}), substitua o conteúdo atual por: [DIGITE AQUI O NOVO ELEMENTO/TEXTO]. Mantenha a mesma iluminação, sombras, alinhamento e estilo visual do restante da arte.`
        );
      }
    },
    []
  );

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (selectedBox && selectedBox.width > 2 && selectedBox.height > 2) {
      const action = areaAction || "replace";
      setAreaAction(action);
      updateInstructionForBox(selectedBox, action);
    } else {
      setSelectedBox(null);
    }
  };

  const handleSelectQuickSuggestion = (sug: (typeof QUICK_SUGGESTIONS)[number]) => {
    if (sug.isAreaAction) {
      setIsSelectingArea(true);
      setAreaAction(sug.actionType);
      if (selectedBox) {
        updateInstructionForBox(selectedBox, sug.actionType);
      } else {
        setInstruction(sug.template);
      }
    } else {
      setIsSelectingArea(false);
      setSelectedBox(null);
      setAreaAction(null);
      setInstruction(sug.template);
    }
    if (error) setError(null);
  };

  const handleClearAreaSelection = () => {
    setSelectedBox(null);
    setInstruction("");
  };

  const handleToggleAreaAction = (action: "erase" | "replace") => {
    setAreaAction(action);
    if (selectedBox) {
      updateInstructionForBox(selectedBox, action);
    }
  };

  // Gera máscara PNG (onde a área selecionada tem alpha = 0 / transparente)
  const generateMaskPng = async (box: AreaBox): Promise<string | null> => {
    if (!imageRef.current) return null;
    try {
      const img = imageRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 1024;
      canvas.height = img.naturalHeight || 1280;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Fundo branco sólido (alpha = 1 = preserva)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Área selecionada transparente (alpha = 0 = inpainting)
      const clearX = (box.x / 100) * canvas.width;
      const clearY = (box.y / 100) * canvas.height;
      const clearW = (box.width / 100) * canvas.width;
      const clearH = (box.height / 100) * canvas.height;
      ctx.clearRect(clearX, clearY, clearW, clearH);

      return canvas.toDataURL("image/png");
    } catch (err) {
      console.warn("[IMAGE_AI_EDITOR_MODAL] Erro ao gerar máscara de inpainting:", err);
      return null;
    }
  };

  const handleApplyEdit = async () => {
    if (!instruction.trim()) {
      setError("Por favor, digite a instrução de alteração desejada.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let maskDataUrl: string | undefined = undefined;
      if (selectedBox && selectedBox.width > 2 && selectedBox.height > 2) {
        const mask = await generateMaskPng(selectedBox);
        if (mask) maskDataUrl = mask;
      }

      const response = await fetch("/api/imagens/editar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          instruction: instruction.trim(),
          format,
          selectedArea:
            selectedBox && selectedBox.width > 2 && selectedBox.height > 2
              ? {
                  ...selectedBox,
                  action: areaAction || "replace",
                  description: getAreaDescription(selectedBox),
                }
              : undefined,
          maskDataUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao editar a imagem com IA.");
      }

      if (data.url) {
        setEditedUrl(data.url);
        setActiveTab("after");
        setIsSelectingArea(false);
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
    setSelectedBox(null);
    setIsSelectingArea(false);
    setAreaAction(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6 sm:p-7">
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
          {/* Coluna da Esquerda: Preview da Imagem com Seleção Interativa de Área */}
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

            {/* Banner Orientativo do Modo de Seleção de Área */}
            {!editedUrl && isSelectingArea && (
              <div className="w-full mb-2 p-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <Crosshair className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                  <span>
                    {selectedBox
                      ? "Área demarcada! Escolha se deseja apagar ou substituir:"
                      : `Clique e arraste na imagem para marcar a área para ${areaAction === "erase" ? "apagar" : "substituir"}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSelectingArea(false)}
                  className="text-amber-700 hover:text-amber-900 p-1 rounded hover:bg-amber-100"
                  title="Fechar modo de seleção"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div
              ref={imageContainerRef}
              className={`relative w-full aspect-[4/5] bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center select-none ${
                isSelectingArea && !editedUrl ? "cursor-crosshair ring-2 ring-amber-400" : ""
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
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
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    ref={imageRef}
                    src={editedUrl && activeTab === "after" ? editedUrl : imageUrl}
                    alt="Pré-visualização da imagem"
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />

                  {/* Retângulo de Seleção Sobreposto na Imagem */}
                  {!editedUrl && selectedBox && selectedBox.width > 0 && selectedBox.height > 0 && (
                    <div
                      style={{
                        left: `${selectedBox.x}%`,
                        top: `${selectedBox.y}%`,
                        width: `${selectedBox.width}%`,
                        height: `${selectedBox.height}%`,
                      }}
                      className={`absolute pointer-events-none rounded border-2 border-dashed z-20 transition-all ${
                        areaAction === "erase"
                          ? "border-rose-500 bg-rose-500/25 shadow-md shadow-rose-950/40"
                          : "border-sky-400 bg-sky-500/25 shadow-md shadow-sky-950/40"
                      }`}
                    >
                      <div
                        className={`absolute -top-6 left-0 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap flex items-center gap-1 ${
                          areaAction === "erase"
                            ? "bg-rose-600 text-white"
                            : "bg-sky-600 text-white"
                        }`}
                      >
                        {areaAction === "erase" ? "🗑️ Área a Apagar" : "✏️ Área a Substituir"}
                      </div>
                    </div>
                  )}
                </div>
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

            {/* Barra de Ações Rápidas da Área Marcada */}
            {!editedUrl && selectedBox && (
              <div className="w-full mt-2 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleAreaAction("erase")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      areaAction === "erase"
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Eraser className="h-3.5 w-3.5" />
                    <span>Apagar da Área</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleAreaAction("replace")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      areaAction === "replace"
                        ? "bg-sky-600 text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Scissors className="h-3.5 w-3.5" />
                    <span>Substituir Conteúdo</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClearAreaSelection}
                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 font-medium hover:underline flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  <span>Limpar Seleção</span>
                </button>
              </div>
            )}
          </div>

          {/* Coluna da Direita: Instruções de Ajuste */}
          <div className="flex flex-col justify-between space-y-4">
            {!editedUrl ? (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                      <span>O que você deseja alterar nesta arte?</span>
                      <span className="text-[11px] font-normal text-gray-500">
                        {selectedBox ? "Instrução cirúrgica da área" : "Ex: texto, números, infográfico"}
                      </span>
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

                  {/* Sugestões Rápidas de Edição (Incluindo Seleção de Área) */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-gray-500 block">
                      Sugestões rápidas de edição:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {QUICK_SUGGESTIONS.map((sug) => {
                        const Icon = sug.icon;
                        const isAreaBtnActive =
                          sug.isAreaAction && isSelectingArea && areaAction === sug.actionType;
                        return (
                          <button
                            key={sug.id}
                            type="button"
                            onClick={() => handleSelectQuickSuggestion(sug)}
                            className={`flex items-center gap-1.5 p-2 rounded-lg border text-left transition-colors text-xs ${
                              isAreaBtnActive
                                ? sug.actionType === "erase"
                                  ? "border-rose-300 bg-rose-50 text-rose-800 font-bold ring-1 ring-rose-400"
                                  : "border-sky-300 bg-sky-50 text-sky-800 font-bold ring-1 ring-sky-400"
                                : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-gray-700 font-medium"
                            }`}
                          >
                            <Icon
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isAreaBtnActive
                                  ? sug.actionType === "erase"
                                    ? "text-rose-600"
                                    : "text-sky-600"
                                  : "text-amber-600"
                              }`}
                            />
                            <span className="truncate">{sug.label}</span>
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
                    <strong>Dica:</strong> Para apagar ou substituir apenas uma parte específica (título, preço, objeto ou texto), clique em <strong>Apagar Área</strong> ou <strong>Substituir Área</strong> e arraste sobre a imagem para marcar com precisão cirúrgica.
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

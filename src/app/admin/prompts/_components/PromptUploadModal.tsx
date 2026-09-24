"use client";

import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  FileText,
  Camera,
  Layers,
  Sliders,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  PROMPT_DEFAULT_CATEGORIES,
  type AIPromptKnowledgeItem,
  type AIPromptTargetUse,
} from "@/lib/types/ai-prompt-knowledge";

interface PromptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PromptUploadModal({ isOpen, onClose, onSaved }: PromptUploadModalProps) {
  const { toast } = useToast();

  const [step, setStep] = useState<"upload" | "review">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Campos do formulário após transcrição
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Gastronomia & Alimentos");
  const [targetUse, setTargetUse] = useState<AIPromptTargetUse>("product_photo");
  const [rawPrompt, setRawPrompt] = useState("");
  const [subjectTemplate, setSubjectTemplate] = useState("{{produto}}");
  const [lighting, setLighting] = useState("");
  const [cameraAndLens, setCameraAndLens] = useState("");
  const [environment, setEnvironment] = useState("");
  const [composition, setComposition] = useState("");
  const [styleAndMood, setStyleAndMood] = useState("");
  const [negativeRules, setNegativeRules] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [semanticSummary, setSemanticSummary] = useState("");
  const [printImageUrl, setPrintImageUrl] = useState("");

  // Limpar estados ao fechar ou reabrir
  useEffect(() => {
    if (!isOpen) {
      setStep("upload");
      setSelectedFile(null);
      setPreviewUrl("");
      setTitle("");
      setRawPrompt("");
      setPrintImageUrl("");
    }
  }, [isOpen]);

  // Listener para capturar Ctrl+V (colar prints) diretamente na janela do modal
  useEffect(() => {
    if (!isOpen || step !== "upload") return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelected(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, step]);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleTranscribePrint = async () => {
    if (!selectedFile && !previewUrl) {
      toast({
        variant: "destructive",
        title: "Nenhum print selecionado",
        description: "Cole um print com Ctrl+V ou selecione um arquivo de imagem.",
      });
      return;
    }

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/admin/prompts/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao transcrever o print com IA.");
      }

      const { transcription, printImageUrl: uploadedUrl } = data;

      setTitle(transcription.title || "");
      setCategory(transcription.category || "Gastronomia & Alimentos");
      setTargetUse(transcription.targetUse || "product_photo");
      setRawPrompt(transcription.rawPrompt || "");
      setSubjectTemplate(transcription.sections?.subjectTemplate || "{{produto}}");
      setLighting(transcription.sections?.lighting || "");
      setCameraAndLens(transcription.sections?.cameraAndLens || "");
      setEnvironment(transcription.sections?.environment || "");
      setComposition(transcription.sections?.composition || "");
      setStyleAndMood(transcription.sections?.styleAndMood || "");
      setNegativeRules(transcription.sections?.negativeRules || "");
      setKeywordsText(transcription.triggerKeywords?.join(", ") || "");
      setSemanticSummary(transcription.semanticSummary || "");
      if (uploadedUrl) setPrintImageUrl(uploadedUrl);

      setStep("review");
      toast({
        title: "Print transcrito com sucesso!",
        description: "A IA extraiu o prompt e dividiu em seções técnicas. Revise e salve na central.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro na transcrição",
        description: err.message || "Não foi possível transcrever a imagem.",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!title.trim() || !rawPrompt.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha o título e o prompt antes de salvar.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const triggerKeywords = keywordsText
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          targetUse,
          rawPrompt,
          sections: {
            subjectTemplate,
            environment,
            lighting,
            cameraAndLens,
            composition,
            styleAndMood,
            negativeRules,
          },
          triggerKeywords,
          semanticSummary,
          printImageUrl: printImageUrl || undefined,
          active: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao salvar prompt na central.");
      }

      toast({
        title: "Prompt cadastrado!",
        description: `O modelo "${title}" agora enriquece automaticamente as criações dos usuários.`,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: err.message || "Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <Sparkles className="h-5 w-5 text-accent" />
            Cadastrar Novo Prompt na Central
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {step === "upload"
              ? "Cole um print de prompt com Ctrl+V ou selecione um arquivo. A IA transcreverá e seccionará tudo automaticamente."
              : "Revise a transcrição e o seccionamento técnico realizado pela IA antes de salvar na central."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-6 pt-4">
            {/* Zona de Drop e Ctrl+V */}
            <div
              className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                previewUrl
                  ? "border-accent bg-orange-50/20"
                  : "border-gray-300 hover:border-accent hover:bg-slate-50/60"
              }`}
              onClick={() => {
                const el = document.getElementById("fileInputModal");
                if (el) el.click();
              }}
            >
              <input
                id="fileInputModal"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
              />

              {previewUrl ? (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="relative max-h-64 max-w-sm rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <img src={previewUrl} alt="Print Selecionado" className="object-contain max-h-64 w-auto" />
                  </div>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50">
                    ✓ Print carregado com sucesso
                  </Badge>
                  <p className="text-xs text-gray-500">
                    Clique para trocar a imagem ou cole outro print com <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-[10px] font-mono">Ctrl+V</kbd>
                  </p>
                </div>
              ) : (
                <div className="space-y-3 py-6">
                  <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-orange-100 text-accent">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      Cole seu print aqui com <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+V</kbd>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Ou clique para selecionar um arquivo de imagem (PNG, JPG ou JPEG)
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    💡 Dica: tire print de qualquer prompt do Midjourney, ChatGPT ou Discord e aperte Ctrl+V.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isTranscribing} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleTranscribePrint}
                disabled={!previewUrl || isTranscribing}
                className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl gap-2 shadow-sm"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Lendo print e seccionando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Transcrever e Seccionar com IA
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Coluna da Esquerda: Print Original */}
              <div className="lg:col-span-4 space-y-3">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-accent" />
                  Print Original
                </Label>
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-slate-900/5 max-h-80 flex items-center justify-center p-2">
                  <img
                    src={previewUrl}
                    alt="Print de Referência"
                    className="max-h-72 w-auto object-contain rounded-lg shadow-2xs"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("upload")}
                  className="w-full text-xs rounded-xl"
                >
                  Trocar Print / Imagem
                </Button>
              </div>

              {/* Coluna da Direita: Seções Extraídas pela IA */}
              <div className="lg:col-span-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="titleInput" className="text-xs font-bold text-gray-700">
                      Título do Prompt
                    </Label>
                    <Input
                      id="titleInput"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="rounded-xl mt-1 text-sm font-semibold"
                      placeholder="Ex: Hambúrguer Artesanal com Fumaça"
                    />
                  </div>

                  <div>
                    <Label htmlFor="categorySelect" className="text-xs font-bold text-gray-700">
                      Categoria / Nicho
                    </Label>
                    <select
                      id="categorySelect"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 px-3 mt-1 rounded-xl border border-gray-200 bg-white text-sm focus:border-accent focus:ring-accent"
                    >
                      {PROMPT_DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="rawPromptInput" className="text-xs font-bold text-gray-700">
                    Prompt Completo Transcrito
                  </Label>
                  <Textarea
                    id="rawPromptInput"
                    rows={3}
                    value={rawPrompt}
                    onChange={(e) => setRawPrompt(e.target.value)}
                    className="rounded-xl mt-1 text-xs resize-none"
                  />
                </div>

                {/* Seções Técnicas */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-accent" />
                    Seccionamento Técnico Extraído
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold text-gray-600">
                        Sujeito (use {"{{produto}}"} para substituição)
                      </Label>
                      <Input
                        value={subjectTemplate}
                        onChange={(e) => setSubjectTemplate(e.target.value)}
                        className="rounded-lg text-xs mt-0.5 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-gray-600">Iluminação Técnica</Label>
                      <Input
                        value={lighting}
                        onChange={(e) => setLighting(e.target.value)}
                        className="rounded-lg text-xs mt-0.5 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-gray-600">Câmera e Lente</Label>
                      <Input
                        value={cameraAndLens}
                        onChange={(e) => setCameraAndLens(e.target.value)}
                        className="rounded-lg text-xs mt-0.5 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-gray-600">Composição e Ângulo</Label>
                      <Input
                        value={composition}
                        onChange={(e) => setComposition(e.target.value)}
                        className="rounded-lg text-xs mt-0.5 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-gray-600">Cenário e Fundo</Label>
                      <Input
                        value={environment}
                        onChange={(e) => setEnvironment(e.target.value)}
                        className="rounded-lg text-xs mt-0.5 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-gray-600">Estilo e Clima</Label>
                      <Input
                        value={styleAndMood}
                        onChange={(e) => setStyleAndMood(e.target.value)}
                        className="rounded-lg text-xs mt-0.5 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="keywordsInput" className="text-xs font-bold text-gray-700">
                    Palavras-Chave Gatilho (separadas por vírgula)
                  </Label>
                  <Input
                    id="keywordsInput"
                    value={keywordsText}
                    onChange={(e) => setKeywordsText(e.target.value)}
                    placeholder="hambúrguer, lanche artesanal, burger, artesanais"
                    className="rounded-xl mt-1 text-xs"
                  />
                  <span className="text-[11px] text-gray-400">
                    Quando o usuário digitar algum desses termos, este prompt será acionado para enriquecer a arte.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setStep("upload")} className="rounded-xl">
                Voltar
              </Button>
              <Button
                type="button"
                onClick={handleSavePrompt}
                disabled={isSaving}
                className="bg-accent hover:bg-accent/90 text-white font-bold rounded-xl gap-2 shadow-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando na Central...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Salvar na Central de Prompts
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  Star,
  QrCode,
  Tag,
  FolderOpen,
  Shirt,
  Coffee,
  Truck,
  Loader2,
  Camera,
  Printer,
  Download,
  Copy,
  Sparkles,
  ExternalLink,
  Check,
  ShoppingBag,
  ShieldCheck,
  Heart,
  Eye,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export interface PdvStudioProps {
  brandName: string;
  slogan?: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  phone?: string;
  instagram?: string;
  website?: string;
  email?: string;
  address?: string;
  initialMockups?: Record<string, string>;
  onMockupSaved?: (mockupKey: string, url: string) => void;
}

export function PdvStudio({
  brandName,
  slogan = "",
  primaryColor,
  secondaryColor,
  logoUrl,
  phone = "(11) 99999-8888",
  instagram = "seunegocio",
  website = "www.suaempresa.com.br",
  email = "contato@suaempresa.com.br",
  address = "Av. Paulista, 1000 - São Paulo, SP",
  initialMockups,
  onMockupSaved,
}: PdvStudioProps) {
  const { toast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<"google" | "stickers" | "folder" | "mockups">("google");

  // ==========================================
  // ESTADOS: DISPLAY GOOGLE MEU NEGÓCIO (A5)
  // ==========================================
  const [googleReviewUrl, setGoogleReviewUrl] = useState(
    `https://search.google.com/local/writereview?placeid=${encodeURIComponent(brandName.toLowerCase().replace(/\s+/g, "-"))}`
  );
  const [displayHeadline, setDisplayHeadline] = useState("Sua opinião é fundamental para nós!");
  const [displaySubtitle, setDisplaySubtitle] = useState(
    "Aponte a câmera do celular para o QR Code abaixo e conte como foi sua experiência no Google."
  );
  const [hasReward, setHasReward] = useState(false);
  const [rewardText, setRewardText] = useState("Mostre sua avaliação no balcão e ganhe 10% de desconto!");
  const [tableNumber, setTableNumber] = useState("");

  // ==========================================
  // ESTADOS: LACRES E ADESIVOS DE DELIVERY
  // ==========================================
  const [stickerShape, setStickerShape] = useState<"round" | "square">("round");
  const [stickerSize, setStickerSize] = useState<"5cm" | "7cm">("5cm");
  const [stickerPreset, setStickerPreset] = useState<"carinho" | "especial" | "seguranca" | "gratidao" | "custom">("carinho");
  const [customStickerText, setCustomStickerText] = useState("Feito especialmente para você!");
  const [includeStickerSocials, setIncludeStickerSocials] = useState(true);

  const getStickerMessage = () => {
    switch (stickerPreset) {
      case "carinho":
        return "Feito com muito carinho para você 💖";
      case "especial":
        return "Cuidado: Conteúdo muito especial aqui dentro! ✨";
      case "seguranca":
        return "Lacre de Segurança • 100% Autêntico e Protegido 🔒";
      case "gratidao":
        return "Obrigado pela preferência! Você é incrível 🙌";
      case "custom":
        return customStickerText || "Qualidade e dedicação em cada detalhe";
    }
  };

  // ==========================================
  // ESTADOS: PASTA CORPORATIVA
  // ==========================================
  const [folderView, setFolderView] = useState<"closed" | "open">("closed");
  const [folderTitle, setFolderTitle] = useState("Proposta Comercial & Institucional");
  const [folderSubtitle, setFolderSubtitle] = useState("Soluções Estratégicas para o seu Negócio");
  const [hasCardSlot, setHasCardSlot] = useState(true);

  // ==========================================
  // ESTADOS: MOCKUPS DE MARCA
  // ==========================================
  const [mockupType, setMockupType] = useState<"polo" | "mug" | "fleet" | "bag" | "facade">("polo");
  const [mockupColor, setMockupColor] = useState<"dark" | "light" | "brand">("brand");
  const [isGeneratingAiMockup, setIsGeneratingAiMockup] = useState(false);
  const [aiMockups, setAiMockups] = useState<Record<string, string>>(initialMockups || {});
  const [mockupViewMode, setMockupViewMode] = useState<"interactive" | "ai_photo">("interactive");

  const isSingleVariant = mockupType === "bag" || mockupType === "facade";
  const activeMockupKey = isSingleVariant ? `${mockupType}_default` : `${mockupType}_${mockupColor}`;

  const getExistingMockup = (type: string, color: string) => {
    if (type === "bag" || type === "facade") {
      return (
        aiMockups[`${type}_default`] ||
        aiMockups[`${type}_brand`] ||
        aiMockups[`${type}_dark`] ||
        aiMockups[`${type}_light`]
      );
    }
    return aiMockups[`${type}_${color}`];
  };

  // Sincronizar mockups salvos na nuvem quando carregados do Firestore
  useEffect(() => {
    if (initialMockups && Object.keys(initialMockups).length > 0) {
      setAiMockups((prev) => {
        const merged = { ...initialMockups, ...prev };
        for (const [k, v] of Object.entries(initialMockups)) {
          if (typeof v === "string" && v.startsWith("data:") && (!prev[k] || prev[k].startsWith("http"))) {
            merged[k] = v;
          }
        }
        return merged;
      });
    }
  }, [initialMockups]);

  // Ao alternar tipo ou tom de cor, ou quando aiMockups atualizar, se já houver imagem gerada, alternar para a foto
  useEffect(() => {
    const existing = getExistingMockup(mockupType, mockupColor);
    if (existing) {
      setMockupViewMode("ai_photo");
    } else {
      setMockupViewMode("interactive");
    }
  }, [mockupType, mockupColor, aiMockups]);

  // Geração Fotográfica do Mockup com IA
  const handleGenerateAiMockup = async () => {
    setIsGeneratingAiMockup(true);
    try {
      const targetColor = isSingleVariant ? "default" : mockupColor;
      const res = await fetch("/api/brand-studio/mockup/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          slogan,
          mockupType,
          mockupColor: targetColor,
          primaryColor,
          secondaryColor,
          logoUrl,
          phone,
          website,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao gerar fotografia do mockup com IA.");
      }

      const key = activeMockupKey;
      setAiMockups((prev) => ({
        ...prev,
        [key]: data.imageUrl,
      }));
      setMockupViewMode("ai_photo");
      onMockupSaved?.(key, data.cloudUrl || data.imageUrl);

      toast({
        title: "Mockup Fotográfico Salvo com Sucesso! 📸✨",
        description: "Fotografia realista gerada e integrada com fidelidade à sua marca.",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao Gerar com IA",
        description: err.message || "Não foi possível gerar a fotografia no momento.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAiMockup(false);
    }
  };

  // Handler de Impressão Direta
  const handlePrint = (title: string) => {
    toast({
      title: "Preparando Impressão Gráfica 🖨️",
      description: `Gerando visualização de impressão para ${title} em alta definição.`,
    });
    window.print();
  };

  // Handler de Cópia de Link
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado com Sucesso!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* SELETOR DAS 4 FERRAMENTAS DO PDV */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-white shadow-2xs print:hidden">
        <button
          type="button"
          onClick={() => setActiveSubTab("google")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === "google"
              ? "bg-[#0083C7] text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          Display Google (Avaliações A5)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("stickers")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === "stickers"
              ? "bg-[#0083C7] text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Tag className="h-4 w-4" />
          Lacres & Adesivos de Sacola
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("folder")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === "folder"
              ? "bg-[#0083C7] text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          Pastas de Proposta Comercial
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("mockups")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === "mockups"
              ? "bg-[#0083C7] text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Shirt className="h-4 w-4" />
          Mockups de Marca (Uniformes & Loja)
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. DISPLAY DE BALCÃO "AVALIE-NOS NO GOOGLE" (A5) */}
      {/* ========================================================================= */}
      {activeSubTab === "google" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Painel de Controles */}
          <Card className="lg:col-span-5 border border-slate-200 bg-white rounded-2xl shadow-sm print:hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                Configurar Display de Mesa / Balcão
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Incentive clientes presenciais a avaliarem sua empresa no Google com 5 estrelas.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Link de Avaliação do Google Meu Negócio</Label>
                <div className="flex gap-2">
                  <Input
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/.../review"
                    className="h-9 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(googleReviewUrl, "Link do Google")}
                    className="shrink-0 h-9 px-2 text-xs"
                    title="Copiar Link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-[10px] text-slate-500">
                  O QR Code é atualizado em tempo real com este endereço.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Título de Destaque</Label>
                <Input
                  value={displayHeadline}
                  onChange={(e) => setDisplayHeadline(e.target.value)}
                  placeholder="Ex: Sua opinião é fundamental para nós!"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Texto de Orientação</Label>
                <Input
                  value={displaySubtitle}
                  onChange={(e) => setDisplaySubtitle(e.target.value)}
                  placeholder="Ex: Aponte a câmera do celular..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Oferecer Vantagem / Recompensa (Opcional)</Label>
                  <input
                    type="checkbox"
                    checked={hasReward}
                    onChange={(e) => setHasReward(e.target.checked)}
                    className="h-4 w-4 rounded text-[#0083C7] focus:ring-[#0083C7]"
                  />
                </div>
                {hasReward && (
                  <Input
                    value={rewardText}
                    onChange={(e) => setRewardText(e.target.value)}
                    placeholder="Ex: Mostre sua avaliação e ganhe 10% de desconto!"
                    className="h-9 text-xs mt-1 border-amber-300 bg-amber-50/50"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Identificador de Mesa / Ponto (Opcional)</Label>
                <Input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ex: Mesa 04 ou Balcão Recepção"
                  className="h-9 text-xs"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={() => handlePrint("Display Google A5")}
                  className="w-full bg-[#0083C7] hover:bg-[#0083C7]/90 text-white font-bold text-xs h-10 rounded-xl"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Display A5 com Marcas de Corte
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Prévia Visual do Totem A5 */}
          <div className="lg:col-span-7 flex flex-col items-center print:w-full print:block">
            <div className="w-full flex items-center justify-between mb-3 px-2 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Prévia Gráfica Real • Padrão A5 (148 x 210 mm)
              </span>
              <Badge variant="outline" className="text-[10px] bg-white">
                Pronto para Display de Acrílico
              </Badge>
            </div>

            {/* Suporte Acrílico e Totem A5 */}
            <div className="relative p-6 sm:p-10 bg-slate-200/70 rounded-3xl border border-slate-300 w-full flex justify-center shadow-inner print:p-0 print:bg-transparent print:border-none print:shadow-none print:rounded-none">
              <div
                className="w-full max-w-[340px] aspect-[148/210] bg-white rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col justify-between text-center relative overflow-hidden border border-slate-100 print:w-[148mm] print:h-[210mm] print:max-w-[148mm] print:max-h-[210mm] print:mx-auto print:shadow-none print:border print:border-slate-300 print:rounded-none print:p-8"
                style={{
                  borderTop: `6px solid ${primaryColor}`,
                }}
              >
                {/* Marcas de corte nas 4 quinas para impressão gráfica A5 */}
                <div className="hidden print:block absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-slate-900 pointer-events-none" />
                <div className="hidden print:block absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-slate-900 pointer-events-none" />
                <div className="hidden print:block absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-slate-900 pointer-events-none" />
                <div className="hidden print:block absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-slate-900 pointer-events-none" />
                {/* Linha decorativa no topo */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{
                    background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                  }}
                />

                {/* Cabeçalho com Logo e Nome */}
                <div className="flex flex-col items-center gap-1 pt-2">
                  <div className="h-14 max-w-[200px] flex items-center justify-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt={brandName} className="max-h-14 max-w-full object-contain drop-shadow-xs" />
                    ) : (
                      <span className="text-lg font-black text-slate-900">
                        {brandName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {!logoUrl && (
                    <h4 className="text-sm font-black text-slate-900 tracking-wide mt-1">
                      {brandName.toUpperCase()}
                    </h4>
                  )}
                  {slogan && (
                    <p className="text-[10px] text-slate-600 font-medium uppercase tracking-wider mt-0.5">
                      {slogan}
                    </p>
                  )}
                </div>

                {/* 5 Estrelas e Chamada */}
                <div className="my-2 space-y-1.5">
                  <div className="flex justify-center items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400 drop-shadow-xs" />
                    ))}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    {displayHeadline}
                  </h3>
                  <p className="text-[10px] text-slate-600 leading-relaxed px-2">
                    {displaySubtitle}
                  </p>
                </div>

                {/* QR Code com moldura de alta densidade */}
                <div className="flex flex-col items-center justify-center my-1">
                  <div className="p-2.5 rounded-2xl bg-white border-2 border-slate-200 shadow-md">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                        googleReviewUrl
                      )}`}
                      alt="QR Code Google Review"
                      className="h-28 w-28 object-contain"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 mt-2 flex items-center gap-1">
                    <QrCode className="h-3 w-3 text-[#0083C7]" />
                    Escanear com a câmera
                  </span>
                </div>

                {/* Recompensa ou Selo */}
                {hasReward ? (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold">
                    🎁 {rewardText}
                  </div>
                ) : (
                  tableNumber && (
                    <div className="text-[9px] font-bold text-slate-400 tracking-wider">
                      {tableNumber.toUpperCase()}
                    </div>
                  )
                )}

                {/* Rodapé com selo Google */}
                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[8px] text-slate-400">
                  <span className="font-semibold text-slate-600">Google Avaliações</span>
                  <span className="truncate max-w-[150px]">{website}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LACRES DE EMBALAGEM E ADESIVOS DE DELIVERY */}
      {/* ========================================================================= */}
      {activeSubTab === "stickers" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Painel de Controles */}
          <Card className="lg:col-span-5 border border-slate-200 bg-white rounded-2xl shadow-sm print:hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#FA6305]" />
                Personalizar Lacres & Adesivos
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Encante clientes ao receberem pedidos e proteja suas embalagens com estilo.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Formato da Faca</Label>
                  <select
                    value={stickerShape}
                    onChange={(e) => setStickerShape(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
                  >
                    <option value="round">Redondo (Circular)</option>
                    <option value="square">Quadrado / Cantos Arredondados</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Diâmetro / Tamanho</Label>
                  <select
                    value={stickerSize}
                    onChange={(e) => setStickerSize(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
                  >
                    <option value="5cm">5 x 5 cm (Padrão Sacolas)</option>
                    <option value="7cm">7 x 7 cm (Caixas Grandes)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Mensagem do Lacre</Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: "carinho", label: "Feito com carinho para você 💖" },
                    { id: "especial", label: "Cuidado: Conteúdo especial! ✨" },
                    { id: "seguranca", label: "Lacre de Segurança • 100% Autêntico 🔒" },
                    { id: "gratidao", label: "Obrigado pela preferência! 🙌" },
                    { id: "custom", label: "Escrever mensagem personalizada..." },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setStickerPreset(preset.id as any)}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        stickerPreset === preset.id
                          ? "border-[#FA6305] bg-[#FA6305]/10 text-slate-900"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {stickerPreset === "custom" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Texto Personalizado</Label>
                  <Input
                    value={customStickerText}
                    onChange={(e) => setCustomStickerText(e.target.value)}
                    placeholder="Ex: Embalado com dedicação e amor..."
                    className="h-9 text-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <Label className="text-xs font-bold text-slate-700">Incluir @Instagram e WhatsApp</Label>
                <input
                  type="checkbox"
                  checked={includeStickerSocials}
                  onChange={(e) => setIncludeStickerSocials(e.target.checked)}
                  className="h-4 w-4 rounded text-[#FA6305] focus:ring-[#FA6305]"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={() => handlePrint("Cartela A4 de Adesivos")}
                  className="w-full bg-[#FA6305] hover:bg-[#FA6305]/90 text-white font-bold text-xs h-10 rounded-xl"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Folha A4 com Cartela de Adesivos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Prévia Visual do Adesivo / Lacre */}
          <div className="lg:col-span-7 flex flex-col items-center print:w-full print:block">
            <div className="w-full flex items-center justify-between mb-3 px-2 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Visualização do Lacre Individual ({stickerSize})
              </span>
              <Badge variant="outline" className="text-[10px] bg-white">
                Faca de Corte Gráfica
              </Badge>
            </div>

            {/* Container do Adesivo com faca de corte */}
            <div className="p-8 sm:p-12 bg-slate-200/70 rounded-3xl border border-slate-300 w-full flex flex-col items-center justify-center gap-6 shadow-inner print:p-0 print:bg-transparent print:border-none print:shadow-none print:rounded-none">
              <div
                className={`w-64 h-64 bg-white shadow-2xl p-6 flex flex-col items-center justify-between text-center relative border-2 border-dashed border-red-400 transition-all ${
                  stickerShape === "round" ? "rounded-full" : "rounded-3xl"
                }`}
                style={{
                  boxShadow: "0 20px 30px -10px rgba(0,0,0,0.15)",
                }}
              >
                {/* Arco Superior ou Borda */}
                <div
                  className={`absolute inset-1.5 border pointer-events-none ${
                    stickerShape === "round" ? "rounded-full" : "rounded-2xl"
                  }`}
                  style={{ borderColor: primaryColor }}
                />

                {/* Logo da Marca */}
                <div className="pt-2 flex flex-col items-center">
                  <div className="h-12 max-w-[140px] flex items-center justify-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt={brandName} className="max-h-12 max-w-full object-contain drop-shadow-xs" />
                    ) : (
                      <span className="text-xs font-black text-slate-900">
                        {brandName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {!logoUrl && (
                    <span className="text-[10px] font-extrabold text-slate-900 mt-1 uppercase tracking-wider">
                      {brandName}
                    </span>
                  )}
                </div>

                {/* Mensagem Principal */}
                <div className="my-auto px-4">
                  <p className="text-xs font-black text-slate-900 leading-snug">
                    {getStickerMessage()}
                  </p>
                </div>

                {/* Redes Sociais no Rodapé */}
                {includeStickerSocials && (
                  <div className="pb-2 text-[9px] font-bold text-slate-600 flex flex-col items-center">
                    <span style={{ color: secondaryColor }}>@{instagram}</span>
                    <span className="text-[8px] text-slate-400 font-normal">{phone}</span>
                  </div>
                )}
              </div>

              {/* Prévia da Cartela A4 (Miniatura) */}
              <div className="w-full max-w-md p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between print:hidden">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Cartela para Impressora A4</h5>
                  <p className="text-[11px] text-slate-500">
                    Gera {stickerSize === "5cm" ? "15 adesivos" : "8 adesivos"} por folha adesiva couché.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrint("Cartela A4 de Adesivos")}
                  className="text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Salvar PDF A4
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PASTAS CORPORATIVAS DE PROPOSTA */}
      {/* ========================================================================= */}
      {activeSubTab === "folder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Painel de Controles */}
          <Card className="lg:col-span-5 border border-slate-200 bg-white rounded-2xl shadow-sm print:hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-[#0083C7]" />
                Pasta Corporativa com Porta-Cartão
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Apresente propostas de alto valor com acabamento executivo para fechar contratos.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Título da Capa da Pasta</Label>
                <Input
                  value={folderTitle}
                  onChange={(e) => setFolderTitle(e.target.value)}
                  placeholder="Ex: Proposta Comercial & Institucional"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Subtítulo / Descrição da Capa</Label>
                <Input
                  value={folderSubtitle}
                  onChange={(e) => setFolderSubtitle(e.target.value)}
                  placeholder="Ex: Soluções Estratégicas para o seu Negócio"
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Label className="text-xs font-bold text-slate-700">Bolsa Interna com Encaixe de Cartão</Label>
                <input
                  type="checkbox"
                  checked={hasCardSlot}
                  onChange={(e) => setHasCardSlot(e.target.checked)}
                  className="h-4 w-4 rounded text-[#0083C7] focus:ring-[#0083C7]"
                />
              </div>

              {/* Especificações para Gráfica */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h6 className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Especificações Técnicas de Produção:
                </h6>
                <ul className="text-[10px] text-slate-600 space-y-1 list-disc pl-4">
                  <li>Formato Fechado: 22,5 x 31,5 cm (comporta folhas A4)</li>
                  <li>Formato Aberto: 45 x 31,5 cm + orelha/bolsa de 7 cm</li>
                  <li>Papel Recomendado: Couché 300g ou Supremo 300g</li>
                  <li>Acabamento: Laminação fosca + Verniz localizado no logo</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={() => handlePrint("Faca Gráfica de Pasta Corporativa")}
                  className="w-full bg-[#0083C7] hover:bg-[#0083C7]/90 text-white font-bold text-xs h-10 rounded-xl"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Faca Aberta para Gráfica
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Prévia Visual da Pasta */}
          <div className="lg:col-span-7 flex flex-col items-center print:w-full print:block">
            <div className="w-full flex items-center justify-between mb-3 px-2 print:hidden">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFolderView("closed")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    folderView === "closed" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                  }`}
                >
                  Pasta Fechada (Capa)
                </button>
                <button
                  type="button"
                  onClick={() => setFolderView("open")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    folderView === "open" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                  }`}
                >
                  Faca Aberta (Interna com Bolsa)
                </button>
              </div>

              <Badge variant="outline" className="text-[10px] bg-white">
                Comporta A4 (300g)
              </Badge>
            </div>

            {/* Container da Pasta */}
            <div className="p-6 sm:p-10 bg-slate-200/70 rounded-3xl border border-slate-300 w-full flex justify-center shadow-inner print:p-0 print:bg-transparent print:border-none print:shadow-none print:rounded-none">
              {folderView === "closed" ? (
                /* CAPA DA PASTA FECHADA */
                <div
                  className="w-full max-w-[360px] aspect-[225/315] bg-slate-900 rounded-2xl shadow-2xl p-8 flex flex-col justify-between text-white relative overflow-hidden border border-slate-800 print:max-w-none print:shadow-none print:border-slate-700 print:rounded-none print:mx-auto"
                >
                  {/* Faixa diagonal geométrica institucional */}
                  <div
                    className="absolute -right-24 -top-24 w-64 h-64 rounded-full opacity-30 blur-2xl pointer-events-none"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div
                    className="absolute top-0 left-0 right-0 h-2"
                    style={{
                      background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                    }}
                  />

                  {/* Logo no topo da capa */}
                  <div className="flex items-center gap-3 pt-4">
                    <div className="h-16 max-w-[200px] flex items-center justify-center">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={brandName}
                          className="max-h-16 max-w-full object-contain drop-shadow-lg"
                        />
                      ) : (
                        <span className="text-xl font-black text-white">
                          {brandName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      {!logoUrl && (
                        <h3 className="text-lg font-black tracking-wider text-white">
                          {brandName.toUpperCase()}
                        </h3>
                      )}
                      {slogan && (
                        <p className="text-[11px] text-slate-300 tracking-widest uppercase">
                          {slogan}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Título Central da Proposta */}
                  <div className="my-auto space-y-2">
                    <div className="h-1 w-12 rounded" style={{ backgroundColor: secondaryColor }} />
                    <h2 className="text-xl font-black text-white leading-tight">
                      {folderTitle}
                    </h2>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {folderSubtitle}
                    </p>
                  </div>

                  {/* Rodapé da Capa com Dados Corporativos */}
                  <div className="border-t border-slate-800 pt-4 flex flex-col gap-1 text-[10px] text-slate-400">
                    <div className="flex justify-between">
                      <span>{website}</span>
                      <span>{phone}</span>
                    </div>
                    <span className="text-[9px] text-slate-500">{address}</span>
                  </div>
                </div>
              ) : (
                /* FACA ABERTA COM BOLSA E ENCAIXE DE CARTÃO */
                <div className="w-full max-w-[520px] aspect-[450/315] bg-white rounded-2xl shadow-2xl p-6 grid grid-cols-2 gap-4 relative overflow-hidden border border-slate-300 print:max-w-none print:shadow-none print:rounded-none print:mx-auto">
                  {/* Linha de dobra central */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-px border-r-2 border-dashed border-slate-300" />

                  {/* Lado Esquerdo Interno */}
                  <div className="flex flex-col justify-between p-3 text-slate-400 text-[10px]">
                    <span className="font-bold uppercase tracking-wider text-slate-500">
                      Parte Interna Esquerda
                    </span>
                    <p className="text-[11px] text-slate-400 italic">
                      Espaço livre para visualização das folhas de proposta anexadas.
                    </p>
                    <span className="text-[9px]">{brandName} • Documento Confidencial</span>
                  </div>

                  {/* Lado Direito Interno com Bolsa/Orelha */}
                  <div className="flex flex-col justify-end p-2 relative">
                    {/* Bolsa com faca */}
                    <div className="h-36 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 p-3 flex flex-col justify-between relative shadow-sm">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                        <span>Bolsa / Orelha (7 cm)</span>
                        <Badge variant="secondary" className="text-[9px]">Faca Gráfica</Badge>
                      </div>

                      {/* Encaixe de Cartão de Visita */}
                      {hasCardSlot && (
                        <div className="w-36 h-20 mx-auto rounded-lg bg-white border border-slate-300 p-2 shadow-xs flex flex-col justify-between relative">
                          <div className="flex items-center gap-1.5">
                            <div className="h-4 w-4 rounded bg-slate-100 flex items-center justify-center text-[8px] font-bold">
                              {brandName.slice(0, 1)}
                            </div>
                            <span className="text-[8px] font-bold text-slate-800 truncate">
                              {brandName}
                            </span>
                          </div>
                          <span className="text-[7px] text-slate-400">Cartão de Visita Acoplado</span>
                          <div className="h-0.5 w-full bg-slate-200 rounded" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MOCKUPS REALISTAS DE MARCA (UNIFORMES & LOJA) */}
      {/* ========================================================================= */}
      {activeSubTab === "mockups" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Painel de Controles */}
          <Card className="lg:col-span-5 border border-slate-200 bg-white rounded-2xl shadow-sm print:hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shirt className="h-4 w-4 text-[#0083C7]" />
                Simulação de Mockups da Marca
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Visualize sua identidade aplicada em uniformes, sacolas de embalagem e fachada.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Selecione o Contexto de Aplicação</Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: "polo", label: "Camisa Polo Corporativa (Uniforme)", desc: "Bordado no peito esquerdo com alta precisão", icon: Shirt },
                    { id: "mug", label: "Caneca de Porcelana (Brindes & Café)", desc: "Estampa de alta fusão em cerâmica brilhante", icon: Coffee },
                    { id: "fleet", label: "Frota / Veículo Comercial (Plotagem)", desc: "Envelopamento automotivo e identificação visual", icon: Truck },
                    { id: "bag", label: "Sacola Kraft Ecológica (Embalagem)", desc: "Logo estampado em tinta preta e relevo seco", icon: ShoppingBag },
                    { id: "facade", label: "Placa de Recepção / Fachada 3D", desc: "Letras caixa em acrílico e aço escovado", icon: Store },
                  ].map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMockupType(item.id as any)}
                        className={`text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                          mockupType === item.id
                            ? "border-[#0083C7] bg-[#0083C7]/10 text-slate-900 shadow-xs ring-1 ring-[#0083C7]/20"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            mockupType === item.id ? "bg-[#0083C7] text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div>
                          <h6 className="text-xs font-bold">{item.label}</h6>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {!isSingleVariant ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Tom de Cor do Uniforme / Material</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMockupColor("dark")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        mockupColor === "dark" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Preto / Escuro
                    </button>
                    <button
                      type="button"
                      onClick={() => setMockupColor("light")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        mockupColor === "light" ? "bg-slate-100 text-slate-900 border-slate-300" : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Branco / Claro
                    </button>
                    <button
                      type="button"
                      onClick={() => setMockupColor("brand")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        mockupColor === "brand" ? "text-white border-transparent" : "bg-white text-slate-700 border-slate-200"
                      }`}
                      style={{
                        backgroundColor: mockupColor === "brand" ? primaryColor : undefined,
                      }}
                    >
                      Cor da Marca
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {mockupType === "bag" ? "Material Padrão" : "Acabamento Arquitetônico"}
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-white text-slate-700 font-semibold border-slate-300">
                    {mockupType === "bag" ? "Papel Kraft Ecológico" : "Acrílico 3D & Aço Escovado"}
                  </Badge>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  disabled={isGeneratingAiMockup}
                  onClick={handleGenerateAiMockup}
                  className="w-full bg-[#FA6305] hover:bg-[#FA6305]/90 text-white font-bold text-xs h-10 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
                >
                  {isGeneratingAiMockup ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando Fotografia com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-amber-200" />
                      Gerar Fotografia com IA
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => handlePrint(`Mockup de ${mockupType}`)}
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs h-9 rounded-xl"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Salvar / Imprimir Mockup
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Prévia do Mockup */}
          {(() => {
            const currentAiPhoto = getExistingMockup(mockupType, mockupColor);
            return (
              <div className="lg:col-span-7 flex flex-col items-center print:w-full print:block">
                <div className="w-full flex items-center justify-between gap-2 mb-3 px-2 print:hidden">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Simulação de Marca
                  </span>
                </div>

                {mockupViewMode === "ai_photo" && currentAiPhoto ? (
                  /* =================================================================== */
                  /* FOTOGRAFIA REALISTA GERADA COM IA (WIDESCREEN 16:9 STUDIO)         */
                  /* =================================================================== */
                  <div className="p-4 sm:p-6 bg-slate-900 rounded-3xl border border-slate-700 w-full flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-950 flex items-center justify-center">
                      <img
                        src={currentAiPhoto}
                        alt={`Mockup Fotográfico de ${mockupType}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between w-full px-1 text-[10px] text-slate-400">
                      <span>Renderização Fotográfica com IA (16:9)</span>
                      <a
                        href={currentAiPhoto}
                        download={`mockup-${mockupType}-${brandName.toLowerCase().replace(/\s+/g, "-")}.png`}
                        className="text-[#0083C7] font-bold hover:underline flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Baixar Foto HD
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 sm:p-10 bg-slate-200/70 rounded-3xl border border-slate-300 w-full flex justify-center shadow-inner print:p-0 print:bg-transparent print:border-none print:shadow-none print:rounded-none">
              {mockupType === "polo" && (
                /* =================================================================== */
                /* 1. MOCKUP CAMISA POLO CORPORATIVA REALISTA                          */
                /* =================================================================== */
                <div
                  className="w-full max-w-[420px] aspect-[4/4.2] rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border border-slate-700/30 transition-all"
                  style={{
                    backgroundColor:
                      mockupColor === "dark"
                        ? "#0F172A"
                        : mockupColor === "light"
                        ? "#F8FAFC"
                        : primaryColor,
                    color: mockupColor === "light" ? "#0F172A" : "#FFFFFF",
                  }}
                >
                  {/* Textura sutil de malha piquet com degradê de estúdio */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/25 pointer-events-none" />
                  
                  {/* Costura dos Ombros e Cavas */}
                  <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none flex justify-between px-6 opacity-30">
                    <div className="w-16 h-1 border-b-2 border-dashed border-current transform -rotate-12" />
                    <div className="w-16 h-1 border-b-2 border-dashed border-current transform rotate-12" />
                  </div>

                  {/* Gola Polo Estruturada e Carcela com Botões Madrepérola */}
                  <div className="relative flex flex-col items-center z-10 -mt-2">
                    {/* Etiqueta Interna de Gola */}
                    <div className="w-20 py-1 bg-black/30 rounded-t-sm flex items-center justify-center border-t border-white/20">
                      <span className="text-[7.5px] font-black uppercase tracking-widest opacity-80 text-white truncate max-w-[70px]">
                        {brandName}
                      </span>
                    </div>

                    {/* Colarinho Dobrado com Friso Duplo */}
                    <div className="relative flex justify-center">
                      {/* Aba Esquerda do Colarinho */}
                      <div
                        className="w-20 h-12 rounded-bl-3xl transform -rotate-6 shadow-md border-b-2 border-l border-black/25 flex items-end justify-center pb-1 relative overflow-hidden"
                        style={{
                          backgroundColor:
                            mockupColor === "dark"
                              ? "#1E293B"
                              : mockupColor === "light"
                              ? "#E2E8F0"
                              : primaryColor,
                        }}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1"
                          style={{ backgroundColor: secondaryColor }}
                        />
                      </div>

                      {/* Aba Direita do Colarinho */}
                      <div
                        className="w-20 h-12 rounded-br-3xl transform rotate-6 shadow-md border-b-2 border-r border-black/25 flex items-end justify-center pb-1 relative overflow-hidden -ml-2"
                        style={{
                          backgroundColor:
                            mockupColor === "dark"
                              ? "#1E293B"
                              : mockupColor === "light"
                              ? "#E2E8F0"
                              : primaryColor,
                        }}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1"
                          style={{ backgroundColor: secondaryColor }}
                        />
                      </div>
                    </div>

                    {/* Peitilho / Carcela com Botões */}
                    <div className="w-8 py-2 bg-black/15 border-x border-b border-black/20 rounded-b-md flex flex-col items-center gap-2 -mt-1 shadow-inner">
                      <div className="h-2.5 w-2.5 rounded-full bg-slate-100 shadow-sm border border-slate-300 flex items-center justify-center">
                        <div className="h-0.5 w-0.5 rounded-full bg-slate-400" />
                      </div>
                      <div className="h-2.5 w-2.5 rounded-full bg-slate-100 shadow-sm border border-slate-300 flex items-center justify-center">
                        <div className="h-0.5 w-0.5 rounded-full bg-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Bordado do Logotipo no Peito Esquerdo (Efeito Relevo 3D) */}
                  <div className="absolute top-28 left-8 sm:left-12 p-3 rounded-2xl flex items-center gap-2.5 bg-black/10 backdrop-blur-2xs border border-white/10 shadow-lg">
                    <div className="h-12 max-w-[120px] flex items-center justify-center shrink-0">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={brandName}
                          className="max-h-12 max-w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-xs font-black drop-shadow-md">
                          {brandName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="leading-tight">
                      {!logoUrl && (
                        <span className="text-xs font-extrabold uppercase tracking-wider block drop-shadow-sm">
                          {brandName}
                        </span>
                      )}
                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-80 block">
                        Bordado Oficial
                      </span>
                      <span className="text-[7.5px] opacity-60">Fios de Alta Precisão</span>
                    </div>
                  </div>

                  {/* Detalhe da Barra Costurada com Slogan */}
                  <div className="relative z-10 pt-32 text-center">
                    {slogan && (
                      <p className="text-[9px] font-semibold uppercase tracking-widest opacity-75 drop-shadow-xs">
                        {slogan}
                      </p>
                    )}
                    <div className="mt-2 text-center text-[8.5px] opacity-60 flex items-center justify-center gap-1.5 border-t border-current/15 pt-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Uniforme Corporativo • Polo Piquet Premium 100% Algodão
                    </div>
                  </div>
                </div>
              )}

              {mockupType === "mug" && (
                /* =================================================================== */
                /* 2. MOCKUP CANECA / XÍCARA DE PORCELANA 3D (NOVO)                    */
                /* =================================================================== */
                <div className="w-full max-w-[420px] aspect-[4/4.2] rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col justify-between items-center relative overflow-hidden bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border border-slate-700 text-white">
                  {/* Superfície da Mesa com Reflexo de Estúdio */}
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />

                  {/* Vapor do Café Subindo Suavemente */}
                  <div className="relative z-10 flex justify-center gap-1.5 h-6 opacity-40 animate-pulse">
                    <div className="w-1 h-6 bg-gradient-to-t from-white/40 to-transparent rounded-full blur-[1px]" />
                    <div className="w-1 h-8 bg-gradient-to-t from-white/50 to-transparent rounded-full blur-[1px] -mt-1" />
                    <div className="w-1 h-5 bg-gradient-to-t from-white/30 to-transparent rounded-full blur-[1px]" />
                  </div>

                  {/* Conjunto Caneca de Cerâmica Cilíndrica */}
                  <div className="relative my-auto flex items-center justify-center">
                    {/* Asa Lateral Curvada da Caneca com Brilho e Sombra */}
                    <div
                      className="absolute -right-10 top-6 w-14 h-24 rounded-r-3xl border-[9px] shadow-lg transition-all"
                      style={{
                        borderColor:
                          mockupColor === "dark"
                            ? "#1E293B"
                            : mockupColor === "light"
                            ? "#F1F5F9"
                            : primaryColor,
                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3), 4px 4px 10px rgba(0,0,0,0.4)",
                      }}
                    />

                    {/* Corpo Principal Cilíndrico da Caneca */}
                    <div
                      className="w-48 sm:w-52 h-44 rounded-b-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all"
                      style={{
                        backgroundColor:
                          mockupColor === "dark"
                            ? "#0F172A"
                            : mockupColor === "light"
                            ? "#FFFFFF"
                            : primaryColor,
                        boxShadow: "0 25px 35px -5px rgba(0,0,0,0.6)",
                      }}
                    >
                      {/* Borda Superior Ovalada com Café Expresso */}
                      <div
                        className="w-full h-8 rounded-full border-4 border-black/15 shadow-inner flex items-center justify-center relative overflow-hidden"
                        style={{
                          backgroundColor:
                            mockupColor === "dark"
                              ? "#1E293B"
                              : mockupColor === "light"
                              ? "#E2E8F0"
                              : primaryColor,
                        }}
                      >
                        {/* Líquido Café Expresso com Crema */}
                        <div className="w-[88%] h-5 rounded-full bg-gradient-to-r from-[#271406] via-[#4A2511] to-[#3B1D0E] shadow-inner flex items-center justify-center">
                          <div className="w-10 h-1.5 rounded-full bg-amber-600/30 blur-[1px]" />
                        </div>
                      </div>

                      {/* Brilho Especular Cilíndrico de Estúdio */}
                      <div className="absolute inset-y-0 left-3 w-5 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/30 to-transparent pointer-events-none" />

                      {/* Logomarca Aplicada no Centro com Perspectiva Curva */}
                      <div className="my-auto px-4 flex flex-col items-center justify-center text-center relative z-10">
                        <div className="h-16 max-w-[130px] flex items-center justify-center mb-1">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={brandName}
                              className={`max-h-16 max-w-full object-contain filter ${
                                mockupColor === "light"
                                  ? "drop-shadow-sm"
                                  : "drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
                              }`}
                            />
                          ) : (
                            <span
                              className={`text-lg font-black tracking-wider ${
                                mockupColor === "light" ? "text-slate-900" : "text-white"
                              }`}
                            >
                              {brandName.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {!logoUrl && (
                          <h4
                            className={`text-xs font-black uppercase tracking-wider ${
                              mockupColor === "light" ? "text-slate-900" : "text-white"
                            }`}
                          >
                            {brandName}
                          </h4>
                        )}
                        {slogan && (
                          <p
                            className={`text-[8.5px] font-semibold uppercase tracking-widest mt-0.5 max-w-[120px] truncate ${
                              mockupColor === "light" ? "text-slate-600" : "text-slate-200"
                            }`}
                          >
                            {slogan}
                          </p>
                        )}
                      </div>

                      {/* Base Inferior com Efeito Cerâmico */}
                      <div className="h-2 w-full bg-black/20 border-t border-white/10" />
                    </div>
                  </div>

                  {/* Sombra de Contato da Caneca na Mesa */}
                  <div className="w-56 h-3 bg-black/60 rounded-full blur-md -mt-2 pointer-events-none" />

                  <div className="text-center text-[9px] text-slate-400 font-medium tracking-wide z-10 pt-2 border-t border-slate-800 w-full flex items-center justify-between">
                    <span>Brinde Corporativo & Reuniões</span>
                    <span className="font-bold text-amber-400">Cerâmica Premium 350ml</span>
                  </div>
                </div>
              )}

              {mockupType === "fleet" && (
                /* =================================================================== */
                /* 3. MOCKUP FROTA COMERCIAL / FURGÃO DE ENTREGAS (NOVO)               */
                /* =================================================================== */
                <div className="w-full max-w-[460px] aspect-[4/3] rounded-3xl shadow-2xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border border-slate-700 text-white">
                  {/* Iluminação de Estúdio Automotivo */}
                  <div className="absolute -top-16 inset-x-0 h-32 bg-white/10 blur-3xl pointer-events-none" />

                  {/* Cabeçalho do Mockup Automotivo */}
                  <div className="flex items-center justify-between z-10 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-[#0083C7]" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                        Plotagem de Frota & Veículos Comerciais
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[8px] bg-white/10 border-white/20 text-white">
                      Envelopamento Vinil 3M
                    </Badge>
                  </div>

                  {/* Ilustração Vetorial Realista do Veículo Utilitário / Furgão */}
                  <div className="my-auto relative py-2 flex flex-col items-center">
                    {/* Carroceria do Furgão */}
                    <div
                      className="w-full h-36 rounded-2xl rounded-r-3xl relative overflow-hidden border border-black/30 shadow-2xl transition-all flex flex-col justify-between"
                      style={{
                        backgroundColor:
                          mockupColor === "dark"
                            ? "#0F172A"
                            : mockupColor === "light"
                            ? "#F8FAFC"
                            : primaryColor,
                        color: mockupColor === "light" ? "#0F172A" : "#FFFFFF",
                      }}
                    >
                      {/* Reflexo Especular de Lataria de Carro */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/30 pointer-events-none" />

                      {/* Cabine com Vidros e Faróis */}
                      <div className="flex justify-between items-start p-2.5 relative z-10">
                        {/* Baú de Carga Traseiro com Linhas de Friso */}
                        <div className="flex items-center gap-1.5 opacity-40">
                          <div className="h-6 w-0.5 bg-current rounded" />
                          <div className="h-6 w-0.5 bg-current rounded" />
                        </div>

                        {/* Vidros da Cabine Dianteira */}
                        <div className="flex items-center gap-1">
                          {/* Janela Lateral Fumê */}
                          <div className="w-14 h-9 bg-slate-900 border-2 border-slate-700 rounded-sm relative overflow-hidden shadow-inner">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-400/20 to-transparent" />
                          </div>
                          {/* Para-brisa Inclinado Dianteiro */}
                          <div className="w-8 h-9 bg-slate-900 border-2 border-slate-700 rounded-tr-xl transform -skew-x-12 relative overflow-hidden shadow-inner">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-400/30 to-transparent" />
                          </div>
                        </div>
                      </div>

                      {/* Faixa Aerodinâmica da Marca na Lataria */}
                      <div
                        className="h-3 w-full my-auto transform -skew-x-12 relative z-10 shadow-md"
                        style={{
                          background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                        }}
                      />

                      {/* Logomarca de Alto Impacto na Lateral do Furgão */}
                      <div className="absolute inset-y-0 left-6 right-24 flex items-center gap-3 z-20">
                        <div className="h-14 max-w-[130px] flex items-center justify-center shrink-0">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={brandName}
                              className="max-h-14 max-w-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                            />
                          ) : (
                            <span className="text-xl font-black tracking-wider uppercase drop-shadow-md">
                              {brandName.slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="truncate">
                          {!logoUrl && (
                            <h3 className="text-sm font-black uppercase tracking-wider truncate drop-shadow-sm">
                              {brandName}
                            </h3>
                          )}
                          {slogan && (
                            <p className="text-[8.5px] font-bold uppercase tracking-wider opacity-85 truncate">
                              {slogan}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-[7.5px] font-bold opacity-75">
                            <span>📞 {phone}</span>
                            <span>🌐 {website}</span>
                          </div>
                        </div>
                      </div>

                      {/* Faróis Dianteiros e Para-choque Inferior */}
                      <div className="flex justify-between items-end p-2 relative z-10">
                        <div className="h-3 w-2 bg-red-600 rounded-sm shadow-xs" title="Lanterna Traseira" />
                        <div className="flex items-center gap-1">
                          <div className="h-3 w-4 bg-amber-300 rounded-l shadow-sm border border-amber-400" title="Farol Dianteiro" />
                          <div className="h-4 w-6 bg-slate-900 rounded-r-md border border-slate-700" title="Para-choque" />
                        </div>
                      </div>
                    </div>

                    {/* Rodas Esportivas com Pneus de Borracha e Calotas */}
                    <div className="w-full flex justify-between px-10 -mt-4 relative z-30">
                      {/* Roda Traseira */}
                      <div className="h-10 w-10 rounded-full bg-slate-950 border-4 border-slate-800 shadow-xl flex items-center justify-center">
                        <div className="h-4 w-4 rounded-full bg-slate-300 border-2 border-slate-600 shadow-inner" />
                      </div>
                      {/* Roda Dianteira */}
                      <div className="h-10 w-10 rounded-full bg-slate-950 border-4 border-slate-800 shadow-xl flex items-center justify-center">
                        <div className="h-4 w-4 rounded-full bg-slate-300 border-2 border-slate-600 shadow-inner" />
                      </div>
                    </div>

                    {/* Sombra de Contato do Veículo no Asfalto */}
                    <div className="w-full h-3 bg-black/70 rounded-full blur-md -mt-2 pointer-events-none" />
                  </div>

                  {/* Rodapé da Apresentação da Frota */}
                  <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800 pt-2 z-10">
                    <span>Identificação Visual Automotiva</span>
                    <span className="font-bold text-slate-200">{brandName} Fleet Design</span>
                  </div>
                </div>
              )}

              {mockupType === "bag" && (
                /* =================================================================== */
                /* 4. MOCKUP SACOLA KRAFT ECOLÓGICA COM EFEITO SANFONADO 3D            */
                /* =================================================================== */
                <div className="w-full max-w-[360px] aspect-[4/4.8] bg-[#D7BA89] rounded-3xl shadow-2xl p-7 flex flex-col justify-between relative overflow-hidden border-2 border-[#B89B6C]">
                  {/* Textura de Fibras do Papel Kraft */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/20 pointer-events-none" />
                  <div className="absolute inset-y-0 right-0 w-8 bg-black/10 pointer-events-none" />

                  {/* Alça Torcida Realista saindo dos Ilhoses */}
                  <div className="relative flex flex-col items-center -mt-10 z-10">
                    {/* Alça Curva */}
                    <div className="w-24 h-16 rounded-t-full border-[5px] border-[#8C6D3F] bg-transparent shadow-md" />
                    {/* Ilhoses Metálicos Dourados */}
                    <div className="flex justify-between w-20 -mt-2">
                      <div className="h-3 w-3 rounded-full bg-amber-700 border border-amber-900 shadow-inner" />
                      <div className="h-3 w-3 rounded-full bg-amber-700 border border-amber-900 shadow-inner" />
                    </div>
                  </div>

                  {/* Logo Estampado em Tinta na Fibra da Sacola */}
                  <div className="my-auto flex flex-col items-center text-center p-6 bg-black/5 rounded-2xl border border-black/10 shadow-xs relative z-10">
                    <div className="h-20 max-w-[200px] flex items-center justify-center mb-2">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={brandName}
                          className="max-h-20 max-w-full object-contain filter contrast-125 mix-blend-multiply drop-shadow-xs"
                        />
                      ) : (
                        <span className="text-2xl font-black text-[#3E2723] tracking-wider">
                          {brandName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {!logoUrl && (
                      <h3 className="text-base font-black text-[#3E2723] uppercase tracking-wider">
                        {brandName}
                      </h3>
                    )}
                    {slogan && (
                      <p className="text-[10px] text-[#5D4037] font-semibold mt-1">
                        {slogan}
                      </p>
                    )}
                    <span className="text-[9px] text-[#6D4C41] mt-3 font-mono font-bold">{website}</span>
                  </div>

                  <div className="text-center text-[9px] text-[#5D4037] font-bold z-10 border-t border-[#C7AA79] pt-2">
                    Embalagem 100% Reciclável • Papel Kraft 120g com Alça Torcida
                  </div>
                </div>
              )}

              {mockupType === "facade" && (
                /* =================================================================== */
                /* 5. MOCKUP FACHADA 3D / PLACA DE RECEPÇÃO COM HALO LED BACKLIGHT     */
                /* =================================================================== */
                <div className="w-full max-w-[440px] aspect-video bg-gradient-to-br from-slate-900 via-slate-950 to-black rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col justify-center items-center relative overflow-hidden border border-slate-700 text-white">
                  {/* Painel Ripada de Madeira / Parede Arquitetônica de Fundo */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none flex justify-between">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="w-3 h-full bg-amber-500 border-r border-black/80" />
                    ))}
                  </div>

                  {/* Brilho Halo LED Traseiro (Backlight Glow nas Cores da Marca) */}
                  <div
                    className="absolute w-72 h-36 rounded-full blur-3xl opacity-40 pointer-events-none transition-all"
                    style={{ backgroundColor: primaryColor }}
                  />

                  {/* Placa de Acrílico Cristal / Aço Escovado */}
                  <div className="w-full max-w-sm p-6 sm:p-7 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl flex flex-col items-center text-center relative z-10">
                    {/* Parafusos Espaçadores Metálicos nos 4 Cantos */}
                    <div className="absolute top-2.5 left-2.5 h-2.5 w-2.5 rounded-full bg-slate-200 border border-slate-400 shadow-md flex items-center justify-center">
                      <div className="h-1 w-1 rounded-full bg-slate-500" />
                    </div>
                    <div className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-slate-200 border border-slate-400 shadow-md flex items-center justify-center">
                      <div className="h-1 w-1 rounded-full bg-slate-500" />
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 h-2.5 w-2.5 rounded-full bg-slate-200 border border-slate-400 shadow-md flex items-center justify-center">
                      <div className="h-1 w-1 rounded-full bg-slate-500" />
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-slate-200 border border-slate-400 shadow-md flex items-center justify-center">
                      <div className="h-1 w-1 rounded-full bg-slate-500" />
                    </div>

                    <div className="h-16 max-w-[200px] flex items-center justify-center mb-2">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={brandName}
                          className="max-h-16 max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                        />
                      ) : (
                        <span className="text-xl font-black text-white drop-shadow-md">
                          {brandName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {!logoUrl && (
                      <h2 className="text-lg font-black tracking-widest text-white uppercase drop-shadow-sm">
                        {brandName}
                      </h2>
                    )}
                    {slogan && (
                      <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-1 font-medium">
                        {slogan}
                      </p>
                    )}
                  </div>

                  <span className="text-[9px] text-slate-400 mt-4 tracking-wider z-10 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                    Placa de Entrada Comercial • Letra Caixa e Iluminação Halo LED Backlight
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    })()}
  </div>
)}
    </div>
  );
}

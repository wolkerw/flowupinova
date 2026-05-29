"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  getOnboardingProfile,
  updateOnboardingProfile,
  type OnboardingProfileData,
  type OnboardingLogoData,
} from "@/lib/services/onboarding-service";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import {
  Settings2,
  UploadCloud,
  Trash2,
  Loader2,
  Sparkles,
  Check,
  Image as ImageIcon,
  Info,
  Globe,
  Phone,
  Bookmark,
  Users,
  Compass,
  Smile,
  Palette,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const presetPalettes = [
  {
    name: "Elegante & Minimalista",
    primary: "#0f172a",
    secondary: "#64748b",
    bg: "bg-slate-50",
  },
  {
    name: "Tecnológico & Premium",
    primary: "#2563eb",
    secondary: "#0f172a",
    bg: "bg-blue-50",
  },
  {
    name: "Natural & Ecológico",
    primary: "#16a34a",
    secondary: "#14532d",
    bg: "bg-emerald-50",
  },
  {
    name: "Criativo & Vibrante",
    primary: "#db2777",
    secondary: "#4f46e5",
    bg: "bg-pink-50",
  },
];

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<OnboardingProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  // Formulário Local
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [description, setDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#1e293b");
  const [slogan, setSlogan] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [mainBenefits, setMainBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState("");

  // Logos Individuais
  const [logoHorizontal, setLogoHorizontal] = useState<OnboardingLogoData>({ url: "", width: 0, height: 0 });
  const [logoVertical, setLogoVertical] = useState<OnboardingLogoData>({ url: "", width: 0, height: 0 });
  const [logoSymbol, setLogoSymbol] = useState<OnboardingLogoData>({ url: "", width: 0, height: 0 });
  const [logoAvatar, setLogoAvatar] = useState<OnboardingLogoData>({ url: "", width: 0, height: 0 });

  const [uploadingType, setUploadingType] = useState<"horizontal" | "vertical" | "symbol" | "avatar" | null>(null);

  const fileInputRefHorizontal = useRef<HTMLInputElement>(null);
  const fileInputRefVertical = useRef<HTMLInputElement>(null);
  const fileInputRefSymbol = useRef<HTMLInputElement>(null);
  const fileInputRefAvatar = useRef<HTMLInputElement>(null);

  const loadProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getOnboardingProfile(user.uid);
      setProfile(data);
      setName(data.name || "");
      setCategory(data.category || "");
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setWebsite(data.website || "");
      setInstagram(data.instagram || "");
      setDescription(data.description || "");
      setPrimaryColor(data.primaryColor || "#3b82f6");
      setSecondaryColor(data.secondaryColor || "#1e293b");
      setSlogan(data.slogan || "");
      setTargetAudience(data.targetAudience || "");
      setToneOfVoice(data.toneOfVoice || "");
      setMainBenefits(data.mainBenefits || []);
      setLogoHorizontal(data.logos?.horizontal || { url: "", width: 0, height: 0 });
      setLogoVertical(data.logos?.vertical || { url: "", width: 0, height: 0 });
      setLogoSymbol(data.logos?.symbol || { url: "", width: 0, height: 0 });
      setLogoAvatar(data.logos?.avatar || { url: "", width: 0, height: 0 });
    } catch (error) {
      console.error("Erro ao carregar configurações de marca:", error);
      toast({ title: "Erro de Conexão", description: "Não foi possível carregar suas configurações.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onload = () => {
          const w = img.naturalWidth || img.width || 0;
          const h = img.naturalHeight || img.height || 0;
          resolve({
            width: w,
            height: h,
            dataUrl: e.target?.result as string,
          });
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "horizontal" | "vertical" | "symbol" | "avatar") => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingType(type);
    toast({ title: `Processando logo ${type}...` });

    try {
      const { dataUrl, width, height } = await getImageDimensions(file);
      const newLogo: OnboardingLogoData = { url: dataUrl, width, height };

      // Lógica de sincronização inteligente de logo padrão para manter compatibilidade
      let logoPrincipal = profile?.logo || { url: "", width: 0, height: 0 };
      
      if (type === "vertical") {
        logoPrincipal = newLogo;
        setLogoVertical(newLogo);
      } else if (type === "horizontal") {
        setLogoHorizontal(newLogo);
        // Se não houver vertical salva, usamos a horizontal como a logo principal
        if (!logoVertical.url) {
          logoPrincipal = newLogo;
        }
      } else if (type === "symbol") {
        setLogoSymbol(newLogo);
      } else if (type === "avatar") {
        setLogoAvatar(newLogo);
      }

      await updateOnboardingProfile(user.uid, {
        logo: logoPrincipal,
        logos: {
          horizontal: type === "horizontal" ? newLogo : logoHorizontal,
          vertical: type === "vertical" ? newLogo : logoVertical,
          symbol: type === "symbol" ? newLogo : logoSymbol,
          avatar: type === "avatar" ? newLogo : logoAvatar,
        },
      });

      // Recarrega dados locais
      await loadProfile();
      toast({ title: "Sucesso!", description: `Logomarca ${type} salva com sucesso.`, variant: "success" });
    } catch (error: any) {
      console.error(`Erro ao subir logo ${type}:`, error);
      toast({ title: "Erro de Processamento", description: error.message, variant: "destructive" });
    } finally {
      setUploadingType(null);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleRemoveLogo = async (type: "horizontal" | "vertical" | "symbol" | "avatar") => {
    if (!user) return;
    setUploadingType(type);
    toast({ title: `Removendo logo ${type}...` });

    try {
      const emptyLogo: OnboardingLogoData = { url: "", width: 0, height: 0 };
      
      // Sincronização inteligente na remoção
      let logoPrincipal = profile?.logo || { url: "", width: 0, height: 0 };

      if (type === "vertical") {
        setLogoVertical(emptyLogo);
        // Se remover a vertical, a logo principal vira a horizontal (se houver), ou limpa
        logoPrincipal = logoHorizontal.url ? logoHorizontal : emptyLogo;
      } else if (type === "horizontal") {
        setLogoHorizontal(emptyLogo);
        // Se a logo principal era a horizontal e foi removida, a logo principal vira a vertical (se houver)
        if (logoPrincipal.url === logoHorizontal.url) {
          logoPrincipal = logoVertical.url ? logoVertical : emptyLogo;
        }
      } else if (type === "symbol") {
        setLogoSymbol(emptyLogo);
      } else if (type === "avatar") {
        setLogoAvatar(emptyLogo);
      }

      await updateOnboardingProfile(user.uid, {
        logo: logoPrincipal,
        logos: {
          horizontal: type === "horizontal" ? emptyLogo : logoHorizontal,
          vertical: type === "vertical" ? emptyLogo : logoVertical,
          symbol: type === "symbol" ? emptyLogo : logoSymbol,
          avatar: type === "avatar" ? emptyLogo : logoAvatar,
        },
      });

      await loadProfile();
      toast({ title: "Sucesso!", description: `Logomarca ${type} removida.`, variant: "success" });
    } catch (error: any) {
      console.error(`Erro ao remover logo ${type}:`, error);
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    } finally {
      setUploadingType(null);
    }
  };

  const handleApplyPalette = (palette: typeof presetPalettes[0]) => {
    setPrimaryColor(palette.primary);
    setSecondaryColor(palette.secondary);
    toast({
      title: "Paleta Aplicada!",
      description: `Cores alteradas para: ${palette.name}. Lembre-se de clicar em salvar para confirmar.`,
    });
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim() && !mainBenefits.includes(newBenefit.trim())) {
      setMainBenefits([...mainBenefits, newBenefit.trim()]);
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (indexToRemove: number) => {
    setMainBenefits(mainBenefits.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveAll = async () => {
    if (!user) return;
    setIsSaving(true);
    toast({ title: "Salvando configurações...", description: "Por favor, aguarde." });

    try {
      // Sincronização inteligente de segurança para a logo principal
      const logoPrincipal = logoVertical.url ? logoVertical : (logoHorizontal.url ? logoHorizontal : { url: "", width: 0, height: 0 });

      await updateOnboardingProfile(user.uid, {
        name,
        category,
        phone,
        address,
        website,
        instagram,
        description,
        primaryColor,
        secondaryColor,
        slogan,
        targetAudience,
        toneOfVoice,
        mainBenefits,
        logo: logoPrincipal,
        logos: {
          horizontal: logoHorizontal,
          vertical: logoVertical,
          symbol: logoSymbol,
          avatar: logoAvatar,
        },
      });

      toast({ title: "Sucesso!", description: "Configurações de marca atualizadas com sucesso.", variant: "success" });
      await loadProfile();
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      toast({ title: "Erro ao Salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 pb-20">
      {/* Cabeçalho */}
      <div className="flex flex-col items-start justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configurações da Marca</h1>
          <p className="mt-1 text-gray-600">Personalize a identidade visual, voz e cadastro do seu negócio</p>
        </div>
        <Button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="bg-primary text-white shadow-md hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Alterações"
          )}
        </Button>
      </div>

      {/* Seções de Configurações */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Painel Esquerdo: Identidade Visual e Logos */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Módulo de Cores (Paleta e Sugestões) */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5 text-primary" />
                Identidade Visual
              </CardTitle>
              <CardDescription>Cores oficiais do seu Brand Kit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Sugestões de Paletas */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paletas Sugeridas</Label>
                <div className="grid grid-cols-2 gap-2">
                  {presetPalettes.map((palette) => (
                    <button
                      key={palette.name}
                      type="button"
                      onClick={() => handleApplyPalette(palette)}
                      className={`flex flex-col items-start gap-1 rounded-lg border p-2 text-left transition-all hover:bg-accent/40 ${
                        primaryColor === palette.primary && secondaryColor === palette.secondary
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border"
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-foreground/80 truncate w-full">{palette.name}</span>
                      <div className="flex h-5 w-full gap-1 rounded overflow-hidden">
                        <div className="h-full w-1/2" style={{ backgroundColor: palette.primary }} />
                        <div className="h-full w-1/2" style={{ backgroundColor: palette.secondary }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Pickers Customizados */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor" className="text-sm font-medium">Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer p-0"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-9 font-mono text-xs uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor" className="text-sm font-medium">Cor Secundária</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="secondaryColor"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer p-0"
                    />
                    <Input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-9 font-mono text-xs uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Módulo de Logomarcas */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="h-5 w-5 text-primary" />
                Múltiplas Logomarcas
              </CardTitle>
              <CardDescription>Gerencie as variações visuais da sua marca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* 0. Thumb / Ícone de Perfil da Plataforma */}
              <div className="space-y-2 pb-4 border-b border-gray-100">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  Avatar / Ícone de Perfil da Plataforma
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs p-3 text-xs bg-slate-900 text-white border-none rounded shadow-lg">
                        Este ícone circular aparecerá no canto superior direito do seu painel. Recomendamos imagens quadradas (1:1).
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                {logoAvatar.url ? (
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-green-100 bg-green-50/40 p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white p-0.5 overflow-hidden">
                        <img src={logoAvatar.url} alt="Avatar da Plataforma" className="h-full w-full rounded-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-green-800 truncate">Avatar Salvo</p>
                        <p className="text-[10px] text-green-700">{logoAvatar.width}x{logoAvatar.height}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:bg-red-50"
                      onClick={() => handleRemoveLogo("avatar")}
                      disabled={uploadingType !== null}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRefAvatar}
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e, "avatar")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-dashed"
                      onClick={() => fileInputRefAvatar.current?.click()}
                      disabled={uploadingType !== null}
                    >
                      {uploadingType === "avatar" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="mr-2 h-4 w-4" />
                      )}
                      Enviar Avatar / Ícone
                    </Button>
                  </div>
                )}
              </div>

              {/* 1. Logo Horizontal */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Logo Horizontal (Formatos Retangulares)</Label>
                {logoHorizontal.url ? (
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-green-100 bg-green-50/40 p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-16 shrink-0 items-center justify-center rounded border bg-white p-1 overflow-hidden">
                        <img src={logoHorizontal.url} alt="Logo Horizontal" className="h-full w-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-green-800 truncate">Horizontal Salva</p>
                        <p className="text-[10px] text-green-700">{logoHorizontal.width}x{logoHorizontal.height}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:bg-red-50"
                      onClick={() => handleRemoveLogo("horizontal")}
                      disabled={uploadingType !== null}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRefHorizontal}
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e, "horizontal")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-dashed"
                      onClick={() => fileInputRefHorizontal.current?.click()}
                      disabled={uploadingType !== null}
                    >
                      {uploadingType === "horizontal" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="mr-2 h-4 w-4" />
                      )}
                      Enviar Logo Horizontal
                    </Button>
                  </div>
                )}
              </div>

              {/* 2. Logo Vertical */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Logo Vertical / Quadrada (Perfis e Posts)</Label>
                {logoVertical.url ? (
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-green-100 bg-green-50/40 p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded border bg-white p-1 overflow-hidden">
                        <img src={logoVertical.url} alt="Logo Vertical" className="h-full w-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-green-800 truncate">Vertical Salva</p>
                        <p className="text-[10px] text-green-700">{logoVertical.width}x{logoVertical.height}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:bg-red-50"
                      onClick={() => handleRemoveLogo("vertical")}
                      disabled={uploadingType !== null}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRefVertical}
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e, "vertical")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-dashed"
                      onClick={() => fileInputRefVertical.current?.click()}
                      disabled={uploadingType !== null}
                    >
                      {uploadingType === "vertical" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="mr-2 h-4 w-4" />
                      )}
                      Enviar Logo Vertical
                    </Button>
                  </div>
                )}
              </div>

              {/* 3. Símbolo / Ícone */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Símbolo / Ícone (Marcas D'água Sutis)</Label>
                {logoSymbol.url ? (
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-green-100 bg-green-50/40 p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded border bg-white p-1 overflow-hidden">
                        <img src={logoSymbol.url} alt="Símbolo" className="h-full w-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-green-800 truncate">Símbolo Salvo</p>
                        <p className="text-[10px] text-green-700">{logoSymbol.width}x{logoSymbol.height}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:bg-red-50"
                      onClick={() => handleRemoveLogo("symbol")}
                      disabled={uploadingType !== null}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRefSymbol}
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e, "symbol")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-dashed"
                      onClick={() => fileInputRefSymbol.current?.click()}
                      disabled={uploadingType !== null}
                    >
                      {uploadingType === "symbol" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="mr-2 h-4 w-4" />
                      )}
                      Enviar Símbolo da Marca
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel Central e Direito: Dados do Negócio e Voz de Marca */}
        <div className="space-y-8 lg:col-span-2">
          
          {/* Assistente de Marca (Banner Inteligente de IA) */}
          <Card className="relative overflow-hidden border-none bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-indigo-500/20 blur-xl"></div>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                Assistência guiada com Inteligência Artificial
              </CardTitle>
              <CardDescription className="text-blue-100">
                Deixe o assistente Vapti criar sua paleta de cores, tom de voz, slogans e público através da IA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-blue-50/90">
                Se você deseja remodelar a identidade do seu negócio ou quer ajuda para extrair slogans marcantes,
                nosso onboarding interativo pode mapear seu site ou suas respostas em segundos.
              </p>
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                type="button"
                onClick={() => setShowWizard(true)}
                className="bg-white text-blue-700 shadow-md transition-all hover:bg-blue-50"
              >
                Refazer Onboarding com IA ✨
              </Button>
            </CardFooter>
          </Card>

          {/* Cadastro Geral do Negócio */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-primary" />
                Dados do Negócio
              </CardTitle>
              <CardDescription>Configurações de cadastro e presença web</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nome Fantasia da Empresa</Label>
                  <Input
                    id="businessName"
                    placeholder="Ex: Pizzaria Forno de Ouro"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria do Negócio</Label>
                  <Input
                    id="category"
                    placeholder="Ex: Restaurantes / Alimentação"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone / WhatsApp Comercial</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="Ex: (51) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    placeholder="Ex: www.fornodeouro.com.br"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço Comercial</Label>
                <Input
                  id="address"
                  placeholder="Ex: Av. Getúlio Vargas, 1000 - Porto Alegre, RS"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Perfil do Instagram (Sufixo / Username)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                  <Input
                    id="instagram"
                    placeholder="pizzaria_fornodeouro"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição do Negócio / Quem Somos</Label>
                <Textarea
                  id="description"
                  placeholder="Conte o que sua empresa oferece de melhor, seus diferenciais e especialidades..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px] resize-y"
                />
              </div>
            </CardContent>
          </Card>

          {/* Voz de Marca e Posicionamento (Brand Voice) */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bookmark className="h-5 w-5 text-primary" />
                Voz de Marca e Posicionamento
              </CardTitle>
              <CardDescription>Definições de marketing que guiam a IA na criação de posts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="slogan">Slogan da Empresa</Label>
                <div className="relative">
                  <Compass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="slogan"
                    placeholder="Ex: O sabor inesquecível da tradição italiana."
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Público-Alvo Principal</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="targetAudience"
                      placeholder="Ex: Famílias, casais e jovens apaixonados por pizza gourmet."
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toneOfVoice">Tom de Voz da Marca</Label>
                  <div className="relative">
                    <Smile className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="toneOfVoice"
                      placeholder="Ex: Acolhedor, apaixonado, familiar e ligeiramente bem-humorado."
                      value={toneOfVoice}
                      onChange={(e) => setToneOfVoice(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Benefícios da Marca */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Principais Benefícios / Diferenciais (Tags)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar novo benefício... Ex: Ingredientes Importados"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddBenefit();
                        e.preventDefault();
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={handleAddBenefit}>
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {mainBenefits.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Nenhum benefício cadastrado. Adicione acima para orientar a IA.</p>
                  ) : (
                    mainBenefits.map((benefit, index) => (
                      <span
                        key={benefit}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                      >
                        {benefit}
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefit(index)}
                          className="hover:text-primary/70 shrink-0 font-bold"
                          aria-label={`Remover benefício ${benefit}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>

      {/* Modal Wizard de IA */}
      <OnboardingWizard
        userId={user?.uid || ""}
        initialData={profile}
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={async () => {
          setShowWizard(false);
          await loadProfile();
          toast({
            title: "Marca Configurada com IA!",
            description: "As configurações foram recalculadas com sucesso pela nossa inteligência artificial.",
            variant: "success",
          });
        }}
      />
    </div>
  );
}

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
  type OnboardingPersona,
} from "@/lib/services/onboarding-service";
import { createCnpjRequest } from "@/lib/services/cnpj-request-service";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Lock } from "lucide-react";
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

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

  // Estados Locais do CNPJ
  const [cnpj, setCnpj] = useState("");
  const [cnpjLocked, setCnpjLocked] = useState(false);
  const [hasPendingCnpjRequest, setHasPendingCnpjRequest] = useState(false);

  // Estados do Modal de Solicitação de Alteração de CNPJ
  const [isCnpjModalOpen, setIsCnpjModalOpen] = useState(false);
  const [newCnpj, setNewCnpj] = useState("");
  const [newBusinessName, setNewBusinessName] = useState("");
  const [cnpjReason, setCnpjReason] = useState("");
  const [isSubmittingCnpjRequest, setIsSubmittingCnpjRequest] = useState(false);

  const formatCnpjLocal = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

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

  // Estados locais para Brand Manual (PDF)
  const [visualGuidelines, setVisualGuidelines] = useState("");
  const [pdfManualPath, setPdfManualPath] = useState("");
  const [pdfManualUrl, setPdfManualUrl] = useState("");
  
  // Novos estados estendidos de branding
  const [primaryFont, setPrimaryFont] = useState("");
  const [secondaryFont, setSecondaryFont] = useState("");
  const [fontStyle, setFontStyle] = useState("");
  const [complementaryColor, setComplementaryColor] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [personas, setPersonas] = useState<OnboardingPersona[]>([]);

  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState("");
  const [extractedBrandData, setExtractedBrandData] = useState<any | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const fileInputRefPdf = useRef<HTMLInputElement>(null);

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

  const migrateLegacyBase64Profile = async (data: OnboardingProfileData) => {
    if (!user) return;
    
    // Verifica se há alguma logo em Base64
    const hasBase64 = 
      (data.logo?.url && data.logo.url.startsWith("data:image")) ||
      (data.logos?.horizontal?.url && data.logos.horizontal.url.startsWith("data:image")) ||
      (data.logos?.vertical?.url && data.logos.vertical.url.startsWith("data:image")) ||
      (data.logos?.symbol?.url && data.logos.symbol.url.startsWith("data:image")) ||
      (data.logos?.avatar?.url && data.logos.avatar.url.startsWith("data:image"));

    if (!hasBase64) return;

    console.log("[MIGRATE_BASE64] Detectadas logos antigas em Base64. Iniciando migração automática...");
    
    // Pequeno delay para garantir que os toasts locais ou estados iniciais de carregamento não entrem em conflito
    setTimeout(() => {
      toast({
        title: "Otimizando armazenamento...",
        description: "Convertendo imagens antigas para melhorar a performance.",
      });
    }, 1000);

    try {
      const uploadBase64ToStorage = async (base64Str: string, type: string) => {
        const res = await fetch(base64Str);
        const blob = await res.blob();
        const storageRef = ref(storage, `users/${user.uid}/logos/${type}_migrated_${Date.now()}`);
        const uploadResult = await uploadBytes(storageRef, blob);
        return await getDownloadURL(uploadResult.ref);
      };

      const finalLogoHorizontal = { ...data.logos?.horizontal || { url: "", width: 0, height: 0 } };
      const finalLogoVertical = { ...data.logos?.vertical || { url: "", width: 0, height: 0 } };
      const finalLogoSymbol = { ...data.logos?.symbol || { url: "", width: 0, height: 0 } };
      const finalLogoAvatar = { ...data.logos?.avatar || { url: "", width: 0, height: 0 } };

      if (finalLogoHorizontal.url && finalLogoHorizontal.url.startsWith("data:image")) {
        finalLogoHorizontal.url = await uploadBase64ToStorage(finalLogoHorizontal.url, "horizontal");
      }
      if (finalLogoVertical.url && finalLogoVertical.url.startsWith("data:image")) {
        finalLogoVertical.url = await uploadBase64ToStorage(finalLogoVertical.url, "vertical");
      }
      if (finalLogoSymbol.url && finalLogoSymbol.url.startsWith("data:image")) {
        finalLogoSymbol.url = await uploadBase64ToStorage(finalLogoSymbol.url, "symbol");
      }
      if (finalLogoAvatar.url && finalLogoAvatar.url.startsWith("data:image")) {
        finalLogoAvatar.url = await uploadBase64ToStorage(finalLogoAvatar.url, "avatar");
      }

      const logoPrincipal = finalLogoVertical.url ? finalLogoVertical : (finalLogoHorizontal.url ? finalLogoHorizontal : { url: "", width: 0, height: 0 });

      const cleanProfileData: OnboardingProfileData = {
        name: data.name || "",
        category: data.category || "",
        address: data.address || "",
        phone: data.phone || "",
        website: data.website || "",
        instagram: data.instagram || "",
        description: data.description || "",
        primaryColor: data.primaryColor || "#3b82f6",
        secondaryColor: data.secondaryColor || "#1e293b",
        onboardingCompleted: data.onboardingCompleted || false,
        slogan: data.slogan || "",
        targetAudience: data.targetAudience || "",
        toneOfVoice: data.toneOfVoice || "",
        mainBenefits: data.mainBenefits || [],
        cnpj: data.cnpj || "",
        cnpjLocked: data.cnpjLocked || false,
        hasPendingCnpjRequest: data.hasPendingCnpjRequest || false,
        logo: logoPrincipal,
        logos: {
          horizontal: finalLogoHorizontal,
          vertical: finalLogoVertical,
          symbol: finalLogoSymbol,
          avatar: finalLogoAvatar,
        },
        brandKit: {
          ...data.brandKit,
          primaryColor: data.brandKit?.primaryColor || data.primaryColor || "#3b82f6",
          secondaryColor: data.brandKit?.secondaryColor || data.secondaryColor || "#1e293b",
          visualGuidelines: data.brandKit?.visualGuidelines || "",
          pdfManualPath: data.brandKit?.pdfManualPath || "",
          pdfManualUrl: data.brandKit?.pdfManualUrl || "",
          pdfUploadedAt: data.brandKit?.pdfUploadedAt || null,
          fonts: data.brandKit?.fonts || { primaryFont: "", secondaryFont: "", style: "" },
          extendedColors: data.brandKit?.extendedColors || { complementary: "", background: "" },
          personas: data.brandKit?.personas || [],
        },
      };

      // merge: false é crítico aqui para limpar o lixo do Base64 antigo do Firestore de forma definitiva!
      await updateOnboardingProfile(user.uid, cleanProfileData, { merge: false });
      
      console.log("[MIGRATE_BASE64] Migração e limpeza concluídas com sucesso.");
      toast({
        title: "Perfil Otimizado!",
        description: "As logos antigas foram migradas para o Storage com sucesso.",
        variant: "success",
      });

      // Recarrega o perfil local com dados novos
      await loadProfile();
    } catch (migrateError) {
      console.error("[MIGRATE_BASE64] Falha ao migrar logos antigas:", migrateError);
    }
  };

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
      setCnpj(data.cnpj ? formatCnpjLocal(data.cnpj) : "");
      setCnpjLocked(data.cnpjLocked || false);
      setHasPendingCnpjRequest(data.hasPendingCnpjRequest || false);
      setMainBenefits(data.mainBenefits || []);
      setLogoHorizontal(data.logos?.horizontal || { url: "", width: 0, height: 0 });
      setLogoVertical(data.logos?.vertical || { url: "", width: 0, height: 0 });
      setLogoSymbol(data.logos?.symbol || { url: "", width: 0, height: 0 });
      setLogoAvatar(data.logos?.avatar || { url: "", width: 0, height: 0 });
      setVisualGuidelines(data.brandKit?.visualGuidelines || "");
      setPdfManualPath(data.brandKit?.pdfManualPath || "");
      setPdfManualUrl(data.brandKit?.pdfManualUrl || "");
      setPrimaryFont(data.brandKit?.fonts?.primaryFont || "");
      setSecondaryFont(data.brandKit?.fonts?.secondaryFont || "");
      setFontStyle(data.brandKit?.fonts?.style || "");
      setComplementaryColor(data.brandKit?.extendedColors?.complementary || "");
      setBackgroundColor(data.brandKit?.extendedColors?.background || "");
      setPersonas(data.brandKit?.personas || []);
      
      // Inicia migração assíncrona se houver Base64 legado
      migrateLegacyBase64Profile(data);
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
    toast({ title: `Enviando logo ${type}...`, description: "Aguarde a conclusão do upload." });

    try {
      // 1. Fazer upload para o Firebase Storage
      const storageRef = ref(storage, `users/${user.uid}/logos/${type}_${Date.now()}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      // 2. Obter as dimensões da imagem localmente
      const { width, height } = await getImageDimensions(file);
      const newLogo: OnboardingLogoData = { url: downloadUrl, width, height };

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

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione apenas arquivos em formato PDF.",
        variant: "destructive",
      });
      return;
    }

    setIsParsingPdf(true);
    
    // Mensagens de progresso simuladas para feedback
    const messages = [
      "Enviando manual em PDF para o servidor...",
      "Iniciando leitura e interpretação via Inteligência Artificial...",
      "Mapeando a paleta de cores institucional da agência...",
      "Sintetizando slogan, público-alvo e posicionamento...",
      "Extraindo tom de voz para legendas e redes sociais...",
      "Estruturando diretrizes fotográficas e regras de design..."
    ];
    
    let msgIndex = 0;
    setPdfProgressText(messages[0]);
    
    const progressInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setPdfProgressText(messages[msgIndex]);
    }, 4500);

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("userId", user.uid);

      const response = await fetch("/api/brand-kit/parse-pdf", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro ao processar o PDF.");
      }

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setExtractedBrandData(resJson.data);
        setIsConfirmModalOpen(true);
        toast({
          title: "Branding Extraído!",
          description: "Revisando diretrizes visuais e conceituais do manual.",
          variant: "success",
        });
      } else {
        throw new Error("Resposta da IA inválida.");
      }

    } catch (e: any) {
      clearInterval(progressInterval);
      console.error("[BRAND_KIT_PDF_UPLOAD] Erro:", e);
      toast({
        title: "Erro ao Processar Manual",
        description: e.message || "Ocorreu uma falha inesperada durante a leitura do PDF.",
        variant: "destructive",
      });
    } finally {
      setIsParsingPdf(false);
      setPdfProgressText("");
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleAcceptExtractedBranding = () => {
    if (!extractedBrandData || !user) return;

    if (extractedBrandData.name) setName(extractedBrandData.name);
    if (extractedBrandData.slogan) setSlogan(extractedBrandData.slogan);
    if (extractedBrandData.description) setDescription(extractedBrandData.description);
    if (extractedBrandData.targetAudience) setTargetAudience(extractedBrandData.targetAudience);
    if (extractedBrandData.toneOfVoice) setToneOfVoice(extractedBrandData.toneOfVoice);
    if (extractedBrandData.primaryColor) setPrimaryColor(extractedBrandData.primaryColor);
    if (extractedBrandData.secondaryColor) setSecondaryColor(extractedBrandData.secondaryColor);
    if (extractedBrandData.visualGuidelines) setVisualGuidelines(extractedBrandData.visualGuidelines);
    if (extractedBrandData.mainBenefits && extractedBrandData.mainBenefits.length > 0) {
      setMainBenefits(extractedBrandData.mainBenefits);
    }
    if (extractedBrandData.pdfManualPath) setPdfManualPath(extractedBrandData.pdfManualPath);
    if (extractedBrandData.pdfManualUrl) setPdfManualUrl(extractedBrandData.pdfManualUrl);
    
    // Novas chaves do Brand Kit estendido
    if (extractedBrandData.fonts) {
      if (extractedBrandData.fonts.primaryFont) setPrimaryFont(extractedBrandData.fonts.primaryFont);
      if (extractedBrandData.fonts.secondaryFont) setSecondaryFont(extractedBrandData.fonts.secondaryFont);
      if (extractedBrandData.fonts.style) setFontStyle(extractedBrandData.fonts.style);
    }
    if (extractedBrandData.extendedColors) {
      if (extractedBrandData.extendedColors.complementary) setComplementaryColor(extractedBrandData.extendedColors.complementary);
      if (extractedBrandData.extendedColors.background) setBackgroundColor(extractedBrandData.extendedColors.background);
    }
    if (extractedBrandData.personas && extractedBrandData.personas.length > 0) {
      setPersonas(extractedBrandData.personas);
    }

    setIsConfirmModalOpen(false);
    setExtractedBrandData(null);

    toast({
      title: "Configurações Carregadas!",
      description: "Os dados do PDF foram aplicados na tela. Lembre-se de clicar em 'Salvar Alterações' para persistir.",
      variant: "success",
    });
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
      // Helper para converter dataUrl base64 em File/Blob para upload no Storage
      const uploadBase64ToStorage = async (base64Str: string, type: string) => {
        const res = await fetch(base64Str);
        const blob = await res.blob();
        const storageRef = ref(storage, `users/${user.uid}/logos/${type}_migrated_${Date.now()}`);
        const uploadResult = await uploadBytes(storageRef, blob);
        return await getDownloadURL(uploadResult.ref);
      };

      // Migração automática de logos em Base64 legado para o Storage
      let finalLogoHorizontal = { ...logoHorizontal };
      let finalLogoVertical = { ...logoVertical };
      let finalLogoSymbol = { ...logoSymbol };
      let finalLogoAvatar = { ...logoAvatar };

      if (logoHorizontal.url && logoHorizontal.url.startsWith("data:image")) {
        toast({ title: "Migrando logo horizontal..." });
        const url = await uploadBase64ToStorage(logoHorizontal.url, "horizontal");
        finalLogoHorizontal.url = url;
        setLogoHorizontal(finalLogoHorizontal);
      }
      if (logoVertical.url && logoVertical.url.startsWith("data:image")) {
        toast({ title: "Migrando logo vertical..." });
        const url = await uploadBase64ToStorage(logoVertical.url, "vertical");
        finalLogoVertical.url = url;
        setLogoVertical(finalLogoVertical);
      }
      if (logoSymbol.url && logoSymbol.url.startsWith("data:image")) {
        toast({ title: "Migrando símbolo..." });
        const url = await uploadBase64ToStorage(logoSymbol.url, "symbol");
        finalLogoSymbol.url = url;
        setLogoSymbol(finalLogoSymbol);
      }
      if (logoAvatar.url && logoAvatar.url.startsWith("data:image")) {
        toast({ title: "Migrando avatar..." });
        const url = await uploadBase64ToStorage(logoAvatar.url, "avatar");
        finalLogoAvatar.url = url;
        setLogoAvatar(finalLogoAvatar);
      }

      // Sincronização inteligente de segurança para a logo principal
      const logoPrincipal = finalLogoVertical.url ? finalLogoVertical : (finalLogoHorizontal.url ? finalLogoHorizontal : { url: "", width: 0, height: 0 });

      const cleanCnpj = cnpj.replace(/\D/g, "");
      const finalCnpjLocked = cnpjLocked || cleanCnpj.length === 14;

      await updateOnboardingProfile(
        user.uid,
        {
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
          cnpj: cleanCnpj,
          cnpjLocked: finalCnpjLocked,
          onboardingCompleted: profile?.onboardingCompleted || false,
          hasPendingCnpjRequest: profile?.hasPendingCnpjRequest || false,
          logo: logoPrincipal,
          logos: {
            horizontal: finalLogoHorizontal,
            vertical: finalLogoVertical,
            symbol: finalLogoSymbol,
            avatar: finalLogoAvatar,
          },
          brandKit: {
            ...profile?.brandKit,
            primaryColor,
            secondaryColor,
            visualGuidelines,
            pdfManualPath,
            pdfManualUrl,
            pdfUploadedAt: profile?.brandKit?.pdfUploadedAt || null,
            fonts: {
              primaryFont,
              secondaryFont,
              style: fontStyle,
            },
            extendedColors: {
              complementary: complementaryColor,
              background: backgroundColor,
            },
            personas: personas,
          },
        },
        { merge: false }
      );

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

              {/* Cores Estendidas */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="complementaryColor" className="text-sm font-medium">Cor de Apoio</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="complementaryColor"
                      value={complementaryColor || "#ffffff"}
                      onChange={(e) => setComplementaryColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer p-0"
                    />
                    <Input
                      type="text"
                      value={complementaryColor}
                      onChange={(e) => setComplementaryColor(e.target.value)}
                      placeholder="#HEX"
                      className="h-9 font-mono text-xs uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor" className="text-sm font-medium">Cenário / Fundo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="backgroundColor"
                      value={backgroundColor || "#ffffff"}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer p-0"
                    />
                    <Input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      placeholder="#HEX"
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

          {/* Módulo de Importação de Manual de Branding (PDF) */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Branding da Agência (PDF)
              </CardTitle>
              <CardDescription>
                Suba o manual de identidade visual criado pela agência e a IA configurará seu Brand Kit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isParsingPdf ? (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 border border-dashed rounded-lg bg-slate-50/50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-800">Processando manual de marca...</p>
                    <p className="text-xs text-muted-foreground animate-pulse">{pdfProgressText}</p>
                  </div>
                </div>
              ) : pdfManualPath ? (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-green-100 bg-green-50/40 p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded border border-green-200 bg-white text-green-600">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-green-800 truncate">Manual de Marca Vinculado</p>
                      {pdfManualUrl && (
                        <a 
                          href={pdfManualUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mt-0.5"
                        >
                          Visualizar PDF
                        </a>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-dashed h-9 px-3 text-xs"
                    onClick={() => fileInputRefPdf.current?.click()}
                  >
                    Substituir PDF
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="application/pdf"
                    ref={fileInputRefPdf}
                    className="hidden"
                    onChange={handlePdfUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed p-8 flex flex-col gap-2 items-center justify-center h-auto text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRefPdf.current?.click()}
                  >
                    <UploadCloud className="mr-2 h-6 w-6 text-primary" />
                    <div className="text-center">
                      <p className="text-sm font-semibold">Upload do Manual em PDF</p>
                      <p className="text-xs text-muted-foreground">Identidade Visual, Cores, Tom de Voz (até 15MB)</p>
                    </div>
                  </Button>
                </div>
              )}
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
                  <Label htmlFor="businessName">Nome Fantasia da Empresa (Razão Social)</Label>
                  <Input
                    id="businessName"
                    placeholder="Ex: Pizzaria Forno de Ouro"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={cnpjLocked}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cnpj">CNPJ do Cadastro</Label>
                    {cnpjLocked && (
                      <span className="text-[10px] font-bold text-violet-600 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Protegido
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(formatCnpjLocal(e.target.value))}
                      disabled={cnpjLocked}
                      className="flex-1"
                      maxLength={18}
                    />
                    {cnpjLocked && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setNewCnpj(cnpj);
                          setNewBusinessName(name);
                          setCnpjReason("");
                          setIsCnpjModalOpen(true);
                        }}
                        disabled={hasPendingCnpjRequest}
                        className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 shrink-0 h-10 px-3 text-xs"
                      >
                        Solicitar Alteração
                      </Button>
                    )}
                  </div>
                  {hasPendingCnpjRequest && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">
                      ⚠️ Solicitação de alteração em análise pelo administrador.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria do Negócio</Label>
                  <Input
                    id="category"
                    placeholder="Ex: Restaurantes / Alimentação"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
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

          {/* Diretrizes de Imagem para IA */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5 text-primary" />
                Diretrizes Visuais para Geração de Fotos
              </CardTitle>
              <CardDescription>Instruções estéticas que guiam a IA na renderização das suas imagens conceito</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visualGuidelines">Diretrizes Fotográficas e Conceituais</Label>
                <Textarea
                  id="visualGuidelines"
                  placeholder="Ex: Fotografia de produto clean em estúdio com luz suave, sombras alongadas e fundo em tons pastéis ou madeira clara. Enquadramento focado no centro."
                  value={visualGuidelines}
                  onChange={(e) => setVisualGuidelines(e.target.value)}
                  className="min-h-[100px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  Se você importar um PDF de manual de marca, essas diretrizes serão extraídas automaticamente pela IA da agência. Elas ajudam o motor de imagem (Imagen) a seguir o estilo do seu designer.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tipografia da Marca (Fontes) */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bookmark className="h-5 w-5 text-primary" />
                Tipografia do Brand Kit
              </CardTitle>
              <CardDescription>Estilo de fontes e escritas recomendados para as imagens da marca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="primaryFont">Fonte Primária (Títulos)</Label>
                  <Input
                    id="primaryFont"
                    placeholder="Ex: Eras Light ITC, Montserrat"
                    value={primaryFont}
                    onChange={(e) => setPrimaryFont(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryFont">Fonte Secundária (Textos)</Label>
                  <Input
                    id="secondaryFont"
                    placeholder="Ex: Myriad Pro, Inter"
                    value={secondaryFont}
                    onChange={(e) => setSecondaryFont(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontStyle">Estilo Geral</Label>
                  <Input
                    id="fontStyle"
                    placeholder="Ex: Tecnológico minimalista, serif moderno"
                    value={fontStyle}
                    onChange={(e) => setFontStyle(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personas do Negócio */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Personas da Marca
              </CardTitle>
              <CardDescription>Perfis de compradores ideais mapeados a partir do manual da agência</CardDescription>
            </CardHeader>
            <CardContent>
              {personas.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground bg-slate-50/50">
                  <p className="font-semibold">Nenhuma persona cadastrada.</p>
                  <p className="text-xs mt-1">Envie o manual de branding em PDF para que nossa IA mapeie e gere os perfis de compradores ideais automaticamente!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {personas.map((persona, index) => (
                    <div
                      key={persona.name || index}
                      className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 space-y-3 relative hover:shadow-sm transition-all"
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800">{persona.name || `Persona ${index + 1}`}</h4>
                        <p className="text-[10px] uppercase font-semibold tracking-wider text-primary">{persona.profile || "Colaborador"}</p>
                      </div>
                      <div className="space-y-2 text-xs text-slate-600 border-t pt-2">
                        <div>
                          <strong className="text-slate-700 text-[10px] uppercase block">Desafios/Dores:</strong>
                          <p className="mt-0.5 line-clamp-3 leading-relaxed">{persona.painPoints || "Sem descrição"}</p>
                        </div>
                        <div>
                          <strong className="text-slate-700 text-[10px] uppercase block">Motivação de Compra:</strong>
                          <p className="mt-0.5 line-clamp-3 leading-relaxed">{persona.buyingMotivation || "Sem descrição"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Modal de Solicitação de Alteração de CNPJ */}
      <Dialog open={isCnpjModalOpen} onOpenChange={setIsCnpjModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Solicitar Alteração Jurídica do Negócio</DialogTitle>
            <DialogDescription className="text-slate-400">
              Para prevenção de abusos de múltiplos negócios por conta, a alteração de CNPJ/Nome necessita de aprovação administrativa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 text-slate-300">
            <div className="space-y-2">
              <Label htmlFor="modal-new-business-name" className="text-slate-200">Novo Nome da Empresa (Razão Social)</Label>
              <Input
                id="modal-new-business-name"
                placeholder="Ex: Clínica Beleza Pura Ltda"
                value={newBusinessName}
                onChange={(e) => setNewBusinessName(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-new-cnpj" className="text-slate-200">Novo CNPJ</Label>
              <Input
                id="modal-new-cnpj"
                placeholder="00.000.000/0000-00"
                value={newCnpj}
                onChange={(e) => setNewCnpj(formatCnpjLocal(e.target.value))}
                className="bg-slate-950 border-slate-800 text-white"
                maxLength={18}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-reason" className="text-slate-200">Justificativa da Alteração</Label>
              <Textarea
                id="modal-reason"
                placeholder="Descreva o motivo real de mudança jurídica (ex: transição de MEI para LTDA, correção de digitação, reestruturação societária...)"
                value={cnpjReason}
                onChange={(e) => setCnpjReason(e.target.value)}
                className="min-h-[100px] bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCnpjModalOpen(false)}
              disabled={isSubmittingCnpjRequest}
              className="border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSubmittingCnpjRequest || !newBusinessName.trim() || newCnpj.replace(/\D/g, "").length !== 14 || !cnpjReason.trim()}
              onClick={async () => {
                if (!user) return;
                setIsSubmittingCnpjRequest(true);
                try {
                  const cleanNewCnpj = newCnpj.replace(/\D/g, "");
                  const cleanCurrentCnpj = cnpj.replace(/\D/g, "");
                  
                  await createCnpjRequest(
                    user.uid,
                    user.email || "",
                    cleanCurrentCnpj,
                    name,
                    cleanNewCnpj,
                    newBusinessName,
                    cnpjReason
                  );
                  
                  toast({
                    title: "Solicitação Enviada!",
                    description: "Seu pedido de alteração foi cadastrado e está sob revisão.",
                    variant: "success",
                  });
                  
                  setIsCnpjModalOpen(false);
                  await loadProfile();
                } catch (err: any) {
                  toast({
                    title: "Erro ao enviar",
                    description: err.message,
                    variant: "destructive",
                  });
                } finally {
                  setIsSubmittingCnpjRequest(false);
                }
              }}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {isSubmittingCnpjRequest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Solicitação"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Branding Extraído do PDF */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-900 border border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              Revisar Branding Extraído da Agência
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Nosso assistente analisou o PDF e identificou as diretrizes de marca abaixo. Deseja aplicá-las às suas configurações locais?
            </DialogDescription>
          </DialogHeader>

          {extractedBrandData && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2 text-slate-300 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Nome do Negócio</span>
                  <p className="font-semibold text-white mt-0.5">{extractedBrandData.name || "Não identificado"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Slogan</span>
                  <p className="font-semibold text-white mt-0.5">{extractedBrandData.slogan || "Não identificado"}</p>
                </div>
              </div>

              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Descrição Comercial</span>
                <p className="mt-0.5 text-slate-200">{extractedBrandData.description || "Não identificada"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Público-Alvo</span>
                  <p className="mt-0.5 text-slate-200">{extractedBrandData.targetAudience || "Não identificado"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tom de Voz</span>
                  <p className="mt-0.5 text-slate-200">{extractedBrandData.toneOfVoice || "Não identificado"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Cor Primária</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-6 w-6 rounded border border-slate-700" style={{ backgroundColor: extractedBrandData.primaryColor }} />
                    <span className="font-mono text-xs text-white">{extractedBrandData.primaryColor || "N/A"}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Cor Secundária</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-6 w-6 rounded border border-slate-700" style={{ backgroundColor: extractedBrandData.secondaryColor }} />
                    <span className="font-mono text-xs text-white">{extractedBrandData.secondaryColor || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Diretrizes Visuais para IA</span>
                <p className="mt-0.5 text-slate-200 text-xs leading-relaxed">{extractedBrandData.visualGuidelines || "Não identificadas"}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Principais Benefícios / Diferenciais</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {extractedBrandData.mainBenefits && extractedBrandData.mainBenefits.length > 0 ? (
                    extractedBrandData.mainBenefits.map((b: string) => (
                      <span key={b} className="bg-blue-900/50 border border-blue-800 text-blue-200 rounded px-2 py-0.5 text-xs font-semibold">
                        {b}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">Nenhum benefício listado.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-800 border-none"
              onClick={() => {
                setIsConfirmModalOpen(false);
                setExtractedBrandData(null);
              }}
            >
              Descartar
            </Button>
            <Button
              type="button"
              className="bg-primary text-white hover:bg-primary/90 shadow-md"
              onClick={handleAcceptExtractedBranding}
            >
              Aplicar ao Meu Negócio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

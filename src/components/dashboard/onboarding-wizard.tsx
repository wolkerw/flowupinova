"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  MapPin,
  Phone,
  Palette,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Camera,
  Loader2,
  Zap,
  Star,
  Rocket,
  Globe,
  Instagram,
  Sparkles,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { updateOnboardingProfile, OnboardingProfileData } from "@/lib/services/onboarding-service";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface OnboardingWizardProps {
  userId: string;
  initialData: OnboardingProfileData | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingWizard({
  userId,
  initialData,
  isOpen,
  onClose,
  onComplete,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    website: initialData?.website || "",
    instagram: initialData?.instagram || "",
    description: initialData?.description || "",
    primaryColor: initialData?.primaryColor || "#3b82f6",
    secondaryColor: initialData?.secondaryColor || "#1e293b",
    logoUrl: initialData?.logo?.url || "",
    logoWidth: initialData?.logo?.width || 0,
    logoHeight: initialData?.logo?.height || 0,
    slogan: initialData?.slogan || "",
    targetAudience: initialData?.targetAudience || "",
    toneOfVoice: initialData?.toneOfVoice || "",
    cnpj: initialData?.cnpj || "",
    cnpjLocked: initialData?.cnpjLocked || false,
  });

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo?.url || null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        category: initialData.category || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        website: initialData.website || "",
        instagram: initialData.instagram || "",
        description: initialData.description || "",
        primaryColor: initialData.primaryColor || "#3b82f6",
        secondaryColor: initialData.secondaryColor || "#1e293b",
        logoUrl: initialData.logo?.url || "",
        logoWidth: initialData.logo?.width || 0,
        logoHeight: initialData.logo?.height || 0,
        slogan: initialData.slogan || "",
        targetAudience: initialData.targetAudience || "",
        toneOfVoice: initialData.toneOfVoice || "",
        cnpj: initialData.cnpj ? formatCnpj(initialData.cnpj) : "",
        cnpjLocked: initialData.cnpjLocked || false,
      });
      setLogoPreview(initialData.logo?.url || null);
    }
  }, [initialData]);

  const handleNext = () => {
    if (step === 2) {
      const cleanCnpj = formData.cnpj.replace(/\D/g, "");
      if (!formData.name.trim()) {
        toast({ title: "Nome fantasia obrigatório", description: "Por favor, insira o nome fantasia da empresa.", variant: "destructive" });
        return;
      }
      if (cleanCnpj.length !== 14) {
        toast({ title: "CNPJ obrigatório", description: "Por favor, informe um CNPJ válido de 14 dígitos.", variant: "destructive" });
        return;
      }
    }

    if (step < totalSteps) {
      // Salva o progresso parcial no Firestore de forma assíncrona para garantir persistência robusta
      updateOnboardingProfile(userId, {
        name: formData.name,
        category: formData.category,
        phone: formData.phone,
        address: formData.address,
        website: formData.website,
        instagram: formData.instagram,
        description: formData.description,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        slogan: formData.slogan,
        targetAudience: formData.targetAudience,
        toneOfVoice: formData.toneOfVoice,
        cnpj: formData.cnpj.replace(/\D/g, ""),
        logo: {
          url: formData.logoUrl,
          width: formData.logoWidth,
          height: formData.logoHeight,
        },
        logos: {
          vertical: {
            url: formData.logoUrl,
            width: formData.logoWidth,
            height: formData.logoHeight,
          },
          horizontal: initialData?.logos?.horizontal || { url: "", width: 0, height: 0 },
          symbol: initialData?.logos?.symbol || { url: "", width: 0, height: 0 },
        },
      }).catch((err) => console.error("Erro ao salvar progresso parcial:", err));

      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleAnalyzeWithIA = async () => {
    if (!formData.website && !formData.instagram) {
      toast({
        title: "Dados necessários",
        description: "Insira um site ou Instagram para que a IA possa analisar.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Garante que a URL tenha protocolo para o scraper não falhar
      let websiteUrl = formData.website;
      if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
        websiteUrl = `https://${websiteUrl}`;
      }

      // Envia como FormData para compatibilidade com o n8n
      const formDataToSend = new FormData();
      formDataToSend.append("website", websiteUrl || "");
      formDataToSend.append("instagram", formData.instagram || "");
      formDataToSend.append("userId", userId);

      const response = await fetch("/api/proxy-webhook?target=analisar_presenca", {
        method: "POST",
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("NumVapt IA - Resposta do Webhook:", result);

        // Lógica de extração robusta para lidar com diferentes formatos do n8n/IA
        let extractedData = null;

        // 1. Tenta pegar o campo 'output'
        let rawOutput = Array.isArray(result) ? result[0]?.output : result?.output;

        // 2. Se não houver 'output', tenta o objeto/array direto
        if (!rawOutput) {
          rawOutput = Array.isArray(result) ? result[0] : result;
        }

        // 3. Se for string (comum no n8n), tenta parsear
        if (typeof rawOutput === "string") {
          try {
            const parsed = JSON.parse(rawOutput);
            extractedData = Array.isArray(parsed) ? parsed[0] : parsed;
          } catch (e) {
            console.warn("NumVapt IA - Output não é um JSON válido, usando como texto simples.");
            extractedData = { description: rawOutput };
          }
        } else {
          extractedData = rawOutput;
        }

        if (extractedData && typeof extractedData === "object") {
          console.log("NumVapt IA - Dados finais para mapeamento:", extractedData);

          setFormData((prev) => ({
            ...prev,
            name: extractedData.name || extractedData.nome || prev.name,
            category: extractedData.category || extractedData.categoria || prev.category,
            phone: extractedData.phone || extractedData.telefone || extractedData.whatsapp || prev.phone,
            address: extractedData.address || extractedData.endereco || extractedData.localizacao || prev.address,
            description:
              extractedData.description ||
              extractedData.descricao ||
              extractedData.bio ||
              prev.description,
            primaryColor:
              extractedData.primaryColor || extractedData.cor_primaria || prev.primaryColor,
            secondaryColor:
              extractedData.secondaryColor || extractedData.cor_secundaria || prev.secondaryColor,
            slogan: extractedData.slogan || prev.slogan,
            targetAudience: extractedData.target_audience || extractedData.targetAudience || prev.targetAudience,
            toneOfVoice: extractedData.tone_of_voice || extractedData.toneOfVoice || prev.toneOfVoice,
          }));

          // Salvar de imediato no Firestore para garantir persistência à prova de falhas após análise de IA bem sucedida
          const updatedFields = {
            name: extractedData.name || extractedData.nome || formData.name,
            category: extractedData.category || extractedData.categoria || formData.category,
            phone: extractedData.phone || extractedData.telefone || extractedData.whatsapp || formData.phone,
            address: extractedData.address || extractedData.endereco || extractedData.localizacao || formData.address,
            description:
              extractedData.description ||
              extractedData.descricao ||
              extractedData.bio ||
              formData.description,
            primaryColor:
              extractedData.primaryColor || extractedData.cor_primaria || formData.primaryColor,
            secondaryColor:
              extractedData.secondaryColor || extractedData.cor_secundaria || formData.secondaryColor,
            slogan: extractedData.slogan || formData.slogan,
            targetAudience: extractedData.target_audience || extractedData.targetAudience || formData.targetAudience,
            toneOfVoice: extractedData.tone_of_voice || extractedData.toneOfVoice || formData.toneOfVoice,
          };

          updateOnboardingProfile(userId, updatedFields).catch((err) =>
            console.error("Erro ao salvar dados analisados de imediato no Firestore:", err)
          );

          toast({
            title: "Análise concluída!",
            description: "Preenchemos os campos baseados na sua presença digital.",
            variant: "success",
          });

          // Pula para o próximo passo após análise bem sucedida
          setTimeout(() => setStep(2), 1500);
        } else {
          console.error("NumVapt IA - Não foi possível extrair dados válidos:", result);
          throw new Error("Estrutura de dados não reconhecida ou vazia");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || "Erro de conexão com o servidor";
        console.error("NumVapt IA - Erro na resposta do Webhook:", response.status, errorData);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("NumVapt IA - Erro ao processar análise:", error);
      toast({
        title: "IA indisponível",
        description: `${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinish = async () => {
    const cleanCnpj = formData.cnpj.replace(/\D/g, "");
    if (!formData.name.trim() || cleanCnpj.length !== 14) {
      toast({
        title: "Dados obrigatórios",
        description: "Nome fantasia e CNPJ válido (14 dígitos) são obrigatórios na etapa 2.",
        variant: "destructive",
      });
      setStep(2);
      return;
    }

    setIsSaving(true);
    try {
      // Normaliza a URL do website antes de salvar
      let websiteUrl = formData.website;
      if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
        websiteUrl = `https://${websiteUrl}`;
      }

      // Helper para converter dataUrl base64 em File/Blob para upload no Storage
      const uploadBase64ToStorage = async (base64Str: string, type: string) => {
        const res = await fetch(base64Str);
        const blob = await res.blob();
        const storageRef = ref(storage, `users/${userId}/logos/${type}_migrated_${Date.now()}`);
        const uploadResult = await uploadBytes(storageRef, blob);
        return await getDownloadURL(uploadResult.ref);
      };

      let finalLogoUrl = formData.logoUrl;
      if (formData.logoUrl && formData.logoUrl.startsWith("data:image")) {
        toast({ title: "Migrando logomarca..." });
        finalLogoUrl = await uploadBase64ToStorage(formData.logoUrl, "vertical");
        setFormData(prev => ({ ...prev, logoUrl: finalLogoUrl }));
      }

      let finalHorizontalUrl = initialData?.logos?.horizontal?.url || "";
      if (finalHorizontalUrl && finalHorizontalUrl.startsWith("data:image")) {
        finalHorizontalUrl = await uploadBase64ToStorage(finalHorizontalUrl, "horizontal");
      }

      let finalSymbolUrl = initialData?.logos?.symbol?.url || "";
      if (finalSymbolUrl && finalSymbolUrl.startsWith("data:image")) {
        finalSymbolUrl = await uploadBase64ToStorage(finalSymbolUrl, "symbol");
      }

      await updateOnboardingProfile(userId, {
        name: formData.name,
        category: formData.category,
        phone: formData.phone,
        address: formData.address,
        website: websiteUrl,
        instagram: formData.instagram,
        description: formData.description,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        slogan: formData.slogan,
        targetAudience: formData.targetAudience,
        toneOfVoice: formData.toneOfVoice,
        cnpj: cleanCnpj,
        cnpjLocked: true, // Travar o CNPJ na conclusão do onboarding
        onboardingCompleted: true,
        logo: {
          url: finalLogoUrl,
          width: formData.logoWidth,
          height: formData.logoHeight,
        },
        logos: {
          vertical: {
            url: finalLogoUrl,
            width: formData.logoWidth,
            height: formData.logoHeight,
          },
          horizontal: {
            url: finalHorizontalUrl,
            width: initialData?.logos?.horizontal?.width || 0,
            height: initialData?.logos?.horizontal?.height || 0,
          },
          symbol: {
            url: finalSymbolUrl,
            width: initialData?.logos?.symbol?.width || 0,
            height: initialData?.logos?.symbol?.height || 0,
          },
        },
      });
      
      setIsFinished(true);
      setTimeout(() => {
        onComplete();
      }, 2500);
    } catch (error) {
      console.error("Erro ao finalizar onboarding:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas informações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    const cleanCnpj = formData.cnpj.replace(/\D/g, "");
    try {
      // Helper para converter dataUrl base64 em File/Blob para upload no Storage
      const uploadBase64ToStorage = async (base64Str: string, type: string) => {
        const res = await fetch(base64Str);
        const blob = await res.blob();
        const storageRef = ref(storage, `users/${userId}/logos/${type}_migrated_${Date.now()}`);
        const uploadResult = await uploadBytes(storageRef, blob);
        return await getDownloadURL(uploadResult.ref);
      };

      let finalLogoUrl = formData.logoUrl;
      if (formData.logoUrl && formData.logoUrl.startsWith("data:image")) {
        finalLogoUrl = await uploadBase64ToStorage(formData.logoUrl, "vertical");
        setFormData(prev => ({ ...prev, logoUrl: finalLogoUrl }));
      }

      let finalHorizontalUrl = initialData?.logos?.horizontal?.url || "";
      if (finalHorizontalUrl && finalHorizontalUrl.startsWith("data:image")) {
        finalHorizontalUrl = await uploadBase64ToStorage(finalHorizontalUrl, "horizontal");
      }

      let finalSymbolUrl = initialData?.logos?.symbol?.url || "";
      if (finalSymbolUrl && finalSymbolUrl.startsWith("data:image")) {
        finalSymbolUrl = await uploadBase64ToStorage(finalSymbolUrl, "symbol");
      }

      // Salva o progresso inserido até o momento antes de marcar como completo, impedindo perda de dados
      await updateOnboardingProfile(userId, {
        name: formData.name,
        category: formData.category,
        phone: formData.phone,
        address: formData.address,
        website: formData.website,
        instagram: formData.instagram,
        description: formData.description,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        slogan: formData.slogan,
        targetAudience: formData.targetAudience,
        toneOfVoice: formData.toneOfVoice,
        cnpj: cleanCnpj,
        cnpjLocked: cleanCnpj.length === 14, // Travar se estiver preenchido completamente
        onboardingCompleted: true,
        logo: {
          url: finalLogoUrl,
          width: formData.logoWidth,
          height: formData.logoHeight,
        },
        logos: {
          vertical: {
            url: finalLogoUrl,
            width: formData.logoWidth,
            height: formData.logoHeight,
          },
          horizontal: {
            url: finalHorizontalUrl,
            width: initialData?.logos?.horizontal?.width || 0,
            height: initialData?.logos?.horizontal?.height || 0,
          },
          symbol: {
            url: finalSymbolUrl,
            width: initialData?.logos?.symbol?.width || 0,
            height: initialData?.logos?.symbol?.height || 0,
          },
        },
      });
      onComplete();
    } catch (error) {
      onClose();
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    toast({ title: "Enviando logomarca...", description: "Por favor, aguarde o upload." });

    try {
      // 1. Fazer upload para o Firebase Storage
      const storageRef = ref(storage, `users/${userId}/logos/logo_onboarding_${Date.now()}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      // 2. Ler as dimensões da imagem localmente para consistência de aspect-ratio
      const img = document.createElement("img");
      const reader = new FileReader();
      
      reader.onloadend = () => {
        img.onload = () => {
          const w = img.naturalWidth || img.width || 0;
          const h = img.naturalHeight || img.height || 0;
          
          setLogoPreview(downloadUrl);
          setFormData({
            ...formData,
            logoUrl: downloadUrl,
            logoWidth: w,
            logoHeight: h,
          });
          toast({ title: "Logomarca carregada!", description: "Imagem salva com sucesso no servidor.", variant: "success" });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);

    } catch (err: any) {
      console.error("Erro no upload da logomarca:", err);
      toast({
        title: "Erro ao carregar logomarca",
        description: err.message || "Tente novamente com outro arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "circOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
  };

  const stepsInfo = [
    { id: 1, title: "Presença", subtitle: "Onde você está na web", icon: Globe },
    { id: 2, title: "Identidade", subtitle: "O coração do seu negócio", icon: Building2 },
    { id: 3, title: "Contato", subtitle: "Esteja onde o cliente está", icon: Phone },
    { id: 4, title: "Essência", subtitle: "O que faz você ser único", icon: Star },
    { id: 5, title: "Visual", subtitle: "Sua marca, suas regras", icon: Palette },
  ];

  if (isFinished) {
    return (
      <Dialog open={isOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 border-none bg-white overflow-hidden shadow-2xl rounded-[40px]">
          <DialogTitle className="sr-only">Onboarding Concluído com Sucesso</DialogTitle>
          <DialogDescription className="sr-only">Suas configurações foram salvas com sucesso!</DialogDescription>
          <div className="py-20 flex flex-col items-center justify-center text-center px-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-24 h-24 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-blue-100"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black text-slate-900 mb-4 tracking-tight"
            >
              Sensacional!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-slate-500 text-lg mb-8 leading-relaxed"
            >
              As configurações foram salvas. O <strong>NumVapt</strong> agora está totalmente sintonizado com sua marca.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 text-cyan-600 font-bold bg-cyan-50 px-6 py-3 rounded-full"
            >
              <Rocket className="w-5 h-5" /> Decolando em instantes...
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[850px] w-[95vw] max-h-[95vh] md:h-auto md:min-h-[600px] p-0 overflow-hidden border-none shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] bg-white rounded-[32px] flex flex-col">
        <DialogTitle className="sr-only">Configuração Inicial do Negócio (Onboarding)</DialogTitle>
        <DialogDescription className="sr-only">Preencha as informações do seu negócio para personalizar as gerações de posts com IA.</DialogDescription>
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar Left */}
          <div className="w-full md:w-[280px] bg-[#030712] relative overflow-y-auto md:overflow-hidden p-6 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 shrink-0">
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-blue-700 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[120%] bg-cyan-500 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10">
              <div className="mb-14">
                <Image 
                  src="/logo-numvapt.png" 
                  alt="NumVapt Logo" 
                  width={160} 
                  height={40} 
                  priority
                  className="brightness-0 invert h-auto w-auto max-w-[180px]" 
                />
              </div>

              <div className="space-y-7">
                {stepsInfo.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 group">
                    <div className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 border relative",
                      s.id === step 
                        ? "bg-cyan-500 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-110" 
                        : s.id < step 
                          ? "bg-emerald-500 border-emerald-400" 
                          : "bg-white/5 border-white/10 group-hover:bg-white/10"
                    )}>
                      {s.id < step ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <s.icon className={cn("w-5 h-5", s.id === step ? "text-white" : "text-white/30")} />
                      )}
                      {s.id === step && (
                        <motion.div 
                          layoutId="active-glow"
                          className="absolute inset-0 rounded-2xl bg-cyan-400/20 blur-md"
                        />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-[0.2em]",
                        s.id <= step ? "text-cyan-400" : "text-white/20"
                      )}>Etapa {s.id}</span>
                      <span className={cn(
                        "text-base font-bold transition-colors tracking-tight",
                        s.id <= step ? "text-white" : "text-white/30"
                      )}>{s.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-10 border-t border-white/10">
              <div className="flex items-center gap-2 text-white/40 mb-2">
                <Sparkles className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Inteligência Artificial</span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                Conecte seu site e deixe a IA cuidar do preenchimento para você.
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 md:p-12 flex flex-col bg-slate-50/40 relative overflow-hidden">
            {/* Analysis Overlay */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="relative w-32 h-32 mb-8">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-4 border-cyan-100 border-t-cyan-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Search className="w-10 h-10 text-cyan-500 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Analisando seu Negócio...</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">
                    Nossa IA está visitando seus canais para extrair sua identidade e essência.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1 pr-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {stepsInfo[step-1].title}
                </h2>
                <p className="text-slate-500 font-semibold text-base">
                  {stepsInfo[step-1].subtitle}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label htmlFor="website" className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Website URL</Label>
                        <div className="relative group">
                          <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-cyan-500 transition-colors" />
                          <Input 
                            id="website" 
                            placeholder="www.suaempresa.com.br" 
                            value={formData.website}
                            onChange={(e) => setFormData({...formData, website: e.target.value})}
                            className="pl-14 h-14 text-lg border-slate-200 bg-white rounded-2xl focus-visible:border-cyan-500 focus-visible:ring-4 focus-visible:ring-cyan-500/20 focus-visible:ring-offset-0 transition-all shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="instagram" className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Instagram (@usuario)</Label>
                        <div className="relative group">
                          <Instagram className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-cyan-500 transition-colors" />
                          <Input 
                            id="instagram" 
                            placeholder="@seuinsta" 
                            value={formData.instagram}
                            onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                            className="pl-14 h-14 text-lg border-slate-200 bg-white rounded-2xl focus-visible:border-cyan-500 focus-visible:ring-4 focus-visible:ring-cyan-500/20 focus-visible:ring-offset-0 transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-200/50 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <Sparkles className="w-20 h-20" />
                      </div>
                      <div className="relative z-10">
                        <h4 className="text-xl font-black mb-2 flex items-center gap-2">
                          Poupe tempo com IA
                        </h4>
                        <p className="text-cyan-50 text-sm mb-4 leading-relaxed max-w-sm">
                          Nossa IA analisará seu site ou Instagram para preencher automaticamente seu nome, categoria e descrição.
                        </p>
                        <Button 
                          onClick={handleAnalyzeWithIA}
                          className="w-full bg-white text-cyan-600 hover:bg-cyan-50 h-14 rounded-xl font-black text-lg gap-2 shadow-lg"
                        >
                          <Zap className="w-5 h-5 fill-cyan-600" /> Analisar Agora
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Fantasia (Obrigatório)</Label>
                        <Input 
                          id="name" 
                          placeholder="Nome da sua empresa" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="h-14 text-lg border-slate-200 bg-white rounded-2xl focus-visible:border-cyan-500 focus-visible:ring-4 focus-visible:ring-cyan-500/20 focus-visible:ring-offset-0 transition-all shadow-sm px-5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnpj" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">CNPJ (Obrigatório)</Label>
                        <Input 
                          id="cnpj" 
                          placeholder="00.000.000/0000-00" 
                          value={formData.cnpj}
                          onChange={(e) => setFormData({...formData, cnpj: formatCnpj(e.target.value)})}
                          className="h-14 text-lg border-slate-200 bg-white rounded-2xl focus-visible:border-cyan-500 focus-visible:ring-4 focus-visible:ring-cyan-500/20 focus-visible:ring-offset-0 transition-all shadow-sm px-5"
                          disabled={formData.cnpjLocked}
                          maxLength={18}
                        />
                        <p className="text-[10px] text-slate-400 ml-1">
                          {formData.cnpjLocked 
                            ? "O CNPJ está travado para proteção jurídica da assinatura. Solicite alteração se necessário."
                            : "O CNPJ vincula sua assinatura e não poderá ser alterado livremente após o Onboarding."
                          }
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Ramo de Atividade</Label>
                        <Input 
                          id="category" 
                          placeholder="Ex: Restaurante, Consultoria Jurídica..." 
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="h-14 text-lg border-slate-200 bg-white rounded-2xl focus-visible:border-cyan-500 focus-visible:ring-4 focus-visible:ring-cyan-500/20 focus-visible:ring-offset-0 transition-all shadow-sm px-5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slogan" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Slogan da Marca (Opcional)</Label>
                        <Input 
                          id="slogan" 
                          placeholder="Ex: O sabor que transforma o seu dia" 
                          value={formData.slogan}
                          onChange={(e) => setFormData({...formData, slogan: e.target.value})}
                          className="h-14 text-lg border-slate-200 bg-white rounded-2xl focus:ring-primary/20 px-5"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Contato</Label>
                        <div className="relative">
                          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                          <Input 
                            id="phone" 
                            placeholder="(00) 00000-0000" 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="pl-14 h-14 text-lg border-slate-200 bg-white rounded-2xl focus-visible:border-cyan-500 focus-visible:ring-4 focus-visible:ring-cyan-500/20 focus-visible:ring-offset-0 transition-all shadow-sm px-5"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Endereço Físico</Label>
                        <div className="relative">
                          <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                          <Input 
                            id="address" 
                            placeholder="Rua, Número, Bairro, Cidade..." 
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="pl-14 h-14 text-lg border-slate-200 bg-white rounded-2xl focus-visible:border-cyan-500 focus-visible:ring-4 focus-visible:ring-cyan-500/20 focus-visible:ring-offset-0 transition-all shadow-sm px-5"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-4"
                  >
                    <Label htmlFor="description" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Bio do Negócio</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Descreva o que seu negócio oferece e qual seu diferencial..." 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="min-h-[220px] text-lg p-7 border-slate-200 bg-white rounded-[32px] focus-visible:border-cyan-500 focus-visible:ring-4 focus-visible:ring-cyan-500/20 focus-visible:ring-offset-0 transition-all resize-none leading-relaxed shadow-inner"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="targetAudience" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Público-alvo</Label>
                        <Input 
                          id="targetAudience" 
                          placeholder="Ex: Jovens profissionais" 
                          value={formData.targetAudience}
                          onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                          className="h-14 text-base border-slate-200 bg-white rounded-2xl focus:ring-primary/20 px-5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="toneOfVoice" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tom de Voz</Label>
                        <Input 
                          id="toneOfVoice" 
                          placeholder="Ex: Casual e amigável" 
                          value={formData.toneOfVoice}
                          onChange={(e) => setFormData({...formData, toneOfVoice: e.target.value})}
                          className="h-14 text-base border-slate-200 bg-white rounded-2xl focus:ring-primary/20 px-5"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div
                    key="step5"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-8"
                  >
                    <div className="flex flex-col sm:flex-row gap-8">
                      <div className="flex-1 space-y-3">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Sua Logo</Label>
                        <div 
                          className="relative aspect-square rounded-[40px] border-2 border-dashed border-slate-200 hover:border-cyan-500 hover:bg-white transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden bg-slate-100/50 group shadow-inner"
                          onClick={() => !isUploadingLogo && document.getElementById('logo-upload')?.click()}
                        >
                          {isUploadingLogo ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
                              <span className="text-[10px] font-black uppercase text-cyan-500 tracking-tighter animate-pulse">Enviando logo...</span>
                            </div>
                          ) : logoPreview ? (
                            <div className="relative w-full h-full p-8">
                              <Image src={logoPreview} alt="Logo" fill style={{ objectFit: 'contain' }} className="p-4 transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera className="w-8 h-8 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <UploadCloud className="w-10 h-10 text-slate-300 group-hover:text-cyan-500 transition-colors" />
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Upload PNG/JPG</span>
                            </div>
                          )}
                          <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={isUploadingLogo} />
                        </div>
                      </div>

                      <div className="flex-1 space-y-6">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Cores da Marca</Label>
                        <div className="space-y-4">
                          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                            <input 
                              type="color" 
                              value={formData.primaryColor}
                              onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                              className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-slate-50 p-0 bg-transparent shadow-lg"
                            />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cor Principal</span>
                              <span className="text-base font-mono font-black text-slate-900">{formData.primaryColor.toUpperCase()}</span>
                            </div>
                          </div>
                          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                            <input 
                              type="color" 
                              value={formData.secondaryColor}
                              onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                              className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-slate-50 p-0 bg-transparent shadow-lg"
                            />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cor Secundária</span>
                              <span className="text-base font-mono font-black text-slate-900">{formData.secondaryColor.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200/60">
              <Button 
                variant="ghost" 
                onClick={step === 1 ? handleSkip : handleBack} 
                className="text-slate-400 hover:text-slate-900 font-bold transition-colors h-14 px-6 rounded-2xl"
              >
                {step === 1 ? "Pular agora" : "Voltar"}
              </Button>

              <Button 
                onClick={handleNext} 
                disabled={isSaving || isAnalyzing}
                className={cn(
                  "h-16 px-12 rounded-2xl font-black text-xl shadow-2xl shadow-blue-200/50 transition-all hover:scale-[1.03] active:scale-95",
                  step === totalSteps 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white" 
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                )}
              >
                {isSaving ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : step === totalSteps ? (
                  "Salvar Tudo"
                ) : (
                  <div className="flex items-center gap-3">
                    Continuar <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

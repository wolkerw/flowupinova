"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
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
import { updateBusinessProfile, BusinessProfileData } from "@/lib/services/business-profile-service";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  userId: string;
  initialData: BusinessProfileData | null;
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
  });

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
      });
      setLogoPreview(initialData.logo?.url || null);
    }
  }, [initialData]);

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else handleFinish();
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
            description:
              extractedData.description ||
              extractedData.descricao ||
              extractedData.bio ||
              prev.description,
            primaryColor:
              extractedData.primaryColor || extractedData.cor_primaria || prev.primaryColor,
            secondaryColor:
              extractedData.secondaryColor || extractedData.cor_secundaria || prev.secondaryColor,
          }));

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
    setIsSaving(true);
    try {
      // Normaliza a URL do website antes de salvar
      let websiteUrl = formData.website;
      if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
        websiteUrl = `https://${websiteUrl}`;
      }

      await updateBusinessProfile(userId, {
        name: formData.name,
        category: formData.category,
        phone: formData.phone,
        address: formData.address,
        website: websiteUrl,
        instagram: formData.instagram,
        description: formData.description,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        onboardingCompleted: true,
        logo: {
          url: formData.logoUrl,
          width: 0,
          height: 0,
        },
      });
      
      setIsFinished(true);
      setTimeout(() => {
        onComplete();
      }, 2500);
    } catch (error) {
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
    try {
      await updateBusinessProfile(userId, { onboardingCompleted: true });
      onComplete();
    } catch (error) {
      onClose();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setFormData({ ...formData, logoUrl: base64String });
      };
      reader.readAsDataURL(file);
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
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] bg-white rounded-[32px]">
        <div className="flex flex-col md:flex-row h-full min-h-[600px]">
          {/* Sidebar Left */}
          <div className="w-full md:w-[280px] bg-[#030712] relative overflow-hidden p-10 flex flex-col justify-between border-r border-white/5">
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-blue-700 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[120%] bg-cyan-500 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-14">
                <div className="bg-cyan-500 p-1.5 rounded-lg shadow-lg shadow-cyan-500/20">
                  <Zap className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="text-white text-2xl font-black tracking-tighter">Num<span className="text-cyan-400">Vapt</span></span>
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
          <div className="flex-1 p-12 flex flex-col bg-slate-50/40 relative">
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

            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {stepsInfo[step-1].title}
                </h2>
                <p className="text-slate-500 font-semibold text-base">
                  {stepsInfo[step-1].subtitle}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-slate-200/50 text-slate-400"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-10"
                  >
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="website" className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Website URL</Label>
                        <div className="relative group">
                          <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-cyan-500 transition-colors" />
                          <Input 
                            id="website" 
                            placeholder="www.seusite.com.br" 
                            value={formData.website}
                            onChange={(e) => setFormData({...formData, website: e.target.value})}
                            className="pl-14 h-16 text-lg border-slate-200 bg-white rounded-2xl focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="instagram" className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Instagram (@usuario)</Label>
                        <div className="relative group">
                          <Instagram className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-cyan-500 transition-colors" />
                          <Input 
                            id="instagram" 
                            placeholder="@seu.negocio" 
                            value={formData.instagram}
                            onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                            className="pl-14 h-16 text-lg border-slate-200 bg-white rounded-2xl focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-8 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-200/50 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <Sparkles className="w-20 h-20" />
                      </div>
                      <div className="relative z-10">
                        <h4 className="text-xl font-black mb-2 flex items-center gap-2">
                          Poupe tempo com IA
                        </h4>
                        <p className="text-cyan-50 text-sm mb-6 leading-relaxed max-w-sm">
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
                        <Label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Fantasia</Label>
                        <Input 
                          id="name" 
                          placeholder="Ex: Café do Porto" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="h-14 text-lg border-slate-200 bg-white rounded-2xl focus:ring-primary/20 px-5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Ramo de Atividade</Label>
                        <Input 
                          id="category" 
                          placeholder="Ex: Restaurante, Consultoria Jurídica..." 
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
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
                            className="pl-14 h-14 text-lg border-slate-200 bg-white rounded-2xl focus:ring-primary/20 px-5"
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
                            className="pl-14 h-14 text-lg border-slate-200 bg-white rounded-2xl focus:ring-primary/20 px-5"
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
                      className="min-h-[220px] text-lg p-7 border-slate-200 bg-white rounded-[32px] focus:ring-primary/20 resize-none leading-relaxed shadow-inner"
                    />
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
                          onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                          {logoPreview ? (
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
                          <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
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
            <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-200/60">
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

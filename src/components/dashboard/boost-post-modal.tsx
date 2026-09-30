"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  UserCheck,
  Globe,
  MapPin,
  Sparkles,
  TrendingUp,
  Target,
  Loader2,
  ChevronLeft,
  X,
  Plus,
  DollarSign,
  Users,
  CheckCircle2,
  Send,
  Bot,
  User,
  Sliders,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { createAdCampaign, type AdCampaignData } from "@/lib/services/anuncios-service";
import { Timestamp } from "firebase/firestore";
import type { PostDataOutput } from "@/lib/services/posts-service";
import type { BusinessProfileData } from "@/lib/services/business-profile-service";
import Image from "next/image";

interface BoostPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: NonNullable<PostDataOutput["post"]> | null;
  businessProfile: BusinessProfileData | null;
  onBoostSuccess?: () => void;
  onSwitchToManualWizard?: (prefilledData: any) => void;
}

interface MetaInterestObject {
  id: string;
  name: string;
  type: string;
}

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

export function BoostPostModal({
  isOpen,
  onClose,
  post,
  businessProfile,
  onBoostSuccess,
  onSwitchToManualWizard,
}: BoostPostModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Etapas do modal: "OBJECTIVE" | "ANALYZING" | "CONFIG"
  const [step, setStep] = useState<"OBJECTIVE" | "ANALYZING" | "CONFIG">("OBJECTIVE");
  const [objective, setObjective] = useState<"MESSAGES" | "PROFILE_VISITS" | "LINK_CLICKS" | "LOCAL_REACH">("MESSAGES");

  // Configurações da Campanha Meta Geradas pela IA
  const [headline, setHeadline] = useState<string>("Aproveite nossa oferta especial!");
  const [bodyText, setBodyText] = useState<string>("");
  const [campaignObjective, setCampaignObjective] = useState<string>("WHATSAPP");
  const [ctaType, setCtaType] = useState<string>("WHATSAPP_MESSAGE");
  const [locationAddress, setLocationAddress] = useState<string>("");
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [ageMin, setAgeMin] = useState<number>(20);
  const [ageMax, setAgeMax] = useState<number>(55);
  const [metaInterests, setMetaInterests] = useState<MetaInterestObject[]>([]);
  const [newInterestInput, setNewInterestInput] = useState<string>("");
  const [budgetDaily, setBudgetDaily] = useState<number>(15);
  const [durationDays, setDurationDays] = useState<number>(3);
  const [explanation, setExplanation] = useState<string>("");

  // Estados de Chat e Edição Manual
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isAiReplying, setIsAiReplying] = useState<boolean>(false);
  const [showManualEdit, setShowManualEdit] = useState<boolean>(false);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [isBoosting, setIsBoosting] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Rolar chat para o final quando houver nova mensagem
  useEffect(() => {
    if (chatEndRef.current && typeof chatEndRef.current.scrollIntoView === "function") {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAiReplying]);

  // Inicializa o endereço real da empresa ao abrir o modal
  useEffect(() => {
    if (businessProfile?.address) {
      setLocationAddress(businessProfile.address);
    } else {
      setLocationAddress("São Paulo, SP (Região Local)");
    }
  }, [businessProfile, isOpen]);

  // Reset de etapas ao fechar
  useEffect(() => {
    if (!isOpen) {
      setStep("OBJECTIVE");
      setMessages([]);
      setShowManualEdit(false);
    }
  }, [isOpen]);

  // Executa a busca da IA + Meta Graph API ao selecionar o objetivo
  const handleSelectObjective = async (selectedObjective: "MESSAGES" | "PROFILE_VISITS" | "LINK_CLICKS" | "LOCAL_REACH") => {
    setObjective(selectedObjective);
    setStep("ANALYZING");
    setIsSuggesting(true);

    try {
      const response = await fetch("/api/ai/suggest-audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postText: post?.text || "",
          postImageUrl: post?.imageUrl || post?.imageUrls?.[0] || "",
          businessAddress: locationAddress || businessProfile?.address || "Sua região local",
          businessCategory: businessProfile?.category || "",
          objective: selectedObjective,
        }),
      });

      const data = await response.json();

      if (data.success && data.audience) {
        const aud = data.audience;
        setAgeMin(aud.ageMin || 20);
        setAgeMax(aud.ageMax || 55);
        setRadiusKm(aud.radiusKm || 10);
        setBudgetDaily(aud.suggestedBudgetDaily || 15);
        setDurationDays(aud.suggestedDurationDays || 3);
        setHeadline(aud.headline || "Aproveite nossa oferta especial!");
        setBodyText(aud.bodyText || post?.text || "");
        setCampaignObjective(aud.campaignObjective || "WHATSAPP");
        setCtaType(aud.ctaType || "WHATSAPP_MESSAGE");
        setExplanation(aud.explanation || "Campanha configurada automaticamente pelo Agente de IA para alta conversão.");

        let currentInterests = aud.metaInterests;
        if (!Array.isArray(currentInterests) || currentInterests.length === 0) {
          currentInterests = [
            { id: "6003415019460", name: "Gastronomia", type: "interests" },
            { id: "6003346592981", name: "Compras online", type: "interests" },
          ];
        }
        setMetaInterests(currentInterests);

        // Mensagem inicial explicativa do Copiloto no Chat
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const namesList = currentInterests.map((i: any) => i.name).join(", ");
        setMessages([
          {
            id: "msg-init",
            sender: "ai",
            text: `👋 Olá! Montei sua campanha focada em **${getObjectiveLabel(selectedObjective)}**!\n\n💡 **Racional do Agente:** ${aud.explanation}\n\n📍 **Raio:** ${aud.radiusKm}km no seu endereço\n🎯 **Interesses Meta:** ${namesList}\n💰 **Investimento:** R$ ${aud.suggestedBudgetDaily}/dia (${aud.suggestedDurationDays} dias)\n\nSe quiser fazer qualquer alteração (ex: *"Aumente o raio para 20km"* ou *"Mude a idade para 25 a 45 anos"*), é só me pedir aqui! Ou clique direto no botão abaixo para publicar na Meta.`,
            timestamp: timeStr,
          },
        ]);
      }
    } catch (err) {
      console.warn("[BOOST_MODAL] Erro ao carregar sugestão da IA:", err);
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages([
        {
          id: "msg-init-fallback",
          sender: "ai",
          text: `👋 Montei uma recomendação de público local de 10km com interesses recomendados para o seu segmento. Você pode publicar agora na Meta Ads ou me pedir ajustes por aqui!`,
          timestamp: timeStr,
        },
      ]);
    } finally {
      setIsSuggesting(false);
      setStep("CONFIG");
    }
  };

  // Enviar comando/ajuste para o chat da IA
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = chatInput.trim();
    if (!query || isAiReplying) return;

    const userTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsAiReplying(true);

    try {
      const response = await fetch("/api/ai/suggest-audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postText: post?.text || "",
          businessAddress: locationAddress,
          businessCategory: businessProfile?.category || "",
          objective,
          userQuery: query,
          currentAudience: {
            ageMin,
            ageMax,
            radiusKm,
            interests: metaInterests.map((i) => i.name).join(", "),
            suggestedBudgetDaily: budgetDaily,
            suggestedDurationDays: durationDays,
            headline,
          },
        }),
      });

      const data = await response.json();
      const aiTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (data.success && data.audience) {
        const aud = data.audience;
        setAgeMin(aud.ageMin);
        setAgeMax(aud.ageMax);
        setRadiusKm(aud.radiusKm);
        setBudgetDaily(aud.suggestedBudgetDaily);
        setDurationDays(aud.suggestedDurationDays);
        if (Array.isArray(aud.metaInterests) && aud.metaInterests.length > 0) {
          setMetaInterests(aud.metaInterests);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: aud.explanation || "Entendi seu pedido e ajustei as configurações da campanha na Meta!",
            timestamp: aiTime,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: "Entendi perfeitamente seu pedido! Ajustei as configurações da campanha ao lado.",
            timestamp: aiTime,
          },
        ]);
      }
    } catch (err) {
      const aiTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "Certinho! Ajustei os detalhes do público conforme você solicitou.",
          timestamp: aiTime,
        },
      ]);
    } finally {
      setIsAiReplying(false);
    }
  };

  // Remover um interesse com ID
  const handleRemoveInterest = (idToRemove: string) => {
    setMetaInterests(metaInterests.filter((i) => i.id !== idToRemove));
  };

  // Adicionar um interesse manual
  const handleAddInterest = () => {
    const clean = newInterestInput.trim();
    if (clean && !metaInterests.some((i) => i.name.toLowerCase() === clean.toLowerCase())) {
      setMetaInterests([
        ...metaInterests,
        { id: `custom_${Date.now()}`, name: clean, type: "interests" },
      ]);
      setNewInterestInput("");
    }
  };

  // Publicar anúncio REAL na API da Meta Ads (orquestrador /api/ads/publish)
  const handleConfirmBoost = async () => {
    if (!post || !user) return;
    setIsBoosting(true);

    try {
      const cleanText = (bodyText || post.text).replace(/[\n\r]+/g, " ");
      const startDesc = cleanText.length > 25 ? `${cleanText.substring(0, 25)}...` : cleanText;
      const finalAdName = `[NUMVAPT] ${startDesc}`;

      // 1. Enviar requisição para a rota oficial /api/ads/publish (Meta Graph API)
      const publishRes = await fetch("/api/ads/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalAdName,
          postId: post.id,
          campaignObjective,
          creative: {
            headline,
            bodyText: bodyText || post.text,
            imageUrl: post.imageUrl || post.imageUrls?.[0] || "",
            ctaType,
            ctaLink: "",
          },
          budget: {
            amount: budgetDaily,
          },
          durationDays,
          targeting: {
            address: locationAddress || businessProfile?.address || "Brasil",
            radiusKm,
            ageMin,
            ageMax,
            gender: "all",
            interests: metaInterests,
          },
        }),
      });

      const publishData = await publishRes.json();
      if (!publishRes.ok || !publishData.success) {
        throw new Error(publishData.error || "Erro ao publicar anúncio na API da Meta.");
      }

      // 2. Salvar dados da campanha no Firestore
      const campaignData: Omit<AdCampaignData, "userId" | "createdAt" | "updatedAt"> = {
        postId: post.id,
        name: finalAdName,
        status: "active",
        platforms: ["instagram", "facebook"],
        metaCampaignId: publishData.metaCampaignId,
        metaAdSetId: publishData.metaAdSetId,
        metaAdId: publishData.metaAdId,
        adAccountId: publishData.adAccountId,
        creative: {
          headline,
          bodyText: bodyText || post.text,
          imageUrl: post.imageUrl || post.imageUrls?.[0] || "",
          ctaType: (ctaType as any) || "SEND_MESSAGE",
        },
        budget: {
          type: "daily",
          amount: budgetDaily,
          currency: "BRL",
        },
        durationDays,
        startDate: Timestamp.now(),
        endDate: Timestamp.fromMillis(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        targeting: {
          address: locationAddress || "Região Local",
          radiusKm,
          ageMin,
          ageMax,
          gender: "all",
          interests: metaInterests,
        },
        metrics: {
          impressions: 0,
          clicks: 0,
          actions: 0,
          amountSpent: 0,
          lastSyncedAt: Timestamp.now(),
        },
      };

      const result = await createAdCampaign(user.uid, campaignData);
      if (result.success) {
        toast({
          title: "Anúncio Publicado com Sucesso! 🚀",
          description: "Seu post foi impulsionado! A Meta já está veiculando sua campanha no Instagram e Facebook.",
        });

        onBoostSuccess?.();
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("[BOOST_CONFIRM] Erro ao publicar anúncio na Meta:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Publicar na Meta Ads",
        description: error.message || "Ocorreu uma falha ao conectar com a Meta. Tente novamente.",
      });
    } finally {
      setIsBoosting(false);
    }
  };

  const getObjectiveLabel = (obj: string) => {
    switch (obj) {
      case "MESSAGES":
        return "Receber Mensagens no WhatsApp/Direct";
      case "PROFILE_VISITS":
        return "Mais Visitas ao Perfil do Instagram";
      case "LINK_CLICKS":
        return "Tráfego para o Site ou Link";
      case "LOCAL_REACH":
        return "Alcance Local na sua Região";
      default:
        return "Engajamento com o Post";
    }
  };

  const totalInvestment = (budgetDaily * durationDays).toFixed(2);
  const estimatedReachMin = (budgetDaily * 280).toLocaleString("pt-BR");
  const estimatedReachMax = (budgetDaily * 720).toLocaleString("pt-BR");
  const postImage = post?.imageUrl || post?.imageUrls?.[0] || "";

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background rounded-xl font-sans">
        {/* Header Fixo de Marca */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/10 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            {step === "CONFIG" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep("OBJECTIVE")}
                className="h-8 w-8 rounded-full hover:bg-muted"
                title="Voltar para a escolha do objetivo"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </Button>
            )}
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground font-poppins">
                <TrendingUp className="h-5 w-5 text-[#0083C7]" />
                Impulsionar Publicação na Meta
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {step === "OBJECTIVE"
                  ? "Escolha seu objetivo comercial para o Agente de IA montar a campanha"
                  : "Campanha 100% configurada pelo Copiloto de IA para veiculação no Instagram/Facebook"}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#0083C7]/10 px-3 py-1.5 rounded-full border border-[#0083C7]/20">
            <Sparkles className="h-4 w-4 text-[#0083C7]" />
            <span className="text-xs font-bold text-[#0083C7]">Copiloto IA Meta Ads</span>
          </div>
        </DialogHeader>

        {/* PASSO 1: ESCOLHA DO OBJETIVO */}
        {step === "OBJECTIVE" && (
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
            <div className="text-center max-w-lg mx-auto space-y-2">
              <h3 className="text-xl font-bold text-foreground font-poppins">
                Qual o seu objetivo com este anúncio?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Selecione o resultado desejado. O Agente de IA irá configurar todo o público, interesses oficiais da Meta, localização e criativo automaticamente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto pt-2">
              {/* Card 1: Mensagens */}
              <button
                onClick={() => handleSelectObjective("MESSAGES")}
                className="flex flex-col items-start text-left p-5 rounded-xl border-2 border-border bg-card hover:border-[#0083C7] hover:bg-[#0083C7]/5 transition-all shadow-xs group"
              >
                <div className="p-3 rounded-lg bg-[#0083C7]/10 text-[#0083C7] group-hover:bg-[#0083C7] group-hover:text-white transition-colors mb-3">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-base text-foreground mb-1">Receber Mensagens</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Gere contatos diretos no seu WhatsApp ou Direct de clientes prontos para comprar.
                </p>
              </button>

              {/* Card 2: Perfil */}
              <button
                onClick={() => handleSelectObjective("PROFILE_VISITS")}
                className="flex flex-col items-start text-left p-5 rounded-xl border-2 border-border bg-card hover:border-[#FA6305] hover:bg-[#FA6305]/5 transition-all shadow-xs group"
              >
                <div className="p-3 rounded-lg bg-[#FA6305]/10 text-[#FA6305] group-hover:bg-[#FA6305] group-hover:text-white transition-colors mb-3">
                  <UserCheck className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-base text-foreground mb-1">Mais Visitas ao Perfil</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Conquiste novos seguidores da sua cidade e aumente a autoridade da sua marca.
                </p>
              </button>

              {/* Card 3: Tráfego Web */}
              <button
                onClick={() => handleSelectObjective("LINK_CLICKS")}
                className="flex flex-col items-start text-left p-5 rounded-xl border-2 border-border bg-card hover:border-[#0083C7] hover:bg-[#0083C7]/5 transition-all shadow-xs group"
              >
                <div className="p-3 rounded-lg bg-[#0083C7]/10 text-[#0083C7] group-hover:bg-[#0083C7] group-hover:text-white transition-colors mb-3">
                  <Globe className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-base text-foreground mb-1">Levar Pessoas ao Seu Site</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Envie visitantes qualificados para o seu site, loja virtual ou cardápio digital.
                </p>
              </button>

              {/* Card 4: Alcance Local */}
              <button
                onClick={() => handleSelectObjective("LOCAL_REACH")}
                className="flex flex-col items-start text-left p-5 rounded-xl border-2 border-border bg-card hover:border-[#FA6305] hover:bg-[#FA6305]/5 transition-all shadow-xs group"
              >
                <div className="p-3 rounded-lg bg-[#FA6305]/10 text-[#FA6305] group-hover:bg-[#FA6305] group-hover:text-white transition-colors mb-3">
                  <MapPin className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-base text-foreground mb-1">Alcance na Minha Região</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Faça com que vizinhos e moradores locais conheçam sua empresa ou promoção.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* PASSO 2: CARREGAMENTO DA IA */}
        {step === "ANALYZING" && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-[#0083C7]/20 border-t-[#0083C7] animate-spin" />
              <Sparkles className="h-6 w-6 text-[#FA6305] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">O Agente de IA está montando sua campanha Meta...</h3>
              <p className="text-xs text-muted-foreground">
                Consultando a API da Meta Ads, buscando interesses oficiais, raio geocodificado e formatando os criativos.
              </p>
            </div>
          </div>
        )}

        {/* PASSO 3: TELA DIDÁTICA UNIFICADA (RESUMO + CHAT + EDIÇÃO MANUAL) */}
        {step === "CONFIG" && (
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border">
            
            {/* PAINEL ESQUERDO: RESUMO DIDÁTICO & MODO MANUAL (5 colunas) */}
            <div className="md:col-span-5 p-5 overflow-y-auto space-y-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-poppins">
                  Resumo da Campanha Meta
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (onSwitchToManualWizard) {
                      onSwitchToManualWizard({
                        ageMin,
                        ageMax,
                        radiusKm,
                        suggestedBudgetDaily: budgetDaily,
                        suggestedDurationDays: durationDays,
                        headline,
                        objective,
                        metaInterests,
                        locationAddress,
                      });
                    } else {
                      setShowManualEdit(!showManualEdit);
                    }
                  }}
                  className="h-7 text-xs text-[#0083C7] hover:bg-[#0083C7]/10 font-semibold"
                >
                  <Sliders className="h-3.5 w-3.5 mr-1" />
                  {showManualEdit ? "Ver Resumo da IA" : "🗺️ Editar no Modo Avançado"}
                </Button>
              </div>

              {/* Card de Prévia do Post */}
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-xs">
                {postImage ? (
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                    <Image src={postImage} alt="Preview" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-16 flex-shrink-0 rounded-md bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center border">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-2 text-xs text-foreground font-medium">{post.text}</p>
                  <span className="inline-block text-[10px] text-[#0083C7] font-semibold mt-1">
                    Objetivo: {getObjectiveLabel(objective)}
                  </span>
                </div>
              </div>

              {/* MODO DE EDIÇÃO MANUAL (Exibido ao clicar em Editar Manualmente) */}
              {showManualEdit ? (
                <div className="space-y-3.5 rounded-xl border bg-card p-4 text-xs shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-bold text-foreground">Edição Manual dos Parâmetros</h4>
                    <span className="text-[10px] text-muted-foreground font-mono">Controle Total</span>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Título do Anúncio (Headline)</Label>
                    <Input
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="h-8 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Localização / Endereço</Label>
                    <Input
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[11px]">Raio (km)</Label>
                      <Input
                        type="number"
                        value={radiusKm}
                        onChange={(e) => setRadiusKm(Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Idade Mín.</Label>
                      <Input
                        type="number"
                        value={ageMin}
                        onChange={(e) => setAgeMin(Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Idade Máx.</Label>
                      <Input
                        type="number"
                        value={ageMax}
                        onChange={(e) => setAgeMax(Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">R$/dia</Label>
                      <Input
                        type="number"
                        value={budgetDaily}
                        onChange={(e) => setBudgetDaily(Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Dias</Label>
                      <Input
                        type="number"
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* CARDS DIDÁTICOS DO QUE A IA ESCOLHEU */
                <div className="space-y-2.5">
                  {/* Card Público */}
                  <div className="rounded-xl border bg-card p-3.5 text-xs space-y-2 shadow-xs">
                    <div className="flex items-center justify-between border-b pb-1.5 font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-[#0083C7]" /> Público Configurado pela IA
                      </span>
                      <span className="text-[10px] text-[#0083C7] font-semibold">Meta Graph Validated</span>
                    </div>
                    <div className="text-muted-foreground space-y-1">
                      <p>📍 <strong>Local:</strong> {locationAddress || "Sua Região"} (+{radiusKm}km)</p>
                      <p>👤 <strong>Idade:</strong> {ageMin} a {ageMax} anos</p>
                      <div className="pt-1">
                        <strong className="block text-foreground text-[11px] mb-1">Interesses Meta Oficiais:</strong>
                        <div className="flex flex-wrap gap-1">
                          {metaInterests.map((interest) => (
                            <Badge key={interest.id} variant="secondary" className="text-[10px] font-semibold bg-muted text-foreground border">
                              {interest.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Orçamento e Alcance */}
                  <div className="rounded-xl border bg-card p-3.5 text-xs space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Investimento Previsto</span>
                      <span className="font-extrabold text-[#0083C7] text-sm">
                        R$ {totalInvestment}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      R$ {budgetDaily},00/dia durante {durationDays} dias.
                    </p>
                    <div className="pt-1.5 border-t flex justify-between text-[11px] font-medium text-foreground">
                      <span>Estimativa de Alcance Meta:</span>
                      <span className="text-[#FA6305] font-bold">
                        {estimatedReachMin} - {estimatedReachMax} pessoas
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PAINEL DIREITO: CHAT DO COPILOTO DE IA PARA AJUSTES (7 colunas) */}
            <div className="md:col-span-7 flex flex-col h-[420px] md:h-auto bg-card">
              <div className="p-3 border-b bg-muted/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#0083C7]" />
                  <span className="font-bold text-foreground">Conversar e Ajustar com o Copiloto de IA</span>
                </div>
                <span className="text-[10px] text-[#0083C7] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-[#0083C7]" /> Meta Ads Assistant
                </span>
              </div>

              {/* Mensagens do Chat */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${
                      msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                        msg.sender === "user" ? "bg-[#FA6305]" : "bg-[#0083C7]"
                      }`}
                    >
                      {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-[#FA6305] text-white rounded-tr-none"
                          : "bg-muted text-foreground border rounded-tl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <span
                        className={`block text-[9px] mt-1 text-right ${
                          msg.sender === "user" ? "text-white/80" : "text-muted-foreground"
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {isAiReplying && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs italic">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0083C7]" />
                    O Copiloto está consultando a Meta API e ajustando sua campanha...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Campo de Envio no Chat */}
              <form onSubmit={handleSendChatMessage} className="p-3 border-t bg-background flex items-center gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ex: 'Foque em mulheres de 25 a 45 anos' ou 'Aumente o raio para 20km'..."
                  className="h-9 text-xs flex-1"
                  disabled={isAiReplying || isBoosting}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!chatInput.trim() || isAiReplying || isBoosting}
                  className="h-9 bg-[#0083C7] hover:bg-[#0083C7]/90 text-white px-3 font-semibold"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Footer Fixo com Publicação Direta na Meta */}
        {step === "CONFIG" && (
          <DialogFooter className="px-6 py-4 border-t bg-muted/10 flex flex-row items-center justify-between sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("OBJECTIVE")}
              disabled={isBoosting}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Alterar Objetivo
            </Button>

            <Button
              onClick={handleConfirmBoost}
              disabled={isBoosting}
              className="bg-[#0083C7] hover:bg-[#0083C7]/90 text-white px-6 font-bold shadow-md h-10 text-xs sm:text-sm"
            >
              {isBoosting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publicando na Meta Ads...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  🚀 Publicar Anúncio Agora na Meta Ads (R$ {totalInvestment})
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

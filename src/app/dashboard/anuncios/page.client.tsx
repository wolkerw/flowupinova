"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  Megaphone,
  TrendingUp,
  Sparkles,
  Target,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  Check,
  Loader2,
  Eye,
  ArrowRight,
  Info,
  AlertCircle,
  HelpCircle,
  X,
  Play,
  Pause,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { BusinessProfileData } from "@/lib/services/business-profile-service";
import { getScheduledPosts } from "@/lib/services/posts-service";
import {
  createAdCampaign,
  getUserAdCampaigns,
  updateAdCampaignStatus,
  deleteAdCampaign,
  estimateReach,
  type AdCampaignData,
} from "@/lib/services/anuncios-service";
import Image from "next/image";
import { Timestamp } from "firebase/firestore";

interface AnunciosPageClientProps {
  initialProfile: BusinessProfileData | null;
}

export default function AnunciosPageClient({ initialProfile }: AnunciosPageClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Dados principais
  const [publishedPosts, setPublishedPosts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<AdCampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(initialProfile);

  // Estados do Wizard/Criação
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  // Inputs do Formulário
  const [adName, setAdName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [ctaType, setCtaType] = useState<AdCampaignData["creative"]["ctaType"]>("SEND_MESSAGE");
  const [platforms, setPlatforms] = useState<Array<"instagram" | "facebook">>(["instagram", "facebook"]);
  const [radius, setRadius] = useState<number>(5);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 55]);
  const [gender, setGender] = useState<"all" | "male" | "female">("all");
  const [dailyBudget, setDailyBudget] = useState<number>(15);
  const [duration, setDuration] = useState<number>(7);

  // Estados de IA e Carregamento
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carrega campanhas e posts publicados
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadingPosts(true);
    try {
      // Buscar posts e filtrar apenas publicados
      const postsResult = await getScheduledPosts(user.uid);
      const filteredPosts = postsResult
        .filter((r: any) => r.success && r.post && r.post.status === "published")
        .map((r: any) => r.post);
      setPublishedPosts(filteredPosts);
      setLoadingPosts(false);

      // Buscar campanhas criadas
      const adsResult = await getUserAdCampaigns(user.uid);
      setCampaigns(adsResult);
    } catch (err) {
      console.error("Erro ao carregar dados da página:", err);
      toast({
        variant: "destructive",
        title: "Erro de Carregamento",
        description: "Não conseguimos sincronizar seus posts ou anúncios pagos.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Função para chamar o Ad Copilot (Gemini)
  const handleGenerateAICopy = async () => {
    if (!selectedPost) return;
    setIsGeneratingCopy(true);
    setAiSuggestions([]);

    try {
      const response = await fetch("/api/anuncios/gerar-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmento: businessProfile?.category || "Comércio Geral",
          descricaoNegocio: businessProfile?.description || "",
          textoPost: selectedPost.text,
          objetivo: ctaType === "SEND_MESSAGE" ? "MESSAGES" : ctaType === "LEARN_MORE" ? "LINK_CLICKS" : "ENGAGEMENT",
        }),
      });

      if (!response.ok) throw new Error("Falha na chamada de IA.");
      const data = await response.json();
      if (data && data.sugestoes) {
        setAiSuggestions(data.sugestoes);
        toast({
          title: "Ideias prontas! ✨",
          description: "O Gemini gerou 3 excelentes sugestões de anúncios para você.",
        });
      }
    } catch (err) {
      console.error("Erro ao gerar sugestões de copy:", err);
      toast({
        variant: "destructive",
        title: "Erro do Ad Copilot",
        description: "Não conseguimos gerar sugestões personalizadas de IA no momento.",
      });
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  // Preenche dados ao selecionar um post para impulsionar
  const handleSelectPostToBoost = (post: any) => {
    setSelectedPost(post);
    setHeadline("Aproveite nossa oferta local!");
    setBodyText(post.text);
    setAdName(`Impulsionamento: ${post.text.substring(0, 20)}...`);
    setAiSuggestions([]);
    setCurrentStep(1);
    setIsCreating(true);
  };

  // Confirma e envia para o Firestore
  const handleActivateCampaign = async () => {
    if (!user || !selectedPost) return;
    setIsSubmitting(true);

    try {
      const campaignData: Omit<AdCampaignData, "userId" | "createdAt" | "updatedAt"> = {
        postId: selectedPost.id,
        name: adName || "Impulsionamento Rápido Meta",
        status: "active", // Inicia como ativo diretamente para simulação intuitiva
        platforms,
        creative: {
          headline,
          bodyText,
          imageUrl: selectedPost.imageUrl || selectedPost.imageUrls?.[0] || "",
          ctaType,
          ctaLink: ctaType === "SEND_MESSAGE" ? "https://wa.me/555199922177" : businessProfile?.website || "",
        },
        budget: {
          type: "daily",
          amount: dailyBudget,
          currency: "BRL",
        },
        durationDays: duration,
        startDate: Timestamp.now(),
        endDate: Timestamp.fromMillis(Date.now() + duration * 24 * 60 * 60 * 1000),
        targeting: {
          address: businessProfile?.address || "Centro Comercial Local",
          radiusKm: radius,
          ageMin: ageRange[0],
          ageMax: ageRange[1],
          gender,
        },
        // Iniciar métricas simuladas legais e didáticas!
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
          title: "Campanha no ar! 🚀",
          description: "Seu post foi impulsionado! A Meta já está distribuindo seu anúncio.",
        });
        setIsCreating(false);
        fetchData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      console.error("Erro ao ativar campanha:", err);
      toast({
        variant: "destructive",
        title: "Erro ao Publicar",
        description: err.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alterna o status da campanha (Pausar / Ativar)
  const handleToggleStatus = async (campaign: AdCampaignData) => {
    if (!user || !campaign.id) return;
    const newStatus = campaign.status === "active" ? "paused" : "active";
    try {
      const res = await updateAdCampaignStatus(user.uid, campaign.id, newStatus);
      if (res.success) {
        toast({
          title: newStatus === "active" ? "Anúncio Ativado!" : "Anúncio Pausado!",
          description: `O anúncio foi ${newStatus === "active" ? "ativado" : "pausado"} com sucesso.`,
        });
        fetchData();
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao alterar status",
        description: "Não foi possível atualizar o status do anúncio.",
      });
    }
  };

  // Exclui a campanha de anúncio
  const handleDeleteCampaign = async (campaignId: string) => {
    if (!user || !campaignId) return;
    if (confirm("Tem certeza que deseja excluir esta campanha de anúncio?")) {
      try {
        await deleteAdCampaign(user.uid, campaignId);
        toast({
          title: "Campanha Removida",
          description: "A campanha foi deletada do seu histórico.",
        });
        fetchData();
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Erro ao excluir",
          description: "Não foi possível remover a campanha.",
        });
      }
    }
  };

  // Cálculos dinâmicos da estimativa
  const reach = estimateReach(dailyBudget, duration, radius);

  // Tradução simples de status para leigos
  const getStatusBadge = (status: AdCampaignData["status"]) => {
    const configs = {
      active: { label: "Veiculando", color: "bg-green-500 text-white" },
      paused: { label: "Pausado", color: "bg-yellow-500 text-white" },
      draft: { label: "Rascunho", color: "bg-slate-400 text-white" },
      completed: { label: "Concluído", color: "bg-blue-500 text-white" },
      failed: { label: "Rejeitado", color: "bg-red-500 text-white" },
      pending_payment: { label: "Aguardando", color: "bg-orange-500 text-white" },
    };
    const c = configs[status] || { label: status, color: "bg-slate-500 text-white" };
    return <Badge className={`${c.color} border-none font-semibold px-2 py-0.5`}>{c.label}</Badge>;
  };

  // Nome abreviado do avatar fallback
  const getAvatarFallback = () => {
    if (businessProfile?.name) return businessProfile.name.substring(0, 2).toUpperCase();
    return "NV";
  };

  // Tradutor de CTAs
  const getCtaLabel = (cta: string) => {
    const ctas: Record<string, string> = {
      SEND_MESSAGE: "Enviar Mensagem (WhatsApp)",
      LEARN_MORE: "Saiba Mais (Ver Site)",
      CALL_NOW: "Ligar Agora",
      GET_DIRECTIONS: "Como Chegar (Mapa)",
      SHOP_NOW: "Comprar Agora",
    };
    return ctas[cta] || "Saiba Mais";
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl font-sans text-slate-800">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-poppins flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-primary" />
            Anúncios Pagos (Meta Ads)
          </h1>
          <p className="text-slate-500 mt-1 max-w-2xl font-inter text-sm">
            Atraia clientes ideais na sua vizinhança! Impulsione suas melhores publicações no Instagram e Facebook de forma descomplicada, inteligente e sem jargões complexos.
          </p>
        </div>
        {!isCreating && publishedPosts.length > 0 && (
          <Button
            onClick={() => handleSelectPostToBoost(publishedPosts[0])}
            className="bg-primary hover:bg-primary/95 text-white font-bold px-6 py-3 rounded-lg shadow-sm font-poppins text-sm transition-transform duration-200 active:scale-95"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Impulsionar Post
          </Button>
        )}
      </div>

      {/* TELA DE CRIAÇÃO (WIZARD GUIADO) */}
      {isCreating && selectedPost && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-8">
          
          {/* Cabeçalho do Wizard */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">
                {currentStep}
              </span>
              <div>
                <h3 className="font-bold text-slate-900 font-poppins text-base">Impulsionando Post</h3>
                <p className="text-xs text-slate-500">Passo {currentStep} de 3</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Barra de Progresso Visível e Sutil */}
          <div className="h-1 bg-slate-100 w-full">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* COLUNA ESQUERDA: FORMULÁRIO (8 colunas) */}
            <div className="lg:col-span-7 p-6 border-r border-slate-200">
              
              {/* PASSO 1: EDITAR CONTEÚDO E ASSISTENTE DE IA */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 font-poppins flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      1. O que seu anúncio vai dizer?
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Deixe que o **Ad Copilot da IA** otimize sua legenda para atrair mais atenção e clique de moradores locais!
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="ad-name" className="text-sm font-bold text-slate-700">Nome Interno (Organização)</Label>
                    <Input
                      id="ad-name"
                      value={adName}
                      onChange={(e) => setAdName(e.target.value)}
                      placeholder="Ex: Campanha Promoção de Inverno"
                      className="rounded-lg border-slate-200 text-sm"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="cta-select" className="text-sm font-bold text-slate-700">Ação desejada do cliente</Label>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Info className="h-3 w-3" /> WhatsApp gera 3x mais contatos locais
                      </span>
                    </div>
                    <select
                      id="cta-select"
                      value={ctaType}
                      onChange={(e) => setCtaType(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="SEND_MESSAGE">Enviar mensagem direta no WhatsApp 📲</option>
                      <option value="LEARN_MORE">Saiba Mais (Ver meu Site/Rede Social) 🌐</option>
                      <option value="GET_DIRECTIONS">Como Chegar no Estabelecimento 📍</option>
                      <option value="CALL_NOW">Ligar para a Loja 📞</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-primary flex items-center gap-1">
                        <Sparkles className="h-4 w-4" /> Ad Copilot com Gemini
                      </span>
                      <Button
                        size="sm"
                        onClick={handleGenerateAICopy}
                        disabled={isGeneratingCopy}
                        className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-3 py-1.5 h-auto rounded-md"
                      >
                        {isGeneratingCopy ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            Sugerir Copy de Vendas
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Moradores da sua região reagem melhor a copies curtas com emojis! Clique no botão acima para o Gemini analisar o post e sugerir copys locais otimizadas.
                    </p>

                    {/* Exibição das ideias de IA */}
                    {aiSuggestions.length > 0 && (
                      <div className="mt-3 space-y-3">
                        <p className="text-[11px] font-bold text-slate-600">Escolha uma opção sugerida:</p>
                        {aiSuggestions.map((sug, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setHeadline(sug.titulo);
                              setBodyText(sug.texto);
                              if (sug.ctaSugerido) setCtaType(sug.ctaSugerido);
                              toast({
                                title: "Criação de Anúncio atualizada!",
                                description: "Título e copy aplicados.",
                              });
                            }}
                            className="bg-white border border-slate-150 rounded-lg p-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors">
                                {sug.titulo}
                              </span>
                              <Badge variant="secondary" className="text-[9px] scale-90 py-0 font-medium">Opção {i + 1}</Badge>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {sug.texto}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ad-headline" className="text-sm font-bold text-slate-700">Título Chamativo (Curto)</Label>
                      <Input
                        id="ad-headline"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="Ex: Hambúrguer Artesanal Perto de Você!"
                        maxLength={40}
                        className="rounded-lg border-slate-200 text-sm"
                      />
                      <span className="text-[10px] text-slate-400 text-right block">
                        {headline.length}/40 caracteres (Ideal: Curto)
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ad-body" className="text-sm font-bold text-slate-700">Texto Completo do Anúncio (Legenda)</Label>
                      <Textarea
                        id="ad-body"
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        placeholder="Escreva a legenda que aparecerá no feed de seus clientes locais..."
                        rows={5}
                        className="rounded-lg border-slate-200 text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 2: TARGETING E SEGMENTAÇÃO LOCAL */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 font-poppins flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      2. Onde seu anúncio vai aparecer?
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Moradores próximos do seu negócio físico são os que mais geram vendas! Defina o raio ao redor da sua loja.
                    </p>
                  </div>

                  <div className="space-y-4">
                    
                    {/* Endereço Base */}
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" /> Endereço de Referência
                      </Label>
                      <Input
                        disabled
                        value={businessProfile?.address || "Centro Comercial Local"}
                        className="bg-slate-50 border-slate-200 text-sm cursor-not-allowed text-slate-600"
                      />
                      <p className="text-[10px] text-slate-400">
                        * Puxamos automaticamente o endereço cadastrado no perfil de seu negócio.
                      </p>
                    </div>

                    {/* Slider Raio em KM */}
                    <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700">Raio de entrega do anúncio</span>
                        <span className="text-base font-extrabold text-primary font-poppins">{radius} km</span>
                      </div>
                      <Slider
                        defaultValue={[radius]}
                        max={20}
                        min={1}
                        step={1}
                        onValueChange={(val) => setRadius(val[0])}
                        className="py-2"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>1 km (Ultra local)</span>
                        <span>10 km</span>
                        <span>20 km (Grande alcance)</span>
                      </div>

                      {/* Caixa Educativa */}
                      <div className="mt-3 flex items-start gap-2 bg-white rounded p-2.5 border border-slate-100">
                        <Info className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-slate-500 leading-normal">
                          {radius <= 5 ? (
                            <span>💡 **Excelente escolha!** Raio de até 5km garante que seus anúncios sejam exibidos para vizinhos muito propensos a ir até sua loja ou pedir delivery rápido.</span>
                          ) : (
                            <span>💡 **Atenção:** Um raio maior distribui sua verba de anúncios em áreas distantes. Ideal apenas para negócios que realizam entregas ou prestam serviços em toda a cidade.</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Demografia Básica */}
                    <div className="space-y-4">
                      <Label className="text-sm font-bold text-slate-700">Quem deve ver seu anúncio?</Label>
                      
                      {/* Gênero */}
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant={gender === "all" ? "default" : "outline"}
                          onClick={() => setGender("all")}
                          className={`text-xs py-2 h-auto rounded-lg font-medium border-slate-200 ${gender === "all" ? "bg-primary text-white" : "bg-white text-slate-600"}`}
                        >
                          Todos
                        </Button>
                        <Button
                          type="button"
                          variant={gender === "male" ? "default" : "outline"}
                          onClick={() => setGender("male")}
                          className={`text-xs py-2 h-auto rounded-lg font-medium border-slate-200 ${gender === "male" ? "bg-primary text-white" : "bg-white text-slate-600"}`}
                        >
                          Homens
                        </Button>
                        <Button
                          type="button"
                          variant={gender === "female" ? "default" : "outline"}
                          onClick={() => setGender("female")}
                          className={`text-xs py-2 h-auto rounded-lg font-medium border-slate-200 ${gender === "female" ? "bg-primary text-white" : "bg-white text-slate-600"}`}
                        >
                          Mulheres
                        </Button>
                      </div>

                      {/* Idades */}
                      <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700">Faixa Etária</span>
                          <span className="text-xs font-extrabold text-primary font-poppins">{ageRange[0]} a {ageRange[1]} anos</span>
                        </div>
                        <Slider
                          defaultValue={ageRange}
                          max={65}
                          min={18}
                          step={1}
                          onValueChange={(val) => setAgeRange(val as [number, number])}
                          className="py-2"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* PASSO 3: ORÇAMENTO E SIMULAÇÃO DINÂMICA */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 font-poppins flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      3. Quanto deseja investir?
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Defina seu orçamento diário. Quanto mais você investe, para mais pessoas próximas a Meta exibirá seu post!
                    </p>
                  </div>

                  <div className="space-y-5">
                    
                    {/* Investimento Diário */}
                    <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700">Investimento Diário</span>
                        <span className="text-base font-extrabold text-primary font-poppins">R$ {dailyBudget} / dia</span>
                      </div>
                      <Slider
                        defaultValue={[dailyBudget]}
                        max={100}
                        min={10}
                        step={5}
                        onValueChange={(val) => setDailyBudget(val[0])}
                        className="py-2"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>R$ 10 (Mínimo recomendado)</span>
                        <span>R$ 50</span>
                        <span>R$ 100</span>
                      </div>
                    </div>

                    {/* Duração da Campanha */}
                    <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700">Duração dos Anúncios</span>
                        <span className="text-base font-extrabold text-primary font-poppins">{duration} dias</span>
                      </div>
                      <Slider
                        defaultValue={[duration]}
                        max={30}
                        min={3}
                        step={1}
                        onValueChange={(val) => setDuration(val[0])}
                        className="py-2"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>3 dias (Ideal para teste rápido)</span>
                        <span>15 dias</span>
                        <span>30 dias</span>
                      </div>
                    </div>

                    {/* WIDGET DE RESULTADO DITÁDICO (WOW FACTOR) */}
                    <div className="p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-orange-500/20 rounded-xl relative overflow-hidden">
                      <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none">
                        <Megaphone className="h-32 w-32" />
                      </div>
                      <h5 className="text-xs font-bold text-orange-600 font-poppins uppercase tracking-wide flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" /> Resultados Estimados na Sua Região
                      </h5>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-3 border border-orange-500/10 shadow-sm">
                          <span className="text-[10px] text-slate-400 block font-medium">Pessoas que verão o anúncio:</span>
                          <span className="text-lg font-extrabold text-orange-600 font-poppins mt-0.5 block">
                            {reach.minReach.toLocaleString("pt-BR")} a {reach.maxReach.toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-orange-500/10 shadow-sm">
                          <span className="text-[10px] text-slate-400 block font-medium">Cliques de interesse gerados:</span>
                          <span className="text-lg font-extrabold text-orange-600 font-poppins mt-0.5 block">
                            {reach.minClicks.toLocaleString("pt-BR")} a {reach.maxClicks.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed mt-4 italic">
                        * Com base em históricos de anúncios na Meta para negócios locais no raio de {radius}km. O valor total a ser investido é de **R$ {dailyBudget * duration}** durante o período.
                      </p>
                    </div>

                    {/* Canais */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">Onde seus anúncios serão exibidos:</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 border px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          Instagram Feed & Stories
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          Facebook Feed
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Botões de Ação do Wizard */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
                    else setIsCreating(false);
                  }}
                  className="rounded-lg text-xs font-bold border-slate-200"
                >
                  {currentStep === 1 ? "Cancelar" : "Voltar"}
                </Button>

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-6 py-2 rounded-lg"
                  >
                    Próximo Passo
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleActivateCampaign}
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-8 py-2.5 rounded-lg active:scale-95 transition-all shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ativando Anúncio...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Confirmar e Ativar Anúncio (Meta)
                      </>
                    )}
                  </Button>
                )}
              </div>

            </div>

            {/* COLUNA DIREITA: PREVIEW DO FEED REAL (5 colunas) */}
            <div className="lg:col-span-5 p-6 bg-slate-50 flex flex-col justify-start items-center">
              <div className="sticky top-6 w-full max-w-[340px]">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block text-center">
                  📱 Prévia em tempo real (Meta Feed)
                </p>

                {/* Card de Simulação Meta */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-md overflow-hidden text-left">
                  {/* Topo do Post */}
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-9 w-9 border border-slate-100">
                        <AvatarImage src={businessProfile?.logo?.url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {getAvatarFallback()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block leading-tight">
                          {businessProfile?.name || "Meu Negócio"}
                        </span>
                        <span className="text-[10px] text-primary font-semibold block leading-tight mt-0.5">
                          Patrocinado (Região de {radius}km)
                        </span>
                      </div>
                    </div>
                    <span className="text-slate-400 text-sm font-bold cursor-default">•••</span>
                  </div>

                  {/* Foto do Post */}
                  <div className="relative aspect-square w-full bg-slate-100 border-y border-slate-100">
                    {(selectedPost.imageUrl || selectedPost.imageUrls?.[0]) ? (
                      <Image
                        src={selectedPost.imageUrl || selectedPost.imageUrls?.[0]}
                        alt="Criativo Anúncio"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-300">
                        <Eye className="h-10 w-10" />
                      </div>
                    )}
                  </div>

                  {/* Barra de Ação de Conversão (CTA) */}
                  <div className="px-3.5 py-2.5 bg-[#F2F4F7] border-b border-slate-100 flex justify-between items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium block">
                        Meta Ads Local
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">
                        {headline || "Aproveite nossa oferta local!"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary text-white text-[10px] font-bold h-7 px-3 rounded"
                    >
                      {ctaType === "SEND_MESSAGE" ? "Enviar Mensagem" : ctaType === "LEARN_MORE" ? "Saiba Mais" : ctaType === "GET_DIRECTIONS" ? "Como Chegar" : "Ligar"}
                    </Button>
                  </div>

                  {/* Legenda/Corpo */}
                  <div className="p-3">
                    <p className="text-xs text-slate-700 leading-relaxed font-inter line-clamp-4">
                      <span className="font-bold text-slate-900 mr-1.5">{businessProfile?.name || "Meu Negócio"}</span>
                      {bodyText || selectedPost.text}
                    </p>
                  </div>
                </div>

                {/* Ajuda ao Usuário Leigo */}
                <div className="mt-6 bg-slate-100 border border-slate-200 rounded-lg p-3 flex gap-2">
                  <HelpCircle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-500 leading-relaxed">
                    <span className="font-bold text-slate-700 block">Sua verba é protegida!</span>
                    Os anúncios locais param automaticamente após os {duration} dias, e a cobrança é feita diretamente pela Meta. Você nunca gastará além do limite programado.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DASHBOARD PRINCIPAL (MÉTRICAS E LISTAS) */}
      {!isCreating && (
        <div className="space-y-10">
          
          {/* SEÇÃO EDUCATIVA (BANNER DIDÁTICO) */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 text-slate-200/50 pointer-events-none">
              <Megaphone className="h-44 w-44" />
            </div>
            <div className="space-y-1.5 max-w-3xl">
              <span className="bg-primary/10 text-primary text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full font-poppins">
                Novidade no NumVapt
              </span>
              <h2 className="text-xl font-bold text-slate-900 font-poppins mt-1">
                Por que impulsionar suas publicações locais?
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-inter">
                O algoritmo das redes sociais orgânicas exibe seus posts para apenas cerca de 5% de seus seguidores. Ao investir valores pequenos (como R$ 15 por dia), a Meta distribui ativamente suas fotos de produtos ou serviços para centenas de moradores locais que **ainda não te seguem**, impulsionando contatos imediatos no WhatsApp e atraindo clientes vizinhos à sua loja!
              </p>
            </div>
          </div>

          {/* PAINEL DE MÉTRICAS GERAIS SIMPLIFICADAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="bg-primary/10 p-3.5 rounded-full text-primary">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Investimento Total</span>
                <span className="text-xl font-extrabold text-slate-900 block font-poppins mt-0.5">
                  R$ {campaigns.reduce((acc, curr) => acc + (curr.budget.amount * curr.durationDays), 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="bg-primary/10 p-3.5 rounded-full text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Pessoas Alcançadas</span>
                <span className="text-xl font-extrabold text-slate-900 block font-poppins mt-0.5">
                  {campaigns.reduce((acc, curr) => acc + (curr.metrics?.impressions || 0), 0).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="bg-primary/10 p-3.5 rounded-full text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Ações e Cliques</span>
                <span className="text-xl font-extrabold text-slate-900 block font-poppins mt-0.5">
                  {campaigns.reduce((acc, curr) => acc + (curr.metrics?.clicks || 0), 0).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </div>

          {/* GALERIA DE POSTS PUBLICADOS (SELECIONE PARA IMPULSIONAR) */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 font-poppins flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Seus Posts Publicados (Selecione para Impulsionar)
              </h3>
            </div>

            {loadingPosts ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : publishedPosts.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-8 text-center text-slate-400">
                <p className="text-sm">Nenhum post publicado encontrado no feed. Crie um post na aba **Conteúdo** antes de impulsionar!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {publishedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm flex flex-col group hover:border-primary/40 transition-colors"
                  >
                    <div className="relative aspect-square w-full bg-slate-50">
                      {(post.imageUrl || post.imageUrls?.[0]) ? (
                        <Image
                          src={post.imageUrl || post.imageUrls?.[0]}
                          alt="Thumbnail post"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-300">
                          <Eye className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {post.text}
                      </p>
                      
                      <div className="border-t pt-3 flex justify-between items-center mt-auto">
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          🟢 Pronto para impulsionar
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleSelectPostToBoost(post)}
                          className="bg-primary hover:bg-primary/95 text-white font-bold text-[11px] h-8 px-3 rounded-lg shadow-sm font-poppins"
                        >
                          <Sparkles className="mr-1 h-3.5 w-3.5" />
                          Impulsionar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HISTÓRICO DE CAMPANHAS DE ANÚNCIOS */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-poppins flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Seus Anúncios Recentes (Meta)
            </h3>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                <p className="text-sm">Nenhum anúncio veiculado ainda. Escolha um de seus posts publicados acima para impulsionar!</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-500">
                    <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 border-b border-slate-200 font-poppins tracking-wider">
                      <tr>
                        <th scope="col" className="px-5 py-3.5 font-bold">Anúncio</th>
                        <th scope="col" className="px-5 py-3.5 font-bold">Status</th>
                        <th scope="col" className="px-5 py-3.5 font-bold">Orçamento Total</th>
                        <th scope="col" className="px-5 py-3.5 font-bold">Visualizações</th>
                        <th scope="col" className="px-5 py-3.5 font-bold">Cliques</th>
                        <th scope="col" className="px-5 py-3.5 font-bold">Ações</th>
                        <th scope="col" className="px-5 py-3.5 font-bold text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-inter">
                      {campaigns.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-800">
                            <div className="flex items-center gap-3">
                              {c.creative.imageUrl && (
                                <div className="relative h-10 w-10 rounded border overflow-hidden flex-shrink-0">
                                  <Image src={c.creative.imageUrl} alt="creative thumb" fill className="object-cover" />
                                </div>
                              )}
                              <div>
                                <span className="block font-bold text-slate-900 leading-tight">{c.name}</span>
                                <span className="text-[10px] text-slate-400 mt-0.5 block leading-none font-medium">
                                  CTA: {getCtaLabel(c.creative.ctaType)} • Raio: {c.targeting.radiusKm}km
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-medium">{getStatusBadge(c.status)}</td>
                          <td className="px-5 py-4 font-bold text-slate-900">
                            R$ {(c.budget.amount * c.durationDays).toFixed(2)}
                            <span className="text-[9px] text-slate-400 block font-normal leading-none mt-0.5">
                              (R$ {c.budget.amount}/dia • {c.durationDays}d)
                            </span>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-700">
                            {c.metrics?.impressions?.toLocaleString("pt-BR") || 0}
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-700">
                            {c.metrics?.clicks?.toLocaleString("pt-BR") || 0}
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-700">
                            {c.metrics?.actions?.toLocaleString("pt-BR") || 0}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {c.status === "active" ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleToggleStatus(c)}
                                  className="h-8 w-8 text-yellow-600 hover:bg-yellow-50 rounded-full"
                                  title="Pausar anúncio"
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                              ) : c.status === "paused" ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleToggleStatus(c)}
                                  className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-full"
                                  title="Ativar anúncio"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              ) : null}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteCampaign(c.id!)}
                                className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full"
                                title="Excluir campanha"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

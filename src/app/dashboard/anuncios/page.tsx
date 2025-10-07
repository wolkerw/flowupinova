
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  MousePointer,
  ShoppingCart,
  Plus,
  Edit,
  Play,
  Pause,
  Sparkles,
  ChevronRight,
  UploadCloud,
  Link as LinkIcon,
  Loader2,
  Building,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface AdAccount {
    id: string;
    account_id: string;
    name: string;
}

interface Campaign {
    id: string;
    name: string;
    status: string;
    daily_budget?: string;
    lifetime_budget?: string;
    insights: {
        impressions: string;
        clicks: string;
        spend: string;
        conversions: number;
    };
}


export default function Anuncios() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);

  // State for the new campaign wizard
  const [selectedAdAccount, setSelectedAdAccount] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("");
  const [audience, setAudience] = useState({ ageMin: 18, ageMax: 65, location: "BR" });
  const [creative, setCreative] = useState<{message: string, link: string, image: File | null}>({ message: "", link: "", image: null });
  const [budget, setBudget] = useState({ daily: 50, startDate: ""});

  // State for API interaction
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [selectedAccountForView, setSelectedAccountForView] = useState<string | null>(null);

 useEffect(() => {
    const fetchAdAccounts = async () => {
        setLoadingAccounts(true);
        try {
            const response = await fetch('/api/ads/accounts');
            const data = await response.json();
            if (data.success && data.accounts.length > 0) {
                setAdAccounts(data.accounts);
                // Pré-seleciona a primeira conta para visualização
                if (!selectedAccountForView) {
                    setSelectedAccountForView(data.accounts[0].id);
                }
            } else if (!data.success) {
                 toast({
                    title: "Erro ao buscar contas",
                    description: data.error || "Não foi possível carregar as contas de anúncio.",
                    variant: "destructive",
                });
            }
        } catch (err: any) {
             toast({
                title: "Erro de Rede",
                description: "Não foi possível conectar ao servidor para buscar as contas.",
                variant: "destructive",
            });
        } finally {
            setLoadingAccounts(false);
        }
    };
    fetchAdAccounts();
  }, [toast, selectedAccountForView]);


  useEffect(() => {
    const fetchCampaigns = async () => {
        if (!selectedAccountForView) return;

        setLoadingCampaigns(true);
        try {
            const campaignsResponse = await fetch(`/api/ads/campaigns?adAccountId=${selectedAccountForView}`);
            const campaignsData = await campaignsResponse.json();

            if (campaignsData.success) {
                setCampaigns(campaignsData.campaigns);
            } else {
                 toast({
                    title: "Erro ao buscar campanhas",
                    description: campaignsData.error || "Não foi possível carregar as campanhas.",
                    variant: "destructive",
                });
            }
        } catch (err: any) {
            toast({
                title: "Erro de Rede",
                description: "Não foi possível conectar ao servidor para buscar campanhas.",
                variant: "destructive",
            });
        } finally {
            setLoadingCampaigns(false);
        }
    };

    fetchCampaigns();
  }, [selectedAccountForView, toast]);


  const campaignSteps = [
    { id: 1, title: "Conta", description: "Selecione a conta de anúncios" },
    { id: 2, title: "Objetivo", description: "Defina o objetivo da campanha" },
    { id: 3, title: "Público", description: "Configure o público-alvo" },
    { id: 4, title: "Criativo", description: "Textos e imagens" },
    { id: 5, title: "Orçamento", description: "Defina investimento e duração" },
    { id: 6, title: "Revisão", description: "Confirme e publique" }
  ];

  const handleObjectiveSelect = (objective: string) => {
    setCampaignObjective(objective);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCreative(prev => ({...prev, image: e.target.files[0]}));
    }
  }

  const handlePublishCampaign = async () => {
    setIsPublishing(true);
    setError(null);

    const formData = new FormData();
    formData.append('adAccountId', selectedAdAccount);
    formData.append('objective', campaignObjective);
    formData.append('audience', JSON.stringify(audience));
    formData.append('creative', JSON.stringify({ message: creative.message, link: creative.link }));
    formData.append('budget', JSON.stringify(budget));
    if (creative.image) {
      formData.append('image', creative.image);
    }
    
    try {
        const response = await fetch('/api/ads/campaigns', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Falha ao publicar a campanha.');
        }

        toast({
            title: "Sucesso!",
            description: "Sua campanha foi enviada para a plataforma da Meta.",
            variant: "default",
        });

        setShowCampaignWizard(false);
        // Reset state here if needed
        
    } catch (err: any) {
        setError(err.message);
        toast({
            title: "Erro ao Publicar",
            description: err.message,
            variant: "destructive",
        });
    } finally {
        setIsPublishing(false);
    }
  };

  const formatCurrency = (value: string | number, currency = 'BRL') => {
    const numberValue = Number(value) || 0;
    // Se o valor já vem em centavos, dividimos por 100
    if (String(value).length > 2 && !String(value).includes('.')) {
        return (numberValue / 100).toLocaleString('pt-BR', { style: 'currency', currency: currency });
    }
    return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: currency });
  };
  

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Anúncios Online</h1>
          <p className="text-gray-600 mt-1">Gerencie suas campanhas pagas</p>
        </div>
        
        <Button 
          onClick={() => setShowCampaignWizard(true)}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Métricas gerais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Impressões</p>
                  <p className="text-2xl font-bold text-gray-900">95.9K</p>
                </div>
                <Eye className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cliques</p>
                  <p className="text-2xl font-bold text-gray-900">1.58K</p>
                </div>
                <MousePointer className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversões</p>
                  <p className="text-2xl font-bold text-gray-900">49</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">CPC Médio</p>
                  <p className="text-2xl font-bold text-gray-900">R$ 1,95</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Lista de campanhas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="shadow-lg border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Campanhas
            </CardTitle>
            {loadingAccounts ? (
                 <Loader2 className="w-5 h-5 animate-spin" />
            ) : adAccounts.length > 0 ? (
                <Select onValueChange={setSelectedAccountForView} value={selectedAccountForView ?? ""}>
                    <SelectTrigger className="w-[350px]">
                        <SelectValue placeholder="Selecione uma conta para visualizar" />
                    </SelectTrigger>
                    <SelectContent>
                        {adAccounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                                {account.name} ({account.account_id})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                <p className="text-sm text-red-500">Nenhuma conta de anúncios encontrada.</p>
            )}
          </CardHeader>
          <CardContent>
            {loadingCampaigns ? (
                 <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    <p className="ml-3 text-gray-600">Buscando campanhas...</p>
                 </div>
            ) : campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign, index) => (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="border rounded-lg p-6 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <Badge 
                            variant={campaign.status.toLowerCase() === 'active' ? 'default' : 'outline'}
                            className={campaign.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                          >
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            {campaign.status.toLowerCase() === 'active' ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Orçamento</p>
                          <p className="font-semibold">{formatCurrency(campaign.daily_budget || campaign.lifetime_budget || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Gasto</p>
                          <p className="font-semibold">{formatCurrency(campaign.insights.spend)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Impressões</p>
                          <p className="font-semibold">{Number(campaign.insights.impressions).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Cliques</p>
                          <p className="font-semibold">{campaign.insights.clicks}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Conversões</p>
                          <p className="font-semibold">{campaign.insights.conversions}</p>
                        </div>
                      </div>

                      { (campaign.daily_budget || campaign.lifetime_budget) &&
                        <div className="mb-2">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progresso do orçamento</span>
                            <span>{Math.round((Number(campaign.insights.spend) / (Number(campaign.lifetime_budget || campaign.daily_budget) / 100)) * 100)}%</span>
                            </div>
                            <Progress value={(Number(campaign.insights.spend) / (Number(campaign.lifetime_budget || campaign.daily_budget) / 100)) * 100} />
                        </div>
                      }
                    </motion.div>
                  ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <p>Nenhuma campanha encontrada para a conta selecionada.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Wizard de criação de campanha */}
      {showCampaignWizard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto flex flex-col"
          >
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">Criar Nova Campanha</h3>
              <div className="flex items-center gap-4 mt-6">
                {campaignSteps.map((step) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step.id}
                    </div>
                    {step.id < campaignSteps.length && (
                      <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 flex-grow">
              {currentStep === 1 && (
                 <div className="space-y-6">
                    <h4 className="text-lg font-semibold">Qual conta de anúncios você quer usar?</h4>
                    {loadingAccounts ? (
                         <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Buscando contas de anúncio...</span>
                         </div>
                    ) : adAccounts.length > 0 ? (
                        <Select onValueChange={setSelectedAdAccount} value={selectedAdAccount}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione uma conta de anúncio" />
                            </SelectTrigger>
                            <SelectContent>
                                {adAccounts.map(account => (
                                    <SelectItem key={account.id} value={account.id}>
                                        <div className="flex items-center gap-2">
                                            <Building className="w-4 h-4 text-gray-500" />
                                            <span>{account.name} ({account.account_id})</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                         <p className="text-red-500">Nenhuma conta de anúncios ativa foi encontrada. Verifique sua conexão com a Meta.</p>
                    )}
                 </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold">Qual é o objetivo da sua campanha?</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'OUTCOME_TRAFFIC', title: 'Cliques no Link', desc: 'Gerar tráfego para seu site.', icon: MousePointer },
                      { key: 'OUTCOME_AWARENESS', title: 'Alcance', desc: 'Mostrar para o máximo de pessoas.', icon: Eye },
                      { key: 'OUTCOME_SALES', title: 'Conversões', desc: 'Gerar vendas ou leads.', icon: ShoppingCart }
                    ].map(obj => (
                        <Card key={obj.key} onClick={() => handleObjectiveSelect(obj.key)} className={`cursor-pointer hover:shadow-md transition-shadow border-2 ${campaignObjective === obj.key ? 'border-blue-500' : 'hover:border-blue-300'}`}>
                          <CardContent className="p-6 text-center">
                            <obj.icon className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                            <h5 className="font-semibold">{obj.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{obj.desc}</p>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold">Defina seu público-alvo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="age-min" className="block text-sm font-medium text-gray-700 mb-2">Idade Mínima</label>
                      <Input id="age-min" type="number" placeholder="18" value={audience.ageMin} onChange={(e) => setAudience(prev => ({ ...prev, ageMin: parseInt(e.target.value) || 18 }))} />
                    </div>
                    <div>
                      <label htmlFor="age-max" className="block text-sm font-medium text-gray-700 mb-2">Idade Máxima</label>
                      <Input id="age-max" type="number" placeholder="65" value={audience.ageMax} onChange={(e) => setAudience(prev => ({ ...prev, ageMax: parseInt(e.target.value) || 65 }))} />
                    </div>
                    <div className="md:col-span-2">
                       <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Localização (País)</label>
                       <Input id="location" placeholder="Ex: BR para Brasil" value={audience.location} onChange={(e) => setAudience(prev => ({ ...prev, location: e.target.value }))} />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                 <div className="space-y-6">
                  <h4 className="text-lg font-semibold">Crie o seu anúncio</h4>
                   <div>
                    <label htmlFor="creative-message" className="block text-sm font-medium text-gray-700 mb-2">Texto do Anúncio</label>
                    <Textarea id="creative-message" placeholder="Escreva o texto principal do seu anúncio..." value={creative.message} onChange={e => setCreative(prev => ({...prev, message: e.target.value}))} />
                  </div>
                  <div>
                    <label htmlFor="creative-link" className="block text-sm font-medium text-gray-700 mb-2">Link de Destino</label>
                    <Input id="creative-link" type="url" placeholder="https://seusite.com/oferta" value={creative.link} onChange={e => setCreative(prev => ({...prev, link: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Anúncio</label>
                    <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                       <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                          <p className="text-xs text-gray-500">PNG, JPG (Recomendado: 1080x1080px)</p>
                       </div>
                       <input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
                    </label>
                    {creative.image && <p className="text-sm text-green-600 mt-2">Imagem selecionada: {creative.image.name}</p>}
                  </div>
                </div>
              )}

               {currentStep === 5 && (
                <div className="space-y-6">
                   <h4 className="text-lg font-semibold">Defina o orçamento e a duração</h4>
                    <div>
                      <label htmlFor="daily-budget" className="block text-sm font-medium text-gray-700 mb-2">Orçamento Diário (R$)</label>
                      <Input id="daily-budget" type="number" placeholder="50,00" value={budget.daily} onChange={e => setBudget(prev => ({ ...prev, daily: parseFloat(e.target.value) || 0}))} />
                      <p className="text-xs text-gray-500 mt-1">Ex: insira 50 para um orçamento de R$50,00/dia.</p>
                    </div>
                     <div>
                      <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">Data e Hora de Início</label>
                      <Input id="start-date" type="datetime-local" value={budget.startDate} onChange={e => setBudget(prev => ({ ...prev, startDate: e.target.value}))}/>
                    </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold">Revisão da Campanha</h4>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-900">Conta de Anúncio</h5>
                        <p className="text-gray-600">{adAccounts.find(a => a.id === selectedAdAccount)?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">Objetivo</h5>
                        <p className="text-gray-600">{campaignObjective}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">Público</h5>
                        <p className="text-gray-600">{audience.ageMin}-{audience.ageMax} anos, em {audience.location}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">Orçamento</h5>
                        <p className="text-gray-600">R$ {budget.daily.toFixed(2)}/dia</p>
                      </div>
                       <div>
                        <h5 className="font-medium text-gray-900">Início</h5>
                        <p className="text-gray-600">{new Date(budget.startDate).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="col-span-2">
                        <h5 className="font-medium text-gray-900">Criativo</h5>
                        <p className="text-gray-600 mt-1 truncate">{creative.message}</p>
                        {creative.image && <p className="text-sm text-blue-600 mt-1">Imagem: {creative.image.name}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-green-900">Previsão de Resultados</h5>
                        <p className="text-sm text-green-700 mt-1">
                          Estimativas de alcance e cliques serão exibidas após a publicação.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-between sticky bottom-0 bg-white z-10">
              <Button variant="outline" onClick={() => setShowCampaignWizard(false)} disabled={isPublishing}>
                Cancelar
              </Button>
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={isPublishing}>
                    Anterior
                  </Button>
                )}
                {currentStep < 6 ? (
                    <Button 
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={
                            (currentStep === 1 && !selectedAdAccount) ||
                            (currentStep === 2 && !campaignObjective)
                        }
                    >
                        Próximo
                    </Button>
                ) : (
                    <Button 
                        onClick={handlePublishCampaign}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isPublishing}
                    >
                      {isPublishing ? <Loader2 className="animate-spin" /> : 'Publicar Campanha'}
                    </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

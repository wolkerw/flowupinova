
"use client";

import React, { useState } from "react";
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
  Link as LinkIcon
} from "lucide-react";
import { motion } from "framer-motion";

export default function Anuncios() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);

  // State for the new campaign wizard
  const [campaignObjective, setCampaignObjective] = useState("");
  const [audience, setAudience] = useState({ ageMin: 18, ageMax: 65, location: "BR" });
  const [creative, setCreative] = useState({ message: "", link: "", image: null });
  const [budget, setBudget] = useState({ daily: 50, startDate: ""});

  const campaigns = [
    {
      id: 1,
      name: "Black Friday 2024",
      status: "active",
      budget: 2500,
      spent: 1850,
      impressions: 45230,
      clicks: 892,
      conversions: 23,
      cpc: 2.07
    },
    {
      id: 2,
      name: "Lançamento Produto X",
      status: "paused",
      budget: 1200,
      spent: 540,
      impressions: 18560,
      clicks: 234,
      conversions: 8,
      cpc: 2.31
    },
    {
      id: 3,
      name: "Retargeting Site",
      status: "active",
      budget: 800,
      spent: 720,
      impressions: 32100,
      clicks: 456,
      conversions: 18,
      cpc: 1.58
    }
  ];

  const campaignSteps = [
    { id: 1, title: "Objetivo", description: "Defina o objetivo da campanha" },
    { id: 2, title: "Público", description: "Configure o público-alvo" },
    { id: 3, title: "Criativo", description: "Textos e imagens" },
    { id: 4, title: "Orçamento", description: "Defina investimento e duração" },
    { id: 5, title: "Revisão", description: "Confirme e publique" }
  ];

  const handleObjectiveSelect = (objective: string) => {
    setCampaignObjective(objective);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCreative(prev => ({...prev, image: e.target.files[0] as any}));
    }
  }

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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Campanhas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                        variant={campaign.status === 'active' ? 'default' : 'outline'}
                        className={campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                      >
                        {campaign.status === 'active' ? 'Ativa' : 'Pausada'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        {campaign.status === 'active' ? (
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
                      <p className="font-semibold">R$ {campaign.budget.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gasto</p>
                      <p className="font-semibold">R$ {campaign.spent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Impressões</p>
                      <p className="font-semibold">{campaign.impressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cliques</p>
                      <p className="font-semibold">{campaign.clicks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Conversões</p>
                      <p className="font-semibold">{campaign.conversions}</p>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progresso do orçamento</span>
                      <span>{Math.round((campaign.spent / campaign.budget) * 100)}%</span>
                    </div>
                    <Progress value={(campaign.spent / campaign.budget) * 100} />
                  </div>
                </motion.div>
              ))}
            </div>
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
                  <h4 className="text-lg font-semibold">Qual é o objetivo da sua campanha?</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'LINK_CLICKS', title: 'Cliques no Link', desc: 'Gerar tráfego para seu site.', icon: MousePointer },
                      { key: 'REACH', title: 'Alcance', desc: 'Mostrar para o máximo de pessoas.', icon: Eye },
                      { key: 'CONVERSIONS', title: 'Conversões', desc: 'Gerar vendas ou leads.', icon: ShoppingCart }
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

              {currentStep === 2 && (
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

              {currentStep === 3 && (
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
                    {creative.image && <p className="text-sm text-green-600 mt-2">Imagem selecionada: {(creative.image as File).name}</p>}
                  </div>
                </div>
              )}

               {currentStep === 4 && (
                <div className="space-y-6">
                   <h4 className="text-lg font-semibold">Defina o orçamento e a duração</h4>
                    <div>
                      <label htmlFor="daily-budget" className="block text-sm font-medium text-gray-700 mb-2">Orçamento Diário (em centavos)</label>
                      <Input id="daily-budget" type="number" placeholder="5000 (para R$50,00)" value={budget.daily * 100} onChange={e => setBudget(prev => ({ ...prev, daily: parseInt(e.target.value)/100 || 0}))} />
                      <p className="text-xs text-gray-500 mt-1">Ex: insira 5000 para um orçamento de R$50,00/dia.</p>
                    </div>
                     <div>
                      <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">Data e Hora de Início</label>
                      <Input id="start-date" type="datetime-local" value={budget.startDate} onChange={e => setBudget(prev => ({ ...prev, startDate: e.target.value}))}/>
                    </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold">Revisão da Campanha</h4>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
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
                        {creative.image && <p className="text-sm text-blue-600 mt-1">Imagem: {(creative.image as File).name}</p>}
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
              <Button variant="outline" onClick={() => setShowCampaignWizard(false)}>
                Cancelar
              </Button>
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                    Anterior
                  </Button>
                )}
                <Button 
                  onClick={() => currentStep < 5 ? setCurrentStep(currentStep + 1) : setShowCampaignWizard(false)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {currentStep < 5 ? 'Próximo' : 'Publicar Campanha'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

    
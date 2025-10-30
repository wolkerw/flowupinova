
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Library, Paintbrush, Globe, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";

const Stepper = ({ currentStep }: { currentStep: number }) => {
    const steps = [
        { title: 'Campanha & Público', icon: Library },
        { title: 'Anúncio', icon: Paintbrush }
    ];

    return (
        <div className="flex justify-center items-center mb-12">
            {steps.map((step, index) => (
                <React.Fragment key={index}>
                    <div className="flex flex-col items-center">
                        <motion.div
                            animate={currentStep >= index + 1 ? "active" : "inactive"}
                            variants={{
                                active: { scale: 1.1, backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' },
                                inactive: { scale: 1, backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                            }}
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                        >
                            <step.icon className="w-5 h-5" />
                        </motion.div>
                        <p className={`mt-2 text-sm font-medium ${currentStep >= index + 1 ? 'text-primary' : 'text-muted-foreground'}`}>{step.title}</p>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`flex-1 h-1 mx-4 ${currentStep > index + 1 ? 'bg-primary' : 'bg-muted'}`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};


export default function Anuncios() {
    const [step, setStep] = useState(1);
    const { toast } = useToast();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Campaign & Ad Set State
    const [campaignName, setCampaignName] = useState('');
    const [campaignObjective, setCampaignObjective] = useState('');
    const [dailyBudget, setDailyBudget] = useState('5000'); // R$50 em centavos
    const [targetLocation, setTargetLocation] = useState('BR');
    const [targetAgeMin, setTargetAgeMin] = useState('18');
    const [targetAgeMax, setTargetAgeMax] = useState('65');
    const [targetInterests, setTargetInterests] = useState('');


    const handleNextStep = () => {
        if (step < 2) {
            setStep(prev => prev + 1);
        }
    };

    const handlePrevStep = () => {
        setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado."});
            return;
        }
         if (!campaignName || !campaignObjective || !dailyBudget) {
            toast({ variant: "destructive", title: "Campos obrigatórios", description: "Preencha o nome, objetivo e orçamento da campanha." });
            return;
        }
        
        setIsLoading(true);

        try {
            // Etapa 1: Criar a Campanha
            const campaignResponse = await fetch('/api/ads/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: campaignName, objective: campaignObjective }),
            });
            const campaignResult = await campaignResponse.json();
            if (!campaignResult.success) throw new Error(`Falha ao criar campanha: ${campaignResult.error}`);
            const campaignId = campaignResult.id;
            toast({ title: "Etapa 1/3: Campanha criada!", description: `ID da Campanha: ${campaignId}` });
            

            // Etapa 2: Criar o Conjunto de Anúncios (Ad Set)
            const adSetTargeting = {
                geo_locations: { countries: [targetLocation] },
                age_min: parseInt(targetAgeMin),
                age_max: parseInt(targetAgeMax),
                flexible_spec: targetInterests ? targetInterests.split(',').map(interest => ({
                    interests: [{ name: interest.trim() }]
                })) : []
            };

            const adSetResponse = await fetch('/api/ads/adsets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${campaignName} - Conjunto 01`,
                    campaign_id: campaignId,
                    daily_budget: parseInt(dailyBudget),
                    targeting: adSetTargeting
                }),
            });
            const adSetResult = await adSetResponse.json();
            if (!adSetResult.success) throw new Error(`Falha ao criar conjunto de anúncios: ${adSetResult.error}`);
            toast({ title: "Etapa 2/3: Conjunto de anúncios criado!", description: `ID do Conjunto: ${adSetResult.id}` });


            // Etapa 3 e 4 (Criativo e Anúncio) viriam aqui
            toast({ title: "Sucesso parcial!", description: "Campanha e Conjunto de Anúncios criados. Próximo passo é o criativo."});

        } catch (error: any) {
             toast({ variant: "destructive", title: "Erro na criação", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1: // Campaign, Audience, Budget
                return (
                    <CardContent className="space-y-8">
                        {/* Seção da Campanha */}
                        <div className="space-y-4 p-6 border rounded-lg bg-gray-50/50">
                            <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Detalhes da Campanha</h3>
                             <div className="space-y-2">
                                <Label htmlFor="campaign-name">Nome da Campanha</Label>
                                <Input id="campaign-name" placeholder="Ex: Divulgação de Verão" value={campaignName} onChange={e => setCampaignName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="campaign-objective">Qual o principal objetivo desta campanha?</Label>
                                <Select onValueChange={setCampaignObjective} value={campaignObjective}>
                                    <SelectTrigger id="campaign-objective">
                                        <SelectValue placeholder="Selecione um objetivo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LINK_CLICKS">Tráfego (LINK_CLICKS)</SelectItem>
                                        <SelectItem value="LEAD_GENERATION">Geração de Cadastros (LEAD_GENERATION)</SelectItem>
                                        <SelectItem value="POST_ENGAGEMENT">Engajamento com a Publicação (POST_ENGAGEMENT)</SelectItem>
                                        <SelectItem value="REACH">Alcance (REACH)</SelectItem>
                                        <SelectItem value="BRAND_AWARENESS">Reconhecimento da Marca (BRAND_AWARENESS)</SelectItem>
                                        <SelectItem value="CONVERSIONS">Conversões (CONVERSIONS)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="adset-budget">Orçamento diário (em centavos)</Label>
                                <Input id="adset-budget" type="number" placeholder="Ex: 5000 para R$50,00" value={dailyBudget} onChange={e => setDailyBudget(e.target.value)} />
                             </div>
                        </div>

                        {/* Seção do Público */}
                        <div className="space-y-4 p-6 border rounded-lg bg-gray-50/50">
                            <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Público-Alvo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="target-location">País (código de 2 letras)</Label>
                                     <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="target-location" placeholder="Ex: BR para Brasil" value={targetLocation} onChange={e => setTargetLocation(e.target.value)} className="pl-10"/>
                                    </div>
                                </div>
                                 <div className="flex items-center gap-4">
                                    <div className="space-y-2 w-1/2">
                                        <Label htmlFor="target-age-min">Idade Mín.</Label>
                                        <Input id="target-age-min" type="number" placeholder="18" value={targetAgeMin} onChange={e => setTargetAgeMin(e.target.value)} />
                                    </div>
                                    <div className="space-y-2 w-1/2">
                                        <Label htmlFor="target-age-max">Idade Máx.</Label>
                                        <Input id="target-age-max" type="number" placeholder="65" value={targetAgeMax} onChange={e => setTargetAgeMax(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="target-interests">Interesses</Label>
                                <p className="text-xs text-muted-foreground">Separe os interesses por vírgula.</p>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="target-interests" placeholder="Ex: Marketing digital, Viagens, Culinária" value={targetInterests} onChange={e => setTargetInterests(e.target.value)} className="pl-10"/>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                );
            case 2: // Ad Creative
                 return (
                    <CardContent className="text-center text-gray-600 p-8">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                <Paintbrush className="w-8 h-8 text-primary"/>
                            </div>
                        </div>
                        <p className="text-lg mb-2 font-semibold">Criação do Anúncio</p>
                        <p className="text-sm">A interface para montar o criativo do seu anúncio (imagem, vídeo e texto) será adicionada aqui em breve.</p>
                    </CardContent>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Criar Novo Anúncio</h1>
                <p className="text-gray-600 mt-1">Siga as etapas para configurar e lançar sua campanha na Meta.</p>
            </div>

            <Stepper currentStep={step} />

            <Card className="shadow-lg border-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {step === 1 && "Etapa 1: Campanha e Público"}
                                {step === 2 && "Etapa 2: Criativo do Anúncio"}
                            </motion.div>
                        </AnimatePresence>
                    </CardTitle>
                </CardHeader>
                
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>

                <CardFooter className={`flex ${step > 1 ? 'justify-between' : 'justify-end'}`}>
                    {step > 1 && (
                        <Button variant="outline" onClick={handlePrevStep} disabled={isLoading}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                    )}
                    
                     <Button onClick={step === 2 ? handleSubmit : handleNextStep} disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        
                        {step === 2 ? "Finalizar e Criar" : "Próximo"}

                        {step < 2 && !isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}


    
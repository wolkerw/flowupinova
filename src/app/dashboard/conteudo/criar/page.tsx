
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowRight, Image as ImageIcon, Copy, Film, Sparkles, ArrowLeft, UploadCloud, Video, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";


type ContentType = "single_post" | "carousel" | "story" | "reels";

const contentOptions: { id: ContentType; icon: React.ElementType; title: string; description: string; }[] = [
    {
        id: "single_post",
        icon: ImageIcon,
        title: "Postagem Única",
        description: "Uma imagem ou vídeo para o feed."
    },
    {
        id: "carousel",
        icon: Copy,
        title: "Carrossel",
        description: "Múltiplas imagens ou vídeos em um post."
    },
    {
        id: "story",
        icon: Film,
        title: "Stories",
        description: "Conteúdo vertical que dura 24 horas."
    },
    {
        id: "reels",
        icon: Sparkles,
        title: "Reels",
        description: "Vídeos curtos e criativos para o feed."
    }
]

const Preview = ({ type }: { type: ContentType }) => {
    switch (type) {
        case 'single_post':
            return (
                <div className="w-full max-w-sm aspect-square bg-gray-200 rounded-lg flex flex-col items-center justify-center p-4">
                    <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 text-center">Pré-visualização de Post Único</p>
                </div>
            );
        case 'carousel':
            return (
                 <div className="w-full max-w-sm aspect-square bg-gray-200 rounded-lg flex items-center justify-center p-4 relative">
                    <div className="w-full h-full border-4 border-gray-300 rounded-lg bg-gray-100 transform -rotate-6"></div>
                    <div className="w-full h-full border-4 border-gray-300 rounded-lg bg-gray-100 transform rotate-6 absolute"></div>
                    <div className="w-full h-full border-4 border-white rounded-lg bg-gray-200 absolute flex flex-col items-center justify-center p-4">
                        <Copy className="w-16 h-16 text-gray-400 mb-4" />
                        <p className="text-gray-600 text-center">Pré-visualização de Carrossel</p>
                    </div>
                </div>
            );
        case 'story':
        case 'reels':
            return (
                <div className="w-full max-w-[250px] aspect-[9/16] bg-gray-800 rounded-3xl border-4 border-gray-600 flex flex-col items-center justify-center p-4">
                    {type === 'story' ? 
                        <Film className="w-16 h-16 text-gray-400 mb-4" /> : 
                        <Sparkles className="w-16 h-16 text-gray-400 mb-4" />
                    }
                    <p className="text-gray-300 text-center text-sm">Pré-visualização de {type === 'story' ? 'Story' : 'Reels'}</p>
                </div>
            );
        default:
            return null;
    }
}


export default function CriarConteudoPage() {
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<ContentType | null>(null);
    const router = useRouter();

    const handleNextStep = () => {
        if(selectedType) {
            setStep(2);
        }
    }
    
    const selectedOption = contentOptions.find(opt => opt.id === selectedType);

    return (
        <div className="p-6 space-y-8 max-w-6xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Criar Novo Conteúdo</h1>
                <p className="text-gray-600 mt-1">
                    {step === 1 && "Escolha o formato do conteúdo que você deseja criar."}
                    {step === 2 && `Etapa 2 de 3: Personalize seu ${selectedOption?.title || 'conteúdo'}`}
                </p>
            </div>

            {step === 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                     className="max-w-4xl mx-auto"
                >
                    <Card className="shadow-lg border-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Sparkles className="w-6 h-6 text-blue-500" />
                                Etapa 1: Qual tipo de conteúdo você quer criar?
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup 
                                value={selectedType || ""}
                                onValueChange={(value) => setSelectedType(value as ContentType)}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                {contentOptions.map(option => (
                                    <div key={option.id}>
                                        <RadioGroupItem value={option.id} id={option.id} className="peer sr-only" />
                                        <Label
                                            htmlFor={option.id}
                                            className={cn(
                                                "flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                                "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 w-full">
                                                <option.icon className="w-8 h-8 text-primary" />
                                                <div className="text-left">
                                                    <h4 className="font-bold text-base">{option.title}</h4>
                                                    <p className="text-sm text-gray-600">{option.description}</p>
                                                </div>
                                            </div>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button
                                onClick={handleNextStep}
                                disabled={!selectedType}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                            >
                                Próxima Etapa
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            )}

            {step === 2 && selectedType && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Coluna da esquerda: Inputs e Ações */}
                        <Card className="shadow-lg border-none">
                            <CardHeader>
                                <CardTitle className="text-lg">Monte sua publicação</CardTitle>
                                <p className="text-sm text-gray-600">Adicione seus arquivos e textos para criar o conteúdo.</p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="font-semibold">Seu Acervo</Label>
                                    <p className="text-xs text-gray-500">Faça o upload de vídeos, imagens e sua logomarca.</p>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <Button variant="outline" className="flex items-center gap-2">
                                            <FileImage className="w-4 h-4 text-blue-500" />
                                            Anexar Imagem
                                        </Button>
                                        <Button variant="outline" className="flex items-center gap-2">
                                            <Video className="w-4 h-4 text-green-500" />
                                            Anexar Vídeo
                                        </Button>
                                    </div>
                                    <div className="pt-2">
                                         <Button variant="outline" className="flex items-center gap-2 w-full justify-center">
                                            <UploadCloud className="w-4 h-4 text-purple-500" />
                                            Adicionar Logomarca
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-semibold">Textos</Label>
                                    <p className="text-xs text-gray-500">Escreva o título e a legenda da sua publicação.</p>
                                    {/* Adicionar inputs de texto aqui */}
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Coluna da direita: Preview */}
                        <div className="flex flex-col items-center justify-start h-full">
                           <div className="sticky top-24">
                             <Preview type={selectedType} />
                           </div>
                        </div>
                    </div>

                    <div className="flex justify-between mt-8">
                        <Button variant="outline" onClick={() => setStep(1)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                           Próxima Etapa
                           <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>

                </motion.div>
            )}
        </div>
    );
}

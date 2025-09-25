
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowRight, Image as ImageIcon, Copy, Film, Sparkles } from "lucide-react";
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

export default function CriarConteudoPage() {
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<ContentType | null>(null);
    const router = useRouter();

    const handleNextStep = () => {
        if(selectedType) {
            setStep(2);
            // Aqui você pode adicionar lógica para redirecionar para a próxima etapa 
            // com base no tipo de conteúdo selecionado, por exemplo:
            // router.push(`/dashboard/conteudo/criar/${selectedType}`);
        }
    }

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Criar Novo Conteúdo</h1>
                <p className="text-gray-600 mt-1">
                    {step === 1 && "Escolha o formato do conteúdo que você deseja criar."}
                </p>
            </div>

            {step === 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
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

            {step === 2 && (
                <div>
                    <h2 className="text-xl font-semibold">Etapa 2</h2>
                    <p>Você selecionou: {selectedType}</p>
                    <Button onClick={() => setStep(1)}>Voltar</Button>
                </div>
            )}
        </div>
    );
}

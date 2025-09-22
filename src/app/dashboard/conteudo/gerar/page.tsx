
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  Loader2,
  Check,
  Paperclip,
  Calendar as CalendarIcon,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";


type GeneratedContent = {
    titulo: string;
    subtitulo: string;
    hashtags: string[];
};

export default function GerarConteudoPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiTone, setAiTone] = useState("");
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
    const [selectedContentIndex, setSelectedContentIndex] = useState<number | null>(null);
    const [generatedText, setGeneratedText] = useState("");
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [loadingAI, setLoadingAI] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePrompt, setImagePrompt] = useState("");
    const [selectedTextSegments, setSelectedTextSegments] = useState(new Set<number>());
    const [selectedAccounts, setSelectedAccounts] = useState(new Set());

    const connectedAccounts = [
        { id: 'ig1', platform: 'instagram', name: '@impulso_app' },
        { id: 'fb1', platform: 'facebook', name: 'Página Impulso Marketing' },
        { id: 'li1', platform: 'linkedin', name: 'Impulso Co.' },
    ];

    const aspectRatios = [
        { key: "1:1", label: "Quadrado (1:1)", suitableFor: "Feed (Instagram, Facebook)", className: "aspect-square" },
        { key: "4:5", label: "Retrato (4:5)", suitableFor: "Feed (Instagram)", className: "aspect-[4/5]" },
        { key: "9:16", label: "Stories (9:16)", suitableFor: "Stories & Reels", className: "aspect-[9/16]" },
        { key: "16:9", label: "Paisagem (16:9)", suitableFor: "Links (Facebook, LinkedIn)", className: "aspect-video" }
    ];
      const [previewAspectRatio, setPreviewAspectRatio] = useState("1:1");


    const splitTextIntoSegments = (text: string) => {
        if (!text) return [];
        return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 10);
    };

    const handleGenerateText = async () => {
        if (!aiPrompt) return;
        setLoadingAI(true);
        setGeneratedContent([]);
        setGeneratedText("");
        setSelectedContentIndex(null);
    
        try {
            const webhookUrl = "https://n8n.flowupinova.com.br/webhook-test/gerador_de_ideias";
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors',
                body: JSON.stringify({
                    prompt: aiPrompt,
                    tone: aiTone,
                    contentType: 'text',
                    step: 1
                })
            });
    
            if (!response.ok) {
                throw new Error(`Erro na chamada do webhook: ${response.statusText}`);
            }

            const responseText = await response.text();
            if (!responseText) {
                throw new Error("A resposta da API está vazia.");
            }
            
            const contentData = JSON.parse(responseText);
            console.log("Resposta da API:", contentData);
    
            if (!Array.isArray(contentData)) {
                throw new Error("A resposta da API não é uma lista de conteúdos.");
            }
    
            setGeneratedContent(contentData);

        } catch (error: any) {
            console.error("Erro ao gerar texto:", error);
            setGeneratedText(`Desculpe, não foi possível gerar o texto. Erro: ${error.message}`);
        } finally {
            setLoadingAI(false);
        }
    };

    const handleContentSelection = (index: number) => {
        setSelectedContentIndex(index);
        const selected = generatedContent[index];
        if (selected) {
            const combinedText = `${selected.titulo}\n\n${selected.subtitulo}\n\n${selected.hashtags.join(' ')}`;
            setGeneratedText(combinedText);
            setImagePrompt(`Criar uma imagem para acompanhar este conteúdo: ${combinedText.substring(0, 200)}...`);
        }
    };

    const getComposedText = () => {
        if (selectedContentIndex === null || !generatedContent[selectedContentIndex]) return "";
        const selected = generatedContent[selectedContentIndex];
        return `${selected.titulo}\n\n${selected.subtitulo}\n\n${selected.hashtags.join(' ')}`;
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleGenerateImage = async (source: 'ai' | 'upload') => {
        if (source === 'ai' && !imagePrompt) return;
        if (source === 'upload' && !selectedFile) return;

        setLoadingAI(true);
        setGeneratedImages([]);
        setSelectedImageIndex(0);

        try {
            if (source === 'upload' && selectedFile) {
                setGeneratedImages([URL.createObjectURL(selectedFile)]);
            } else if (source === 'ai') {
                const webhookUrl = "https://n8n.flowupinova.com.br/webhook-test/imagem";
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    mode: 'cors',
                    body: JSON.stringify({
                        prompt: imagePrompt,
                        contentType: 'image',
                        step: 2,
                        baseText: getComposedText()
                    })
                });
    
                if (!response.ok) {
                    throw new Error(`Erro na chamada do webhook de imagem: ${response.statusText}`);
                }
    
                const data = await response.json();
                let imageUrls = [];
    
                if (data.output) {
                    imageUrls = Array.isArray(data.output) ? data.output : [data.output];
                } else if (Array.isArray(data) && data.length > 0 && data[0]?.output) {
                    const output = data[0].output;
                    imageUrls = Array.isArray(output) ? output : [output];
                }
    
                if (imageUrls.length > 0) {
                    setGeneratedImages(imageUrls);
                } else {
                    throw new Error("Nenhuma imagem foi retornada pelo serviço.");
                }
            }
        } catch (error: any) {
            console.error("Erro ao processar imagem:", error);
            alert(`Erro ao processar imagem: ${error.message}`);
            // Fallback to placeholder if error
            setGeneratedImages(["https://picsum.photos/seed/error/1024/1024"]);
        } finally {
            setLoadingAI(false);
        }
    };

    const handleNextStep = () => {
        setCurrentStep(currentStep + 1);
    };

    const handlePrevStep = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleFinishAndSchedule = () => {
        alert("Simulação: Conteúdo agendado com sucesso!");
        router.push("/dashboard/conteudo");
    };

    const handleAccountSelection = (accountId: string) => {
        setSelectedAccounts(prev => {
          const newSet = new Set(prev);
          if (newSet.has(accountId)) {
            newSet.delete(accountId);
          } else {
            newSet.add(accountId);
          }
          return newSet;
        });
      };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-xl shadow-2xl w-full"
            >
                <div className="p-6 border-b sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-purple-500" />
                            Gerador de Conteúdo IA - Passo {currentStep} de 3
                        </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4 ml-14">
                        {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center flex-grow">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            currentStep >= step 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                            {step}
                            </div>
                            {step < 3 && (
                            <div className={`flex-grow h-1 mx-2 ${
                                currentStep > step ? 'bg-blue-500' : 'bg-gray-200'
                            }`}></div>
                            )}
                        </div>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-lg font-semibold mb-4">1. Criar Conteúdo em Texto</h4>
                                <p className="text-gray-600 mb-4">Descreva o que você quer que a IA escreva para sua postagem.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descrição do Conteúdo
                                </label>
                                <Textarea 
                                placeholder="Ex: Um texto sobre os benefícios do café com um tom inspiracional"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                className="h-24"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tom da mensagem
                                </label>
                                <Select value={aiTone} onValueChange={setAiTone}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tom" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="profissional">Profissional</SelectItem>
                                    <SelectItem value="casual">Casual</SelectItem>
                                    <SelectItem value="inspiracional">Inspiracional</SelectItem>
                                    <SelectItem value="educativo">Educativo</SelectItem>
                                    <SelectItem value="divertido">Divertido</SelectItem>
                                </SelectContent>
                                </Select>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                                <h5 className="font-medium text-gray-900 mb-4">Sugestões de Conteúdo (Escolha 1)</h5>
                                
                                {loadingAI ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                    <p>Gerando texto...</p>
                                </div>
                                ) : generatedContent.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {generatedContent.map((content, index) => {
                                        const isSelected = selectedContentIndex === index;
                                        return (
                                            <div 
                                                key={index}
                                                onClick={() => handleContentSelection(index)}
                                                className={cn(
                                                    "bg-white p-4 rounded-lg border-2 shadow-sm cursor-pointer transition-all relative",
                                                    isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300"
                                                )}
                                            >
                                                {isSelected && (
                                                    <CheckCircle2 className="w-5 h-5 text-white bg-blue-500 rounded-full absolute -top-2 -right-2" />
                                                )}
                                                <h6 className="font-bold text-base text-gray-800">{content.titulo}</h6>
                                                <p className="text-sm text-gray-600 mt-2 mb-3 whitespace-pre-wrap">{content.subtitulo}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {content.hashtags.map((tag, tagIndex) => (
                                                        <span key={tagIndex} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                ) : generatedText ? (
                                    <p className="whitespace-pre-wrap text-red-500">{generatedText}</p>
                                ) : (
                                <p className="text-gray-500 italic text-center py-8">Clique em "Gerar Texto" para criar seu conteúdo...</p>
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 space-y-6">
                                <div>
                                    <h4 className="text-lg font-semibold">2. Design Visual</h4>
                                    <p className="text-gray-600 text-sm mt-1">Crie a imagem para seu post.</p>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <h5 className="font-medium text-blue-900 mb-2 text-sm">Texto selecionado para o post:</h5>
                                    <p className="text-blue-800 text-xs whitespace-pre-wrap max-h-24 overflow-y-auto">{getComposedText()}</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Prompt para Imagem
                                    </label>
                                    <Textarea 
                                        placeholder="Use o texto acima como inspiração ou descreva a imagem que você deseja criar..."
                                        value={imagePrompt}
                                        onChange={(e) => setImagePrompt(e.target.value)}
                                        className="h-20"
                                    />
                                    <Button 
                                        onClick={() => handleGenerateImage('ai')}
                                        disabled={loadingAI || !imagePrompt}
                                        className="w-full mt-2 bg-purple-600 hover:bg-purple-700"
                                    >
                                        {loadingAI ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                        Gerar Imagem com IA
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                <hr className="flex-grow border-gray-200"/>
                                <span className="text-xs text-gray-400">OU</span>
                                <hr className="flex-grow border-gray-200"/>
                                </div>

                                <div>
                                    <label htmlFor="file-upload-step2" className="block text-sm font-medium text-gray-700 mb-2">
                                        Upload Próprio
                                    </label>
                                    <Button asChild variant="outline" className="w-full">
                                    <label htmlFor="file-upload-step2" className="cursor-pointer flex items-center gap-2">
                                        <Paperclip className="w-4 h-4" />
                                        {selectedFile ? <span className="truncate">{selectedFile.name}</span> : "Selecionar Arquivo"}
                                        <Input 
                                        id="file-upload-step2" 
                                        type="file" 
                                        className="sr-only" 
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        disabled={loadingAI}
                                        />
                                    </label>
                                    </Button>
                                    {selectedFile && 
                                        <Button 
                                            onClick={() => handleGenerateImage('upload')}
                                            disabled={loadingAI}
                                            className="w-full mt-2"
                                        >
                                        {loadingAI ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Processar Upload
                                        </Button>
                                    }
                                </div>
                                
                                {loadingAI && (
                                    <div className="flex items-center justify-center text-gray-500 py-8">
                                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                        <p>Gerando imagem...</p>
                                    </div>
                                )}
                                {generatedImages.length > 0 && !loadingAI && (
                                    <div className="space-y-2">
                                        <h5 className="text-sm font-medium text-gray-700">Imagem para Edição:</h5>
                                        <img 
                                            src={generatedImages[selectedImageIndex]} 
                                            alt="Imagem selecionada" 
                                            className="w-full rounded-lg object-cover border" 
                                        />
                                        <p className="text-xs text-gray-500 italic">Esta imagem pode ser usada dentro do editor ao lado.</p>
                                    </div>
                                )}
                            </div>

                            <div className="lg:col-span-2 bg-gray-100 rounded-lg min-h-[600px] flex flex-col">
                                <div className="p-3 border-b bg-white rounded-t-lg">
                                <h5 className="font-semibold text-gray-800">Editor de Design</h5>
                                <p className="text-xs text-gray-500">Use o editor abaixo para finalizar seu post.</p>
                                </div>
                                <iframe
                                    src="https://app.templated.io/editor?embed=e28464ed-1df8-4c9f-b932-fa026770bcb3"
                                    width="100%"
                                    height="100%"
                                    className="border-0 flex-grow"
                                    title="Editor Templated.io"
                                ></iframe>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Prévia Final e Agendamento</h4>
                            <p className="text-gray-600 mb-4">Confira como ficará sua postagem e escolha onde publicar.</p>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-4">Prévia da Postagem</h5>
                            <div className="space-y-4">
                            {generatedImages.length > 0 && (
                                <div className={`mx-auto w-full max-w-sm rounded-lg overflow-hidden bg-gray-200 border ${aspectRatios.find(r => r.key === previewAspectRatio)?.className}`}>
                                <img 
                                    src={generatedImages[selectedImageIndex]} 
                                    alt="Imagem da postagem" 
                                    className="w-full h-full object-cover" 
                                />
                                </div>
                            )}
                            {getComposedText() && (
                                <div className="bg-gray-50 p-3 rounded">
                                <p className="whitespace-pre-wrap">{getComposedText()}</p>
                                </div>
                            )}
                            </div>
                        </div>

                        <div>
                            <h5 className="font-medium text-gray-900 mb-3">Publicar em:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {connectedAccounts.map(account => {
                                const isSelected = selectedAccounts.has(account.id);
                                return (
                                <div
                                    key={account.id}
                                    onClick={() => handleAccountSelection(account.id)}
                                    className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
                                    isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
                                    {isSelected && <Check className="w-3 h-3 text-white"/>}
                                    </div>
                                    <span className="font-medium text-sm">{account.name}</span>
                                </div>
                                )
                            })}
                            </div>
                        </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t flex justify-between sticky bottom-0 bg-white z-10">
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => router.push('/dashboard/conteudo')}>
                            Cancelar
                        </Button>
                        {currentStep > 1 && (
                            <Button variant="outline" onClick={handlePrevStep}>
                                Voltar
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        {currentStep === 1 && (
                        <>
                            <Button 
                                onClick={handleGenerateText}
                                disabled={loadingAI || !aiPrompt}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {loadingAI ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Gerar Texto
                            </Button>
                            <Button 
                                onClick={handleNextStep}
                                disabled={selectedContentIndex === null}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Próximo
                            </Button>
                        </>
                        )}

                        {currentStep === 2 && (
                        <>
                            <Button 
                                onClick={handleNextStep}
                                disabled={generatedImages.length === 0 && getComposedText().length === 0}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Próximo
                            </Button>
                        </>
                        )}

                        {currentStep === 3 && (
                        <Button 
                            onClick={handleFinishAndSchedule}
                            disabled={selectedAccounts.size === 0}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Agendar Conteúdo
                        </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}


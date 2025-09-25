
"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowRight, Image as ImageIcon, Copy, Film, Sparkles, ArrowLeft, UploadCloud, Video, FileImage, CheckCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";


type ContentType = "single_post" | "carousel" | "story" | "reels";
type MediaItem = {
    type: 'image' | 'video';
    url: string;
};

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

const Preview = ({ type, mediaItems, logoUrl, onRemoveItem }: { type: ContentType, mediaItems: MediaItem[], logoUrl: string | null, onRemoveItem: (index: number) => void }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (currentSlide >= mediaItems.length && mediaItems.length > 0) {
            setCurrentSlide(mediaItems.length - 1);
        }
    }, [mediaItems, currentSlide]);


    const handleNextSlide = () => {
        if (mediaItems.length > 1) {
            setCurrentSlide((prev) => (prev + 1) % mediaItems.length);
        }
    }
    
    const handlePrevSlide = () => {
        if (mediaItems.length > 1) {
            setCurrentSlide((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
        }
    }

    const renderContent = (item: MediaItem | null) => {
        if (!item) {
            return null;
        }

        if (item.type === 'image') {
            return <Image src={item.url} alt="Preview da imagem" layout="fill" objectFit="cover" />;
        }
        
        if (item.type === 'video') {
            return <video src={item.url} className="w-full h-full object-cover" controls autoPlay loop muted playsInline />;
        }
        
        return null;
    };

    const placeholder = (icon: React.ElementType, text: string) => (
        <div className="flex flex-col items-center justify-center text-center p-4 h-full">
            {React.createElement(icon, { className: "w-16 h-16 text-gray-400 mb-4" })}
            <p className="text-gray-500">{text}</p>
        </div>
    );

    const singleItem = mediaItems.length > 0 ? mediaItems[0] : null;
    const currentCarouselItem = mediaItems.length > 0 ? mediaItems[currentSlide] : null;

    switch (type) {
        case 'single_post':
            return (
                <div className="w-full max-w-sm aspect-[4/5] bg-gray-200 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                    {singleItem ? renderContent(singleItem) : placeholder(ImageIcon, "Pré-visualização de Post Único (Feed)")}
                    {logoUrl && (
                        <Image src={logoUrl} alt="Logo preview" width={64} height={64} className="absolute bottom-4 right-4 w-16 h-16 object-contain" />
                    )}
                </div>
            );
        case 'carousel':
            return (
                 <div className="flex flex-col items-center gap-6">
                    <div className="w-full max-w-[280px] flex flex-col items-center gap-4">
                        <div className="aspect-[9/16] w-full bg-gray-800 rounded-3xl border-4 border-gray-600 flex flex-col items-center justify-center p-0 relative overflow-hidden">
                           <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center relative">
                                {renderContent(currentCarouselItem)}
                                {mediaItems.length === 0 && placeholder(Copy, "Pré-visualização de Carrossel")}

                                {mediaItems.length > 0 && (
                                     <button onClick={() => onRemoveItem(currentSlide)} className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
                                        <X className="w-4 h-4"/>
                                     </button>
                                )}

                                {mediaItems.length > 1 && (
                                    <>
                                        <div className="absolute top-1/2 left-2 right-2 flex justify-between z-10">
                                            <button onClick={handlePrevSlide} className="bg-white/50 rounded-full p-1 text-gray-700 hover:bg-white"><ChevronLeft className="w-5 h-5"/></button>
                                            <button onClick={handleNextSlide} className="bg-white/50 rounded-full p-1 text-gray-700 hover:bg-white"><ChevronRight className="w-5 h-5"/></button>
                                        </div>
                                        <div className="absolute bottom-4 flex gap-1.5 z-10">
                                            {mediaItems.map((_, index) => (
                                                 <div key={index} className={cn("w-2 h-2 rounded-full", currentSlide === index ? 'bg-blue-500' : 'bg-gray-400')}></div>
                                            ))}
                                        </div>
                                    </>
                                )}
                                {mediaItems.length > 0 && (
                                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10">
                                        {currentSlide + 1} / {mediaItems.length}
                                    </div>
                                )}
                           </div>
                        </div>
                    </div>
                    <div className="w-full max-w-sm text-left bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium mb-2">Sequência de 2 a 10 imagens ou vídeos que o usuário desliza.</p>
                        <h5 className="font-bold text-blue-900">Ótimo para:</h5>
                        <ul className="mt-2 space-y-1 text-sm text-blue-800 list-none">
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-600" /><span>“Passo a passo”</span></li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-600" /><span>Comparativos (antes e depois)</span></li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-600" /><span>Listas (“5 dicas rápidas…”)</span></li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-600" /><span>Mostrar vários produtos/serviços</span></li>
                        </ul>
                    </div>
                </div>
            );
        case 'story':
        case 'reels':
            return (
                <div className="w-full max-w-[250px] aspect-[9/16] bg-gray-800 rounded-3xl border-4 border-gray-600 flex flex-col items-center justify-center p-0 overflow-hidden relative">
                    {singleItem ? renderContent(singleItem) : placeholder(type === 'story' ? Film : Sparkles, `Pré-visualização de ${type === 'story' ? 'Story' : 'Reels'}`)}
                    {logoUrl && (
                         <Image src={logoUrl} alt="Logo preview" width={48} height={48} className="absolute bottom-4 right-4 w-12 h-12 object-contain" />
                    )}
                </div>
            );
        default:
            return null;
    }
}


export default function CriarConteudoPage() {
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<ContentType | null>(null);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
    const router = useRouter();
    
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Cleanup function to revoke Object URLs on component unmount
        return () => {
            mediaItems.forEach(item => URL.revokeObjectURL(item.url));
            if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNextStep = () => {
        if(selectedType) {
            setStep(2);
        }
    }

    const handleFileSelect = (ref: React.RefObject<HTMLInputElement>) => {
        ref.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video' | 'logo') => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const newMediaItem: MediaItem = { type: fileType === 'video' ? 'video' : 'image', url };

            if (fileType === 'logo') {
                if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
                setLogoPreviewUrl(url);
            } else {
                 if (selectedType === 'carousel' || (mediaItems.length === 0) ) {
                    setMediaItems(prev => [...prev, newMediaItem]);
                } else {
                    // For single media types, replace the existing item
                    mediaItems.forEach(item => URL.revokeObjectURL(item.url));
                    setMediaItems([newMediaItem]);
                }
            }
        }
        // Reset the input value to allow selecting the same file again
        if(event.target) {
            event.target.value = "";
        }
    };
    
    const clearPreview = (fileType: 'item' | 'logo', index?: number) => {
        if (fileType === 'logo') {
            if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
            setLogoPreviewUrl(null);
        } else if (fileType === 'item') {
            if(typeof index === 'number') {
                const urlToRemove = mediaItems[index]?.url;
                if (urlToRemove) URL.revokeObjectURL(urlToRemove);
                setMediaItems(prev => prev.filter((_, i) => i !== index));
            } else {
                // Clear all media items
                mediaItems.forEach(item => URL.revokeObjectURL(item.url));
                setMediaItems([]);
            }
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
                                    <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" className="hidden" multiple={selectedType === 'carousel'} />
                                    <input type="file" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} accept="video/*" className="hidden" multiple={selectedType === 'carousel'}/>
                                    <input type="file" ref={logoInputRef} onChange={(e) => handleFileChange(e, 'logo')} accept="image/png, image/jpeg" className="hidden" />
                                    
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="relative">
                                            <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => handleFileSelect(imageInputRef)}>
                                                <FileImage className="w-4 h-4 text-blue-500" />
                                                Anexar Imagem
                                            </Button>
                                            {mediaItems.some(i => i.type === 'image') && selectedType !== 'carousel' && (
                                                <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200" onClick={() => clearPreview('item')}><X className="w-4 h-4"/></Button>
                                            )}
                                        </div>
                                         <div className="relative">
                                            <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => handleFileSelect(videoInputRef)}>
                                                <Video className="w-4 h-4 text-green-500" />
                                                Anexar Vídeo
                                            </Button>
                                            {mediaItems.some(i => i.type === 'video') && selectedType !== 'carousel' && (
                                                <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200" onClick={() => clearPreview('item')}><X className="w-4 h-4"/></Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-2 relative">
                                         <Button variant="outline" className="flex items-center gap-2 w-full justify-center" onClick={() => handleFileSelect(logoInputRef)}>
                                            <UploadCloud className="w-4 h-4 text-purple-500" />
                                            Adicionar Logomarca
                                        </Button>
                                        {logoPreviewUrl && (
                                            <Button variant="ghost" size="icon" className="absolute -top-1 right-0 h-6 w-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200" onClick={() => clearPreview('logo')}><X className="w-4 h-4"/></Button>
                                        )}
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
                        <div className="flex flex-col items-center justify-start h-full group">
                           <div className="sticky top-24">
                             <Preview type={selectedType} mediaItems={mediaItems} logoUrl={logoPreviewUrl} onRemoveItem={(index) => clearPreview('item', index)} />
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

    
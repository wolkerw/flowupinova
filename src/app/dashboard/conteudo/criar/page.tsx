
"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowRight, Image as ImageIcon, Copy, Film, Sparkles, ArrowLeft, Video, FileImage, CheckCircle, ChevronLeft, ChevronRight, X, Loader2, Send, Calendar as CalendarIcon, Clock, AlertTriangle, Instagram, Facebook } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { schedulePost } from "@/lib/services/posts-service";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import { Checkbox } from "@/components/ui/checkbox";


type ContentType = "single_post" | "carousel" | "story" | "reels";
type Platform = 'instagram' | 'facebook';

type MediaItem = {
    type: 'image' | 'video';
    file: File;
    previewUrl: string; // Blob or data URL for local preview
    publicUrl?: string; // URL from webhook
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
];

const Preview = ({ type, mediaItems, onRemoveItem }: { type: ContentType, mediaItems: MediaItem[], onRemoveItem: (index: number) => void }) => {
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

    const renderContent = (item: MediaItem) => {
        const imageUrlToDisplay = item.publicUrl || item.previewUrl;
        const imageSizeProps = { width: 400, height: 400 };
        if (type === 'reels' || type === 'story') {
            imageSizeProps.width = 250;
            imageSizeProps.height = 444; // approx 9:16
        }

        if (item.type === 'image') {
            return <Image src={imageUrlToDisplay} alt="Preview da imagem" width={imageSizeProps.width} height={imageSizeProps.height} className="object-cover w-full h-full" />;
        }
        
        if (item.type === 'video') {
            return <video src={item.previewUrl} className="w-full h-full object-cover" controls autoPlay loop muted playsInline />;
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
                <div className="w-full max-w-sm aspect-square bg-gray-200 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                    {singleItem ? renderContent(singleItem) : placeholder(ImageIcon, "Pré-visualização de Post Único (Feed)")}
                </div>
            );
        case 'carousel':
            return (
                 <div className="flex flex-col items-center gap-6">
                    <div className="w-full max-w-sm flex flex-col items-center gap-4">
                        <div className="aspect-square w-full bg-gray-200 rounded-lg flex flex-col items-center justify-center p-0 relative overflow-hidden">
                           <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center relative">
                                {currentCarouselItem ? renderContent(currentCarouselItem) : placeholder(Copy, "Pré-visualização de Carrossel")}

                                {mediaItems.length > 0 && (
                                     <button onClick={() => onRemoveItem(currentSlide)} className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
                                        <X className="w-4 h-4"/>
                                     </button>
                                )}

                                {mediaItems.length > 1 && (
                                    <>
                                        <div className="absolute top-1/2 left-2 right-2 flex justify-between z-10 transform -translate-y-1/2">
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
    const [isUploading, setIsUploading] = useState(false);
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [scheduleType, setScheduleType] = useState<'now' | 'schedule'>('now');
    const [scheduleDate, setScheduleDate] = useState('');
    const [platforms, setPlatforms] = useState<Platform[]>(['instagram']);

    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) return;
        getMetaConnection(user.uid).then(setMetaConnection);
    }, [user]);

    const handleNextStep = async () => {
        if(step === 1 && selectedType) {
            setStep(2);
        } else if (step === 2 && mediaItems.length > 0) {
            setIsUploading(true);
            toast({ title: "Processando imagem...", description: "Enviando imagem para obter URL pública." });

            const file = mediaItems[0].file;

            const formData = new FormData();
            formData.append('file', file);

            try {
                // Call the internal API proxy instead of the external webhook
                const response = await fetch('/api/proxy-webhook', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.details || `Falha na API proxy: ${response.statusText}`);
                }

                const result = await response.json();
                
                const publicUrl = result?.[0]?.url_post;

                if (!publicUrl) {
                    throw new Error("A resposta do webhook (via proxy) não continha uma 'url_post' válida.");
                }

                setMediaItems(prevItems => {
                    const updatedItems = [...prevItems];
                    if (updatedItems[0]) {
                        updatedItems[0].publicUrl = publicUrl;
                    }
                    return updatedItems;
                });
                
                toast({ title: "Sucesso!", description: "Imagem processada e pronta para a próxima etapa." });
                setStep(3);

            } catch (error: any) {
                console.error("Erro ao enviar para a API proxy:", error);
                toast({ variant: "destructive", title: "Erro ao Processar Imagem", description: error.message });
            } finally {
                setIsUploading(false);
            }
        }
    }

    const handleFileSelect = (ref: React.RefObject<HTMLInputElement>) => {
        ref.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video') => {
        const file = event.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
             const newMediaItem: MediaItem = {
                file: file,
                previewUrl: previewUrl,
                type: file.type.startsWith('video') ? 'video' : 'image',
            };
            if (selectedType === 'carousel' || mediaItems.length === 0) {
                setMediaItems(prev => [...prev, newMediaItem]);
            } else {
                setMediaItems([newMediaItem]);
            }
        }
        if(event.target) event.target.value = ""; // Reset input to allow selecting same file again
    };
    
    const handleRemoveItem = (index: number) => {
        const itemToRemove = mediaItems[index];
        if(itemToRemove.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(itemToRemove.previewUrl);
        }
        setMediaItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerateText = () => {
        setIsGeneratingText(true);
        setTimeout(() => {
            setText(prevText => prevText + "\n\nTexto melhorado pela IA: " + prevText);
            setIsGeneratingText(false);
        }, 1500);
    };

    const handlePlatformChange = (platform: Platform) => {
        setPlatforms(prev => 
            prev.includes(platform) 
            ? prev.filter(p => p !== platform)
            : [...prev, platform]
        );
    }

    const handleSubmit = async () => {
        if (!user || !metaConnection?.isConnected || mediaItems.length === 0) {
            toast({ variant: "destructive", title: "Erro", description: "Verifique se você conectou sua conta, está logado e adicionou uma mídia." });
            return;
        }
         if (platforms.length === 0) {
            toast({ variant: "destructive", title: "Nenhuma plataforma", description: "Selecione ao menos uma plataforma para publicar."});
            return;
        }
        if (scheduleType === 'schedule' && !scheduleDate) {
            toast({ variant: "destructive", title: "Data inválida", description: "Por favor, selecione data e hora para o agendamento."});
            return;
        }
        
        // Use the publicUrl if available, otherwise pass the File object
        const mediaToPublish = mediaItems[0].publicUrl || mediaItems[0].file;

        if (!mediaToPublish) {
            toast({ variant: "destructive", title: "Mídia Inválida", description: "Não foi possível encontrar a imagem para publicar." });
            return;
        }

        setIsPublishing(true);
        toast({ title: "Iniciando publicação...", description: "Fazendo upload da mídia e agendando o post." });
        
        const result = await schedulePost(user.uid, {
            title: title || "Post sem título",
            text: text,
            media: mediaToPublish,
            platforms: platforms,
            scheduledAt: scheduleType === 'schedule' && scheduleDate ? new Date(scheduleDate) : new Date(),
            metaConnection: metaConnection,
        });

        setIsPublishing(false);

        if (result.success) {
            toast({ title: "Sucesso!", description: `Post ${scheduleType === 'now' ? 'enviado para publicação' : 'agendado'}!` });
            router.push('/dashboard/conteudo');
        } else {
            toast({ variant: "destructive", title: "Erro ao Publicar", description: result.error || "Ocorreu um erro desconhecido." });
        }
    }
    
    const selectedOption = contentOptions.find(opt => opt.id === selectedType);
    const isNextDisabled = (step === 1 && !selectedType) || (step === 2 && (mediaItems.length === 0 || isUploading));
    const isSubmitDisabled = (
        !metaConnection?.isConnected || 
        isPublishing || 
        mediaItems.length === 0 ||
        platforms.length === 0 ||
        (scheduleType === 'schedule' && !scheduleDate)
    );

    const getAvatarFallback = () => {
        if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
        if (metaConnection?.instagramUsername) return metaConnection.instagramUsername.charAt(0).toUpperCase();
        return "U";
    }

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            mediaItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
        };
    }, [mediaItems]);

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Criar Novo Conteúdo</h1>
                <p className="text-gray-600 mt-1">
                    {step === 1 && "Escolha o formato do conteúdo que você deseja criar."}
                    {step === 2 && `Etapa 2 de 3: Personalize seu ${selectedOption?.title || 'conteúdo'}`}
                    {step === 3 && `Etapa 3 de 3: Revise e agende sua publicação`}
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
                                disabled={isNextDisabled}
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
                        <Card className="shadow-lg border-none">
                            <CardHeader>
                                <CardTitle className="text-lg">Monte sua publicação</CardTitle>
                                <p className="text-sm text-gray-600">Adicione seus arquivos e textos para criar o conteúdo.</p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="font-semibold">Seu Acervo</Label>
                                    <p className="text-xs text-gray-500">Faça o upload de vídeos e imagens.</p>
                                    <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" className="hidden" multiple={selectedType === 'carousel'} />
                                    <input type="file" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} accept="video/*" className="hidden" multiple={selectedType === 'carousel'}/>
                                    
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => handleFileSelect(imageInputRef)} disabled={isUploading}>
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <FileImage className="w-4 h-4 text-blue-500" />}
                                            Anexar Imagem
                                        </Button>
                                        <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => handleFileSelect(videoInputRef)} disabled={isUploading}>
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-green-500" /> : <Video className="w-4 h-4 text-green-500" />}
                                            Anexar Vídeo
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="post-title" className="font-semibold">Título</Label>
                                        <Input
                                            id="post-title"
                                            placeholder="Um título chamativo para seu post"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="post-text" className="font-semibold">Legenda</Label>
                                        <p className="text-xs text-gray-500 mb-2">Escreva o que quiser sobre sua publicação e peça para a IA melhorar seu texto.</p>
                                        <Textarea
                                            id="post-text"
                                            placeholder="Escreva aqui a legenda da sua publicação..."
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            className="h-32"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full flex items-center gap-2"
                                        onClick={handleGenerateText}
                                        disabled={isGeneratingText}
                                    >
                                        {isGeneratingText ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                        ) : (
                                            <Sparkles className="w-4 h-4 text-purple-500" />
                                        )}
                                        Melhorar com IA
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <div className="flex flex-col items-center justify-start h-full group">
                           <div className="sticky top-24">
                             <Preview type={selectedType} mediaItems={mediaItems} onRemoveItem={handleRemoveItem} />
                           </div>
                        </div>
                    </div>

                    <div className="flex justify-between mt-8">
                        <Button variant="outline" onClick={() => setStep(1)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                        <Button 
                          onClick={handleNextStep}
                          disabled={isNextDisabled}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                           {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                           {isUploading ? 'Processando...' : 'Próxima Etapa'}
                           {!isUploading && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>
                </motion.div>
            )}

            {step === 3 && selectedType && (
                 <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
                >
                    <div className="flex flex-col items-center justify-start h-full">
                        <div className="sticky top-24 w-full">
                             <Card className="shadow-lg border-none">
                                <CardHeader>
                                    <CardTitle className="text-lg">Preview Final</CardTitle>
                                </CardHeader>
                                <CardContent className="flex justify-center">
                                    <div className="w-full max-w-sm">
                                        <div className="w-full bg-white rounded-md shadow-lg border flex flex-col mt-4">
                                            <div className="p-3 flex items-center gap-2 border-b">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user?.photoURL || undefined} />
                                                    <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-bold text-sm">{metaConnection?.instagramUsername || 'seu_usuario'}</span>
                                            </div>
                                            <div className="relative aspect-square bg-gray-200">
                                                 <Preview type={selectedType} mediaItems={mediaItems} onRemoveItem={handleRemoveItem} />
                                            </div>
                                            <div className="p-3 text-sm">
                                                <p>
                                                    <span className="font-bold">{metaConnection?.instagramUsername || 'seu_usuario'}</span> {title && <span className="font-bold">{title}</span>} {text}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <Card className="shadow-lg border-none">
                        <CardHeader>
                            <CardTitle className="text-lg">Agendamento e Plataformas</CardTitle>
                            <p className="text-sm text-gray-600">Escolha onde e quando publicar seu conteúdo.</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label className="font-semibold">Onde Publicar?</Label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer peer-data-[state=checked]:border-primary" data-state={platforms.includes('instagram') ? 'checked' : 'unchecked'}>
                                        <Checkbox id="platform-instagram" checked={platforms.includes('instagram')} onCheckedChange={() => handlePlatformChange('instagram')} />
                                        <Label htmlFor="platform-instagram" className="flex items-center gap-2 cursor-pointer">
                                            <Instagram className="w-5 h-5 text-pink-500" />
                                            Instagram
                                        </Label>
                                    </div>
                                     <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer peer-data-[state=checked]:border-primary" data-state={platforms.includes('facebook') ? 'checked' : 'unchecked'}>
                                        <Checkbox id="platform-facebook" checked={platforms.includes('facebook')} onCheckedChange={() => handlePlatformChange('facebook')} disabled={true} />
                                        <Label htmlFor="platform-facebook" className="flex items-center gap-2 cursor-pointer text-gray-400">
                                            <Facebook className="w-5 h-5" />
                                            Facebook (Breve)
                                        </Label>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Label className="font-semibold">Quando publicar?</Label>
                                <RadioGroup value={scheduleType} onValueChange={(v) => setScheduleType(v as 'now' | 'schedule')} className="grid grid-cols-2 gap-4 mt-2">
                                     <div>
                                        <RadioGroupItem value="now" id="now" className="peer sr-only" />
                                        <Label htmlFor="now" className="flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary">
                                            <Clock className="w-6 h-6 mb-2" />
                                            Publicar Agora
                                        </Label>
                                     </div>
                                     <div>
                                        <RadioGroupItem value="schedule" id="schedule" className="peer sr-only" />
                                        <Label htmlFor="schedule" className="flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary">
                                            <CalendarIcon className="w-6 h-6 mb-2" />
                                            Agendar
                                        </Label>
                                     </div>
                                </RadioGroup>
                                {scheduleType === 'schedule' && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="mt-4"
                                    >
                                        <Input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                                    </motion.div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col items-stretch">
                             <Button onClick={handleSubmit} size="lg" className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" disabled={isSubmitDisabled}>
                                {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                {isPublishing ? 'Publicando...' : scheduleType === 'now' ? 'Publicar Post' : 'Agendar Post'}
                            </Button>
                            {!metaConnection?.isConnected && (
                                <p className="text-xs text-red-600 mt-2 text-center flex items-center justify-center gap-1"><AlertTriangle className="w-4 h-4" /> Conecte sua conta da Meta na página de Conteúdo para publicar.</p>
                            )}
                        </CardFooter>
                    </Card>

                     <div className="col-span-full flex justify-between mt-8">
                        <Button variant="outline" onClick={() => setStep(2)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

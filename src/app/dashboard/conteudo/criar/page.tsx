
"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowRight, Image as ImageIcon, Copy, Film, Sparkles, ArrowLeft, UploadCloud, Video, FileImage, CheckCircle, ChevronLeft, ChevronRight, X, Loader2, CornerUpRight, CornerUpLeft, CornerDownLeft, CornerDownRight, ArrowUpToLine, ArrowDownToLine, Instagram, Facebook, Linkedin, Send, Calendar as CalendarIcon, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { schedulePost } from "@/lib/services/posts-service";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";


type ContentType = "single_post" | "carousel" | "story" | "reels";
type MediaItem = {
    type: 'image' | 'video';
    file: File;
    url: string; // Blob URL for preview
};
type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
type LogoSize = 'small' | 'medium' | 'large';


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

const Preview = ({ type, mediaItems, logoUrl, onRemoveItem, logoPosition, logoSize }: { type: ContentType, mediaItems: MediaItem[], logoUrl: string | null, onRemoveItem: (index: number) => void, logoPosition: LogoPosition, logoSize: LogoSize }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (currentSlide >= mediaItems.length && mediaItems.length > 0) {
            setCurrentSlide(mediaItems.length - 1);
        }
    }, [mediaItems, currentSlide]);

    const positionClasses: Record<LogoPosition, string> = {
        'top-left': 'top-4 left-4',
        'top-right': 'top-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    };

    const sizeClasses: Record<LogoSize, string> = {
        'small': 'w-12 h-12',
        'medium': 'w-16 h-16',
        'large': 'w-20 h-20',
    }

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
                <div className="w-full max-w-sm aspect-square bg-gray-200 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                    {singleItem ? renderContent(singleItem) : placeholder(ImageIcon, "Pré-visualização de Post Único (Feed)")}
                    {logoUrl && (
                        <Image src={logoUrl} alt="Logo preview" width={64} height={64} className={cn("absolute object-contain", positionClasses[logoPosition], sizeClasses[logoSize])} />
                    )}
                </div>
            );
        case 'carousel':
            return (
                 <div className="flex flex-col items-center gap-6">
                    <div className="w-full max-w-sm flex flex-col items-center gap-4">
                        <div className="aspect-square w-full bg-gray-200 rounded-lg flex flex-col items-center justify-center p-0 relative overflow-hidden">
                           <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center relative">
                                {currentCarouselItem ? renderContent(currentCarouselItem) : placeholder(Copy, "Pré-visualização de Carrossel")}
                                
                                {logoUrl && (
                                    <Image src={logoUrl} alt="Logo preview" width={64} height={64} className={cn("absolute object-contain", positionClasses[logoPosition], sizeClasses[logoSize])} />
                                )}

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
                    {logoUrl && (
                         <Image src={logoUrl} alt="Logo preview" width={64} height={64} className={cn("absolute object-contain", positionClasses[logoPosition], sizeClasses[logoSize])} />
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
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [logoPosition, setLogoPosition] = useState<LogoPosition>('bottom-right');
    const [logoSize, setLogoSize] = useState<LogoSize>('medium');
    const [scheduleType, setScheduleType] = useState<'now' | 'schedule'>('now');
    const [scheduleDate, setScheduleDate] = useState('');
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) return;
        getMetaConnection(user.uid).then(setMetaConnection);
    }, [user]);

    useEffect(() => {
        return () => {
            mediaItems.forEach(item => URL.revokeObjectURL(item.url));
            if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
        };
    }, [mediaItems, logoPreviewUrl]);

    const handleNextStep = () => {
        if(step === 1 && selectedType) {
            setStep(2);
        } else if (step === 2 && mediaItems.length > 0) {
            setStep(3);
        }
    }

    const handleFileSelect = (ref: React.RefObject<HTMLInputElement>) => {
        ref.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video' | 'logo') => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const newMediaItem: MediaItem = { type: fileType === 'video' ? 'video' : 'image', url, file };

            if (fileType === 'logo') {
                if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
                setLogoFile(file);
                setLogoPreviewUrl(url);
            } else {
                 if (selectedType === 'carousel' || (mediaItems.length === 0) ) {
                    setMediaItems(prev => [...prev, newMediaItem]);
                } else {
                    mediaItems.forEach(item => URL.revokeObjectURL(item.url));
                    setMediaItems([newMediaItem]);
                }
            }
        }
        if(event.target) event.target.value = "";
    };
    
    const handleRemoveItem = (index: number) => {
        const urlToRemove = mediaItems[index]?.url;
        if (urlToRemove) URL.revokeObjectURL(urlToRemove);
        setMediaItems(prev => prev.filter((_, i) => i !== index));
    };

    const clearLogo = () => {
        if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
        setLogoFile(null);
        setLogoPreviewUrl(null);
    };

    const handleGenerateText = () => {
        setIsGeneratingText(true);
        setTimeout(() => {
            setText(prevText => prevText + "\n\nTexto melhorado pela IA: " + prevText);
            setIsGeneratingText(false);
        }, 1500);
    };

    const handleSubmit = async () => {
        if (!user || !metaConnection?.isConnected || mediaItems.length === 0) {
            toast({ variant: "destructive", title: "Erro", description: "Verifique se você conectou sua conta, está logado e adicionou uma mídia." });
            return;
        }
        setIsPublishing(true);

        try {
            await schedulePost(user.uid, {
                title: title || "Post sem título",
                text: text,
                media: mediaItems[0].file, // Por agora, apenas o primeiro item. Carrossel virá depois.
                platforms: ['instagram'],
                scheduledAt: scheduleType === 'schedule' && scheduleDate ? new Date(scheduleDate) : new Date(),
                metaConnection: metaConnection,
            });

            toast({ title: "Sucesso!", description: `Post ${scheduleType === 'now' ? 'enviado para publicação' : 'agendado'}!` });
            router.push('/dashboard/conteudo');

        } catch (error: any) {
            console.error("Erro ao publicar:", error);
            toast({ variant: "destructive", title: "Erro ao Publicar", description: error.message });
        } finally {
            setIsPublishing(false);
        }
    }
    
    const selectedOption = contentOptions.find(opt => opt.id === selectedType);
    const isNextDisabled = (step === 1 && !selectedType) || (step === 2 && mediaItems.length === 0);
    const isSubmitDisabled = (
        !metaConnection?.isConnected || 
        isPublishing || 
        mediaItems.length === 0 ||
        (scheduleType === 'schedule' && !scheduleDate)
    );

    const getAvatarFallback = () => {
        if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
        if (metaConnection?.instagramUsername) return metaConnection.instagramUsername.charAt(0).toUpperCase();
        return "U";
    }

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
                                    <p className="text-xs text-gray-500">Faça o upload de vídeos, imagens e sua logomarca.</p>
                                    <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" className="hidden" multiple={selectedType === 'carousel'} />
                                    <input type="file" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} accept="video/*" className="hidden" multiple={selectedType === 'carousel'}/>
                                    <input type="file" ref={logoInputRef} onChange={(e) => handleFileChange(e, 'logo')} accept="image/png, image/jpeg" className="hidden" />
                                    
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => handleFileSelect(imageInputRef)}>
                                            <FileImage className="w-4 h-4 text-blue-500" />
                                            Anexar Imagem
                                        </Button>
                                        <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => handleFileSelect(videoInputRef)}>
                                            <Video className="w-4 h-4 text-green-500" />
                                            Anexar Vídeo
                                        </Button>
                                    </div>
                                    <div className="pt-2 relative">
                                         <Button variant="outline" className="flex items-center gap-2 w-full justify-center" onClick={() => handleFileSelect(logoInputRef)}>
                                            <UploadCloud className="w-4 h-4 text-purple-500" />
                                            Adicionar Logomarca
                                        </Button>
                                        {logoPreviewUrl && (
                                            <Button variant="ghost" size="icon" className="absolute -top-1 right-0 h-6 w-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200" onClick={clearLogo}><X className="w-4 h-4"/></Button>
                                        )}
                                    </div>
                                     {logoPreviewUrl && (
                                        <div className="space-y-4 pt-2">
                                            <div>
                                                <Label className="font-medium text-sm">Posição da Logo</Label>
                                                <RadioGroup value={logoPosition} onValueChange={(v) => setLogoPosition(v as LogoPosition)} className="flex flex-wrap gap-2 mt-2">
                                                    <Label htmlFor="pos-tl" className="p-2 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                        <RadioGroupItem value="top-left" id="pos-tl" className="sr-only"/>
                                                        <CornerUpLeft />
                                                    </Label>
                                                    <Label htmlFor="pos-tc" className="p-2 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                        <RadioGroupItem value="top-center" id="pos-tc" className="sr-only"/>
                                                        <ArrowUpToLine />
                                                    </Label>
                                                    <Label htmlFor="pos-tr" className="p-2 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                        <RadioGroupItem value="top-right" id="pos-tr" className="sr-only"/>
                                                        <CornerUpRight />
                                                    </Label>
                                                    <Label htmlFor="pos-bl" className="p-2 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                        <RadioGroupItem value="bottom-left" id="pos-bl" className="sr-only"/>
                                                        <CornerDownLeft />
                                                    </Label>
                                                     <Label htmlFor="pos-bc" className="p-2 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                        <RadioGroupItem value="bottom-center" id="pos-bc" className="sr-only"/>
                                                        <ArrowDownToLine />
                                                    </Label>
                                                     <Label htmlFor="pos-br" className="p-2 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                        <RadioGroupItem value="bottom-right" id="pos-br" className="sr-only"/>
                                                        <CornerDownRight />
                                                    </Label>
                                                </RadioGroup>
                                            </div>
                                             <div>
                                                <Label className="font-medium text-sm">Tamanho da Logo</Label>
                                                <RadioGroup value={logoSize} onValueChange={(v) => setLogoSize(v as LogoSize)} className="grid grid-cols-3 gap-2 mt-2">
                                                    <Label htmlFor="size-s" className="p-2 border rounded-md cursor-pointer text-center has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                        <RadioGroupItem value="small" id="size-s" className="sr-only"/>
                                                        Pequeno
                                                    </Label>
                                                    <Label htmlFor="size-m" className="p-2 border rounded-md cursor-pointer text-center has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                        <RadioGroupItem value="medium" id="size-m" className="sr-only"/>
                                                        Médio
                                                    </Label>
                                                    <Label htmlFor="size-l" className="p-2 border rounded-md cursor-pointer text-center has-[:checked]:bg-blue-100 has-[:checked]:border-blue-400">
                                                        <RadioGroupItem value="large" id="size-l" className="sr-only"/>
                                                        Grande
                                                    </Label>
                                                </RadioGroup>
                                            </div>
                                        </div>
                                    )}
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
                             <Preview type={selectedType} mediaItems={mediaItems} logoUrl={logoPreviewUrl} onRemoveItem={handleRemoveItem} logoPosition={logoPosition} logoSize={logoSize} />
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
                           Próxima Etapa
                           <ArrowRight className="w-4 h-4 ml-2" />
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
                                    <Tabs defaultValue="instagram" className="w-full max-w-sm">
                                        <TabsList className="grid w-full grid-cols-1">
                                            <TabsTrigger value="instagram"><Instagram className="w-4 h-4 mr-2"/>Preview</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="instagram">
                                            <div className="w-full bg-white rounded-md shadow-lg border flex flex-col mt-4">
                                                <div className="p-3 flex items-center gap-2 border-b">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={user?.photoURL || undefined} />
                                                        <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-bold text-sm">{metaConnection?.instagramUsername || 'seu_usuario'}</span>
                                                </div>
                                                <div className="relative w-full aspect-square bg-gray-200">
                                                    {mediaItems[0] && (
                                                      <div className="w-full h-full relative">
                                                          {mediaItems[0].type === 'image' ? (
                                                              <Image src={mediaItems[0].url} layout="fill" objectFit="cover" alt="Post preview" />
                                                          ) : (
                                                              <video src={mediaItems[0].url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                                                          )}
                                                          {logoPreviewUrl && <Image src={logoPreviewUrl} alt="Logo" width={64} height={64} className={cn("absolute object-contain", positionClasses[logoPosition], sizeClasses[logoSize])} />}
                                                      </div>
                                                    )}
                                                </div>
                                                <div className="p-3 text-sm">
                                                    <p>
                                                        <span className="font-bold">{metaConnection?.instagramUsername || 'seu_usuario'}</span> {text.substring(0, 100)}{text.length > 100 && '...'}
                                                    </p>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <Card className="shadow-lg border-none">
                        <CardHeader>
                            <CardTitle className="text-lg">Agendamento</CardTitle>
                            <p className="text-sm text-gray-600">Escolha quando publicar seu conteúdo.</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
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

    
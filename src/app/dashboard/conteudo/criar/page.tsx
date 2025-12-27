
"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowRight, Image as ImageIcon, Copy, Film, Sparkles, ArrowLeft, Video, FileImage, CheckCircle, ChevronLeft, ChevronRight, X, Loader2, Send, Calendar as CalendarIcon, Clock, AlertTriangle, Facebook, Instagram, UploadCloud, Trash2, ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { schedulePost, type PostDataInput } from "@/lib/services/posts-service";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import { getInstagramConnection, type InstagramConnectionData } from "@/lib/services/instagram-service";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


type ContentType = "single_post" | "carousel" | "story" | "reels";
type LogoPosition = 'top-left' | 'top-center' | 'top-right' | 'left-center' | 'center' | 'right-center' | 'bottom-left' | 'bottom-center' | 'bottom-right';
type Platform = 'instagram' | 'facebook';

type MediaItem = {
    type: 'image' | 'video';
    file: File;
    previewUrl: string;
    publicUrl?: string;
};

const contentOptions = [
    {
        id: "single_post",
        title: "Post Único (Feed)",
        description: "Uma única imagem ou vídeo para o feed.",
        icon: ImageIcon
    },
    {
        id: "carousel",
        title: "Carrossel (Feed)",
        description: "Várias imagens ou vídeos em um só post.",
        icon: Copy
    }
];

const InstagramPreview = ({ mediaItems, user, text, instagramConnection }: { mediaItems: MediaItem[], user: any, text: string, instagramConnection: InstagramConnectionData | null }) => {
    const getAvatarFallback = () => {
        if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
        if (instagramConnection?.instagramUsername) return instagramConnection.instagramUsername.charAt(0).toUpperCase();
        return "U";
    }

    const singleItem = mediaItems.length > 0 ? mediaItems[0] : null;

    return (
        <div className="w-full bg-white rounded-md shadow-lg border flex flex-col">
            <div className="p-3 flex items-center gap-2 border-b">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                </Avatar>
                <span className="font-bold text-sm">{instagramConnection?.instagramUsername || 'seu_usuario'}</span>
            </div>
            <div className="relative aspect-square bg-gray-200">
                {singleItem ? <Image src={singleItem.publicUrl || singleItem.previewUrl} alt="Preview" layout="fill" objectFit="cover" /> : <ImageIcon className="w-16 h-16 text-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
            </div>
            <div className="p-3 text-sm min-h-[6rem]">
                <p className="whitespace-pre-wrap">
                    <span className="font-bold">{instagramConnection?.instagramUsername || 'seu_usuario'}</span> {text}
                </p>
            </div>
        </div>
    );
};

const FacebookPreview = ({ mediaItems, user, text, metaConnection }: { mediaItems: MediaItem[], user: any, text: string, metaConnection: MetaConnectionData | null }) => {
    const getAvatarFallback = () => {
        if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
        if (metaConnection?.pageName) return metaConnection.pageName.charAt(0).toUpperCase();
        return "P";
    }

    const singleItem = mediaItems.length > 0 ? mediaItems[0] : null;

    return (
        <div className="w-full bg-white rounded-md shadow-lg border flex flex-col">
            <div className="p-3 flex items-center gap-2 border-b">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                </Avatar>
                <div>
                    <span className="font-bold text-sm text-gray-800">{metaConnection?.pageName || 'Sua Página'}</span>
                    <p className="text-xs text-gray-500">Agora mesmo</p>
                </div>
            </div>
            <div className="p-3 text-sm">
                <p className="whitespace-pre-wrap">{text}</p>
            </div>
            <div className="relative aspect-square bg-gray-200">
                {singleItem ? <Image src={singleItem.publicUrl || singleItem.previewUrl} alt="Preview" layout="fill" objectFit="cover" /> : <ImageIcon className="w-16 h-16 text-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
            </div>
             <div className="flex items-center justify-around border-t p-2 text-sm text-gray-600 font-semibold">
                <div className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md cursor-pointer">
                    <ThumbsUp className="w-5 h-5"/> Curtir
                </div>
                 <div className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md cursor-pointer">
                    <MessageCircle className="w-5 h-5"/> Comentar
                </div>
                 <div className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md cursor-pointer">
                    <Share2 className="w-5 h-5"/> Compartilhar
                </div>
            </div>
        </div>
    );
};


export default function CriarConteudoPage() {
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<ContentType | null>(null);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [text, setText] = useState("");
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [scheduleType, setScheduleType] = useState<'now' | 'schedule'>('now');
    const [scheduleDate, setScheduleDate] = useState('');
    const [platforms, setPlatforms] = useState<Platform[]>(['facebook', 'instagram']);

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
    const [logoPosition, setLogoPosition] = useState<LogoPosition>('bottom-right');
    const [logoScale, setLogoScale] = useState(30);
    const [logoOpacity, setLogoOpacity] = useState(80);


    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);
    const [instagramConnection, setInstagramConnection] = useState<InstagramConnectionData | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const visualLogoScale = 5 + (logoScale - 10) * (45 / 90);

    useEffect(() => {
        if (!user) return;
        getMetaConnection(user.uid).then(setMetaConnection);
        getInstagramConnection(user.uid).then(setInstagramConnection);
    }, [user]);

    const getImageDimensions = (file: File): Promise<{ width: number, height: number }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.onload = () => resolve({ width: img.width, height: img.height });
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const processSingleMediaItem = async (mediaItem: MediaItem): Promise<string> => {
        if (mediaItem.type === 'video') {
            return mediaItem.previewUrl;
        }

        const imageFile = mediaItem.file;
        const formData = new FormData();
        formData.append('file', imageFile);

        let webhookUrl = "";
        
        if (logoFile) {
            webhookUrl = "https://webhook.flowupinova.com.br/webhook/post_manual";
            const { width: mainImageWidth, height: mainImageHeight } = await getImageDimensions(imageFile);
            formData.append('logo', logoFile);
            formData.append('logoScale', logoScale.toString());
            formData.append('logoOpacity', logoOpacity.toString());

            const logoPixelWidth = mainImageWidth * (visualLogoScale / 100);
            let positionX = 0, positionY = 0;
            const margin = 16; 

            switch (logoPosition) {
                case 'top-left':    positionX = margin; positionY = margin; break;
                case 'top-center':  positionX = (mainImageWidth / 2) - (logoPixelWidth / 2); positionY = margin; break;
                case 'top-right':   positionX = mainImageWidth - logoPixelWidth - margin; positionY = margin; break;
                case 'left-center': positionX = margin; positionY = (mainImageHeight / 2) - (logoPixelWidth / 2); break;
                case 'center':      positionX = (mainImageWidth / 2) - (logoPixelWidth / 2); positionY = (mainImageHeight / 2) - (logoPixelWidth / 2); break;
                case 'right-center':positionX = mainImageWidth - logoPixelWidth - margin; positionY = (mainImageHeight / 2) - (logoPixelWidth / 2); break;
                case 'bottom-left': positionX = margin; positionY = mainImageHeight - logoPixelWidth - margin; break;
                case 'bottom-center':positionX = (mainImageWidth / 2) - (logoPixelWidth / 2); positionY = mainImageHeight - logoPixelWidth - margin; break;
                case 'bottom-right':positionX = mainImageWidth - logoPixelWidth - margin; positionY = mainImageHeight - logoPixelWidth - margin; break;
            }
            
            formData.append('positionX', Math.round(positionX).toString());
            formData.append('positionY', Math.round(positionY).toString());
        } else {
            webhookUrl = "https://webhook.flowupinova.com.br/webhook/imagem_sem_logo";
        }

        const response = await fetch(webhookUrl, { method: 'POST', body: formData });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorDetails = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorDetails = errorJson.details || errorJson.error || errorText;
            } catch (e) { /* Use plain text */ }
            throw new Error(errorDetails || `Falha ao chamar o webhook: ${response.statusText}`);
        }

        const result = await response.json();
        const publicUrl = result?.[0]?.url_post;

        if (!publicUrl) {
            throw new Error("A resposta do webhook não continha uma 'url_post' válida.");
        }

        return publicUrl;
    };

    const handleNextStep = async () => {
        if (step === 2 && mediaItems.length > 0) {
            setIsUploading(true);
            toast({ title: `Processando ${mediaItems.length} mídia(s)...`, description: "Aplicando edições e enviando para o webhook." });

            try {
                const processedUrls: string[] = [];
                for (const item of mediaItems) {
                    if (item.type === 'image') {
                        const url = await processSingleMediaItem(item);
                        processedUrls.push(url);
                    } else {
                        processedUrls.push(item.previewUrl); 
                    }
                }
                
                setMediaItems(prevItems => prevItems.map((item, index) => ({
                    ...item,
                    publicUrl: processedUrls[index]
                })));

                toast({ variant: "success", title: "Sucesso!", description: "Mídias processadas e prontas para a próxima etapa." });
                setStep(3);

            } catch (error: any) {
                console.error("Erro ao enviar para o webhook:", error);
                toast({ variant: "destructive", title: "Erro ao Processar Mídia", description: error.message });
            } finally {
                setIsUploading(false);
            }
        }
    }


    const handleContentTypeSelect = (value: string) => {
        setSelectedType(value as ContentType);
        setStep(2);
    };

    const handleFileSelect = (ref: React.RefObject<HTMLInputElement>) => {
        ref.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        if(event.target) event.target.value = "";
    };
    
     const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast({ variant: "destructive", title: "Arquivo muito grande", description: "Por favor, escolha uma logomarca com menos de 2MB." });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreviewUrl(reader.result as string);
                setLogoFile(file);
            };
            reader.readAsDataURL(file);
        }
        if(event.target) event.target.value = "";
    };

    const handleRemoveLogo = () => {
        if(logoPreviewUrl) {
            URL.revokeObjectURL(logoPreviewUrl);
        }
        setLogoFile(null);
        setLogoPreviewUrl(null);
    }

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
        if (!user || mediaItems.length === 0) {
             toast({ variant: "destructive", title: "Erro", description: "Verifique se você adicionou uma mídia." });
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
        
        const mediaToPublish = mediaItems[0].publicUrl || mediaItems[0].file;

        if (!mediaToPublish) {
            toast({ variant: "destructive", title: "Mídia Inválida", description: "Não foi possível encontrar a imagem para publicar." });
            return;
        }

        setIsPublishing(true);
        toast({ title: "Iniciando publicação...", description: "Fazendo upload da mídia e agendando o post." });
        
        const postInput: PostDataInput = {
            title: "Post sem título", // Título removido da UI
            text: text,
            media: mediaToPublish,
            platforms: platforms,
            scheduledAt: scheduleType === 'schedule' && scheduleDate ? new Date(scheduleDate) : new Date(),
        };

        if (platforms.includes('facebook') && metaConnection?.isConnected) {
            postInput.metaConnection = metaConnection;
        }
        if (platforms.includes('instagram') && instagramConnection?.isConnected) {
            postInput.instagramConnection = instagramConnection;
        }

        const result = await schedulePost(user.uid, postInput);

        setIsPublishing(false);

        if (result.success) {
            toast({ title: "Sucesso!", description: `Post ${scheduleType === 'now' ? 'enviado para publicação' : 'agendado'}!` });
            router.push('/dashboard/conteudo');
        } else {
            toast({ variant: "destructive", title: "Erro ao Publicar", description: result.error || "Ocorreu um erro desconhecido." });
        }
    }
    
    const selectedOption = contentOptions.find(opt => opt.id === selectedType);
    const isNextDisabled = (step === 2 && (mediaItems.length === 0 || isUploading));
    const isSubmitDisabled = (
        isPublishing || 
        mediaItems.length === 0 ||
        platforms.length === 0 ||
        (platforms.includes('facebook') && !metaConnection?.isConnected) ||
        (platforms.includes('instagram') && !instagramConnection?.isConnected) ||
        (scheduleType === 'schedule' && !scheduleDate)
    );

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            mediaItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
             if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(logoPreviewUrl);
            }
        };
    }, [mediaItems, logoPreviewUrl]);

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
                                onValueChange={handleContentTypeSelect}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                {contentOptions.map(option => (
                                    <div key={option.id}>
                                        <RadioGroupItem value={option.id} id={option.id} className="peer sr-only" />
                                        <Label
                                            htmlFor={option.id}
                                            onClick={() => handleContentTypeSelect(option.id)}
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
                                    <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" className="hidden" multiple={selectedType === 'carousel'} />
                                    <input type="file" ref={videoInputRef} onChange={handleFileChange} accept="video/*" className="hidden" multiple={selectedType === 'carousel'}/>

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
                                
                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold">Personalização da Marca</h4>
                                    <input type="file" ref={logoInputRef} onChange={handleLogoFileChange} accept="image/png, image/jpeg" className="hidden" />
                                     {!logoPreviewUrl ? (
                                         <Button variant="outline" className="w-full" onClick={() => handleFileSelect(logoInputRef)}>
                                            <UploadCloud className="w-4 h-4 mr-2"/>
                                            Anexar Logomarca
                                         </Button>
                                     ) : (
                                        <div className="space-y-4">
                                             <div className="flex items-center justify-between p-2 border rounded-lg bg-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <Image src={logoPreviewUrl} alt="Preview da logomarca" width={40} height={40} className="object-contain rounded" />
                                                    <span className="text-sm text-gray-600 truncate max-w-[150px]">{logoFile?.name}</span>
                                                </div>
                                                <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-100" onClick={handleRemoveLogo}>
                                                    <Trash2 className="w-4 h-4"/>
                                                </Button>
                                             </div>

                                            <div>
                                                <Label className="text-sm">Posição</Label>
                                                <RadioGroup value={logoPosition} onValueChange={(v) => setLogoPosition(v as LogoPosition)} className="grid grid-cols-3 gap-2 mt-2">
                                                    {(['top-left', 'top-center', 'top-right', 'left-center', 'center', 'right-center', 'bottom-left', 'bottom-center', 'bottom-right'] as LogoPosition[]).map(pos => (
                                                        <div key={pos}>
                                                            <RadioGroupItem value={pos} id={pos} className="sr-only peer" />
                                                            <Label htmlFor={pos} className="flex items-center justify-center text-xs rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary capitalize">{pos.replace('-', ' ')}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                            <div>
                                                <Label htmlFor="logo-scale" className="text-sm">Tamanho ({logoScale}%)</Label>
                                                <Slider id="logo-scale" min={10} max={100} step={1} value={[logoScale]} onValueChange={([v]) => setLogoScale(v)} />
                                            </div>
                                             <div>
                                                <Label htmlFor="logo-opacity" className="text-sm">Opacidade ({logoOpacity}%)</Label>
                                                <Slider id="logo-opacity" min={10} max={100} step={5} value={[logoOpacity]} onValueChange={([v]) => setLogoOpacity(v)} />
                                            </div>
                                        </div>
                                     )}
                                 </div>

                                <div className="space-y-4 pt-4 border-t">
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
                           <div className="sticky top-24 w-full">
                                <div className="w-full max-w-sm">
                                    <Tabs defaultValue="instagram">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="instagram">
                                                <Instagram className="w-4 h-4 mr-2" />
                                                Instagram
                                            </TabsTrigger>
                                            <TabsTrigger value="facebook">
                                                <Facebook className="w-4 h-4 mr-2" />
                                                Facebook
                                            </TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="instagram" className="mt-4">
                                            <InstagramPreview mediaItems={mediaItems} user={user} text={text} instagramConnection={instagramConnection} />
                                        </TabsContent>
                                        <TabsContent value="facebook" className="mt-4">
                                            <FacebookPreview mediaItems={mediaItems} user={user} text={text} metaConnection={metaConnection} />
                                        </TabsContent>
                                    </Tabs>
                                </div>
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
                                        <Tabs defaultValue="instagram">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="instagram">
                                                    <Instagram className="w-4 h-4 mr-2" />
                                                    Instagram
                                                </TabsTrigger>
                                                <TabsTrigger value="facebook">
                                                    <Facebook className="w-4 h-4 mr-2" />
                                                    Facebook
                                                </TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="instagram" className="mt-4">
                                                <InstagramPreview mediaItems={mediaItems} user={user} text={text} instagramConnection={instagramConnection} />
                                            </TabsContent>
                                            <TabsContent value="facebook" className="mt-4">
                                                <FacebookPreview mediaItems={mediaItems} user={user} text={text} metaConnection={metaConnection} />
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <Card className="shadow-lg border-none">
                        <CardHeader>
                            <CardTitle className="text-lg">Agendamento e Plataformas</CardTitle>
                            <p className="text-sm text-gray-600">Escolha quando e onde publicar seu conteúdo.</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <div>
                                <Label className="font-semibold">Onde Publicar?</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                     <div className={cn("flex items-center space-x-2 rounded-lg border p-4", !metaConnection?.isConnected && "bg-gray-100 opacity-60")}>
                                        <Checkbox id="platform-facebook" checked={platforms.includes('facebook')} onCheckedChange={() => handlePlatformChange('facebook')} disabled={!metaConnection?.isConnected} />
                                        <Label htmlFor="platform-facebook" className="flex items-center gap-2 cursor-pointer">
                                            <Facebook className="w-5 h-5 text-blue-600" />
                                            Facebook
                                        </Label>
                                    </div>
                                    <div className={cn("flex items-center space-x-2 rounded-lg border p-4", !instagramConnection?.isConnected && "bg-gray-100 opacity-60")}>
                                        <Checkbox id="platform-instagram" checked={platforms.includes('instagram')} onCheckedChange={() => handlePlatformChange('instagram')} disabled={!instagramConnection?.isConnected} />
                                        <Label htmlFor="platform-instagram" className="flex items-center gap-2 cursor-pointer">
                                            <Instagram className="w-5 h-5 text-pink-500" />
                                            Instagram
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
                                        <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full p-2 border rounded-md" />
                                    </motion.div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col items-stretch">
                             <Button onClick={handleSubmit} size="lg" className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" disabled={isSubmitDisabled}>
                                {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                {isPublishing ? 'Publicando...' : scheduleType === 'now' ? 'Publicar Post' : 'Agendar Post'}
                            </Button>
                            {!metaConnection?.isConnected && !instagramConnection?.isConnected && (
                                <p className="text-xs text-red-600 mt-2 text-center flex items-center justify-center gap-1"><AlertTriangle className="w-4 h-4" /> Conecte suas contas na página de Conteúdo para publicar.</p>
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

"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Image as ImageIcon,
  Copy,
  Film,
  Sparkles,
  ArrowLeft,
  Video,
  FileImage,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Send,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  Facebook,
  Instagram,
  UploadCloud,
  Trash2,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreVertical,
  MoreHorizontal,
  Globe,
  Bookmark,
  Repeat,
  Heart,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  schedulePost,
  type PostDataInput,
  type MediaFileInput,
} from "@/lib/services/posts-service";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import {
  getInstagramConnection,
  type InstagramConnectionData,
} from "@/lib/services/instagram-service";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ContentType = "single_post" | "carousel" | "story" | "reels";
type LogoPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "left-center"
  | "center"
  | "right-center"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
type Platform = "instagram" | "facebook";

type MediaItem = {
  type: "image" | "video";
  file: File;
  previewUrl: string;
  publicUrl?: string;
};

const contentOptions = [
  {
    id: "single_post",
    title: "Post Único (Feed)",
    description: "Uma única imagem ou vídeo para o feed.",
    icon: ImageIcon,
  },
  {
    id: "carousel",
    title: "Carrossel (Feed)",
    description: "Várias imagens ou vídeos em um só post.",
    icon: Copy,
  },
];

const InstagramPreview = ({
  mediaItems,
  user,
  text,
  instagramConnection,
}: {
  mediaItems: MediaItem[];
  user: any;
  text: string;
  instagramConnection: InstagramConnectionData | null;
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setCurrentSlide(0);
  }, [mediaItems]);

  const isCarousel = mediaItems.length > 1;
  const currentMedia = mediaItems[currentSlide];

  const getAvatarFallback = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (instagramConnection?.instagramUsername)
      return instagramConnection.instagramUsername.charAt(0).toUpperCase();
    return "U";
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % mediaItems.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);

  return (
    <div className="flex w-full flex-col rounded-md border bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-bold">
            {instagramConnection?.instagramUsername || "seu_usuario"}
          </span>
        </div>
        <MoreVertical className="h-5 cursor-pointer text-gray-600" />
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-gray-200">
        {currentMedia ? (
          <Image
            src={currentMedia.publicUrl || currentMedia.previewUrl}
            alt="Preview"
            layout="fill"
            objectFit="cover"
            unoptimized
          />
        ) : (
          <ImageIcon className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-gray-300" />
        )}
        {isCarousel && (
          <>
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
              <Copy className="h-3 w-3" />
              <span>
                {currentSlide + 1}/{mediaItems.length}
              </span>
            </div>
            {currentSlide > 0 && (
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {currentSlide < mediaItems.length - 1 && (
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Action Icons */}
      <div className="flex items-center justify-between px-3 pt-3">
        <div className="flex items-center gap-4">
          <Heart className="h-6 w-6 cursor-pointer text-gray-800 hover:text-red-500" />
          <MessageCircle className="-ml-1 h-6 w-6 -scale-x-100 transform cursor-pointer text-gray-800" />
          <Repeat className="h-6 w-6 cursor-pointer text-gray-800" />
          <Send className="-ml-1 h-6 w-6 cursor-pointer text-gray-800" />
        </div>
        <Bookmark className="h-6 w-6 cursor-pointer text-gray-800" />
      </div>

      {/* Likes and Caption */}
      <div className="min-h-[6rem] space-y-1 p-3 pt-2 text-sm">
        <p className="text-xs text-gray-900">
          Curtido por <span className="font-bold">NumVapt</span> e{" "}
          <span className="font-bold">outras pessoas</span>
        </p>
        <div className="text-sm text-gray-900">
          <p className="whitespace-pre-wrap">
            <span className="font-bold">
              {instagramConnection?.instagramUsername || "seu_usuario"}
            </span>{" "}
            {text}
          </p>
        </div>
        <p className="pt-1 text-xs text-gray-400">Adicionar um comentário...</p>
      </div>
    </div>
  );
};

const FacebookPreview = ({
  mediaItems,
  user,
  text,
  metaConnection,
}: {
  mediaItems: MediaItem[];
  user: any;
  text: string;
  metaConnection: MetaConnectionData | null;
}) => {
  const getAvatarFallback = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (metaConnection?.pageName) return metaConnection.pageName.charAt(0).toUpperCase();
    return "P";
  };

  const singleItem = mediaItems.length > 0 ? mediaItems[0] : null;
  const isCarousel = mediaItems.length > 1;

  return (
    <div className="flex w-full flex-col rounded-md border bg-white shadow-lg">
      {isCarousel && (
        <div className="flex items-start gap-2 border-b bg-yellow-50 p-3 text-sm text-yellow-800">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            Apenas a primeira imagem será postada no Facebook, pois a plataforma não permite
            publicar carrosséis diretamente. No Instagram, o carrossel será publicado normalmente.
          </span>
        </div>
      )}
      <div className="flex items-start justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
          </Avatar>
          <div>
            <span className="text-sm font-bold text-gray-800">
              {metaConnection?.pageName || "Sua Página"}
            </span>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-gray-500">Agora mesmo</p>
              <span className="text-xs text-gray-500">·</span>
              <Globe className="h-3 w-3 text-gray-500" />
            </div>
          </div>
        </div>
        <MoreHorizontal className="h-5 cursor-pointer text-gray-600" />
      </div>
      <div className="px-3 pb-2 text-sm">
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
      <div className="relative aspect-square bg-gray-200">
        {singleItem ? (
          <Image
            src={singleItem.publicUrl || singleItem.previewUrl}
            alt="Preview"
            layout="fill"
            objectFit="cover"
            unoptimized
          />
        ) : (
          <ImageIcon className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-gray-300" />
        )}
      </div>
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1.5 rounded-md p-2 hover:bg-gray-100">
            <ThumbsUp className="h-5 w-5 text-gray-600" />
          </button>
          <button className="flex items-center gap-1.5 rounded-md p-2 hover:bg-gray-100">
            <MessageCircle className="h-5 w-5 text-gray-600" />
          </button>
          <button className="flex items-center gap-1.5 rounded-md p-2 hover:bg-gray-100">
            <Share2 className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="flex items-center">
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500">
            <Heart className="h-3 w-3 fill-white text-white" />
          </div>
          <div className="-ml-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600">
            <ThumbsUp className="h-3 w-3 fill-white text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

const FinalPreview = ({
  mediaItems,
  user,
  text,
  metaConnection,
  instagramConnection,
}: {
  mediaItems: MediaItem[];
  user: any;
  text: string;
  metaConnection: MetaConnectionData | null;
  instagramConnection: InstagramConnectionData | null;
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const isCarousel = mediaItems.length > 1;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % mediaItems.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);

  // Instagram Preview with navigation
  const InstagramNavPreview = () => {
    const currentMedia = mediaItems[currentSlide];
    const getAvatarFallback = () => {
      if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
      if (instagramConnection?.instagramUsername)
        return instagramConnection.instagramUsername.charAt(0).toUpperCase();
      return "U";
    };

    return (
      <div className="flex w-full flex-col rounded-md border bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b p-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-bold">
              {instagramConnection?.instagramUsername || "seu_usuario"}
            </span>
          </div>
          <MoreVertical className="h-5 cursor-pointer text-gray-600" />
        </div>

        {/* Image */}
        <div className="relative aspect-square bg-gray-200">
          {currentMedia ? (
            <Image
              src={currentMedia.publicUrl || currentMedia.previewUrl}
              alt="Preview"
              layout="fill"
              objectFit="cover"
              unoptimized
            />
          ) : (
            <ImageIcon className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-gray-300" />
          )}
          {isCarousel && (
            <>
              <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                <Copy className="h-3 w-3" />
                <span>
                  {currentSlide + 1}/{mediaItems.length}
                </span>
              </div>
              {currentSlide > 0 && (
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {currentSlide < mediaItems.length - 1 && (
                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Action Icons & Caption */}
        <div className="min-h-[6rem] space-y-1 p-3 pt-2 text-sm">
          <p className="whitespace-pre-wrap">
            <span className="font-bold">
              {instagramConnection?.instagramUsername || "seu_usuario"}
            </span>{" "}
            {text}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-sm">
      <Tabs defaultValue="instagram">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="instagram">
            <Instagram className="mr-2 h-4 w-4" />
            Instagram
          </TabsTrigger>
          <TabsTrigger value="facebook">
            <Facebook className="mr-2 h-4 w-4" />
            Facebook
          </TabsTrigger>
        </TabsList>
        <TabsContent value="instagram" className="mt-4">
          <InstagramNavPreview />
        </TabsContent>
        <TabsContent value="facebook" className="mt-4">
          <FacebookPreview
            mediaItems={mediaItems}
            user={user}
            text={text}
            metaConnection={metaConnection}
          />
        </TabsContent>
      </Tabs>
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
  const [scheduleType, setScheduleType] = useState<"now" | "schedule">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(["facebook", "instagram"]);

  const [collaboratorsInput, setCollaboratorsInput] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>([]);

  const [userTagsInput, setUserTagsInput] = useState("");
  const [userTags, setUserTags] = useState<{username: string, x: number, y: number}[]>([]);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("bottom-right");
  const [logoScale, setLogoScale] = useState(30);
  const [logoOpacity, setLogoOpacity] = useState(80);

  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);
  const [instagramConnection, setInstagramConnection] = useState<InstagramConnectionData | null>(
    null
  );

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const visualLogoScale = 5 + (logoScale - 10) * (45 / 90);

  useEffect(() => {
    if (!user) return;
    getMetaConnection(user.uid).then(setMetaConnection);
    getInstagramConnection(user.uid).then(setInstagramConnection);
  }, [user]);

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processSingleMediaItem = async (mediaItem: MediaItem): Promise<string> => {
    if (mediaItem.type === "video") {
      // Placeholder: Video processing might be different, for now just returning preview
      // In a real scenario, this would upload the video and return a public URL.
      return mediaItem.previewUrl;
    }

    const imageFile = mediaItem.file;
    const formData = new FormData();
    formData.append("file", imageFile);

    let webhookUrl = "";

    if (logoFile) {
      webhookUrl = "https://webhook.flowupinova.com.br/webhook/post_manual";
      const { width: mainImageWidth, height: mainImageHeight } =
        await getImageDimensions(imageFile);
      formData.append("logo", logoFile);
      formData.append("logoScale", logoScale.toString());
      formData.append("logoOpacity", logoOpacity.toString());

      const logoPixelWidth = mainImageWidth * (visualLogoScale / 100);
      let positionX = 0,
        positionY = 0;
      const margin = 16;

      switch (logoPosition) {
        case "top-left":
          positionX = margin;
          positionY = margin;
          break;
        case "top-center":
          positionX = mainImageWidth / 2 - logoPixelWidth / 2;
          positionY = margin;
          break;
        case "top-right":
          positionX = mainImageWidth - logoPixelWidth - margin;
          positionY = margin;
          break;
        case "left-center":
          positionX = margin;
          positionY = mainImageHeight / 2 - logoPixelWidth / 2;
          break;
        case "center":
          positionX = mainImageWidth / 2 - logoPixelWidth / 2;
          positionY = mainImageHeight / 2 - logoPixelWidth / 2;
          break;
        case "right-center":
          positionX = mainImageWidth - logoPixelWidth - margin;
          positionY = mainImageHeight / 2 - logoPixelWidth / 2;
          break;
        case "bottom-left":
          positionX = margin;
          positionY = mainImageHeight - logoPixelWidth - margin;
          break;
        case "bottom-center":
          positionX = mainImageWidth / 2 - logoPixelWidth / 2;
          positionY = mainImageHeight - logoPixelWidth - margin;
          break;
        case "bottom-right":
          positionX = mainImageWidth - logoPixelWidth - margin;
          positionY = mainImageHeight - logoPixelWidth - margin;
          break;
      }

      formData.append("positionX", Math.round(positionX).toString());
      formData.append("positionY", Math.round(positionY).toString());
    } else {
      webhookUrl = "https://webhook.flowupinova.com.br/webhook/imagem_sem_logo";
    }

    const response = await fetch(webhookUrl, { method: "POST", body: formData });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.details || errorJson.error || errorText;
      } catch (e) {
        /* Use plain text */
      }
      throw new Error(errorDetails || `Falha ao chamar o webhook: ${"error"}`);
    }

    const result = await response.json();
    const publicUrl = result?.[0]?.url_post;

    if (!publicUrl) {
      throw new Error("A resposta do webhook não continha uma 'url_post' válida.");
    }

    return publicUrl;
  };

  const handleAddCollaborator = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = collaboratorsInput.trim().replace('@', '');
      if (val && collaborators.length < 3 && !collaborators.includes(val)) {
        setCollaborators([...collaborators, val]);
      }
      setCollaboratorsInput("");
    }
  };

  const handleAddUserTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = userTagsInput.trim().replace('@', '');
      if (val && !userTags.some(t => t.username === val)) {
        setUserTags([...userTags, { username: val, x: 0.5, y: 0.5 }]);
      }
      setUserTagsInput("");
    }
  };

  const handleNextStep = async () => {
    if (step === 2 && mediaItems.length > 0) {
      setIsUploading(true);
      toast({
        title: `Processando ${mediaItems.length} mídia(s)...`,
        description: "Aplicando edições e enviando para o webhook.",
      });

      try {
        const uploadPromises = mediaItems.map((item) => {
          if (item.type === "image") {
            return processSingleMediaItem(item);
          }
          // For now, let's just assume video is already a URL or doesn't need processing
          return Promise.resolve(item.previewUrl);
        });

        const processedUrls = await Promise.all(uploadPromises);

        setMediaItems((prevItems) =>
          prevItems.map((item, index) => ({
            ...item,
            publicUrl: processedUrls[index],
          }))
        );

        toast({
          variant: "success",
          title: "Sucesso!",
          description: "Mídias processadas e prontas para a próxima etapa.",
        });
        setStep(3);
      } catch (error: any) {
        console.error("Erro ao enviar para o webhook:", error);
        toast({
          variant: "destructive",
          title: "Erro ao Processar Mídia",
          description: error.message,
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleContentTypeSelect = (value: string) => {
    setSelectedType(value as ContentType);
    setStep(2);
  };

  const handleFileSelect = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newMediaItems: MediaItem[] = Array.from(files).map((file) => ({
        file: file,
        previewUrl: URL.createObjectURL(file),
        type: file.type.startsWith("video") ? "video" : "image",
      }));

      if (selectedType === "carousel") {
        if (mediaItems.length + newMediaItems.length > 10) {
          toast({
            variant: "destructive",
            title: "Limite excedido",
            description: "Você pode adicionar no máximo 10 mídias a um carrossel.",
          });
          return;
        }
        setMediaItems((prev) => [...prev, ...newMediaItems]);
      } else {
        setMediaItems(newMediaItems.slice(0, 1)); // Only first file for single post
      }
    }
    if (event.target) event.target.value = "";
  };

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: "Por favor, escolha uma logomarca com menos de 2MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreviewUrl(reader.result as string);
        setLogoFile(file);
      };
      reader.readAsDataURL(file);
    }
    if (event.target) event.target.value = "";
  };

  const handleRemoveLogo = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setLogoFile(null);
    setLogoPreviewUrl(null);
  };

  const handleRemoveItem = (index: number) => {
    const itemToRemove = mediaItems[index];
    if (itemToRemove.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(itemToRemove.previewUrl);
    }
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateText = () => {
    setIsGeneratingText(true);
    setTimeout(() => {
      setText((prevText) => prevText + "\n\nTexto melhorado pela IA: " + prevText);
      setIsGeneratingText(false);
    }, 1500);
  };

  const handlePlatformChange = (platform: Platform) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleSubmit = async () => {
    if (!user || mediaItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Verifique se você adicionou uma mídia.",
      });
      return;
    }

    if (platforms.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhuma plataforma",
        description: "Selecione ao menos uma plataforma para publicar.",
      });
      return;
    }

    if (scheduleType === "schedule" && !scheduleDate) {
      toast({
        variant: "destructive",
        title: "Data inválida",
        description: "Por favor, selecione data e hora para o agendamento.",
      });
      return;
    }

    const mediaToPublish: MediaFileInput[] = mediaItems.map((item) => ({
      file: item.file,
      publicUrl: item.publicUrl,
    }));

    if (!mediaToPublish.every((m) => m.file || m.publicUrl)) {
      toast({
        variant: "destructive",
        title: "Mídia Inválida",
        description: "Não foi possível encontrar a imagem para publicar.",
      });
      return;
    }

    setIsPublishing(true);
    toast({
      title: "Iniciando publicação...",
      description: "Fazendo upload da mídia e agendando o post.",
    });

    const postInput: PostDataInput = {
      text: text,
      media: mediaToPublish,
      platforms: platforms,
      isCarousel: selectedType === "carousel",
      scheduledAt:
        scheduleType === "schedule" && scheduleDate ? new Date(scheduleDate) : new Date(),
      collaborators: collaborators.length > 0 ? collaborators : undefined,
      userTags: userTags.length > 0 ? userTags : undefined,
    };

    if (platforms.includes("facebook") && metaConnection?.isConnected) {
      postInput.metaConnection = metaConnection;
    }
    if (platforms.includes("instagram") && instagramConnection?.isConnected) {
      postInput.instagramConnection = instagramConnection;
    }

    const result = await schedulePost(user.uid, postInput);

    setIsPublishing(false);

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: `Post ${scheduleType === "now" ? "enviado para publicação" : "agendado"}!`,
      });
      router.push("/dashboard/conteudo");
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao Publicar",
        description: result.error || "Ocorreu um erro desconhecido.",
      });
    }
  };

  const selectedOption = contentOptions.find((opt) => opt.id === selectedType);
  const isNextDisabled = step === 2 && (mediaItems.length === 0 || isUploading);
  const isSubmitDisabled =
    isPublishing ||
    mediaItems.length === 0 ||
    platforms.length === 0 ||
    (platforms.includes("facebook") && !metaConnection?.isConnected) ||
    (platforms.includes("instagram") && !instagramConnection?.isConnected) ||
    (scheduleType === "schedule" && !scheduleDate);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      mediaItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      if (logoPreviewUrl && logoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [mediaItems, logoPreviewUrl]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Criar Novo Conteúdo</h1>
        <p className="mt-1 text-gray-600">
          {step === 1 && "Escolha o formato do conteúdo que você deseja criar."}
          {step === 2 && `Etapa 2 de 3: Personalize seu ${selectedOption?.title || "conteúdo"}`}
          {step === 3 && `Etapa 3 de 3: Revise e agende sua publicação`}
        </p>
      </div>

      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl"
        >
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-6 w-6 text-blue-500" />
                Etapa 1: Qual tipo de conteúdo você quer criar?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedType || ""}
                onValueChange={handleContentTypeSelect}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                {contentOptions.map((option) => (
                  <div key={option.id}>
                    <RadioGroupItem value={option.id} id={option.id} className="peer sr-only" />
                    <Label
                      htmlFor={option.id}
                      onClick={() => handleContentTypeSelect(option.id)}
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                        "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      )}
                    >
                      <div className="flex w-full items-center gap-4">
                        <option.icon className="h-8 w-8 text-primary" />
                        <div className="text-left">
                          <h4 className="text-base font-bold">{option.title}</h4>
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
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Monte sua publicação</CardTitle>
                <p className="text-sm text-gray-600">
                  Adicione seus arquivos e textos para criar o conteúdo.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-semibold">Seu Acervo</Label>
                  {mediaItems.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {mediaItems.map((item, index) => (
                        <div key={index} className="group relative aspect-square">
                          <Image
                            src={item.previewUrl}
                            alt={`Preview ${index}`}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-md"
                          />
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <p className="pt-2 text-xs text-gray-500">Faça o upload de vídeos e imagens.</p>
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    multiple={selectedType === "carousel"}
                  />
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleFileChange}
                    accept="video/*"
                    className="hidden"
                    multiple={selectedType === "carousel"}
                  />

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button
                      variant="outline"
                      className="flex w-full items-center gap-2"
                      onClick={() => handleFileSelect(imageInputRef)}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      ) : (
                        <FileImage className="h-4 w-4 text-blue-500" />
                      )}
                      Anexar Imagem
                    </Button>
                    <Button
                      variant="outline"
                      className="flex w-full items-center gap-2"
                      onClick={() => handleFileSelect(videoInputRef)}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                      ) : (
                        <Video className="h-4 w-4 text-green-500" />
                      )}
                      Anexar Vídeo
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold">Personalização da Marca</h4>
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoFileChange}
                    accept="image/png, image/jpeg"
                    className="hidden"
                  />
                  {!logoPreviewUrl ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleFileSelect(logoInputRef)}
                    >
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Anexar Logomarca
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-2">
                        <div className="flex items-center gap-2">
                          <Image
                            src={logoPreviewUrl}
                            alt="Preview da logomarca"
                            width={40}
                            height={40}
                            className="rounded object-contain"
                          />
                          <span className="max-w-[150px] truncate text-sm text-gray-600">
                            {logoFile?.name}
                          </span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-100"
                          onClick={handleRemoveLogo}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div>
                        <Label className="text-sm">Posição</Label>
                        <RadioGroup
                          value={logoPosition}
                          onValueChange={(v) => setLogoPosition(v as LogoPosition)}
                          className="mt-2 grid grid-cols-3 gap-2"
                        >
                          {(
                            [
                              "top-left",
                              "top-center",
                              "top-right",
                              "left-center",
                              "center",
                              "right-center",
                              "bottom-left",
                              "bottom-center",
                              "bottom-right",
                            ] as LogoPosition[]
                          ).map((pos) => (
                            <div key={pos}>
                              <RadioGroupItem value={pos} id={pos} className="peer sr-only" />
                              <Label
                                htmlFor={pos}
                                className="flex cursor-pointer items-center justify-center rounded-md border-2 border-muted bg-popover p-2 text-xs capitalize hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
                              >
                                {pos.replace("-", " ")}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <div>
                        <Label htmlFor="logo-scale" className="text-sm">
                          Tamanho ({logoScale}%)
                        </Label>
                        <Slider
                          id="logo-scale"
                          min={10}
                          max={100}
                          step={1}
                          value={[logoScale]}
                          onValueChange={([v]) => setLogoScale(v)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="logo-opacity" className="text-sm">
                          Opacidade ({logoOpacity}%)
                        </Label>
                        <Slider
                          id="logo-opacity"
                          min={10}
                          max={100}
                          step={5}
                          value={[logoOpacity]}
                          onValueChange={([v]) => setLogoOpacity(v)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div>
                    <Label htmlFor="post-text" className="font-semibold">
                      Legenda
                    </Label>
                    <p className="mb-2 text-xs text-gray-500">
                      Escreva o que quiser sobre sua publicação e peça para a IA melhorar seu texto.
                    </p>
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
                    className="flex w-full items-center gap-2"
                    onClick={handleGenerateText}
                    disabled={isGeneratingText}
                  >
                    {isGeneratingText ? (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-purple-500" />
                    )}
                    Melhorar com IA
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="group flex h-full flex-col items-center justify-start">
              <div className="sticky top-24 w-full">
                <div className="w-full max-w-sm">
                  <Tabs defaultValue="instagram">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="instagram">
                        <Instagram className="mr-2 h-4 w-4" />
                        Instagram
                      </TabsTrigger>
                      <TabsTrigger value="facebook">
                        <Facebook className="mr-2 h-4 w-4" />
                        Facebook
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="instagram" className="mt-4">
                      <InstagramPreview
                        mediaItems={mediaItems}
                        user={user}
                        text={text}
                        instagramConnection={instagramConnection}
                      />
                    </TabsContent>
                    <TabsContent value="facebook" className="mt-4">
                      <FacebookPreview
                        mediaItems={mediaItems}
                        user={user}
                        text={text}
                        metaConnection={metaConnection}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={isNextDisabled}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isUploading ? "Processando..." : "Próxima Etapa"}
              {!isUploading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </motion.div>
      )}

      {step === 3 && selectedType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2"
        >
          <div className="flex h-full flex-col items-center justify-start">
            <div className="sticky top-24 w-full">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Preview Final</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <FinalPreview
                    mediaItems={mediaItems}
                    user={user}
                    text={text}
                    metaConnection={metaConnection}
                    instagramConnection={instagramConnection}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Agendamento e Plataformas</CardTitle>
              <p className="text-sm text-gray-600">Escolha quando e onde publicar seu conteúdo.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="font-semibold">Onde Publicar?</Label>
                <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div
                    className={cn(
                      "flex items-center space-x-2 rounded-lg border p-4",
                      !metaConnection?.isConnected && "bg-gray-100 opacity-60"
                    )}
                  >
                    <Checkbox
                      id="platform-facebook"
                      checked={platforms.includes("facebook")}
                      onCheckedChange={() => handlePlatformChange("facebook")}
                      disabled={!metaConnection?.isConnected}
                    />
                    <Label
                      htmlFor="platform-facebook"
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <Facebook className="h-5 w-5 text-blue-600" />
                      Facebook
                    </Label>
                  </div>
                  <div
                    className={cn(
                      "flex items-center space-x-2 rounded-lg border p-4",
                      !instagramConnection?.isConnected && "bg-gray-100 opacity-60"
                    )}
                  >
                    <Checkbox
                      id="platform-instagram"
                      checked={platforms.includes("instagram")}
                      onCheckedChange={() => handlePlatformChange("instagram")}
                      disabled={!instagramConnection?.isConnected}
                    />
                    <Label
                      htmlFor="platform-instagram"
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <Instagram className="h-5 w-5 text-pink-500" />
                      Instagram
                    </Label>
                  </div>
                </div>
                {platforms.includes("facebook") && selectedType === "carousel" && (
                  <div className="mt-4 flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                    <Info className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>
                      Apenas a primeira imagem será postada no Facebook, pois a plataforma não
                      permite publicar carrosséis diretamente. No Instagram, o carrossel será
                      publicado normalmente.
                    </span>
                  </div>
                )}
              </div>
              <div>
                <Label className="font-semibold">Quando publicar?</Label>
                <RadioGroup
                  value={scheduleType}
                  onValueChange={(v) => setScheduleType(v as "now" | "schedule")}
                  className="mt-2 grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="now" id="now" className="peer sr-only" />
                    <Label
                      htmlFor="now"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 peer-data-[state=checked]:border-primary"
                    >
                      <Clock className="mb-2 h-6 w-6" />
                      Publicar Agora
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="schedule" id="schedule" className="peer sr-only" />
                    <Label
                      htmlFor="schedule"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 peer-data-[state=checked]:border-primary"
                    >
                      <CalendarIcon className="mb-2 h-6 w-6" />
                      Agendar
                    </Label>
                  </div>
                </RadioGroup>
                {scheduleType === "schedule" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full rounded-md border p-2"
                    />
                  </motion.div>
                )}
              </div>

              {/* Instagram Specific Features */}
              {platforms.includes("instagram") && (
                <div className="space-y-6 border-t pt-4">
                  {/* Collabs */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Dividir postagem com parceiro (Collab)</h4>
                    <p className="text-xs text-muted-foreground">A postagem também aparecerá no perfil desta pessoa se ela aceitar.</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {collaborators.map((username) => (
                        <div key={username} className="flex items-center gap-1 bg-pink-50 text-pink-700 border border-pink-200 px-2 py-1 rounded-full text-xs">
                          @{username}
                          <X className="h-3 w-3 cursor-pointer hover:text-pink-900" onClick={() => setCollaborators(collaborators.filter(c => c !== username))} />
                        </div>
                      ))}
                    </div>
                    <input 
                      type="text"
                      value={collaboratorsInput}
                      onChange={(e) => setCollaboratorsInput(e.target.value)}
                      onKeyDown={handleAddCollaborator}
                      placeholder="@usuario"
                      disabled={collaborators.length >= 3}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                    />
                  </div>

                  {/* User Tags */}
                  <div className="space-y-2 border-t pt-4">
                    <h4 className="font-semibold text-sm">Marcar na foto</h4>
                    <p className="text-xs text-muted-foreground">A pessoa apenas receberá uma notificação de que foi marcada.</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {userTags.map((tag) => (
                        <div key={tag.username} className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full text-xs">
                          @{tag.username}
                          <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => setUserTags(userTags.filter(t => t.username !== tag.username))} />
                        </div>
                      ))}
                    </div>
                    <input 
                      type="text"
                      value={userTagsInput}
                      onChange={(e) => setUserTagsInput(e.target.value)}
                      onKeyDown={handleAddUserTag}
                      placeholder="@usuario"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col items-stretch">
              <Button
                onClick={handleSubmit}
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                disabled={isSubmitDisabled}
              >
                {isPublishing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isPublishing
                  ? "Publicando..."
                  : scheduleType === "now"
                    ? "Publicar Post"
                    : "Agendar Post"}
              </Button>
              {!metaConnection?.isConnected && !instagramConnection?.isConnected && (
                <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-red-600">
                  <AlertTriangle className="h-4 w-4" /> Conecte suas contas na página de Conteúdo
                  para publicar.
                </p>
              )}
            </CardFooter>
          </Card>

          <div className="col-span-full mt-8 flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

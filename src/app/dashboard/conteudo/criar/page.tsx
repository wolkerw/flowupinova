"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Store,
  Linkedin,
  ChevronDown,
  Paintbrush,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ImageInpaintModal, type EditorLayer } from "../gerar/_components/ImageInpaintModal";
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
import { getGoogleConnection, type GoogleConnectionData } from "@/lib/services/google-service";
import {
  getLinkedInConnection,
  type LinkedInConnectionData,
} from "@/lib/services/linkedin-service";
import {
  getTikTokConnection,
  type TikTokConnectionData,
} from "@/lib/services/tiktok-service";
import { TikTokIcon } from "@/components/icons/tiktok-icon";
import {
  getOnboardingProfile,
  type OnboardingProfileData,
} from "@/lib/services/onboarding-service";
import {
  getBusinessProfile,
  type BusinessProfileData,
} from "@/lib/services/business-profile-service";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
type Platform = "instagram" | "facebook" | "google" | "linkedin" | "tiktok";

type MediaItem = {
  type: "image" | "video";
  file: File;
  previewUrl: string;
  publicUrl?: string;
  originalUrl?: string;
  editorLayers?: EditorLayer[];
};

const LogoOverlay = ({
  url,
  position,
  scale,
  opacity,
}: {
  url?: string | null;
  position?: LogoPosition;
  scale?: number;
  opacity?: number;
}) => {
  if (!url) return null;
  return (
    <img
      src={url}
      alt="Logo Preview"
      className={cn("pointer-events-none absolute z-10", {
        "left-4 top-4": position === "top-left",
        "left-1/2 top-4 -translate-x-1/2": position === "top-center",
        "right-4 top-4": position === "top-right",
        "left-4 top-1/2 -translate-y-1/2": position === "left-center",
        "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2": position === "center",
        "right-4 top-1/2 -translate-y-1/2": position === "right-center",
        "bottom-4 left-4": position === "bottom-left",
        "bottom-4 left-1/2 -translate-x-1/2": position === "bottom-center",
        "bottom-4 right-4": position === "bottom-right",
      })}
      style={{
        width: `${scale || 30}%`,
        opacity: (opacity || 100) / 100,
      }}
    />
  );
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
  {
    id: "story",
    title: "Story (9:16)",
    description: "Publique um Story vertical de imagem única.",
    icon: Video,
  },
];

const adaptImageToStory = (
  imageUrl: string,
  mode: "blur" | "crop" | "solid",
  brandKitPrimaryColor?: string,
  logoUrl?: string | null,
  logoPosition: LogoPosition = "bottom-right",
  logoScale: number = 30,
  logoOpacity: number = 80
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Não foi possível criar o contexto 2D do Canvas."));
      return;
    }

    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        if (mode === "blur") {
          // 1. Fundo Borrado (Ampliado e com blur)
          ctx.save();
          try {
            ctx.filter = "blur(30px) brightness(0.75)";
          } catch (e) {
            console.warn("ctx.filter não suportado neste navegador.", e);
          }
          const bgScale = 1920 / img.height;
          const bgWidth = img.width * bgScale;
          const bgX = (1080 - bgWidth) / 2;
          ctx.drawImage(img, bgX, 0, bgWidth, 1920);
          ctx.restore();

          // Filtro escurecedor extra caso o blur não tenha suporte
          ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
          ctx.fillRect(0, 0, 1080, 1920);

          // 2. Imagem Principal centralizada mantendo a proporção original
          const scale = Math.min(1080 / img.width, 1920 / img.height);
          const targetWidth = img.width * scale;
          const targetHeight = img.height * scale;
          const targetX = (1080 - targetWidth) / 2;
          const targetY = (1920 - targetHeight) / 2;
          ctx.drawImage(img, targetX, targetY, targetWidth, targetHeight);
        } else if (mode === "crop") {
          // Zoom e crop para cobrir toda a tela 9:16
          const bgScale = 1920 / img.height;
          const bgWidth = img.width * bgScale;
          const bgX = (1080 - bgWidth) / 2;
          ctx.drawImage(img, bgX, 0, bgWidth, 1920);
        } else {
          // Fundo Sólido (Cor primária do Brand Kit)
          ctx.fillStyle = brandKitPrimaryColor || "#000000";
          ctx.fillRect(0, 0, 1080, 1920);

          const scale = Math.min(1080 / img.width, 1920 / img.height);
          const targetWidth = img.width * scale;
          const targetHeight = img.height * scale;
          const targetX = (1080 - targetWidth) / 2;
          const targetY = (1920 - targetHeight) / 2;
          ctx.drawImage(img, targetX, targetY, targetWidth, targetHeight);
        }

        // 3. Aplicação do Logotipo
        if (logoUrl) {
          const logoImg = document.createElement("img");
          logoImg.crossOrigin = "anonymous";
          logoImg.onload = () => {
            try {
              const visualLogoScale = 5 + (logoScale - 10) * (45 / 90);
              const logoPixelWidth = 1080 * (visualLogoScale / 100);
              const logoAspectRatio = logoImg.height / logoImg.width;
              const logoPixelHeight = logoPixelWidth * logoAspectRatio;

              // Margem de 4% da largura (43px)
              const margin = 43;
              let x = 0;
              let y = 0;

              switch (logoPosition) {
                case "top-left":
                  x = margin;
                  y = margin;
                  break;
                case "top-center":
                  x = 1080 / 2 - logoPixelWidth / 2;
                  y = margin;
                  break;
                case "top-right":
                  x = 1080 - logoPixelWidth - margin;
                  y = margin;
                  break;
                case "left-center":
                  x = margin;
                  y = 1920 / 2 - logoPixelHeight / 2;
                  break;
                case "center":
                  x = 1080 / 2 - logoPixelWidth / 2;
                  y = 1920 / 2 - logoPixelHeight / 2;
                  break;
                case "right-center":
                  x = 1080 - logoPixelWidth - margin;
                  y = 1920 / 2 - logoPixelHeight / 2;
                  break;
                case "bottom-left":
                  x = margin;
                  y = 1920 - logoPixelHeight - margin;
                  break;
                case "bottom-center":
                  x = 1080 / 2 - logoPixelWidth / 2;
                  y = 1920 - logoPixelHeight - margin;
                  break;
                case "bottom-right":
                  x = 1080 - logoPixelWidth - margin;
                  y = 1920 - logoPixelHeight - margin;
                  break;
              }

              ctx.save();
              ctx.globalAlpha = logoOpacity / 100;
              ctx.drawImage(logoImg, x, y, logoPixelWidth, logoPixelHeight);
              ctx.restore();

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error("Falha ao exportar blob do canvas com logotipo."));
                  }
                },
                "image/jpeg",
                0.95
              );
            } catch (err) {
              console.error("Erro ao desenhar logotipo no canvas:", err);
              // Fallback se falhar
              canvas.toBlob(
                (blob) => {
                  if (blob) resolve(blob);
                  else reject(new Error("Falha ao exportar blob do canvas."));
                },
                "image/jpeg",
                0.95
              );
            }
          };
          logoImg.onerror = () => {
            console.error("Erro ao carregar imagem do logotipo no Canvas.");
            // Fallback sem logo se falhar ao carregar a imagem da logo
            canvas.toBlob(
              (blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Falha ao exportar blob do canvas."));
              },
              "image/jpeg",
              0.95
            );
          };
          const proxyLogoUrl =
            logoUrl.startsWith("blob:") || logoUrl.startsWith("data:") || logoUrl.startsWith("/")
              ? logoUrl
              : `/api/download?url=${encodeURIComponent(logoUrl)}`;
          logoImg.src = proxyLogoUrl;
        } else {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Falha ao exportar blob do canvas."));
              }
            },
            "image/jpeg",
            0.95
          );
        }
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      reject(new Error("Erro ao carregar a imagem original no Canvas."));
    };
    const proxyImageUrl =
      imageUrl.startsWith("blob:") || imageUrl.startsWith("data:") || imageUrl.startsWith("/")
        ? imageUrl
        : `/api/download?url=${encodeURIComponent(imageUrl)}`;
    img.src = proxyImageUrl;
  });
};

const InstagramPreview = ({
  mediaItems,
  user,
  text,
  instagramConnection,
  logoPreviewUrl,
  logoPosition,
  visualLogoScale,
  logoOpacity,
  contentType,
  storyAdaptationMode = "blur",
  brandKitPrimaryColor,
  isFinalPreview,
}: {
  mediaItems: MediaItem[];
  user: any;
  text: string;
  instagramConnection: InstagramConnectionData | null;
  logoPreviewUrl?: string | null;
  logoPosition?: LogoPosition;
  visualLogoScale?: number;
  logoOpacity?: number;
  contentType?: ContentType | null;
  storyAdaptationMode?: "blur" | "crop" | "solid";
  brandKitPrimaryColor?: string;
  isFinalPreview?: boolean;
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

  if (contentType === "story") {
    return (
      <div className="flex w-full flex-col items-center justify-center">
        <div className="relative aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-xl border border-gray-100 bg-black shadow-2xl">
          {/* Fundo de acordo com o modo de adaptação */}
          {currentMedia ? (
            <div className="absolute inset-0 z-0 h-full w-full">
              {storyAdaptationMode === "blur" && (
                <>
                  {/* Fundo Desfocado Ampliado */}
                  <div className="absolute inset-0 z-0 scale-125 overflow-hidden blur-xl brightness-75 filter">
                    {currentMedia.type === "video" ? (
                      <video
                        src={currentMedia.publicUrl || currentMedia.previewUrl}
                        className="absolute inset-0 h-full w-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <Image
                        src={currentMedia.publicUrl || currentMedia.previewUrl}
                        alt="Fundo Desfocado"
                        layout="fill"
                        objectFit="cover"
                        unoptimized
                      />
                    )}
                  </div>
                  {/* Imagem Principal Centralizada */}
                  <div className="absolute inset-0 z-10 h-full w-full">
                    {currentMedia.type === "video" ? (
                      <video
                        src={currentMedia.publicUrl || currentMedia.previewUrl}
                        className="absolute inset-0 h-full w-full object-contain"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <Image
                        src={currentMedia.publicUrl || currentMedia.previewUrl}
                        alt="Imagem Principal"
                        layout="fill"
                        objectFit="contain"
                        unoptimized
                      />
                    )}
                  </div>
                </>
              )}

              {storyAdaptationMode === "crop" && (
                currentMedia.type === "video" ? (
                  <video
                    src={currentMedia.publicUrl || currentMedia.previewUrl}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <Image
                    src={currentMedia.publicUrl || currentMedia.previewUrl}
                    alt="Imagem Cortada"
                    layout="fill"
                    objectFit="cover"
                    unoptimized
                  />
                )
              )}

              {storyAdaptationMode === "solid" && (
                <div
                  className="absolute inset-0 z-0 flex items-center justify-center"
                  style={{ backgroundColor: brandKitPrimaryColor || "#000000" }}
                >
                  <div className="relative h-full w-full">
                    {currentMedia.type === "video" ? (
                      <video
                        src={currentMedia.publicUrl || currentMedia.previewUrl}
                        className="absolute inset-0 h-full w-full object-contain"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <Image
                        src={currentMedia.publicUrl || currentMedia.previewUrl}
                        alt="Imagem Centralizada"
                        layout="fill"
                        objectFit="contain"
                        unoptimized
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-gray-500">
              <ImageIcon className="h-12 w-12 animate-pulse text-gray-700" />
              <span className="mt-2 text-xs font-semibold">Nenhuma mídia anexada</span>
            </div>
          )}

          {/* Overlay do logotipo da marca no preview */}
          {currentMedia && !isFinalPreview && (
            <LogoOverlay
              url={logoPreviewUrl}
              position={logoPosition}
              scale={visualLogoScale}
              opacity={logoOpacity}
            />
          )}

          {/* Story UI Overlay (Barras superiores, Perfil, Rodapé) */}
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between bg-gradient-to-b from-black/40 via-transparent to-black/30 p-3">
            {/* Top Area */}
            <div className="w-full space-y-2">
              {/* Barra de Progresso do Story */}
              <div className="flex w-full gap-1 px-0.5">
                <div className="h-0.5 flex-1 rounded bg-white/90"></div>
              </div>

              {/* Informações do Usuário */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-white/20 shadow-md">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback className="bg-pink-600 text-xs text-white">
                      {getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white drop-shadow">
                      {instagramConnection?.instagramUsername || "seu_usuario"}
                    </span>
                    <span className="text-[10px] text-white/80 drop-shadow">Patrocinado</span>
                  </div>
                </div>
                <MoreHorizontal className="h-4 w-4 text-white drop-shadow" />
              </div>
            </div>

            {/* Bottom Area (Instagram Stories Footer) */}
            <div className="flex w-full items-center gap-3 bg-transparent">
              <div className="flex-1 rounded-full border border-white/30 bg-black/20 px-4 py-2 backdrop-blur-sm">
                <span className="text-[11px] text-white/70">Enviar mensagem...</span>
              </div>
              <Heart className="h-5 w-5 cursor-pointer text-white drop-shadow" />
              <Send className="h-5 w-5 -rotate-12 cursor-pointer text-white drop-shadow" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-xs font-medium italic text-gray-500">
          Visualização simulada de Story no Instagram (9:16)
        </p>
      </div>
    );
  }

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
          currentMedia.type === "video" ? (
            <video
              src={currentMedia.publicUrl || currentMedia.previewUrl}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <Image
              src={currentMedia.publicUrl || currentMedia.previewUrl}
              alt="Preview"
              layout="fill"
              objectFit="cover"
              unoptimized
            />
          )
        ) : (
          <ImageIcon className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-gray-300" />
        )}
        {currentMedia && !isFinalPreview && (
          <LogoOverlay
            url={logoPreviewUrl}
            position={logoPosition}
            scale={visualLogoScale}
            opacity={logoOpacity}
          />
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
  logoPreviewUrl,
  logoPosition,
  visualLogoScale,
  logoOpacity,
  contentType,
  storyAdaptationMode = "blur",
  brandKitPrimaryColor,
  isFinalPreview,
}: {
  mediaItems: MediaItem[];
  user: any;
  text: string;
  metaConnection: MetaConnectionData | null;
  logoPreviewUrl?: string | null;
  logoPosition?: LogoPosition;
  visualLogoScale?: number;
  logoOpacity?: number;
  contentType?: ContentType | null;
  storyAdaptationMode?: "blur" | "crop" | "solid";
  brandKitPrimaryColor?: string;
  isFinalPreview?: boolean;
}) => {
  const getAvatarFallback = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (metaConnection?.pageName) return metaConnection.pageName.charAt(0).toUpperCase();
    return "P";
  };

  const singleItem = mediaItems.length > 0 ? mediaItems[0] : null;
  const isCarousel = mediaItems.length > 1;

  if (contentType === "story") {
    return (
      <div className="flex w-full flex-col items-center justify-center">
        <div className="relative aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-xl border border-gray-100 bg-black shadow-2xl">
          {/* Fundo de acordo com o modo de adaptação */}
          {singleItem ? (
            <div className="absolute inset-0 z-0 h-full w-full">
              {storyAdaptationMode === "blur" && (
                <>
                  {/* Fundo Desfocado Ampliado */}
                  <div className="absolute inset-0 z-0 scale-125 overflow-hidden blur-xl brightness-75 filter">
                    {singleItem.type === "video" ? (
                      <video
                        src={singleItem.publicUrl || singleItem.previewUrl}
                        className="absolute inset-0 h-full w-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <Image
                        src={singleItem.publicUrl || singleItem.previewUrl}
                        alt="Fundo Desfocado"
                        layout="fill"
                        objectFit="cover"
                        unoptimized
                      />
                    )}
                  </div>
                  {/* Imagem Centralizada Quadrada */}
                  <div className="absolute inset-x-0 top-1/2 z-10 aspect-square -translate-y-1/2">
                    {singleItem.type === "video" ? (
                      <video
                        src={singleItem.publicUrl || singleItem.previewUrl}
                        className="absolute inset-0 h-full w-full object-contain"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <Image
                        src={singleItem.publicUrl || singleItem.previewUrl}
                        alt="Imagem Principal"
                        layout="fill"
                        objectFit="contain"
                        unoptimized
                      />
                    )}
                  </div>
                </>
              )}

              {storyAdaptationMode === "crop" && (
                singleItem.type === "video" ? (
                  <video
                    src={singleItem.publicUrl || singleItem.previewUrl}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <Image
                    src={singleItem.publicUrl || singleItem.previewUrl}
                    alt="Imagem Cortada"
                    layout="fill"
                    objectFit="cover"
                    unoptimized
                  />
                )
              )}

              {storyAdaptationMode === "solid" && (
                <div
                  className="absolute inset-0 z-0 flex items-center justify-center"
                  style={{ backgroundColor: brandKitPrimaryColor || "#000000" }}
                >
                  <div className="relative aspect-square w-full">
                    {singleItem.type === "video" ? (
                      <video
                        src={singleItem.publicUrl || singleItem.previewUrl}
                        className="absolute inset-0 h-full w-full object-contain"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <Image
                        src={singleItem.publicUrl || singleItem.previewUrl}
                        alt="Imagem Centralizada"
                        layout="fill"
                        objectFit="contain"
                        unoptimized
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-gray-500">
              <ImageIcon className="h-12 w-12 animate-pulse text-gray-700" />
              <span className="mt-2 text-xs font-semibold">Nenhuma mídia anexada</span>
            </div>
          )}

          {/* Overlay do logotipo da marca no preview */}
          {singleItem && !isFinalPreview && (
            <LogoOverlay
              url={logoPreviewUrl}
              position={logoPosition}
              scale={visualLogoScale}
              opacity={logoOpacity}
            />
          )}

          {/* Story UI Overlay (Facebook Stories Style) */}
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between bg-gradient-to-b from-black/40 via-transparent to-black/30 p-3">
            {/* Top Area */}
            <div className="w-full space-y-2">
              {/* Barra de Progresso do Story */}
              <div className="flex w-full gap-1 px-0.5">
                <div className="h-0.5 flex-1 rounded bg-white/90"></div>
              </div>

              {/* Informações do Usuário */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-white/20 shadow-md">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback className="bg-blue-600 text-xs text-white">
                      {getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white drop-shadow">
                      {metaConnection?.pageName || "Sua Página"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-white/80 drop-shadow">
                      Agora mesmo · <Globe className="inline h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>
                <X className="h-4 w-4 text-white drop-shadow" />
              </div>
            </div>

            {/* Bottom Area (Facebook Stories Footer) */}
            <div className="flex w-full items-center justify-between bg-transparent pt-4">
              <div className="mr-4 flex-1 rounded-full border border-white/30 bg-black/30 px-3 py-1.5 backdrop-blur-sm">
                <span className="text-[10px] text-white/70">Responder...</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-blue-600 shadow">
                  <ThumbsUp className="h-3.5 w-3.5 fill-white text-white" />
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-red-500 shadow">
                  <Heart className="h-3.5 w-3.5 fill-white text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-xs font-medium italic text-gray-500">
          Visualização simulada de Story no Facebook (9:16)
        </p>
      </div>
    );
  }

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
          singleItem.type === "video" ? (
            <video
              src={singleItem.publicUrl || singleItem.previewUrl}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <Image
              src={singleItem.publicUrl || singleItem.previewUrl}
              alt="Preview"
              layout="fill"
              objectFit="cover"
              unoptimized
            />
          )
        ) : (
          <ImageIcon className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-gray-300" />
        )}
        {singleItem && !isFinalPreview && (
          <LogoOverlay
            url={logoPreviewUrl}
            position={logoPosition}
            scale={visualLogoScale}
            opacity={logoOpacity}
          />
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

const GooglePreview = ({
  mediaItems,
  user,
  text,
  googleConnection,
  businessProfile,
  gmbProfile = null,
  logoPreviewUrl,
  logoPosition,
  visualLogoScale,
  logoOpacity,
  contentType,
  brandKitPrimaryColor,
  isFinalPreview,
}: {
  mediaItems: MediaItem[];
  user: any;
  text: string;
  googleConnection: GoogleConnectionData | null;
  businessProfile: OnboardingProfileData | null;
  gmbProfile?: BusinessProfileData | null;
  logoPreviewUrl?: string | null;
  logoPosition?: LogoPosition;
  visualLogoScale?: number;
  logoOpacity?: number;
  contentType?: ContentType | null;
  brandKitPrimaryColor?: string;
  isFinalPreview?: boolean;
}) => {
  const getAvatarFallback = () => {
    if (gmbProfile?.name) return gmbProfile.name.charAt(0).toUpperCase();
    if (businessProfile?.name) return businessProfile.name.charAt(0).toUpperCase();
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    return "G";
  };

  const singleItem = mediaItems.length > 0 ? mediaItems[0] : null;
  const isCarousel = mediaItems.length > 1;

  const businessName = gmbProfile?.name || businessProfile?.name || "Minha Empresa";
  const avatarUrl =
    gmbProfile?.logo?.url || businessProfile?.logo?.url || user?.photoURL || undefined;

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {isCarousel && (
        <div className="flex items-start gap-2 border-b bg-yellow-50 p-3 text-sm text-yellow-800">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            Apenas a primeira imagem será postada no Google Meu Negócio, pois a plataforma não
            permite publicar carrosséis diretamente.
          </span>
        </div>
      )}

      {(contentType === "story" || contentType === "reels") && (
        <div className="flex items-start gap-2 border-b bg-blue-50 p-3 text-sm text-blue-800">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <span>
            O formato {contentType === "story" ? "Story" : "Reels"} será publicado como uma
            atualização padrão (post) no Google Meu Negócio.
          </span>
        </div>
      )}

      {/* Google Maps / Search Style Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 border border-gray-100">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-blue-600 font-bold text-white">
                {getAvatarFallback()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1.5 -right-1.5 rounded-full bg-white p-0.5 shadow-sm">
              <svg className="h-4 w-4 text-[#1a73e8]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.7 3.1 5.51l.34 3.69L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="pb-0.5 text-sm font-medium leading-none text-gray-900">
                {businessName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-xs text-gray-500">há 2 minutos</p>
            </div>
          </div>
        </div>
        <MoreVertical className="h-5 w-5 cursor-pointer text-gray-500" />
      </div>

      {/* Image Container with black background letterboxing */}
      <div className="relative flex aspect-[4/3] w-full items-center justify-center border-y border-gray-100 bg-black">
        {singleItem ? (
          singleItem.type === "video" ? (
            <video
              src={singleItem.publicUrl || singleItem.previewUrl}
              className="absolute inset-0 h-full w-full object-contain"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <Image
              src={singleItem.publicUrl || singleItem.previewUrl}
              alt="Preview Google"
              layout="fill"
              objectFit="contain"
              unoptimized
            />
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <ImageIcon className="mb-2 h-12 w-12 text-gray-300" />
            <span className="text-xs">Nenhuma imagem anexada</span>
          </div>
        )}
        {singleItem && !isFinalPreview && (
          <LogoOverlay
            url={logoPreviewUrl}
            position={logoPosition}
            scale={visualLogoScale}
            opacity={logoOpacity}
          />
        )}
      </div>

      {/* Caption text below image */}
      <div className="px-4 pb-4 pt-3 text-sm leading-relaxed text-gray-800">
        <p className="whitespace-pre-wrap">{text || "legenda"}</p>
      </div>
    </div>
  );
};

const LinkedInPreview = ({
  mediaItems,
  user,
  text,
  linkedinConnection,
  logoPreviewUrl,
  logoPosition,
  visualLogoScale,
  logoOpacity,
  isFinalPreview,
}: {
  mediaItems: MediaItem[];
  user: any;
  text: string;
  linkedinConnection: LinkedInConnectionData | null;
  logoPreviewUrl?: string | null;
  logoPosition?: LogoPosition;
  visualLogoScale?: number;
  logoOpacity?: number;
  isFinalPreview?: boolean;
}) => {
  const getAvatarFallback = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (
      linkedinConnection?.publishTarget === "organization" &&
      linkedinConnection?.selectedOrganizationName
    ) {
      return linkedinConnection.selectedOrganizationName.charAt(0).toUpperCase();
    }
    if (linkedinConnection?.personName)
      return linkedinConnection.personName.charAt(0).toUpperCase();
    return "L";
  };

  const getDisplayName = () => {
    if (
      linkedinConnection?.publishTarget === "organization" &&
      linkedinConnection?.selectedOrganizationName
    ) {
      return linkedinConnection.selectedOrganizationName;
    }
    return linkedinConnection?.personName || user?.displayName || "Seu Nome (LinkedIn)";
  };

  const singleItem = mediaItems.length > 0 ? mediaItems[0] : null;

  return (
    <div className="flex w-full flex-col rounded-md border bg-white shadow-lg">
      <div className="flex items-start justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="block cursor-pointer text-sm font-bold text-gray-800 hover:text-blue-700 hover:underline">
              {getDisplayName()}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <span>Agora mesmo</span>
              <span>·</span>
              <Globe className="h-3 w-3" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <MoreHorizontal className="h-5 w-5 cursor-pointer hover:text-gray-700" />
          <X className="h-5 w-5 cursor-pointer hover:text-gray-700" />
        </div>
      </div>
      <div className="px-3 pb-2 text-sm text-gray-800">
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
      <div className="relative aspect-square bg-gray-200">
        {singleItem ? (
          singleItem.type === "video" ? (
            <video
              src={singleItem.publicUrl || singleItem.previewUrl}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <Image
              src={singleItem.publicUrl || singleItem.previewUrl}
              alt="Preview"
              layout="fill"
              objectFit="cover"
              unoptimized
            />
          )
        ) : (
          <ImageIcon className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-gray-300" />
        )}
        {singleItem && !isFinalPreview && (
          <LogoOverlay
            url={logoPreviewUrl}
            position={logoPosition}
            scale={visualLogoScale}
            opacity={logoOpacity}
          />
        )}
      </div>
      <div className="flex items-center gap-6 border-t p-3 text-gray-500">
        <div className="flex cursor-pointer items-center gap-1">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className="text-[10px]">{getAvatarFallback()}</AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3 w-3 text-gray-500" />
        </div>
        <button className="flex items-center justify-center rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100">
          <ThumbsUp className="h-5 w-5" />
        </button>
        <button className="flex items-center justify-center rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100">
          <MessageCircle className="h-5 w-5" />
        </button>
        <button className="flex items-center justify-center rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100">
          <Repeat className="h-5 w-5" />
        </button>
        <button className="flex items-center justify-center rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100">
          <Send className="h-5 w-5" />
        </button>
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
  googleConnection,
  linkedinConnection,
  businessProfile,
  gmbProfile = null,
  contentType,
  storyAdaptationMode,
  brandKitPrimaryColor,
  logoPreviewUrl,
  logoPosition,
  visualLogoScale,
  logoOpacity,
}: {
  mediaItems: MediaItem[];
  user: any;
  text: string;
  metaConnection: MetaConnectionData | null;
  instagramConnection: InstagramConnectionData | null;
  googleConnection: GoogleConnectionData | null;
  linkedinConnection: LinkedInConnectionData | null;
  businessProfile: OnboardingProfileData | null;
  gmbProfile?: BusinessProfileData | null;
  contentType?: ContentType | null;
  storyAdaptationMode?: "blur" | "crop" | "solid";
  brandKitPrimaryColor?: string;
  logoPreviewUrl?: string | null;
  logoPosition?: LogoPosition;
  visualLogoScale?: number;
  logoOpacity?: number;
}) => {
  return (
    <div className="w-full max-w-sm">
      <Tabs defaultValue="instagram">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="instagram" className="px-1 text-xs">
            <Instagram className="mr-1 h-3.5 w-3.5" />
            Instagram
          </TabsTrigger>
          <TabsTrigger value="facebook" className="px-1 text-xs">
            <Facebook className="mr-1 h-3.5 w-3.5" />
            Facebook
          </TabsTrigger>
          <TabsTrigger value="google" className="px-1 text-xs">
            <Store className="mr-1 h-3.5 w-3.5" />
            Google
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="px-1 text-xs">
            <Linkedin className="mr-1 h-3.5 w-3.5" />
            LinkedIn
          </TabsTrigger>
        </TabsList>
        <TabsContent value="instagram" className="mt-4">
          <InstagramPreview
            mediaItems={mediaItems}
            user={user}
            text={text}
            instagramConnection={instagramConnection}
            logoPreviewUrl={logoPreviewUrl}
            logoPosition={logoPosition}
            visualLogoScale={visualLogoScale}
            logoOpacity={logoOpacity}
            contentType={contentType}
            storyAdaptationMode={storyAdaptationMode}
            brandKitPrimaryColor={brandKitPrimaryColor}
            isFinalPreview={true}
          />
        </TabsContent>
        <TabsContent value="facebook" className="mt-4">
          <FacebookPreview
            mediaItems={mediaItems}
            user={user}
            text={text}
            metaConnection={metaConnection}
            logoPreviewUrl={logoPreviewUrl}
            logoPosition={logoPosition}
            visualLogoScale={visualLogoScale}
            logoOpacity={logoOpacity}
            contentType={contentType}
            storyAdaptationMode={storyAdaptationMode}
            brandKitPrimaryColor={brandKitPrimaryColor}
            isFinalPreview={true}
          />
        </TabsContent>
        <TabsContent value="google" className="mt-4">
          <GooglePreview
            mediaItems={mediaItems}
            user={user}
            text={text}
            googleConnection={googleConnection}
            businessProfile={businessProfile}
            gmbProfile={gmbProfile}
            logoPreviewUrl={logoPreviewUrl}
            logoPosition={logoPosition}
            visualLogoScale={visualLogoScale}
            logoOpacity={logoOpacity}
            contentType={contentType}
            brandKitPrimaryColor={brandKitPrimaryColor}
            isFinalPreview={true}
          />
        </TabsContent>
        <TabsContent value="linkedin" className="mt-4">
          <LinkedInPreview
            mediaItems={mediaItems}
            user={user}
            text={text}
            linkedinConnection={linkedinConnection}
            logoPreviewUrl={logoPreviewUrl}
            logoPosition={logoPosition}
            visualLogoScale={visualLogoScale}
            logoOpacity={logoOpacity}
            isFinalPreview={true}
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
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const [collaboratorsInput, setCollaboratorsInput] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>([]);

  const [userTagsInput, setUserTagsInput] = useState("");
  const [userTags, setUserTags] = useState<{ username: string; x: number; y: number }[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("bottom-right");
  const [logoScale, setLogoScale] = useState(30);
  const [logoOpacity, setLogoOpacity] = useState(80);

  const [businessProfile, setBusinessProfile] = useState<OnboardingProfileData | null>(null);
  const [storyAdaptationMode, setStoryAdaptationMode] = useState<"blur" | "crop" | "solid">("blur");
  const [originalStoryMedia, setOriginalStoryMedia] = useState<MediaItem | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);
  const [instagramConnection, setInstagramConnection] = useState<InstagramConnectionData | null>(
    null
  );
  const [googleConnection, setGoogleConnection] = useState<GoogleConnectionData | null>(null);
  const [linkedinConnection, setLinkedinConnection] = useState<LinkedInConnectionData | null>(null);
  const [tiktokConnection, setTiktokConnection] = useState<TikTokConnectionData | null>(null);
  const [gmbProfile, setGmbProfile] = useState<BusinessProfileData | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const visualLogoScale = 5 + (logoScale - 10) * (45 / 90);

  // Sincronizar referências para evitar revogação precoce de blobs durante re-renderizações do Wizard
  const mediaItemsRef = useRef(mediaItems);
  useEffect(() => {
    mediaItemsRef.current = mediaItems;
  }, [mediaItems]);

  const logoPreviewUrlRef = useRef(logoPreviewUrl);
  useEffect(() => {
    logoPreviewUrlRef.current = logoPreviewUrl;
  }, [logoPreviewUrl]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getMetaConnection(user.uid),
      getInstagramConnection(user.uid),
      getGoogleConnection(user.uid),
      getLinkedInConnection(user.uid),
      getTikTokConnection(user.uid),
      getOnboardingProfile(user.uid),
      getBusinessProfile(user.uid),
    ]).then(([metaConn, instaConn, googleConn, linkedinConn, tiktokConn, profile, gmbProf]) => {
      setMetaConnection(metaConn);
      setInstagramConnection(instaConn);
      setGoogleConnection(googleConn);
      setLinkedinConnection(linkedinConn);
      setTiktokConnection(tiktokConn);
      setBusinessProfile(profile);
      setGmbProfile(gmbProf);

      const initialPlatforms: Platform[] = [];
      if (metaConn?.isConnected) initialPlatforms.push("facebook");
      if (instaConn?.isConnected) initialPlatforms.push("instagram");
      if (googleConn?.isConnected) initialPlatforms.push("google");
      if (linkedinConn?.isConnected) initialPlatforms.push("linkedin");
      if (tiktokConn?.isConnected) initialPlatforms.push("tiktok");
      setPlatforms(initialPlatforms);

      // Carregar automaticamente a logomarca do Brand Kit se existir e nenhuma estiver selecionada
      if (profile?.logo?.url && !logoPreviewUrlRef.current) {
        setLogoPreviewUrl(profile.logo.url);

        const logoUrlToFetch = profile.logo.url.startsWith("http")
          ? `/api/conteudo/gerar-referencia?action=proxy&url=${encodeURIComponent(profile.logo.url)}`
          : profile.logo.url;

        // Converter a URL/Base64 do logotipo do Brand Kit de volta para File
        fetch(logoUrlToFetch)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.blob();
          })
          .then((blob) => {
            const file = new File([blob], "logo-brandkit.png", { type: blob.type || "image/png" });
            setLogoFile(file);
          })
          .catch((err) => {
            console.warn(
              "Aviso: Não foi possível carregar a logo do Brand Kit como File (CORS/Rede), usando apenas URL de visualização:",
              err.message || err
            );
          });
      }
    });
  }, [user]);

  // Interfaces e estados da galeria pessoal do lojista
  interface GalleryMediaItem {
    id: string;
    url: string;
    storagePath: string;
    source: string;
    prompt: string | null;
    createdAt: any;
    usedInPostId: string | null;
    fileName: string;
    caption?: string | null;
  }
  const [galleryImages, setGalleryImages] = useState<GalleryMediaItem[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);

  // Estados para correção localizada de escrita (Inpainting) do Post Manual
  const [manualPostId] = useState(() => "manual_" + Math.random().toString(36).substring(2, 15));
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [activeImageToCorrect, setActiveImageToCorrect] = useState<string | null>(null);
  const [activeIndexToCorrect, setActiveIndexToCorrect] = useState<number>(-1);

  // Buscar imagens livres da galeria no Firestore
  const fetchGalleryImages = async () => {
    if (!user) return;
    setIsGalleryLoading(true);
    try {
      const galleryRef = collection(db, "users", user.uid, "mediaGallery");
      const q = query(galleryRef, where("usedInPostId", "==", null));
      const querySnapshot = await getDocs(q);
      const items: GalleryMediaItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          url: data.url,
          storagePath: data.storagePath,
          source: data.source || "wizard_generation",
          prompt: data.prompt || null,
          createdAt: data.createdAt,
          usedInPostId: data.usedInPostId || null,
          fileName: data.fileName || "imagem.jpg",
          caption: data.caption || null,
        });
      });

      // Ordenar em memória para evitar a necessidade de criar um índice composto no Firestore
      items.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
        return dateB - dateA;
      });

      setGalleryImages(items);
    } catch (e) {
      console.error("Erro ao buscar imagens da galeria no manual:", e);
      toast({
        variant: "destructive",
        title: "Erro ao buscar galeria",
        description: "Não foi possível carregar as imagens do seu acervo.",
      });
    } finally {
      setIsGalleryLoading(false);
    }
  };

  // Recarregar galeria ao abrir o modal
  useEffect(() => {
    if (isGalleryOpen) {
      fetchGalleryImages();
    }
  }, [isGalleryOpen]);

  // Carregar imagem pré-selecionada da galeria na inicialização se redirecionado
  useEffect(() => {
    try {
      const storedImage = sessionStorage.getItem("preloaded_gallery_image");
      if (storedImage) {
        const item = JSON.parse(storedImage);

        const newMediaItem: MediaItem = {
          file: new File([], item.storagePath.split("/").pop() || "imagem.jpg"),
          previewUrl: item.url,
          publicUrl: item.url,
          type: "image",
        };

        setMediaItems([newMediaItem]);
        setSelectedType("single_post");
        setStep(2);

        if (item.caption) {
          setText(item.caption);
        }

        sessionStorage.removeItem("preloaded_gallery_image");

        toast({
          variant: "success",
          title: "Imagem Importada!",
          description: "Imagem do seu acervo de IA carregada com sucesso na sua área de trabalho.",
        });
      }
    } catch (e) {
      console.error("Erro ao carregar imagem da galeria na inicialização:", e);
    }
  }, [toast]);

  const handleImportFromGallery = (item: GalleryMediaItem) => {
    const newMediaItem: MediaItem = {
      file: new File([], item.storagePath.split("/").pop() || "imagem.jpg"),
      previewUrl: item.url,
      publicUrl: item.url,
      type: "image",
    };

    if (selectedType === "carousel") {
      if (mediaItems.length >= 10) {
        toast({
          variant: "destructive",
          title: "Limite excedido",
          description: "Você pode adicionar no máximo 10 mídias a um carrossel.",
        });
        return;
      }
      setMediaItems((prev) => [...prev, newMediaItem]);
    } else {
      setMediaItems([newMediaItem]);
    }

    if (item.caption) {
      setText(item.caption);
    }

    setIsGalleryOpen(false);
    toast({
      variant: "success",
      title: "Imagem Importada!",
      description: "Imagem da galeria adicionada ao post com sucesso.",
    });
  };

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

    const isUrl = (url: string) => url && (url.startsWith("http://") || url.startsWith("https://"));
    const imageUrl =
      mediaItem.publicUrl || (isUrl(mediaItem.previewUrl) ? mediaItem.previewUrl : "");

    // Se não há logotipo e a imagem já possui URL remota, retornamos ela de imediato
    if (!logoFile && imageUrl) {
      console.log(
        "[MANUAL_GALLERY] Imagem sem logo com URL remota existente: pulando webhook e usando URL direta."
      );
      return imageUrl;
    }

    let imageFile = mediaItem.file;

    // Se veio da galeria ou inpainting (nulo ou sem tamanho, mas com URL) e precisa aplicar logo, baixamos os bytes de volta usando o proxy
    if ((!imageFile || imageFile.size === 0) && imageUrl && logoFile) {
      try {
        const proxyUrl = `/api/download?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Erro na resposta do proxy: ${response.status}`);
        }
        const blob = await response.blob();
        const name = (mediaItem.file && mediaItem.file.name) || "gallery-image.jpg";
        imageFile = new File([blob], name, {
          type: blob.type || "image/jpeg",
        });
      } catch (e) {
        console.error("Erro ao baixar imagem remota para aplicar logo:", e);
        throw new Error("Não foi possível processar o logotipo nesta imagem da galeria.");
      }
    }

    if (!imageFile) {
      throw new Error("Arquivo de imagem inválido para processamento.");
    }

    const formData = new FormData();
    formData.append("file", imageFile);

    let webhookUrl = "";

    if (logoFile) {
      // Usar proxy interno com fallback resiliente em vez de chamar webhook externo diretamente
      webhookUrl = "/api/proxy-webhook?target=post_manual";
      const { width: mainImageWidth, height: mainImageHeight } =
        await getImageDimensions(imageFile);

      // Obter proporções reais da logomarca para evitar deformações ou posicionamento incorreto
      const { width: logoOrigWidth, height: logoOrigHeight } = await getImageDimensions(logoFile);
      const logoAspectRatio = logoOrigHeight / logoOrigWidth;

      formData.append("logo", logoFile);
      formData.append("logoScale", logoScale.toString());
      formData.append("logoOpacity", logoOpacity.toString());

      const logoPixelWidth = mainImageWidth * (visualLogoScale / 100);
      const logoPixelHeight = logoPixelWidth * logoAspectRatio; // Altura real e proporcional da logo

      let positionX = 0,
        positionY = 0;

      // Margem proporcional à largura da imagem real (16px relativos aos 400px de largura do preview da interface)
      const margin = mainImageWidth * (16 / 400);

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
          positionY = mainImageHeight / 2 - logoPixelHeight / 2;
          break;
        case "center":
          positionX = mainImageWidth / 2 - logoPixelWidth / 2;
          positionY = mainImageHeight / 2 - logoPixelHeight / 2;
          break;
        case "right-center":
          positionX = mainImageWidth - logoPixelWidth - margin;
          positionY = mainImageHeight / 2 - logoPixelHeight / 2;
          break;
        case "bottom-left":
          positionX = margin;
          positionY = mainImageHeight - logoPixelHeight - margin;
          break;
        case "bottom-center":
          positionX = mainImageWidth / 2 - logoPixelWidth / 2;
          positionY = mainImageHeight - logoPixelHeight - margin;
          break;
        case "bottom-right":
          positionX = mainImageWidth - logoPixelWidth - margin;
          positionY = mainImageHeight - logoPixelHeight - margin;
          break;
      }

      formData.append("positionX", Math.round(positionX).toString());
      formData.append("positionY", Math.round(positionY).toString());
    } else {
      // Usar proxy interno com fallback resiliente em vez de chamar webhook externo diretamente
      webhookUrl = "/api/proxy-webhook?target=imagem_sem_logo";
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
    if (e.key === "Enter") {
      e.preventDefault();
      const val = collaboratorsInput.trim().replace("@", "");
      if (val && collaborators.length < 3 && !collaborators.includes(val)) {
        setCollaborators([...collaborators, val]);
      }
      setCollaboratorsInput("");
    }
  };

  const handleAddUserTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = userTagsInput.trim().replace("@", "");
      if (val && !userTags.some((t) => t.username === val)) {
        setUserTags([...userTags, { username: val, x: 0.5, y: 0.5 }]);
      }
      setUserTagsInput("");
    }
  };

  const handleNextStep = async () => {
    if (step === 2 && mediaItems.length > 0) {
      setIsUploading(true);

      if (selectedType === "story") {
        toast({
          title: "Processando Story...",
          description: "Renderizando e adaptando a imagem localmente para proporção 9:16 vertical.",
        });

        try {
          const item = mediaItems[0];
          if (item.type === "image") {
            // Fazer backup da mídia original quadrada 1:1
            setOriginalStoryMedia(item);

            const primaryColor =
              businessProfile?.brandKit?.primaryColor || businessProfile?.primaryColor || "#000000";
            const imageUrlToProcess = item.publicUrl || item.previewUrl;

            const blob = await adaptImageToStory(
              imageUrlToProcess,
              storyAdaptationMode,
              primaryColor,
              logoPreviewUrl,
              logoPosition,
              logoScale,
              logoOpacity
            );

            const fileName = item.file?.name || "adapted_story.jpg";
            const adaptedFile = new File([blob], fileName, {
              type: "image/jpeg",
            });
            const adaptedUrl = URL.createObjectURL(blob);

            setMediaItems([
              {
                type: "image",
                file: adaptedFile,
                previewUrl: adaptedUrl,
                publicUrl: adaptedUrl,
              },
            ]);
          }

          toast({
            variant: "success",
            title: "Story Adaptado!",
            description: "A imagem foi redimensionada e ajustada com sucesso para Story.",
          });
          setStep(3);
        } catch (error: any) {
          console.error("Erro ao adaptar Story localmente:", error);
          toast({
            variant: "destructive",
            title: "Erro ao Adaptar Story",
            description: error.message || "Ocorreu um erro ao processar a imagem do Story.",
          });
        } finally {
          setIsUploading(false);
        }
        return;
      }

      // Fluxo normal de Posts / Carrosséis (chama webhook)
      toast({
        title: `Processando ${mediaItems.length} mídia(s)...`,
        description: "Aplicando edições e enviando para o webhook.",
      });

      try {
        const uploadPromises = mediaItems.map((item) => {
          if (item.type === "image") {
            return processSingleMediaItem(item);
          }
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

  const handleBackToStep2 = () => {
    if (selectedType === "story" && originalStoryMedia) {
      // Cleanup do blob de Story adaptado criado temporariamente
      if (mediaItems[0]?.previewUrl && mediaItems[0].previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(mediaItems[0].previewUrl);
      }
      setMediaItems([originalStoryMedia]);
      setOriginalStoryMedia(null);
      setStep(2);
      return;
    }

    // Limpa a URL pública pós-mesclagem para reexibir a imagem limpa com a logo móvel interativa
    setMediaItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        publicUrl: undefined,
      }))
    );
    setStep(2);
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

  const handleGenerateText = async () => {
    if (!text.trim()) {
      toast({
        title: "Texto vazio",
        description: "Escreva algo primeiro para a IA poder melhorar.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingText(true);
    try {
      const response = await fetch("/api/conteudo/melhorar-texto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textoOriginal: text }),
      });

      if (!response.ok) {
        throw new Error("Falha ao comunicar com a IA.");
      }

      const data = await response.json();
      if (data.textoMelhorado) {
        setText(data.textoMelhorado);
      } else {
        throw new Error("Texto não retornado.");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro na IA",
        description: "Não foi possível melhorar o texto no momento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingText(false);
    }
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

    if (platforms.includes("google") && !text.trim()) {
      toast({
        variant: "destructive",
        title: "Texto Obrigatório",
        description: "O texto da publicação é obrigatório para publicar no Google Meu Negócio.",
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
    if (platforms.includes("google") && googleConnection?.isConnected) {
      postInput.googleConnection = googleConnection;
    }
    if (platforms.includes("linkedin") && linkedinConnection?.isConnected) {
      postInput.linkedinConnection = linkedinConnection;
    }

    const result = await schedulePost(user.uid, postInput);

    setIsPublishing(false);

    if (result.success) {
      toast({
        title: "Publicação realizada com sucesso!",
        description:
          scheduleType === "now"
            ? "Seu post foi enviado para as redes sociais."
            : "Seu post foi agendado com sucesso.",
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
    (platforms.includes("linkedin") && !linkedinConnection?.isConnected) ||
    (scheduleType === "schedule" && !scheduleDate);

  // Cleanup de URLs de blob executado estritamente na desmontagem real da página
  useEffect(() => {
    return () => {
      mediaItemsRef.current.forEach((item) => {
        if (item.previewUrl && item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      if (logoPreviewUrlRef.current && logoPreviewUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreviewUrlRef.current);
      }
    };
  }, []);

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
                        <div key={index} className="flex flex-col gap-2">
                          <div className="group relative aspect-square">
                            {item.type === "video" ? (
                              <video
                                src={item.previewUrl}
                                className="h-full w-full rounded-md object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                              />
                            ) : (
                              <Image
                                src={item.previewUrl}
                                alt={`Preview ${index}`}
                                layout="fill"
                                objectFit="cover"
                                className="rounded-md"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="absolute right-1 top-1 rounded-full bg-red-600 p-1.5 text-white shadow-md transition-colors hover:bg-red-500"
                              title="Remover imagem"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {item.type === "image" && (
                            <Button
                              variant="outline"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageToCorrect(item.previewUrl);
                                setActiveIndexToCorrect(index);
                                setIsCorrectionOpen(true);
                              }}
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg border-primary/40 py-1.5 px-2 text-xs font-medium text-slate-800 transition-all hover:border-primary hover:bg-primary/5 h-auto"
                            >
                              <Paintbrush className="h-3.5 w-3.5 text-primary" />
                              <span className="truncate">Editar Textos</span>
                            </Button>
                          )}
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

                  {/* Botão e Dialog Premium para Importar da Galeria NumVapt */}
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex w-full items-center justify-center gap-2 border-dashed border-blue-300 bg-blue-50/30 font-semibold text-blue-700 transition-all hover:border-blue-400 hover:bg-blue-50"
                      onClick={() => setIsGalleryOpen(true)}
                      disabled={isUploading}
                    >
                      <Sparkles className="h-4 w-4 animate-pulse text-blue-500" />
                      Importar da Galeria NumVapt
                    </Button>
                  </div>

                  <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                    <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto bg-white">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 border-b pb-3 text-xl font-bold text-gray-900">
                          <Sparkles className="h-6 w-6 text-blue-500" />
                          Minha Galeria NumVapt (Mídias Livres)
                        </DialogTitle>
                      </DialogHeader>

                      {isGalleryLoading ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                          <p className="text-sm font-medium text-gray-500">
                            Carregando acervo livre de imagens...
                          </p>
                        </div>
                      ) : galleryImages.length === 0 ? (
                        <div className="flex h-48 flex-col items-center justify-center gap-2 py-6 text-center">
                          <ImageIcon className="h-10 w-10 text-gray-400" />
                          <p className="text-sm font-semibold text-gray-900">
                            Nenhuma imagem disponível na sua galeria
                          </p>
                          <p className="max-w-sm text-xs text-gray-500">
                            Todas as imagens geradas por IA já foram publicadas ou seu acervo está
                            vazio. Gere novos posts com o assistente inteligente para alimentar sua
                            galeria!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xs font-medium text-gray-500">
                            Selecione uma imagem do seu acervo para importá-la instantaneamente.
                            Essas mídias não gastarão novas cotas de geração!
                          </p>
                          <div className="grid grid-cols-2 gap-4 py-2 sm:grid-cols-3">
                            {galleryImages.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => handleImportFromGallery(item)}
                                className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md"
                              >
                                <Image
                                  src={item.url}
                                  alt="Imagem da Galeria"
                                  layout="fill"
                                  objectFit="cover"
                                  unoptimized
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                  <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-800 shadow-md">
                                    Selecionar Imagem
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>

                {selectedType === "story" && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 animate-pulse text-blue-500" />
                      <Label className="font-bold text-gray-900">
                        Adaptação de Tela (Proporção 9:16)
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500">
                      Como sua imagem quadrada original será convertida para o formato vertical de
                      Stories?
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setStoryAdaptationMode("blur")}
                        className={cn(
                          "flex flex-col items-center justify-between rounded-xl border p-3.5 text-center transition-all hover:scale-[1.02] hover:shadow-sm",
                          storyAdaptationMode === "blur"
                            ? "border-blue-500 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        )}
                      >
                        <div className="mb-2 flex h-10 w-8 flex-col items-center justify-between gap-0.5 rounded border border-dashed border-current p-1 opacity-80">
                          <div className="bg-current/25 h-1 w-full rounded-sm"></div>
                          <div className="h-4 w-4 rounded-sm bg-current"></div>
                          <div className="bg-current/25 h-1 w-full rounded-sm"></div>
                        </div>
                        <span className="text-xs font-bold leading-tight">Fundo Borrado</span>
                        <span className="mt-1 text-[10px] text-gray-500">Premium (Padrão)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStoryAdaptationMode("crop")}
                        className={cn(
                          "flex flex-col items-center justify-between rounded-xl border p-3.5 text-center transition-all hover:scale-[1.02] hover:shadow-sm",
                          storyAdaptationMode === "crop"
                            ? "border-blue-500 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        )}
                      >
                        <div className="mb-2 flex h-10 w-8 items-center justify-center rounded border border-dashed border-current p-1 opacity-80">
                          <div className="h-8 w-6 rounded-sm bg-current"></div>
                        </div>
                        <span className="text-xs font-bold leading-tight">Corte Central</span>
                        <span className="mt-1 text-[10px] text-gray-500">Zoom (Preencher)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStoryAdaptationMode("solid")}
                        className={cn(
                          "flex flex-col items-center justify-between rounded-xl border p-3.5 text-center transition-all hover:scale-[1.02] hover:shadow-sm",
                          storyAdaptationMode === "solid"
                            ? "border-blue-500 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        )}
                      >
                        <div className="mb-2 flex h-10 w-8 flex-col items-center justify-between gap-0.5 rounded border border-dashed border-current p-1 opacity-80">
                          <div className="bg-current/10 h-1 w-full rounded-sm"></div>
                          <div className="h-4 w-4 rounded-sm bg-current"></div>
                          <div className="bg-current/10 h-1 w-full rounded-sm"></div>
                        </div>
                        <span className="text-xs font-bold leading-tight">Fundo Sólido</span>
                        <span className="mt-1 flex items-center justify-center gap-1 text-[10px] text-gray-500">
                          Brand Kit
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-gray-300 shadow-sm"
                            style={{
                              backgroundColor:
                                businessProfile?.brandKit?.primaryColor ||
                                businessProfile?.primaryColor ||
                                "#000000",
                            }}
                          />
                        </span>
                      </button>
                    </div>
                  </div>
                )}

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
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="instagram" className="px-1 text-xs">
                        <Instagram className="mr-1 h-3.5 w-3.5" />
                        Instagram
                      </TabsTrigger>
                      <TabsTrigger value="facebook" className="px-1 text-xs">
                        <Facebook className="mr-1 h-3.5 w-3.5" />
                        Facebook
                      </TabsTrigger>
                      <TabsTrigger value="linkedin" className="px-1 text-xs">
                        <Linkedin className="mr-1 h-3.5 w-3.5" />
                        LinkedIn
                      </TabsTrigger>
                      <TabsTrigger value="google" className="px-1 text-xs">
                        <Store className="mr-1 h-3.5 w-3.5" />
                        Google
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="instagram" className="mt-4">
                      <InstagramPreview
                        mediaItems={mediaItems}
                        user={user}
                        text={text}
                        instagramConnection={instagramConnection}
                        logoPreviewUrl={logoPreviewUrl}
                        logoPosition={logoPosition}
                        visualLogoScale={visualLogoScale}
                        logoOpacity={logoOpacity}
                        contentType={selectedType}
                        storyAdaptationMode={storyAdaptationMode}
                        brandKitPrimaryColor={
                          businessProfile?.brandKit?.primaryColor ||
                          businessProfile?.primaryColor ||
                          "#000000"
                        }
                      />
                    </TabsContent>
                    <TabsContent value="facebook" className="mt-4">
                      <FacebookPreview
                        mediaItems={mediaItems}
                        user={user}
                        text={text}
                        metaConnection={metaConnection}
                        logoPreviewUrl={logoPreviewUrl}
                        logoPosition={logoPosition}
                        visualLogoScale={visualLogoScale}
                        logoOpacity={logoOpacity}
                        contentType={selectedType}
                        storyAdaptationMode={storyAdaptationMode}
                        brandKitPrimaryColor={
                          businessProfile?.brandKit?.primaryColor ||
                          businessProfile?.primaryColor ||
                          "#000000"
                        }
                      />
                    </TabsContent>
                    <TabsContent value="linkedin" className="mt-4">
                      <LinkedInPreview
                        mediaItems={mediaItems}
                        user={user}
                        text={text}
                        linkedinConnection={linkedinConnection}
                        logoPreviewUrl={logoPreviewUrl}
                        logoPosition={logoPosition}
                        visualLogoScale={visualLogoScale}
                        logoOpacity={logoOpacity}
                        isFinalPreview={false}
                      />
                    </TabsContent>
                    <TabsContent value="google" className="mt-4">
                      <GooglePreview
                        mediaItems={mediaItems}
                        user={user}
                        text={text}
                        googleConnection={googleConnection}
                        businessProfile={businessProfile}
                        gmbProfile={gmbProfile}
                        logoPreviewUrl={logoPreviewUrl}
                        logoPosition={logoPosition}
                        visualLogoScale={visualLogoScale}
                        logoOpacity={logoOpacity}
                        contentType={selectedType}
                        brandKitPrimaryColor={
                          businessProfile?.brandKit?.primaryColor ||
                          businessProfile?.primaryColor ||
                          "#000000"
                        }
                      />
                    </TabsContent>
                  </Tabs>
                  {mediaItems.some(item => item.type === "image") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const firstImageIndex = mediaItems.findIndex(item => item.type === "image");
                        if (firstImageIndex !== -1) {
                          setActiveImageToCorrect(mediaItems[firstImageIndex].previewUrl);
                          setActiveIndexToCorrect(firstImageIndex);
                          setIsCorrectionOpen(true);
                        }
                      }}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border-primary/40 py-2 font-medium text-slate-800 transition-all hover:border-primary hover:bg-primary/5"
                    >
                      <Paintbrush className="h-4 w-4 text-primary" />
                      Escrever Textos / Editar Imagens
                    </Button>
                  )}
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
                    googleConnection={googleConnection}
                    linkedinConnection={linkedinConnection}
                    businessProfile={businessProfile}
                    contentType={selectedType}
                    storyAdaptationMode={storyAdaptationMode}
                    brandKitPrimaryColor={
                      businessProfile?.brandKit?.primaryColor ||
                      businessProfile?.primaryColor ||
                      "#000000"
                    }
                    logoPreviewUrl={logoPreviewUrl}
                    logoPosition={logoPosition}
                    visualLogoScale={visualLogoScale}
                    logoOpacity={logoOpacity}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Editor de Texto</CardTitle>
                <p className="text-sm text-gray-600">Escreva e edite a legenda da sua publicação antes de publicar.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="post-text-step3" className="font-semibold text-gray-700">
                    Legenda
                  </Label>
                  <Textarea
                    id="post-text-step3"
                    placeholder="Escreva aqui a legenda da sua publicação..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[120px] bg-white"
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
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Agendamento e Plataformas</CardTitle>
                <p className="text-sm text-gray-600">Escolha quando e onde publicar seu conteúdo.</p>
              </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="font-semibold">Onde Publicar?</Label>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all duration-200",
                            platforms.includes("facebook") && metaConnection?.isConnected
                              ? "border-[#0083C7] bg-blue-50/50 shadow-sm"
                              : "border-gray-200 hover:bg-gray-50",
                            !metaConnection?.isConnected &&
                              "cursor-not-allowed bg-gray-100 opacity-60 hover:bg-gray-100"
                          )}
                        >
                          <Checkbox
                            id="platform-facebook"
                            checked={
                              platforms.includes("facebook") && !!metaConnection?.isConnected
                            }
                            onCheckedChange={() => handlePlatformChange("facebook")}
                            disabled={!metaConnection?.isConnected}
                          />
                          <Label
                            htmlFor="platform-facebook"
                            className={cn(
                              "flex flex-1 cursor-pointer items-center gap-3 font-semibold text-gray-700",
                              !metaConnection?.isConnected && "cursor-not-allowed"
                            )}
                          >
                            <Facebook className="h-5 w-5 text-blue-600" />
                            Facebook
                          </Label>
                        </div>
                      </TooltipTrigger>
                      {!metaConnection?.isConnected && (
                        <TooltipContent>
                          <p>Conecte o Facebook na aba 'Conteúdo' para publicar.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all duration-200",
                            platforms.includes("instagram") && instagramConnection?.isConnected
                              ? "border-[#0083C7] bg-blue-50/50 shadow-sm"
                              : "border-gray-200 hover:bg-gray-50",
                            !instagramConnection?.isConnected &&
                              "cursor-not-allowed bg-gray-100 opacity-60 hover:bg-gray-100"
                          )}
                        >
                          <Checkbox
                            id="platform-instagram"
                            checked={
                              platforms.includes("instagram") && !!instagramConnection?.isConnected
                            }
                            onCheckedChange={() => handlePlatformChange("instagram")}
                            disabled={!instagramConnection?.isConnected}
                          />
                          <Label
                            htmlFor="platform-instagram"
                            className={cn(
                              "flex flex-1 cursor-pointer items-center gap-3 font-semibold text-gray-700",
                              !instagramConnection?.isConnected && "cursor-not-allowed"
                            )}
                          >
                            <Instagram className="h-5 w-5 text-pink-500" />
                            Instagram
                          </Label>
                        </div>
                      </TooltipTrigger>
                      {!instagramConnection?.isConnected && (
                        <TooltipContent>
                          <p>Conecte o Instagram na aba 'Conteúdo' para publicar.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all duration-200",
                            platforms.includes("google") && googleConnection?.isConnected && selectedType !== "story"
                              ? "border-[#0083C7] bg-blue-50/50 shadow-sm"
                              : "border-gray-200 hover:bg-gray-50",
                            (!googleConnection?.isConnected || selectedType === "story") &&
                              "cursor-not-allowed bg-gray-100 opacity-60 hover:bg-gray-100"
                          )}
                        >
                          <Checkbox
                            id="platform-google"
                            checked={
                              platforms.includes("google") && !!googleConnection?.isConnected && selectedType !== "story"
                            }
                            onCheckedChange={() => handlePlatformChange("google")}
                            disabled={!googleConnection?.isConnected || selectedType === "story"}
                          />
                          <Label
                            htmlFor="platform-google"
                            className={cn(
                              "flex flex-1 cursor-pointer items-center gap-3 font-semibold text-gray-700",
                              (!googleConnection?.isConnected || selectedType === "story") && "cursor-not-allowed"
                            )}
                          >
                            <Store className="h-5 w-5 text-blue-500" />
                            Google Meu Negócio
                          </Label>
                        </div>
                      </TooltipTrigger>
                      {selectedType === "story" ? (
                        <TooltipContent>
                          <p>O Google Meu Negócio não suporta o formato Story.</p>
                        </TooltipContent>
                      ) : !googleConnection?.isConnected ? (
                        <TooltipContent>
                          <p>Conecte seu Perfil no Google na aba 'Meu Negócio' para publicar.</p>
                        </TooltipContent>
                      ) : null}
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all duration-200",
                            platforms.includes("linkedin") && linkedinConnection?.isConnected && selectedType !== "story"
                              ? "border-[#0083C7] bg-blue-50/50 shadow-sm"
                              : "border-gray-200 hover:bg-gray-50",
                            (!linkedinConnection?.isConnected || selectedType === "story") &&
                              "cursor-not-allowed bg-gray-100 opacity-60 hover:bg-gray-100"
                          )}
                        >
                          <Checkbox
                            id="platform-linkedin"
                            checked={
                              platforms.includes("linkedin") && !!linkedinConnection?.isConnected && selectedType !== "story"
                            }
                            onCheckedChange={() => handlePlatformChange("linkedin")}
                            disabled={!linkedinConnection?.isConnected || selectedType === "story"}
                          />
                          <Label
                            htmlFor="platform-linkedin"
                            className={cn(
                              "flex flex-1 cursor-pointer items-center gap-3 font-semibold text-gray-700",
                              (!linkedinConnection?.isConnected || selectedType === "story") && "cursor-not-allowed"
                            )}
                          >
                            <Linkedin className="h-5 w-5 text-blue-700" />
                            LinkedIn
                          </Label>
                        </div>
                      </TooltipTrigger>
                      {selectedType === "story" ? (
                        <TooltipContent>
                          <p>O LinkedIn não suporta o formato Story.</p>
                        </TooltipContent>
                      ) : !linkedinConnection?.isConnected ? (
                        <TooltipContent>
                          <p>Conecte seu LinkedIn na aba 'Conexões' para publicar.</p>
                        </TooltipContent>
                      ) : null}
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all duration-200",
                            platforms.includes("tiktok") && tiktokConnection?.isConnected
                              ? "border-[#0083C7] bg-blue-50/50 shadow-sm"
                              : "border-gray-200 hover:bg-gray-50",
                            !tiktokConnection?.isConnected &&
                              "cursor-not-allowed bg-gray-100 opacity-60 hover:bg-gray-100"
                          )}
                        >
                          <Checkbox
                            id="platform-tiktok"
                            checked={
                              platforms.includes("tiktok") && !!tiktokConnection?.isConnected
                            }
                            onCheckedChange={() => handlePlatformChange("tiktok")}
                            disabled={!tiktokConnection?.isConnected}
                          />
                          <Label
                            htmlFor="platform-tiktok"
                            className={cn(
                              "flex flex-1 cursor-pointer items-center gap-3 font-semibold text-gray-700",
                              !tiktokConnection?.isConnected && "cursor-not-allowed"
                            )}
                          >
                            <TikTokIcon className="h-5 w-5 text-slate-900" />
                            TikTok
                          </Label>
                        </div>
                      </TooltipTrigger>
                      {!tiktokConnection?.isConnected ? (
                        <TooltipContent>
                          <p>Conecte seu TikTok na aba 'Conexões' para publicar.</p>
                        </TooltipContent>
                      ) : null}
                    </Tooltip>
                  </TooltipProvider>
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
                    <h4 className="text-sm font-semibold">
                      Dividir postagem com parceiro (Collab)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      A postagem também aparecerá no perfil desta pessoa se ela aceitar.
                    </p>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {collaborators.map((username) => (
                        <div
                          key={username}
                          className="flex items-center gap-1 rounded-full border border-pink-200 bg-pink-50 px-2 py-1 text-xs text-pink-700"
                        >
                          @{username}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-pink-900"
                            onClick={() =>
                              setCollaborators(collaborators.filter((c) => c !== username))
                            }
                          />
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
                    <h4 className="text-sm font-semibold">Marcar na foto</h4>
                    <p className="text-xs text-muted-foreground">
                      A pessoa apenas receberá uma notificação de que foi marcada.
                    </p>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {userTags.map((tag) => (
                        <div
                          key={tag.username}
                          className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700"
                        >
                          @{tag.username}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-blue-900"
                            onClick={() =>
                              setUserTags(userTags.filter((t) => t.username !== tag.username))
                            }
                          />
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
              {!metaConnection?.isConnected &&
                !instagramConnection?.isConnected &&
                !linkedinConnection?.isConnected &&
                !googleConnection?.isConnected &&
                !tiktokConnection?.isConnected && (
                  <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-red-600">
                    <AlertTriangle className="h-4 w-4" /> Conecte pelo menos uma rede social para publicar.
                  </p>
                )}
            </CardFooter>
          </Card>
        </div>

        <div className="col-span-full mt-8 flex justify-between">
            <Button variant="outline" onClick={handleBackToStep2}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </motion.div>
      )}

      {isCorrectionOpen && activeImageToCorrect && (
        <ImageInpaintModal
          isOpen={isCorrectionOpen}
          onClose={() => {
            setIsCorrectionOpen(false);
            setActiveImageToCorrect(null);
            setActiveIndexToCorrect(-1);
          }}
          imageUrl={
            activeIndexToCorrect >= 0 && mediaItems[activeIndexToCorrect]?.originalUrl
              ? mediaItems[activeIndexToCorrect].originalUrl!
              : activeImageToCorrect
          }
          initialLayers={
            activeIndexToCorrect >= 0 ? mediaItems[activeIndexToCorrect]?.editorLayers : undefined
          }
          postId={manualPostId}
          userId={user?.uid || ""}
          fileName={String(activeIndexToCorrect + 1)}
          brandKitPrimaryColor={
            businessProfile?.brandKit?.primaryColor || businessProfile?.primaryColor
          }
          brandKitSecondaryColor={
            businessProfile?.brandKit?.secondaryColor || businessProfile?.secondaryColor
          }
          onSuccess={(newUrl, layers) => {
            if (activeIndexToCorrect !== -1) {
              setMediaItems((prev) => {
                const updated = [...prev];
                const current = updated[activeIndexToCorrect];
                updated[activeIndexToCorrect] = {
                  ...current,
                  previewUrl: newUrl,
                  publicUrl: newUrl,
                  originalUrl: current?.originalUrl || current?.previewUrl,
                  editorLayers: layers,
                  file: null as any,
                };
                return updated;
              });
            }
            setIsCorrectionOpen(false);
            setActiveImageToCorrect(null);
            setActiveIndexToCorrect(-1);
          }}
        />
      )}
    </div>
  );
}

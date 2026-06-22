"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import {
  Bot,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Sparkles,
  Check,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CircularProgressLoader } from "./CircularProgressLoader";

import { useWizard } from "../context/WizardContext";

export const Step2TextSelection = () => {
  const {
    generatedContent,
    selectedContentId,
    setSelectedContentId: onSelectedContentIdChange,
    setStep,
    user,
    instagramConnection,
    handleGeneratePostContent: onGenerateContent,
    isLoading,
    handleGeneratePrompts,
    generatedImages,
    selectedImage,
    setSelectedImage: onSelectedImageChange,
    isGeneratingImages,
    handleDownloadImage: onDownload,
    mode,
    fluxImageUrl,
  } = useWizard();

  const onBack = () => setStep(1);
  const onNext = () => {
    if (mode === "reference-photo") {
      setStep(3);
    } else {
      handleGeneratePrompts();
      setStep(3);
    }
  };
  const isLoadingContent = isLoading;
  const selectedContent = selectedContentId
    ? generatedContent[parseInt(selectedContentId, 10)]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 gap-8 lg:grid-cols-2"
    >
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-6 w-6 text-accent" />
            Etapa 2: Sugestões da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-600">Selecione uma das opções geradas para o seu post.</p>

          {generatedContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bot className="mb-4 h-12 w-12 text-gray-300" />
              <p className="mb-6 text-gray-500">Ainda não há conteúdo de texto para esta imagem.</p>
              {onGenerateContent && (
                <Button
                  onClick={() => onGenerateContent()}
                  disabled={isLoadingContent}
                  className="bg-primary text-white"
                >
                  {isLoadingContent ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando Texto...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Conteúdo de Texto
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <RadioGroup value={selectedContentId} onValueChange={onSelectedContentIdChange}>
              {generatedContent.map((content, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-gray-50"
                >
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                    className="mt-1"
                  />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    <h4 className="text-base font-bold text-gray-900">{content.titulo}</h4>
                    <p className="mt-1 text-sm text-gray-600">{content.subtitulo}</p>
                    <p className="mt-2 break-words text-xs text-blue-500">
                      {Array.isArray(content.hashtags) ? content.hashtags.join(" ") : ""}
                    </p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </CardContent>
        <CardFooter className="flex items-end justify-between">
          <Button variant="outline" onClick={() => onBack()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            onClick={() => onNext()}
            disabled={
              !selectedContentId ||
              (mode === "reference-photo" && (!selectedImage || isGeneratingImages))
            }
            className="bg-accent text-white shadow-md hover:bg-accent/90"
          >
            Avançar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {mode === "reference-photo" ? (
        <div className="flex h-full w-full flex-col items-center justify-start gap-4">
          <Card className="w-full max-w-md overflow-hidden border-none shadow-lg">
            <CardContent className="pt-6">
              {isGeneratingImages ? (
                <div className="relative flex min-h-[300px] flex-col items-center justify-center rounded-lg bg-gray-50 p-6">
                  <CircularProgressLoader isActive={isGeneratingImages} />
                </div>
              ) : generatedImages.length > 0 ? (
                <div className="space-y-4">
                  {generatedImages.map((imgSrc, index) => (
                    <div
                      key={`img-${index}`}
                      onClick={() => onSelectedImageChange(imgSrc)}
                      className={cn(
                        "group relative aspect-square cursor-pointer overflow-hidden rounded-lg transition-all duration-300",
                        "ring-4 ring-offset-2",
                        selectedImage === imgSrc ? "ring-accent" : "ring-transparent"
                      )}
                    >
                      <Image
                        src={imgSrc}
                        alt={`Imagem gerada ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                      {selectedImage === imgSrc && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <Check className="h-12 w-12 text-white" />
                        </div>
                      )}
                      {onDownload && (
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload(imgSrc);
                          }}
                          className="absolute right-2 top-2 z-10 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gray-50 p-6 text-gray-400">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <p className="mt-2 text-xs font-semibold">Aguardando geração da imagem...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <div className="flex w-[320px] flex-col overflow-hidden rounded-lg border bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b p-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback>
                  {(instagramConnection?.instagramUsername || user?.displayName || "U")
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-bold">
                {instagramConnection?.instagramUsername || user?.displayName || "seu_usuario"}
              </span>
            </div>
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gray-100 text-gray-400">
              {generatedContent[0]?.url_da_imagem ? (
                <img
                  src={generatedContent[0].url_da_imagem}
                  alt="Post"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Bot className="h-16 w-16 opacity-20" />
              )}
            </div>
            <div className="flex items-center justify-between px-3 pt-3">
              <div className="flex items-center gap-4">
                <Heart className="h-6 w-6 cursor-pointer text-gray-800" />
                <MessageCircle className="h-6 w-6 -scale-x-100 transform cursor-pointer text-gray-800" />
                <Send className="-ml-1 h-6 w-6 cursor-pointer text-gray-800" />
                <RepeatIcon className="h-6 w-6 cursor-pointer text-gray-800" />
              </div>
              <Bookmark className="h-6 w-6 cursor-pointer text-gray-800" />
            </div>
            <div className="p-3 pt-2 text-sm">
              {selectedContent ? (
                <p className="whitespace-pre-wrap text-gray-800">
                  <span className="font-bold">
                    {instagramConnection?.instagramUsername || user?.displayName || "seu_usuario"}
                  </span>{" "}
                  {selectedContent.titulo}
                  {"\n\n"}
                  {selectedContent.subtitulo}
                  {selectedContent.hashtags &&
                    `\n\n${Array.isArray(selectedContent.hashtags) ? selectedContent.hashtags.join(" ") : ""}`}
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const RepeatIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </svg>
);

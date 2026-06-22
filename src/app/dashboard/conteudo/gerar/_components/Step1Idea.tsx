"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  UploadCloud,
  X,
  Box,
  MessageSquare,
  FlaskConical,
} from "lucide-react";

import { useWizard } from "../context/WizardContext";

export const Step1Idea = () => {
  const {
    postSummary,
    setPostSummary: onPostSummaryChange,
    handleGenerateText: onGenerate,
    isLoading,
    referenceImagePreview,
    handleReferenceImageChange: onReferenceImageChange,
    referenceDescription,
    setReferenceDescription: onReferenceDescriptionChange,
    mode,
    referenceLink,
    setReferenceLink: onReferenceLinkChange,
    setInspirationFile: onInspirationFileChange,
  } = useWizard();

  const hideImageOption = mode === "concept";
  const hideTextOption = mode === "reference-photo";
  const isLinkMode = mode === "reference-link";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preenche a descrição padrão automaticamente se estiver em branco no modo de referência
  React.useEffect(() => {
    if (isLinkMode && !referenceDescription.trim()) {
      onReferenceDescriptionChange(
        "Criar um post profissional mantendo fielmente o layout, as cores e a estrutura da referência de inspiração, integrando o meu produto ou pessoa de forma perfeitamente harmônica."
      );
    }
  }, [isLinkMode, referenceDescription, onReferenceDescriptionChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReferenceImageChange(file);
    }
  };

  const isButtonDisabled =
    isLoading ||
    (isLinkMode
      ? !referenceLink || !referenceImagePreview
      : mode === "reference-photo"
        ? !referenceImagePreview || !referenceDescription.trim()
        : !postSummary.trim() || (!!referenceImagePreview && !referenceDescription.trim()));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <Card className="mx-auto w-full max-w-4xl border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-accent" />
            Etapa 1: Envie as imagens do post
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLinkMode && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Para criar o seu post com o layout perfeito, envie o print do post que você gostou
                (Inspiração) e a foto do seu produto ou pessoa (Conteúdo).
              </p>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* 1. Print de Inspiração */}
                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5 animate-pulse text-accent" />
                    <Label className="text-base font-bold">1. Print de Inspiração (Layout)</Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    O post modelo que servirá de referência para o círculo de desconto, molduras,
                    cores e posições.
                  </p>

                  {!referenceLink ? (
                    <div
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            onInspirationFileChange?.(file);
                            onReferenceLinkChange?.(URL.createObjectURL(file));
                          }
                        };
                        input.click();
                      }}
                      className="flex h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 transition-all hover:border-accent hover:bg-accent/5"
                    >
                      <UploadCloud className="mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-center text-xs font-bold text-gray-700">
                        Clique para carregar o print de inspiração
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        PNG, JPG de posts do Instagram, etc.
                      </p>
                    </div>
                  ) : (
                    <div className="relative flex h-44 flex-col items-center justify-center rounded-lg border bg-white p-3 shadow-inner">
                      <div className="relative h-28 w-28 overflow-hidden rounded border shadow-sm">
                        <Image
                          src={referenceLink}
                          alt="Referência"
                          layout="fill"
                          objectFit="cover"
                          unoptimized
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => {
                          onInspirationFileChange?.(null);
                          onReferenceLinkChange?.("");
                        }}
                      >
                        Trocar imagem
                      </Button>
                    </div>
                  )}
                </div>

                {/* 2. Foto do Produto ou Pessoa */}
                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-primary">
                    <Box className="h-5 w-5 text-blue-500" />
                    <Label className="text-base font-bold">2. Foto do seu Produto ou Pessoa</Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    A foto do seu produto real, pessoa ou modelo que será recortada e inserida na
                    arte de destino.
                  </p>

                  {!referenceImagePreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 transition-all hover:border-blue-500 hover:bg-blue-50/20"
                    >
                      <UploadCloud className="mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-center text-xs font-bold text-gray-700">
                        Clique para carregar a foto do produto/modelo
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        Tire uma foto nítida e bem iluminada.
                      </p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative flex h-44 flex-col items-center justify-center rounded-lg border bg-white p-3 shadow-inner">
                      <div className="relative h-28 w-28 overflow-hidden rounded border shadow-sm">
                        <Image
                          src={referenceImagePreview}
                          alt="Produto"
                          layout="fill"
                          objectFit="cover"
                          unoptimized
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => onReferenceImageChange(null)}
                      >
                        Trocar imagem
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {mode !== "reference-photo" && (
            <div className="space-y-2 border-t pt-4">
              <Label className="text-base font-semibold">
                {isLinkMode ? "Ideia do Conteúdo / Promoção" : "Ideia do Conteúdo"}
              </Label>
              <p className="mb-2 text-sm text-gray-600">
                {isLinkMode
                  ? "Descreva a sua promoção, descontos, textos importantes ou o tema que deseja destacar (ex: 'Oferecer 35% de desconto no notebook Dell'). A IA integrará isso ao layout."
                  : "Escreva um resumo, uma ideia ou algumas palavras-chave sobre o conteúdo que você deseja criar."}
              </p>
              <Textarea
                placeholder={
                  isLinkMode
                    ? "Ex: Cupom de 35% de desconto na compra do novo notebook Dell Inspiron neste final de semana!"
                    : "Ex: Criar um post sobre os benefícios do nosso novo produto X, destacando a facilidade de uso e o design inovador."
                }
                className="h-32 bg-white text-base"
                value={postSummary}
                onChange={(e) => onPostSummaryChange(e.target.value)}
              />
            </div>
          )}

          {!hideImageOption && !isLinkMode && (
            <div className={!hideTextOption ? "border-t pt-4" : ""}>
              <div className="mb-2 flex items-center gap-2">
                <Box className="h-5 w-5 text-blue-500" />
                <Label className="text-base font-semibold">
                  Imagem do Produto {hideTextOption ? "" : "(Opcional)"}
                </Label>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Deseja destacar um produto real? Envie uma foto dele para que a IA tente usá-la como
                base para criar a imagem do post.
                <span className="mt-1 block text-xs italic">
                  Exemplos: Foto do seu produto físico, uma embalagem específica ou um ambiente da
                  sua loja.
                </span>
              </p>

              <div className="space-y-6">
                {!referenceImagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-all hover:border-primary hover:bg-gray-50"
                  >
                    <UploadCloud className="mb-2 h-10 w-10 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">
                      Clique para enviar uma imagem
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG ou JPEG (Máx. 5MB)</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="w-full space-y-4 pt-1">
                    <div className="flex flex-col items-start gap-6 md:flex-row">
                      <div className="group relative h-40 w-40 shrink-0 overflow-hidden rounded-lg border shadow-sm">
                        <Image
                          src={referenceImagePreview}
                          alt="Referência"
                          layout="fill"
                          objectFit="cover"
                        />
                        <button
                          type="button"
                          onClick={() => onReferenceImageChange(null)}
                          className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="w-full flex-1 space-y-3"
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            <Label className="text-sm font-bold">
                              Descreva a imagem enviada <span className="text-red-500">*</span>
                            </Label>
                          </div>
                          <p className="text-xs text-gray-500">
                            Explique o que é o produto/objeto na foto e como você gostaria que ele
                            fosse integrado à imagem final (ex: "coloque este frasco de perfume
                            sobre uma mesa de mármore com flores brancas ao fundo").
                          </p>
                          <Textarea
                            placeholder="Descreva detalhes como cor, material e o cenário desejado para este item..."
                            className="h-24 text-sm"
                            value={referenceDescription}
                            onChange={(e) => onReferenceDescriptionChange(e.target.value)}
                            required
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-end">
          <Button
            onClick={() => onGenerate()}
            disabled={isButtonDisabled}
            className="bg-accent text-white shadow-md hover:bg-accent/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                {hideTextOption && !referenceImagePreview ? "Aguardando imagem..." : "Avançar"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

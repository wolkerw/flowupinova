"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, Loader2, UploadCloud, X, Box, MessageSquare } from "lucide-react";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReferenceImageChange(file);
    }
  };

  const isButtonDisabled = isLoading || (
    isLinkMode
      ? (!referenceLink.trim() || !referenceDescription.trim())
      : hideTextOption 
        ? (!referenceImagePreview || !referenceDescription.trim() || !postSummary.trim())
        : (!postSummary.trim() || (!!referenceImagePreview && !referenceDescription.trim()))
  );

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
            Etapa 1: Sobre o que é o post?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLinkMode && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <Label className="text-base font-semibold">Inspiração Visual (Print)</Label>
                </div>
                <p className="text-sm text-gray-600">
                  Envie um print ou foto da postagem que você gostou para a IA usar como base.
                </p>
                
                {!referenceLink ? (
                  <div
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          onInspirationFileChange?.(file);
                          onReferenceLinkChange?.(url); 
                        }
                      };
                      input.click();
                    }}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-all hover:border-accent hover:bg-gray-50"
                  >
                    <UploadCloud className="mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">Clique para enviar o print de referência</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 rounded-lg border p-3 bg-gray-50">
                    <div className="relative h-16 w-16 overflow-hidden rounded border shadow-sm">
                      <Image src={referenceLink} alt="Referência" layout="fill" objectFit="cover" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-primary truncate">Imagem de referência carregada!</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 p-0"
                        onClick={() => {
                          onInspirationFileChange?.(null);
                          onReferenceLinkChange?.("");
                        }}
                      >
                        Remover e trocar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <Label className="text-base font-semibold">O que você deseja desta referência?</Label>
                </div>
                <p className="text-sm text-gray-600">
                  Descreva o que você quer aproveitar (estilo, cores, layout, etc).
                </p>
                <Textarea
                  placeholder="Ex: Gostaria de criar um post com o mesmo estilo de cores e layout, mas focado no meu produto X..."
                  className="h-32 text-base"
                  value={referenceDescription}
                  onChange={(e) => onReferenceDescriptionChange(e.target.value)}
                />
              </div>

              {/* Seção de Imagem Opcional do Produto */}
              <div className="border-t pt-4">
                <div className="mb-2 flex items-center gap-2">
                  <Box className="h-5 w-5 text-blue-500" />
                  <Label className="text-base font-semibold">Foto do seu Produto (Opcional)</Label>
                </div>
                <p className="mb-4 text-sm text-gray-600 italic">
                  Deseja que a IA use a foto do seu produto real na arte inspirada pelo print?
                </p>

                <div className="space-y-6">
                  {!referenceImagePreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-all hover:border-primary hover:bg-gray-50"
                    >
                      <UploadCloud className="mb-2 h-10 w-10 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">Clique para enviar a foto do produto</p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-6 md:flex-row">
                      <div className="group relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border shadow-sm">
                        <Image
                          src={referenceImagePreview}
                          alt="Referência"
                          layout="fill"
                          objectFit="cover"
                        />
                        <button
                          onClick={() => onReferenceImageChange(null)}
                          className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex-1 text-sm text-gray-600">
                        <p className="font-semibold text-primary">Foto selecionada!</p>
                        <p>Esta imagem será enviada junto com o link para referência.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isLinkMode && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                {hideTextOption ? "Texto da Postagem" : "Ideia do Conteúdo"}
              </Label>
              <p className="mb-2 text-sm text-gray-600">
                {hideTextOption 
                  ? "Diga o que você quer que esteja escrito no texto do seu post (ex: promoções, avisos, convites)."
                  : "Escreva um resumo, uma ideia ou algumas palavras-chave sobre o conteúdo que você deseja criar."
                }
              </p>
              <Textarea
                placeholder={hideTextOption 
                  ? "Ex: Chegou a liquidação de verão da Loja Mais Bela. Peças como a da foto por apenas 49,90."
                  : "Ex: Criar um post sobre os benefícios do nosso novo produto X, destacando a facilidade de uso e o design inovador."
                }
                className="h-32 text-base"
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
                  Exemplos: Foto do seu produto físico, uma embalagem específica ou um ambiente da sua
                  loja.
                </span>
              </p>

              <div className="space-y-6">
                {!referenceImagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-all hover:border-primary hover:bg-gray-50"
                  >
                    <UploadCloud className="mb-2 h-10 w-10 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">Clique para enviar uma imagem</p>
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
                  <div className="flex flex-col items-start gap-6 md:flex-row">
                    <div className="group relative h-40 w-40 shrink-0 overflow-hidden rounded-lg border shadow-sm">
                      <Image
                        src={referenceImagePreview}
                        alt="Referência"
                        layout="fill"
                        objectFit="cover"
                      />
                      <button
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
                          Explique o que é o produto/objeto na foto e como você gostaria que ele fosse
                          integrado à imagem final (ex: "coloque este frasco de perfume sobre uma mesa
                          de mármore com flores brancas ao fundo").
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

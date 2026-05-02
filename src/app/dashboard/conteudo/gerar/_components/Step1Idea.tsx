"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, Loader2, UploadCloud, X, Box, MessageSquare } from "lucide-react";

interface Step1IdeaProps {
  postSummary: string;
  onPostSummaryChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  referenceImagePreview: string | null;
  onReferenceImageChange: (file: File | null) => void;
  referenceDescription: string;
  onReferenceDescriptionChange: (value: string) => void;
}

export const Step1Idea = ({
  postSummary,
  onPostSummaryChange,
  onGenerate,
  isLoading,
  referenceImagePreview,
  onReferenceImageChange,
  referenceDescription,
  onReferenceDescriptionChange,
}: Step1IdeaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReferenceImageChange(file);
    }
  };

  const isButtonDisabled =
    !postSummary.trim() || isLoading || (!!referenceImagePreview && !referenceDescription.trim());

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
          <div className="space-y-2">
            <Label className="text-base font-semibold">Ideia do Conteúdo</Label>
            <p className="mb-2 text-sm text-gray-600">
              Escreva um resumo, uma ideia ou algumas palavras-chave sobre o conteúdo que você
              deseja criar. Quanto mais detalhes você fornecer, melhores serão os resultados.
            </p>
            <Textarea
              placeholder="Ex: Criar um post sobre os benefícios do nosso novo produto X, destacando a facilidade de uso e o design inovador."
              className="h-32 text-base"
              value={postSummary}
              onChange={(e) => onPostSummaryChange(e.target.value)}
            />
          </div>

          <div className="border-t pt-4">
            <div className="mb-2 flex items-center gap-2">
              <Box className="h-5 w-5 text-blue-500" />
              <Label className="text-base font-semibold">Imagem do Produto (Opcional)</Label>
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
        </CardContent>
        <CardFooter className="flex items-center justify-end">
          <Button
            onClick={onGenerate}
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
                Avançar <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight, Upload, Video, Image as ImageIcon, Loader2, ArrowLeft, Film } from "lucide-react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";

export default function CriarConteudoPage() {
  const [step, setStep] = useState(1);
  const [script, setScript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Finalize logic
      console.log("Finalizando criação de conteúdo personalizado...");
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Criar Story ou Reel</h1>
        <p className="text-gray-600 mt-1">
          {step === 1 && "Escreva a ideia ou roteiro para o seu vídeo."}
          {step === 2 && "Adicione seus próprios arquivos de mídia, como logo e vídeos."}
          {step === 3 && "Revise e prepare-se para gerar seu vídeo."}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-lg border-none w-full max-w-4xl mx-auto">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="w-6 h-6 text-blue-500" />
                  Etapa 1: Qual é a sua ideia?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Descreva o roteiro, as cenas ou a mensagem principal do seu vídeo. A IA usará isso para gerar a narração e a estrutura.
                </p>
                <Textarea
                  placeholder="Ex: Um reel rápido mostrando 3 dicas de marketing. A primeira dica é sobre SEO, a segunda sobre redes sociais e a terceira sobre email marketing. Usar um tom dinâmico e direto."
                  className="h-40 text-base"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                />
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Upload className="w-6 h-6 text-blue-500" />
                  Etapa 2: Adicione seu acervo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="logo-upload" className="flex items-center gap-2 mb-2 font-semibold">
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                    Logomarca (opcional)
                  </Label>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)}
                  />
                  {logoFile && <p className="text-sm text-gray-500 mt-2">Arquivo selecionado: {logoFile.name}</p>}
                </div>
                <div>
                  <Label htmlFor="video-upload" className="flex items-center gap-2 mb-2 font-semibold">
                    <Video className="w-5 h-5 text-gray-600" />
                    Vídeo de fundo (opcional)
                  </Label>
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/mp4, video/quicktime"
                    onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
                  />
                  {videoFile && <p className="text-sm text-gray-500 mt-2">Arquivo selecionado: {videoFile.name}</p>}
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
             <>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                    <Film className="w-6 h-6 text-blue-500" />
                    Etapa 3: Revise e Gere
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 mb-4">
                        Confirme as informações abaixo. A IA irá gerar uma narração com base no seu roteiro e combinar com a mídia que você forneceu.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-800">Roteiro:</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-3">{script || "Nenhum roteiro fornecido."}</p>
                        </div>
                         <div>
                            <h4 className="font-semibold text-gray-800">Logomarca:</h4>
                            <p className="text-sm text-gray-600 mt-1">{logoFile?.name || "Nenhuma logomarca fornecida."}</p>
                        </div>
                         <div>
                            <h4 className="font-semibold text-gray-800">Vídeo de Fundo:</h4>
                            <p className="text-sm text-gray-600 mt-1">{videoFile?.name || "Nenhum vídeo de fundo fornecido. A IA irá gerar um."}</p>
                        </div>
                    </div>
                </CardContent>
             </>
          )}

          <CardFooter className="flex justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={handlePreviousStep} disabled={isLoading}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            ) : <div></div>}
            <Button
              onClick={handleNextStep}
              disabled={isLoading || (step === 1 && !script.trim())}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  {step < 3 ? 'Próxima Etapa' : 'Gerar Vídeo'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

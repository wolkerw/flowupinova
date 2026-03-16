
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Loader2, ArrowLeft, ArrowRight, Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { GeneratedContent } from "../types";
import { InstagramConnectionData } from "@/lib/services/instagram-service";

interface Step2TextSelectionProps {
  generatedContent: GeneratedContent[];
  selectedContentId: string | undefined;
  onSelectedContentIdChange: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onGeneratePrompts: () => void;
  isGeneratingImages: boolean;
  user: any;
  instagramConnection: InstagramConnectionData | null;
}

export const Step2TextSelection = ({
  generatedContent,
  selectedContentId,
  onSelectedContentIdChange,
  onBack,
  onNext,
  onSaveDraft,
  onGeneratePrompts,
  isGeneratingImages,
  user,
  instagramConnection
}: Step2TextSelectionProps) => {
  const selectedContent = selectedContentId ? generatedContent[parseInt(selectedContentId, 10)] : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bot className="w-6 h-6 text-purple-500" />
            Etapa 2: Sugestões da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">Selecione uma das opções geradas para o seu post.</p>
          <RadioGroup value={selectedContentId} onValueChange={onSelectedContentIdChange}>
            {generatedContent.map((content, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} className="mt-1" />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  <h4 className="font-bold text-base text-gray-900">{content.título}</h4>
                  <p className="text-sm text-gray-600 mt-1">{content.subtitulo}</p>
                  <p className="text-xs text-blue-500 mt-2 break-words">
                    {Array.isArray(content.hashtags) ? content.hashtags.join(' ') : ''}
                  </p>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between items-end">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Button>
          <div className="flex flex-col gap-2">
            <Button 
              type="button"
              variant="outline" 
              size="sm"
              onClick={onGeneratePrompts}
              className="text-xs text-muted-foreground border-dashed"
            >
              Gerar texto
            </Button>
            <Button
              type="button"
              onClick={onSaveDraft}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              Gerar 3 imagens assíncronas
            </Button>
            <Button 
              onClick={onNext} 
              disabled={!selectedContentId || isGeneratingImages} 
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              {isGeneratingImages ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : 'Avançar'}
              {!isGeneratingImages && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div className="flex items-center justify-center">
        <div className="w-[320px] bg-white rounded-lg shadow-2xl border flex flex-col overflow-hidden">
          <div className="p-3 flex items-center gap-2 border-b">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback>{(instagramConnection?.instagramUsername || user?.displayName || 'U').charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-bold text-sm">
              {instagramConnection?.instagramUsername || user?.displayName || 'seu_usuario'}
            </span>
          </div>
          <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-gray-400">
            <Bot className="w-16 h-16 opacity-20" />
          </div>
          <div className="px-3 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Heart className="w-6 h-6 text-gray-800 cursor-pointer"/>
              <MessageCircle className="w-6 h-6 text-gray-800 cursor-pointer transform -scale-x-100"/>
              <Send className="w-6 h-6 text-gray-800 cursor-pointer -ml-1"/>
              <Repeat className="w-6 h-6 text-gray-800 cursor-pointer"/>
            </div>
            <Bookmark className="w-6 h-6 text-gray-800 cursor-pointer"/>
          </div>
          <div className="p-3 pt-2 text-sm">
            {selectedContent ? (
              <p className="whitespace-pre-wrap text-gray-800">
                <span className="font-bold">{instagramConnection?.instagramUsername || user?.displayName || 'seu_usuario'}</span>{' '}
                {selectedContent.título}
                {'\n\n'}
                {selectedContent.subtitulo}
                {selectedContent.hashtags && `\n\n${Array.isArray(selectedContent.hashtags) ? selectedContent.hashtags.join(' ') : ''}`}
              </p>
            ) : (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Repeat = ({ className }: { className?: string }) => (
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
    <path d="m17 2 4 4-4 4"/>
    <path d="M3 11v-1a4 4 0 0 1 4-4h14"/>
    <path d="m7 22-4-4 4-4"/>
    <path d="M21 13v1a4 4 0 0 1-4 4H3"/>
  </svg>
);

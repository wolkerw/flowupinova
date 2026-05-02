"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bot,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
} from "lucide-react";
import { GeneratedContent } from "../types";
import { InstagramConnectionData } from "@/lib/services/instagram-service";

interface Step2TextSelectionProps {
  generatedContent: GeneratedContent[];
  selectedContentId: string | undefined;
  onSelectedContentIdChange: (id: string) => void;
  onBack: () => void;
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
  onGeneratePrompts,
  isGeneratingImages,
  user,
  instagramConnection,
}: Step2TextSelectionProps) => {
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
          <RadioGroup value={selectedContentId} onValueChange={onSelectedContentIdChange}>
            {generatedContent.map((content, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-gray-50"
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} className="mt-1" />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  <h4 className="text-base font-bold text-gray-900">{content.título}</h4>
                  <p className="mt-1 text-sm text-gray-600">{content.subtitulo}</p>
                  <p className="mt-2 break-words text-xs text-blue-500">
                    {Array.isArray(content.hashtags) ? content.hashtags.join(" ") : ""}
                  </p>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex items-end justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            onClick={onGeneratePrompts}
            disabled={!selectedContentId || isGeneratingImages}
            className="bg-accent text-white shadow-md hover:bg-accent/90"
          >
            {isGeneratingImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Avançar"}
            {!isGeneratingImages && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>

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
          <div className="flex aspect-square w-full items-center justify-center bg-gray-100 text-gray-400">
            <Bot className="h-16 w-16 opacity-20" />
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
                {selectedContent.título}
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

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Send, Calendar, Loader2, ArrowLeft, Instagram, Facebook, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PostPreview } from "./PostPreview";
import { GeneratedContent, Platform } from "../types";
import { MetaConnectionData } from "@/lib/services/meta-service";
import { InstagramConnectionData } from "@/lib/services/instagram-service";

interface Step5ReviewPublishProps {
  processedImageUrl: string | null;
  selectedImage: string;
  selectedContent: GeneratedContent;
  user: any;
  metaConnection: MetaConnectionData | null;
  instagramConnection: InstagramConnectionData | null;
  platforms: Platform[];
  onPlatformChange: (platform: Platform) => void;
  onPublish: (mode: 'now' | 'schedule') => void;
  onBack: () => void;
  isPublishing: boolean;
}

export const Step5ReviewPublish = ({
  processedImageUrl,
  selectedImage,
  selectedContent,
  user,
  metaConnection,
  instagramConnection,
  platforms,
  onPlatformChange,
  onPublish,
  onBack,
  isPublishing
}: Step5ReviewPublishProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="shadow-lg border-none w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Etapa 5: Revise e publique seu post
          </CardTitle>
          <p className="text-sm text-gray-600 pt-1">Revise o texto, a imagem e agende a publicação.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <h3 className="font-bold text-lg">Preview do Post</h3>
              <div className="mt-6 flex items-center justify-center">
                <PostPreview 
                  imageUrl={processedImageUrl || selectedImage} 
                  content={selectedContent} 
                  user={user} 
                  metaConnection={metaConnection}
                  instagramConnection={instagramConnection}
                  platforms={platforms}
                />
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <Label className="font-semibold">Onde Publicar?</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className={cn("flex items-center space-x-2 rounded-lg border p-4", !instagramConnection?.isConnected && "bg-gray-100 opacity-60")}>
                    <Checkbox id="platform-instagram" checked={platforms.includes('instagram')} onCheckedChange={() => onPlatformChange('instagram')} disabled={!instagramConnection?.isConnected} />
                    <Label htmlFor="platform-instagram" className="flex items-center gap-2 cursor-pointer"><Instagram className="w-5 h-5 text-pink-500" />Instagram</Label>
                  </div>
                  <div className={cn("flex items-center space-x-2 rounded-lg border p-4", !metaConnection?.isConnected && "bg-gray-100 opacity-60")}>
                    <Checkbox id="platform-facebook" checked={platforms.includes('facebook')} onCheckedChange={() => onPlatformChange('facebook')} disabled={!metaConnection?.isConnected} />
                    <Label htmlFor="platform-facebook" className="flex items-center gap-2 cursor-pointer"><Facebook className="w-5 h-5 text-blue-600" />Facebook</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Publicar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={() => onPublish('now')} disabled={isPublishing || platforms.length === 0} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" size="lg">
                    {isPublishing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                    {isPublishing ? 'Publicando...' : 'Publicar Agora'}
                  </Button>
                  <Button onClick={() => onPublish('schedule')} disabled={isPublishing || platforms.length === 0} variant="outline" size="lg">
                    <Calendar className="w-5 h-5 mr-2" />Agendar
                  </Button>
                </div>
                {!metaConnection?.isConnected && !instagramConnection?.isConnected && (
                  <p className="text-xs text-red-600 mt-2 text-center flex items-center justify-center gap-1">
                    <AlertTriangle className="w-4 h-4" />Conecte suas contas na página de "Conteúdo" para publicar.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Voltar para Edição</Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

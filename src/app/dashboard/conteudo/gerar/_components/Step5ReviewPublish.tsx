"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  Send,
  Calendar,
  Loader2,
  ArrowLeft,
  Instagram,
  Facebook,
  AlertTriangle,
  X,
} from "lucide-react";
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
  onPublish: (mode: "now" | "schedule") => void;
  onBack: () => void;
  isPublishing: boolean;
  collaborators: string[];
  collaboratorsInput: string;
  onCollaboratorsChange: (collaborators: string[]) => void;
  onCollaboratorsInputChange: (input: string) => void;
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
  isPublishing,
  collaborators,
  collaboratorsInput,
  onCollaboratorsChange,
  onCollaboratorsInputChange,
}: Step5ReviewPublishProps) => {
  const handleAddCollaborator = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = collaboratorsInput.trim().replace('@', '');
      if (val && collaborators.length < 3 && !collaborators.includes(val)) {
        onCollaboratorsChange([...collaborators, val]);
      }
      onCollaboratorsInputChange("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="mx-auto w-full max-w-4xl border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-accent" />
            Etapa 5: Revise e publique seu post
          </CardTitle>
          <p className="pt-1 text-sm text-gray-600">
            Revise o texto, a imagem e agende a publicação.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Preview do Post</h3>
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
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div
                    className={cn(
                      "flex items-center space-x-2 rounded-lg border p-4",
                      !instagramConnection?.isConnected && "bg-gray-100 opacity-60"
                    )}
                  >
                    <Checkbox
                      id="platform-instagram"
                      checked={platforms.includes("instagram")}
                      onCheckedChange={() => onPlatformChange("instagram")}
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
                  <div
                    className={cn(
                      "flex items-center space-x-2 rounded-lg border p-4",
                      !metaConnection?.isConnected && "bg-gray-100 opacity-60"
                    )}
                  >
                    <Checkbox
                      id="platform-facebook"
                      checked={platforms.includes("facebook")}
                      onCheckedChange={() => onPlatformChange("facebook")}
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
                </div>
              </div>

              {/* Collabs in Step 5 (AI) */}
              {platforms.includes("instagram") && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Colaboradores no Instagram (Opcional)</h3>
                  <div>
                    <Label className="text-sm">Convide até 3 perfis para dividir a postagem</Label>
                    <p className="text-xs text-gray-500 mb-2">Digite o @usuario e aperte Enter.</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {collaborators.map((username) => (
                        <div key={username} className="flex items-center gap-1 bg-pink-50 text-pink-700 border border-pink-200 px-2 py-1 rounded-full text-xs">
                          @{username}
                          <X className="h-3 w-3 cursor-pointer hover:text-pink-900" onClick={() => onCollaboratorsChange(collaborators.filter(c => c !== username))} />
                        </div>
                      ))}
                    </div>
                    <input 
                      type="text"
                      value={collaboratorsInput}
                      onChange={(e) => onCollaboratorsInputChange(e.target.value)}
                      onKeyDown={handleAddCollaborator}
                      placeholder="@colaborador"
                      disabled={collaborators.length >= 3}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-bold">Publicar</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Button
                    onClick={() => onPublish("now")}
                    disabled={isPublishing || platforms.length === 0}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    size="lg"
                  >
                    {isPublishing ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-5 w-5" />
                    )}
                    {isPublishing ? "Publicando..." : "Publicar Agora"}
                  </Button>
                  <Button
                    onClick={() => onPublish("schedule")}
                    disabled={isPublishing || platforms.length === 0}
                    variant="outline"
                    size="lg"
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Agendar
                  </Button>
                </div>
                {!metaConnection?.isConnected && !instagramConnection?.isConnected && (
                  <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Conecte suas contas na página de "Conteúdo" para publicar.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Edição
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

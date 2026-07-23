"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sparkles,
  Send,
  Calendar,
  Loader2,
  ArrowLeft,
  Instagram,
  Facebook,
  Linkedin,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PostPreview } from "./PostPreview";
import { GeneratedContent, Platform } from "../types";
import { MetaConnectionData } from "@/lib/services/meta-service";
import { InstagramConnectionData } from "@/lib/services/instagram-service";

import { useWizard } from "../context/WizardContext";

export const Step5ReviewPublish = () => {
  const {
    processedImageUrl,
    setProcessedImageUrl,
    selectedImage,
    generatedImages,
    user,
    metaConnection,
    instagramConnection,
    linkedinConnection,
    platforms,
    setPlatforms,
    setShowSchedulerModal,
    handlePublish,
    setStep,
    isPublishing,
    collaborators,
    collaboratorsInput,
    setCollaborators: onCollaboratorsChange,
    setCollaboratorsInput: onCollaboratorsInputChange,
    userTags,
    userTagsInput,
    setUserTags: onUserTagsChange,
    setUserTagsInput: onUserTagsInputChange,
    generatedContent,
    setGeneratedContent,
    selectedContentId,
    mode,
    isGeneratingCaption,
    handleGenerateCaption,
    businessProfile,
  } = useWizard();

  const isSyncImageMode = mode === "reference-photo" || mode === "reference-hybrid";

  const fallbackContent: GeneratedContent = {
    titulo: "Nova publicação",
    subtitulo: "",
    hashtags: []
  };

  const selectedContent =
    selectedContentId !== undefined ? generatedContent[parseInt(selectedContentId, 10)] || fallbackContent : fallbackContent;

  const handleEditContent = (field: keyof GeneratedContent, value: any) => {
    if (selectedContentId === undefined) {
      const baseContent = generatedContent[0] || fallbackContent;
      const updated = { ...baseContent, [field]: value };
      setGeneratedContent([updated]);
      setSelectedContentId("0");
      return;
    }
    const index = parseInt(selectedContentId, 10);
    setGeneratedContent((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const onBack = () => {
    // Limpa a URL processada para que Step4 exiba a imagem original editável com camadas de texto
    setProcessedImageUrl(null);
    setStep(isSyncImageMode ? 3 : 4);
  };
  const onPlatformChange = (p: Platform) =>
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const onPublish = (mode: "now" | "schedule") =>
    mode === "now" ? handlePublish("now") : setShowSchedulerModal(true);

  const displayImage = processedImageUrl || selectedImage || (generatedImages && generatedImages.length > 0 ? generatedImages[0] : null);
  if (!displayImage) return null;
  const handleAddCollaborator = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = collaboratorsInput.trim().replace("@", "");
      if (val && collaborators.length < 3 && !collaborators.includes(val)) {
        onCollaboratorsChange([...collaborators, val]);
      }
      onCollaboratorsInputChange("");
    }
  };

  const handleAddUserTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = userTagsInput.trim().replace("@", "");
      if (val && !userTags.some((t) => t.username === val)) {
        onUserTagsChange([...userTags, { username: val, x: 0.5, y: 0.5 }]);
      }
      onUserTagsInputChange("");
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
            Etapa 4: Revise e publique seu post
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
                  imageUrl={displayImage}
                  content={selectedContent}
                  user={user}
                  metaConnection={metaConnection}
                  instagramConnection={instagramConnection}
                  linkedinConnection={linkedinConnection}
                  businessProfile={businessProfile}
                  platforms={platforms}
                />
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <Label className="text-base font-bold">Editar Conteúdo</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-title"
                      className="text-xs font-semibold uppercase text-gray-500"
                    >
                      Título / Destaque
                    </Label>
                    <Input
                      id="edit-title"
                      value={selectedContent.titulo}
                      onChange={(e) => handleEditContent("titulo", e.target.value)}
                      className="bg-white"
                      placeholder="Título que aparece no post..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-subtitle"
                      className="text-xs font-semibold uppercase text-gray-500"
                    >
                      Legenda / Corpo do Post
                    </Label>
                    <Textarea
                      id="edit-subtitle"
                      value={selectedContent.subtitulo}
                      onChange={(e) => handleEditContent("subtitulo", e.target.value)}
                      className="min-h-[120px] resize-none bg-white"
                      placeholder="Escreva a legenda principal aqui..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="edit-hashtags"
                      className="text-xs font-semibold uppercase text-gray-500"
                    >
                      Hashtags
                    </Label>
                    <Input
                      id="edit-hashtags"
                      value={selectedContent.hashtags.join(" ")}
                      onChange={(e) =>
                        handleEditContent(
                          "hashtags",
                          e.target.value.split(" ").filter((h) => h.trim() !== "")
                        )
                      }
                      className="bg-white"
                      placeholder="#hashtag1 #hashtag2..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Onde Publicar?</Label>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                            onCheckedChange={() => onPlatformChange("instagram")}
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
                            onCheckedChange={() => onPlatformChange("facebook")}
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
                            platforms.includes("linkedin") && linkedinConnection?.isConnected
                              ? "border-[#0083C7] bg-blue-50/50 shadow-sm"
                              : "border-gray-200 hover:bg-gray-50",
                            !linkedinConnection?.isConnected &&
                              "cursor-not-allowed bg-gray-100 opacity-60 hover:bg-gray-100"
                          )}
                        >
                          <Checkbox
                            id="platform-linkedin"
                            checked={
                              platforms.includes("linkedin") && !!linkedinConnection?.isConnected
                            }
                            onCheckedChange={() => onPlatformChange("linkedin")}
                            disabled={!linkedinConnection?.isConnected}
                          />
                          <Label
                            htmlFor="platform-linkedin"
                            className={cn(
                              "flex flex-1 cursor-pointer items-center gap-3 font-semibold text-gray-700",
                              !linkedinConnection?.isConnected && "cursor-not-allowed"
                            )}
                          >
                            <Linkedin className="h-5 w-5 text-blue-700" />
                            LinkedIn
                          </Label>
                        </div>
                      </TooltipTrigger>
                      {!linkedinConnection?.isConnected && (
                        <TooltipContent>
                          <p>Conecte seu LinkedIn na aba 'Conexões' para publicar.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
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
                              onCollaboratorsChange(collaborators.filter((c) => c !== username))
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={collaboratorsInput}
                      onChange={(e) => onCollaboratorsInputChange(e.target.value)}
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
                              onUserTagsChange(userTags.filter((t) => t.username !== tag.username))
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={userTagsInput}
                      onChange={(e) => onUserTagsInputChange(e.target.value)}
                      onKeyDown={handleAddUserTag}
                      placeholder="@usuario"
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
                {!metaConnection?.isConnected &&
                  !instagramConnection?.isConnected &&
                  !linkedinConnection?.isConnected && (
                    <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      Conecte suas contas na página de "Conteúdo" ou "Conexões" para publicar.
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

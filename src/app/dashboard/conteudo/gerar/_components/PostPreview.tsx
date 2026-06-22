"use client";

import React from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Facebook,
  Instagram,
  Store,
  Linkedin,
  Globe,
  ImageIcon,
  MoreVertical,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
} from "lucide-react";
import { GeneratedContent, Platform } from "../types";
import { MetaConnectionData } from "@/lib/services/meta-service";
import { InstagramConnectionData } from "@/lib/services/instagram-service";
import { LinkedInConnectionData } from "@/lib/services/linkedin-service";

interface PostPreviewProps {
  imageUrl: string | null;
  content: GeneratedContent | null;
  user: any;
  metaConnection: MetaConnectionData | null;
  instagramConnection: InstagramConnectionData | null;
  linkedinConnection?: LinkedInConnectionData | null;
  googleConnection?: any;
  businessProfile?: any;
  platforms: Platform[];
}

export const PostPreview = ({
  imageUrl,
  content,
  user,
  metaConnection,
  instagramConnection,
  linkedinConnection = null,
  googleConnection = null,
  businessProfile = null,
  platforms,
}: PostPreviewProps) => {
  const getAvatarFallback = (type: "facebook" | "instagram" | "google" | "linkedin") => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (type === "facebook" && metaConnection?.pageName)
      return metaConnection.pageName.charAt(0).toUpperCase();
    if (type === "instagram" && instagramConnection?.instagramUsername)
      return instagramConnection.instagramUsername.charAt(0).toUpperCase();
    if (type === "google" && businessProfile?.name)
      return businessProfile.name.charAt(0).toUpperCase();
    if (type === "linkedin") {
      if (linkedinConnection?.publishTarget === "organization" && linkedinConnection?.selectedOrganizationName)
        return linkedinConnection.selectedOrganizationName.charAt(0).toUpperCase();
      if (linkedinConnection?.personName)
        return linkedinConnection.personName.charAt(0).toUpperCase();
    }
    return "U";
  };

  const InstagramPreview = () => (
    <div className="flex w-full flex-col rounded-md border bg-white shadow-lg">
      <div className="flex items-center gap-2 border-b p-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.photoURL || undefined} />
          <AvatarFallback>{getAvatarFallback("instagram")}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-bold">
          {instagramConnection?.instagramUsername || "seu_usuario"}
        </span>
      </div>
      <div className="relative aspect-square bg-gray-200">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Preview"
            layout="fill"
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <ImageIcon className="mb-4 h-16 w-16 text-gray-400" />
            <p className="text-gray-500 text-xs">Sua imagem aparecerá aqui</p>
          </div>
        )}
      </div>
      <div className="min-h-[6rem] p-3 text-sm">
        <p className="whitespace-pre-wrap">
          <span className="font-bold">
            {instagramConnection?.instagramUsername || "seu_usuario"}
          </span>{" "}
          {content && (
            <>
              {content.titulo}
              {`\n\n${content.subtitulo}`}
              {content.hashtags && `\n\n${content.hashtags.join(" ")}`}
            </>
          )}
        </p>
      </div>
    </div>
  );

  const FacebookPreview = () => (
    <div className="flex w-full flex-col rounded-md border bg-white shadow-lg">
      <div className="flex items-center gap-2 border-b p-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.photoURL || undefined} />
          <AvatarFallback>{getAvatarFallback("facebook")}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-bold">
            {metaConnection?.pageName || "Sua Página"}
          </span>
          <span className="text-[10px] text-gray-500">Agora mesmo</span>
        </div>
      </div>
      <div className="p-3 text-sm">
        <p className="whitespace-pre-wrap">
          {content && (
            <>
              {content.titulo}
              {`\n\n${content.subtitulo}`}
              {content.hashtags && `\n\n${content.hashtags.join(" ")}`}
            </>
          )}
        </p>
      </div>
      <div className="relative aspect-square bg-gray-200">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Preview"
            layout="fill"
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <ImageIcon className="mb-4 h-16 w-16 text-gray-400" />
            <p className="text-gray-500 text-xs">Sua imagem aparecerá aqui</p>
          </div>
        )}
      </div>
    </div>
  );

  const GooglePreview = () => (
    <div className="flex w-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 border border-gray-100">
              <AvatarImage src={businessProfile?.logo?.url || user?.photoURL || undefined} />
              <AvatarFallback className="bg-blue-600 text-white font-bold">{getAvatarFallback("google")}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1.5 -right-1.5 rounded-full bg-white p-0.5 shadow-sm">
              <svg className="h-4 w-4 text-[#1a73e8]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.7 3.1 5.51l.34 3.69L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-900 leading-none pb-0.5">
                {businessProfile?.name || user?.displayName || "Minha Empresa"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-xs text-gray-500">há 2 minutos</p>
            </div>
          </div>
        </div>
        <MoreVertical className="h-5 w-5 cursor-pointer text-gray-500" />
      </div>
      <div className="relative aspect-[4/3] w-full bg-black flex items-center justify-center border-y border-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Preview"
            layout="fill"
            className="h-full w-full object-contain"
            unoptimized
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center bg-gray-50">
            <ImageIcon className="mb-4 h-16 w-16 text-gray-400" />
            <p className="text-gray-500 text-xs">Sua imagem aparecerá aqui</p>
          </div>
        )}
      </div>
      <div className="px-4 pt-3 pb-4 text-sm text-gray-800 leading-relaxed">
        <p className="whitespace-pre-wrap">
          {content ? (
            <>
              {content.titulo}
              {`\n\n${content.subtitulo}`}
              {content.hashtags && `\n\n${content.hashtags.join(" ")}`}
            </>
          ) : "legenda"}
        </p>
      </div>
    </div>
  );

  const LinkedInPreview = () => {
    const getDisplayName = () => {
      if (linkedinConnection?.publishTarget === "organization" && linkedinConnection?.selectedOrganizationName) {
        return linkedinConnection.selectedOrganizationName;
      }
      return linkedinConnection?.personName || user?.displayName || "Seu Nome (LinkedIn)";
    };

    return (
      <div className="flex w-full flex-col rounded-md border bg-white shadow-lg">
        <div className="flex items-start justify-between p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback>{getAvatarFallback("linkedin")}</AvatarFallback>
            </Avatar>
            <div>
              <span className="text-sm font-bold text-gray-800 block">
                {getDisplayName()}
              </span>
              <div className="flex items-center gap-1">
                <p className="text-[11px] text-gray-500">Qualquer pessoa · Agora mesmo</p>
                <Globe className="h-3 w-3 text-gray-500" />
              </div>
            </div>
          </div>
          <MoreHorizontal className="h-5 cursor-pointer text-gray-600" />
        </div>
        <div className="px-3 pb-2 text-sm text-gray-800">
          <p className="whitespace-pre-wrap">
            {content && (
              <>
                {content.titulo}
                {`\n\n${content.subtitulo}`}
                {content.hashtags && `\n\n${content.hashtags.join(" ")}`}
              </>
            )}
          </p>
        </div>
        <div className="relative aspect-square bg-gray-200">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Preview"
              layout="fill"
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <ImageIcon className="mb-4 h-16 w-16 text-gray-400" />
              <p className="text-gray-500 text-xs">Sua imagem aparecerá aqui</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t p-1.5 text-xs text-gray-500 font-medium">
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 hover:bg-gray-100">
            <ThumbsUp className="h-4 w-4" />
            <span>Gostei</span>
          </button>
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 hover:bg-gray-100">
            <MessageCircle className="h-4 w-4" />
            <span>Comentar</span>
          </button>
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 hover:bg-gray-100">
            <Share2 className="h-4 w-4" />
            <span>Compartilhar</span>
          </button>
        </div>
      </div>
    );
  };

  const defaultTab = platforms.includes("instagram")
    ? "instagram"
    : platforms.includes("facebook")
    ? "facebook"
    : platforms.includes("google")
    ? "google"
    : "linkedin";

  return (
    <div className="w-full max-w-sm">
      <Tabs defaultValue={defaultTab}>
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="instagram" disabled={!platforms.includes("instagram")} className="text-xs px-1">
            <Instagram className="mr-1 h-3.5 w-3.5 text-pink-500" />
            Instagram
          </TabsTrigger>
          <TabsTrigger value="facebook" disabled={!platforms.includes("facebook")} className="text-xs px-1">
            <Facebook className="mr-1 h-3.5 w-3.5 text-blue-600" />
            Facebook
          </TabsTrigger>
          <TabsTrigger value="google" disabled={!platforms.includes("google")} className="text-xs px-1">
            <Store className="mr-1 h-3.5 w-3.5 text-blue-500" />
            Google
          </TabsTrigger>
          <TabsTrigger value="linkedin" disabled={!platforms.includes("linkedin")} className="text-xs px-1">
            <Linkedin className="mr-1 h-3.5 w-3.5 text-blue-700" />
            LinkedIn
          </TabsTrigger>
        </TabsList>
        <TabsContent value="instagram">
          <InstagramPreview />
        </TabsContent>
        <TabsContent value="facebook">
          <FacebookPreview />
        </TabsContent>
        <TabsContent value="google">
          <GooglePreview />
        </TabsContent>
        <TabsContent value="linkedin">
          <LinkedInPreview />
        </TabsContent>
      </Tabs>
    </div>
  );
};

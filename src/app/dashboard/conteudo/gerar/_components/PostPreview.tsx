"use client";

import React from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Facebook, Instagram } from "lucide-react";
import { GeneratedContent, Platform } from "../types";
import { MetaConnectionData } from "@/lib/services/meta-service";
import { InstagramConnectionData } from "@/lib/services/instagram-service";

interface PostPreviewProps {
  imageUrl: string | null;
  content: GeneratedContent | null;
  user: any;
  metaConnection: MetaConnectionData | null;
  instagramConnection: InstagramConnectionData | null;
  platforms: Platform[];
}

export const PostPreview = ({
  imageUrl,
  content,
  user,
  metaConnection,
  instagramConnection,
  platforms,
}: PostPreviewProps) => {
  const getAvatarFallback = (type: "facebook" | "instagram") => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (type === "facebook" && metaConnection?.pageName)
      return metaConnection.pageName.charAt(0).toUpperCase();
    if (type === "instagram" && instagramConnection?.instagramUsername)
      return instagramConnection.instagramUsername.charAt(0).toUpperCase();
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
              {content.título}
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
              {content.título}
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

  return (
    <div className="w-full max-w-sm">
      <Tabs defaultValue={platforms.includes("instagram") ? "instagram" : "facebook"}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="instagram" disabled={!platforms.includes("instagram")}>
            <Instagram className="mr-2 h-4 w-4 text-pink-500" />
            Instagram
          </TabsTrigger>
          <TabsTrigger value="facebook" disabled={!platforms.includes("facebook")}>
            <Facebook className="mr-2 h-4 w-4 text-blue-600" />
            Facebook
          </TabsTrigger>
        </TabsList>
        <TabsContent value="instagram">
          <InstagramPreview />
        </TabsContent>
        <TabsContent value="facebook">
          <FacebookPreview />
        </TabsContent>
      </Tabs>
    </div>
  );
};

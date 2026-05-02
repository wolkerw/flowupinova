"use client";

import React from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const getAvatarFallback = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (metaConnection?.pageName) return metaConnection.pageName.charAt(0).toUpperCase();
    if (instagramConnection?.instagramUsername)
      return instagramConnection.instagramUsername.charAt(0).toUpperCase();
    return "U";
  };

  const getPageName = () => {
    if (platforms.includes("facebook") && metaConnection?.pageName) {
      return metaConnection.pageName;
    }
    if (platforms.includes("instagram") && instagramConnection?.instagramUsername) {
      return instagramConnection.instagramUsername;
    }
    return metaConnection?.pageName || instagramConnection?.instagramUsername || "Sua Página";
  };

  return (
    <div className="w-full max-w-sm">
      <div className="flex w-full flex-col rounded-md border bg-white shadow-lg">
        <div className="flex items-center gap-2 border-b p-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-bold">{getPageName()}</span>
        </div>
        <div className="relative aspect-square bg-gray-200">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Preview da imagem"
              layout="fill"
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <ImageIcon className="mb-4 h-16 w-16 text-gray-400" />
              <p className="text-gray-500">Sua imagem aparecerá aqui</p>
            </div>
          )}
        </div>
        <div className="min-h-[6rem] p-3 text-sm">
          <p className="whitespace-pre-wrap">
            <span className="font-bold">{getPageName()}</span>{" "}
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
    </div>
  );
};

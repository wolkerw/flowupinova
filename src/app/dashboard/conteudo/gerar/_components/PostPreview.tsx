"use client";

import React from "react";
import Image from 'next/image';
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
    if (instagramConnection?.instagramUsername) return instagramConnection.instagramUsername.charAt(0).toUpperCase();
    return "U";
  };

  const getPageName = () => {
    if (platforms.includes('facebook') && metaConnection?.pageName) {
      return metaConnection.pageName;
    }
    if (platforms.includes('instagram') && instagramConnection?.instagramUsername) {
      return instagramConnection.instagramUsername;
    }
    return metaConnection?.pageName || instagramConnection?.instagramUsername || "Sua Página";
  };

  return (
    <div className="w-full max-w-sm">
      <div className="w-full bg-white rounded-md shadow-lg border flex flex-col">
        <div className="p-3 flex items-center gap-2 border-b">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
          </Avatar>
          <span className="font-bold text-sm">{getPageName()}</span>
        </div>
        <div className="relative aspect-square bg-gray-200">
          {imageUrl ? (
            <Image 
              src={imageUrl} 
              alt="Preview da imagem" 
              layout="fill" 
              className="object-cover w-full h-full" 
              unoptimized 
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 h-full">
              <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-500">Sua imagem aparecerá aqui</p>
            </div>
          )}
        </div>
        <div className="p-3 text-sm min-h-[6rem]">
          <p className="whitespace-pre-wrap">
            <span className="font-bold">{getPageName()}</span>{' '}
            {content && (
              <>
                {content.título}
                {`\n\n${content.subtitulo}`}
                {content.hashtags && `\n\n${content.hashtags.join(' ')}`}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

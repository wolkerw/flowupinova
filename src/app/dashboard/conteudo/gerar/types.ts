export interface GeneratedContent {
  título: string;
  subtitulo: string;
  hashtags: string[];
  url_da_imagem?: string;
}

export type Platform = 'instagram' | 'facebook';

export type LogoPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'left-center' 
  | 'center' 
  | 'right-center' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

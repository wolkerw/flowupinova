export interface GeneratedContent {
  titulo: string;
  subtitulo: string;
  hashtags: string[];
  url_da_imagem?: string;
}

export type Platform = "instagram" | "facebook" | "google";

export type LogoPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "left-center"
  | "center"
  | "right-center"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

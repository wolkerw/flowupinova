"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  setDoc,
  arrayUnion,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFriendlyErrorMessage } from "@/lib/utils";
import { schedulePost, deletePost } from "@/lib/services/posts-service";
import { getMetaConnection, type MetaConnectionData } from "@/lib/services/meta-service";
import {
  getInstagramConnection,
  type InstagramConnectionData,
} from "@/lib/services/instagram-service";
import {
  getLinkedInConnection,
  type LinkedInConnectionData,
} from "@/lib/services/linkedin-service";
import {
  getOnboardingProfile,
  type OnboardingProfileData,
} from "@/lib/services/onboarding-service";
import {
  getUnusedImages,
  saveUnusedImages,
  getContentHistory,
  saveContentHistory,
} from "@/lib/services/user-data-service";
import { GeneratedContent, Platform, LogoPosition } from "../types";

interface WizardContextType {
  // States
  step: number;
  setStep: (step: number) => void;
  postSummary: string;
  setPostSummary: (summary: string) => void;
  isLoading: boolean;
  generatedContent: GeneratedContent[];
  setGeneratedContent: React.Dispatch<React.SetStateAction<GeneratedContent[]>>;
  selectedContentId: string | undefined;
  setSelectedContentId: (id: string | undefined) => void;
  generatedImages: string[];
  setGeneratedImages: React.Dispatch<React.SetStateAction<string[]>>;
  selectedImage: string | null;
  setSelectedImage: (url: string | null) => void;
  processedImageUrl: string | null;
  setProcessedImageUrl: (url: string | null) => void;
  showSchedulerModal: boolean;
  setShowSchedulerModal: (show: boolean) => void;
  isPublishing: boolean;
  scheduleDateTime: string;
  setScheduleDateTime: (dateTime: string) => void;
  platforms: Platform[];
  setPlatforms: React.Dispatch<React.SetStateAction<Platform[]>>;
  collaborators: string[];
  setCollaborators: (collabs: string[]) => void;
  collaboratorsInput: string;
  setCollaboratorsInput: (input: string) => void;
  userTags: { username: string; x: number; y: number }[];
  setUserTags: (tags: { username: string; x: number; y: number }[]) => void;
  userTagsInput: string;
  setUserTagsInput: (input: string) => void;
  isGeneratingImages: boolean;
  setIsGeneratingImages: (val: boolean) => void;
  // Legacy canStartPolling removed
  contentHistory: GeneratedContent[];
  unusedImagesHistory: string[];
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  handleSubmitImageGeneration: (
    customPromptOverride?: string | string[],
    postIdOverride?: string,
    contentOverride?: GeneratedContent
  ) => Promise<void>;
  isRetailStyle: boolean;
  setIsRetailStyle: (val: boolean) => void;
  useImagen4Ref: boolean;
  setUseImagen4Ref: (val: boolean) => void;
  useNanoBananaRef: boolean;
  setUseNanoBananaRef: (val: boolean) => void;
  fluxImageUrl: string | null;
  setFluxImageUrl: React.Dispatch<React.SetStateAction<string | null>>;

  // Reference Image States
  referenceImageFile: File | null;
  setReferenceImageFile: (file: File | null) => void;
  referenceImagePreview: string | null;
  setReferenceImagePreview: (preview: string | null) => void;
  inspirationFile: File | null;
  setInspirationFile: (file: File | null) => void;
  referenceDescription: string;
  setReferenceDescription: (desc: string) => void;
  referenceLink: string;
  setReferenceLink: (link: string) => void;
  secondaryReferenceImageFile: File | null;
  setSecondaryReferenceImageFile: (file: File | null) => void;
  secondaryReferenceImagePreview: string | null;
  setSecondaryReferenceImagePreview: (preview: string | null) => void;
  secondaryReferenceDescription: string;
  setSecondaryReferenceDescription: (desc: string) => void;
  hybridPriority: "person" | "scenario" | "balanced";
  setHybridPriority: (priority: "person" | "scenario" | "balanced") => void;
  productWorkflow: "text-ambientation" | "packshot-hybrid" | null;
  setProductWorkflow: (workflow: "text-ambientation" | "packshot-hybrid" | null) => void;

  // Customization States
  logoFile: File | null;
  setLogoFile: (file: File | null) => void;
  logoPreviewUrl: string | null;
  setLogoPreviewUrl: (url: string | null) => void;
  logoPosition: LogoPosition;
  setLogoPosition: (pos: LogoPosition) => void;
  logoScale: number;
  setLogoScale: (scale: number) => void;
  logoOpacity: number;
  setLogoOpacity: (opacity: number) => void;
  showTextOverlay: boolean;
  setShowTextOverlay: (show: boolean) => void;
  textPosition: LogoPosition;
  setTextPosition: (pos: LogoPosition) => void;
  textScale: number;
  setTextScale: (scale: number) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontWeight: string;
  setFontWeight: (weight: string) => void;
  isItalic: boolean;
  setIsItalic: (italic: boolean) => void;
  insertTextOnImage: boolean | null;
  setInsertTextOnImage: (val: boolean | null) => void;
  generateTextSuggestions: boolean;
  setGenerateTextSuggestions: (val: boolean) => void;
  layoutStyle: string;
  setLayoutStyle: (style: string) => void;
  isUploading: boolean;

  // Computed & Refs
  mode: string | null;
  user: any;
  metaConnection: MetaConnectionData | null;
  instagramConnection: InstagramConnectionData | null;
  linkedinConnection: LinkedInConnectionData | null;
  businessProfile: OnboardingProfileData | null;
  currentPostId: string | null;
  visualLogoScale: number;
  selectedContent: GeneratedContent | null;
  logoInputRef: React.RefObject<HTMLInputElement>;
  foundFilesRef: React.RefObject<Set<string>>;

  // Handlers
  handleGenerateText: (summary?: string) => Promise<GeneratedContent[] | null>;
  handleGeneratePostContent: () => Promise<void>;
  handleGeneratePrompts: () => Promise<void>;
  handleLogoProcessing: () => Promise<void>;
  handlePublish: (publishMode: "now" | "schedule") => Promise<void>;
  handleReferenceImageChange: (file: File | null) => void;
  handleSecondaryReferenceImageChange: (file: File | null) => void;
  handleDownloadImage: (url: string) => Promise<void>;
  handleLogoFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isGeneratingCaption: boolean;
  handleGenerateCaption: () => Promise<void>;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const WizardProvider = ({ children }: { children: React.ReactNode }) => {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const isSyncImageMode = mode === "reference-photo" || mode === "reference-hybrid";
  const [step, setStep] = useState(1);
  const [postSummary, setPostSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generateTextSuggestions, setGenerateTextSuggestions] = useState<boolean>(true);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | undefined>(undefined);

  const handleSelectedContentIdChange = async (id: string | undefined) => {
    setSelectedContentId(id);
    if (id !== undefined && currentPostId && user) {
      const sel = generatedContent[parseInt(id, 10)];
      if (sel) {
        try {
          const fullCaption = `${sel.titulo}\n\n${sel.subtitulo}\n\n${Array.isArray(sel.hashtags) ? sel.hashtags.join(" ") : ""}`;
          const postDocRef = doc(db, "users", user.uid, "posts", currentPostId);
          await updateDoc(postDocRef, { text: fullCaption });
          console.log("[WIZARD] Rascunho atualizado no Firestore com a legenda selecionada:", id);
        } catch (err) {
          console.error("Erro ao atualizar a legenda selecionada no Firestore:", err);
        }
      }
    }
  };
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const [collaboratorsInput, setCollaboratorsInput] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>([]);

  const [userTagsInput, setUserTagsInput] = useState("");
  const [userTags, setUserTags] = useState<{ username: string; x: number; y: number }[]>([]);

  const [metaConnection, setMetaConnection] = useState<MetaConnectionData | null>(null);
  const [instagramConnection, setInstagramConnection] = useState<InstagramConnectionData | null>(
    null
  );
  const [linkedinConnection, setLinkedinConnection] = useState<LinkedInConnectionData | null>(null);
  const [businessProfile, setBusinessProfile] = useState<OnboardingProfileData | null>(null);

  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  // Legacy canStartPolling state removed
  const [contentHistory, setContentHistory] = useState<GeneratedContent[]>([]);
  const [unusedImagesHistory, setUnusedImagesHistory] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isRetailStyle, setIsRetailStyle] = useState<boolean>(false);
  const [useImagen4Ref, setUseImagen4Ref] = useState<boolean>(false);
  const [useNanoBananaRef, setUseNanoBananaRef] = useState<boolean>(true);
  const [layoutStyle, setLayoutStyle] = useState<string>("CLEAN_LUXURY");
  const [fluxImageUrl, setFluxImageUrl] = useState<string | null>(null);

  const [isGeneratingCaption, setIsGeneratingCaption] = useState<boolean>(false);

  // Estados para imagem de referência
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [inspirationFile, setInspirationFile] = useState<File | null>(null);
  const [referenceDescription, setReferenceDescription] = useState("");
  const [referenceLink, setReferenceLink] = useState("");
  const [secondaryReferenceImageFile, setSecondaryReferenceImageFile] = useState<File | null>(null);
  const [secondaryReferenceImagePreview, setSecondaryReferenceImagePreview] = useState<
    string | null
  >(null);
  const [secondaryReferenceDescription, setSecondaryReferenceDescription] = useState("");
  const [hybridPriority, setHybridPriority] = useState<"person" | "scenario" | "balanced">(
    "balanced"
  );
  const [productWorkflow, setProductWorkflow] = useState<
    "text-ambientation" | "packshot-hybrid" | null
  >(null);

  // Personalização
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("bottom-right");
  const [logoScale, setLogoScale] = useState(30);
  const [logoOpacity, setLogoOpacity] = useState(100);

  // Text Overlay States
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [textPosition, setTextPosition] = useState<LogoPosition>("top-center");
  const [textScale, setTextScale] = useState(100);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontWeight, setFontWeight] = useState("bold");
  const [isItalic, setIsItalic] = useState(false);
  const [insertTextOnImage, setInsertTextOnImage] = useState<boolean | null>(true);

  const [isUploading, setIsUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [lastGeneratedText, setLastGeneratedText] = useState<string>("");
  const [lastConceptPromptUsed, setLastConceptPromptUsed] = useState<string>("");
  const [lastSelectedContentIdUsed, setLastSelectedContentIdUsed] = useState<string | undefined>(
    undefined
  );

  const handleSelectedImageChange = (url: string | null) => {
    setSelectedImage(url);
    setProcessedImageUrl(null); // Limpa a imagem processada com logo antigo ao mudar de imagem conceito
  };

  const foundFilesRef = useRef<Set<string>>(new Set());
  const blobURLsRef = useRef<Set<string>>(new Set());
  const generatedImagesRef = useRef<string[]>([]);
  const userRef = useRef<any>(null);

  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const visualLogoScale = 5 + (logoScale - 10) * (45 / 90);
  const selectedContent = selectedContentId
    ? generatedContent[parseInt(selectedContentId, 10)]
    : null;

  const fetchUnusedImages = useCallback(async () => {
    if (!user) return;
    try {
      const unusedImages = await getUnusedImages(user.uid);
      setUnusedImagesHistory(unusedImages.reverse());
    } catch (error: any) {
      console.error("Failed to fetch unused images:", error);
    }
  }, [user]);

  const fetchContentHistory = useCallback(async () => {
    if (!user) return;
    try {
      const history = await getContentHistory(user.uid);
      setContentHistory(history);
    } catch (error: any) {
      console.error("Failed to fetch content history:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    userRef.current = user;

    async function loadInitialData() {
      try {
        if (!user) return;
        const [metaConn, instaConn, linkedinConn, busProfile] = await Promise.all([
          getMetaConnection(user.uid),
          getInstagramConnection(user.uid),
          getLinkedInConnection(user.uid),
          getOnboardingProfile(user.uid),
        ]);
        setMetaConnection(metaConn);
        setInstagramConnection(instaConn);
        setLinkedinConnection(linkedinConn);
        setBusinessProfile(busProfile);

        const initialPlatforms: Platform[] = [];
        if (metaConn?.isConnected) initialPlatforms.push("facebook");
        if (instaConn?.isConnected) initialPlatforms.push("instagram");
        if (linkedinConn?.isConnected) initialPlatforms.push("linkedin");
        setPlatforms(initialPlatforms);

        // Inicializar a logomarca do Brand Kit se existir e nenhuma estiver selecionada
        const brandKitLogoUrl =
          busProfile?.logo?.url ||
          busProfile?.brandKit?.logoUrl ||
          (busProfile as any)?.logoUrl ||
          (busProfile as any)?.logo;

        if (brandKitLogoUrl && typeof brandKitLogoUrl === "string") {
          setLogoPreviewUrl(brandKitLogoUrl);

          const logoUrlToFetch = brandKitLogoUrl.startsWith("http")
            ? `/api/conteudo/gerar-referencia?action=proxy&url=${encodeURIComponent(brandKitLogoUrl)}`
            : brandKitLogoUrl;

          fetch(logoUrlToFetch)
            .then((res) => {
              if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
              }
              return res.blob();
            })
            .then((blob) => {
              const file = new File([blob], "logo-brandkit.png", {
                type: blob.type || "image/png",
              });
              setLogoFile(file);
            })
            .catch((err) => {
              console.warn(
                "Aviso: Não foi possível pré-carregar o arquivo físico da logo do Brand Kit (CORS/Rede), utilizando apenas URL de visualização:",
                err.message || err
              );
            });
        }
      } catch (error: any) {
        console.error("Failed to load initial data:", error);
      }
    }

    loadInitialData();
  }, [user]);

  useEffect(() => {
    generatedImagesRef.current = generatedImages;
  }, [generatedImages]);

  useEffect(() => {
    return () => {
      const currentImages = generatedImagesRef.current;
      const currentUser = userRef.current;

      if (currentUser && currentImages.length > 0) {
        const remoteUrls = currentImages.filter((url) => !url.startsWith("blob:"));
        if (remoteUrls.length > 0) {
          saveUnusedImages(currentUser.uid, remoteUrls).catch(console.error);
        }
      }

      blobURLsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn("Falha ao revogar URL:", url, e);
        }
      });
      blobURLsRef.current.clear();
    };
  }, []);

  // Polling useEffect for webhook removed as it's no longer used

  const handleReferenceImageChange = (file: File | null) => {
    if (file) {
      const url = URL.createObjectURL(file);
      blobURLsRef.current.add(url);
      setReferenceImageFile(file);
      setReferenceImagePreview(url);
    } else {
      setReferenceImageFile(null);
      setReferenceImagePreview(null);
      setReferenceDescription("");
    }
  };

  const handleSecondaryReferenceImageChange = (file: File | null) => {
    if (file) {
      const url = URL.createObjectURL(file);
      blobURLsRef.current.add(url);
      setSecondaryReferenceImageFile(file);
      setSecondaryReferenceImagePreview(url);
    } else {
      setSecondaryReferenceImageFile(null);
      setSecondaryReferenceImagePreview(null);
      setSecondaryReferenceDescription("");
    }
  };

  const handleGenerateText = async (summary?: any) => {
    if (!generateTextSuggestions) {
      setGeneratedContent([]);
      setSelectedContentId(undefined);

      if (mode === "reference-photo" || mode === "reference-hybrid") {
        handleGeneratePrompts().catch((err) => {
          console.error("Erro na geração de prompt de imagem em paralelo:", err);
        });
        setStep(3);
        return null;
      }

      setStep(3);
      handleGeneratePrompts();
      return null;
    }

    if (mode === "reference-photo" || mode === "reference-hybrid") {
      let textToGenerate = referenceDescription;
      if (!textToGenerate.trim() || isLoading || !user) return null;
      setIsLoading(true);

      // Iniciar a geração da imagem em paralelo
      handleGeneratePrompts().catch((err) => {
        console.error("Erro na geração de prompt de imagem em paralelo:", err);
      });

      try {
        const response = await fetch("/api/generate-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary: textToGenerate, businessProfile }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.details || data.error || "Erro na API");

        const publicacoes = Array.isArray(data)
          ? data[0]?.publicacoes || data
          : data.publicacoes || data;

        if (Array.isArray(publicacoes)) {
          const mappedContent = publicacoes.map((item: any) => ({
            titulo: item.titulo || item.título || "",
            subtitulo: item.subtitulo || "",
            hashtags: item.hashtags || [],
            url_da_imagem: item.url_da_imagem,
          }));

          setGeneratedContent(mappedContent);
          setSelectedContentId("0");
          await saveContentHistory(user.uid, mappedContent);
          await fetchContentHistory();
          return mappedContent;
        } else {
          throw new Error("O formato da resposta da IA é inesperado.");
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erro ao gerar textos sugeridos",
          description: getFriendlyErrorMessage(error.message),
        });
        return null;
      } finally {
        setIsLoading(false);
        setStep(2);
      }
    }

    let textToGenerate = (typeof summary === "string" ? summary : null) || postSummary;

    if ((mode === "reference-link" || (mode === "concept" && inspirationFile)) && !summary) {
      if (mode === "concept") {
        if (!postSummary.trim()) {
          toast({
            title: "Campos obrigatórios",
            description: "Por favor, descreva a ideia do seu conteúdo.",
          });
          return null;
        }
      } else {
        if (!inspirationFile || !referenceDescription.trim()) {
          toast({
            title: "Campos obrigatórios",
            description: "Por favor, envie uma imagem de inspiração e descreva o que deseja.",
          });
          return null;
        }
      }
      setIsLoading(true);
      try {
        const formData = new FormData();
        if (inspirationFile) {
          formData.append("inspiration_file", inspirationFile);
        }

        const combinedDescription =
          mode === "concept"
            ? postSummary.trim()
            : postSummary.trim()
              ? `${referenceDescription.trim()} Ideia/Texto da promoção do lojista a ser destacado na imagem: "${postSummary.trim()}".`
              : referenceDescription;

        formData.append("description", combinedDescription);
        formData.append("user_id", user?.uid || "");

        if (businessProfile) {
          formData.append("business_profile_json", JSON.stringify(businessProfile));
        }

        if (referenceImageFile) {
          formData.append("product_file", referenceImageFile);
        }

        const response = await fetch("/api/proxy-webhook?target=gerador_link_referencia", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.details || "Erro ao processar link de referência.");

        const publicacoes = Array.isArray(data)
          ? data[0]?.publicacoes || data
          : data.publicacoes || data;

        if (Array.isArray(publicacoes)) {
          const mappedContent = publicacoes.map((item: any) => ({
            titulo: item.titulo || item.título || "",
            subtitulo: item.subtitulo || "",
            hashtags: item.hashtags || [],
            url_da_imagem: item.url_da_imagem,
          }));

          setGeneratedContent(mappedContent);
          setSelectedContentId("0");
          setStep(2);
          return mappedContent;
        }
        throw new Error("Formato de resposta inválido do webhook.");
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erro no Link",
          description: getFriendlyErrorMessage(error.message),
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    }

    if (
      (mode === "reference-photo" || mode === "reference-hybrid") &&
      !textToGenerate.trim() &&
      referenceDescription.trim()
    ) {
      textToGenerate = referenceDescription;
    }

    if (!textToGenerate.trim() || isLoading) return null;
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: textToGenerate, businessProfile }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || "Erro na API");

      const publicacoes = Array.isArray(data)
        ? data[0]?.publicacoes || data
        : data.publicacoes || data;

      if (Array.isArray(publicacoes)) {
        const mappedContent = publicacoes.map((item: any) => ({
          titulo: item.titulo || item.título || "",
          subtitulo: item.subtitulo || "",
          hashtags: item.hashtags || [],
          url_da_imagem: item.url_da_imagem,
        }));

        setGeneratedContent(mappedContent);
        setSelectedContentId("0");
        setStep(2);
        if (!summary && user) {
          saveContentHistory(user.uid, mappedContent).catch((e) =>
            console.warn("Erro ao salvar histórico de conteúdo:", e)
          );
          fetchContentHistory().catch((e) =>
            console.warn("Erro ao atualizar histórico de conteúdo:", e)
          );
        }
        return mappedContent;
      } else {
        throw new Error("O formato da resposta da IA é inesperado.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar texto",
        description: getFriendlyErrorMessage(error.message),
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePostContent = async () => {
    if (!user || isLoading) return;
    setIsLoading(true);
    try {
      const imageUrl = generatedContent[0]?.url_da_imagem;
      const formData = new FormData();
      formData.append("imageUrl", imageUrl || "");
      formData.append("businessProfile", JSON.stringify(businessProfile || {}));
      formData.append("referenceDescription", referenceDescription || "");
      formData.append("postId", currentPostId || "");
      formData.append("userId", user.uid);

      const response = await fetch("/api/conteudo/gerar-ideias", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || "Erro ao gerar conteúdo.");

      const publicacoes = Array.isArray(data)
        ? data[0]?.publicacoes || data
        : data.publicacoes || [data];

      if (Array.isArray(publicacoes)) {
        const mappedContent = publicacoes.map((item: any) => ({
          titulo: item.titulo || item.título || "",
          subtitulo: item.subtitulo || "",
          hashtags: item.hashtags || [],
          url_da_imagem: imageUrl || item.url_da_imagem,
        }));

        setGeneratedContent(mappedContent);
        setSelectedContentId("0");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro na Geração",
        description: getFriendlyErrorMessage(error.message),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePrompts = async (contentOverride?: GeneratedContent) => {
    const selContent =
      contentOverride ||
      (selectedContentId !== undefined
        ? generatedContent[parseInt(selectedContentId, 10)]
        : generatedContent[0]) ||
      (!generateTextSuggestions
        ? { titulo: postSummary || referenceDescription, subtitulo: "", hashtags: [] }
        : undefined);
    if (!user) return;
    if (!isSyncImageMode && !selContent && generateTextSuggestions) return;

    // Inteligência de navegação para evitar regerar imagens conceito se nada mudou
    if (!referenceImageFile && mode !== "reference-photo" && mode !== "reference-link") {
      const expectedLength = inspirationFile ? 1 : 2;
      const hasImages = generatedImages && generatedImages.length === expectedLength;
      const hasNoChanges =
        hasImages &&
        postSummary.trim() === lastConceptPromptUsed.trim() &&
        selectedContentId === lastSelectedContentIdUsed;

      if (hasNoChanges) {
        console.log(
          "[WIZARD] Nenhuma alteração no prompt inicial ou na escolha do texto. Mantendo imagens conceito anteriores."
        );
        setStep(3);
        return;
      }
    }

    setIsGeneratingImages(true);
    setSelectedImage(null);
    setGeneratedImages([]);
    foundFilesRef.current.clear();

    try {
      // Deletar o rascunho de post anterior ("draft") no Firestore local se o lojista decidir regerar os prompts
      if (currentPostId) {
        try {
          await deletePost(user.uid, currentPostId);
          console.log(
            "[WIZARD] Post de rascunho anterior abandonado foi deletado do Firestore com sucesso."
          );
        } catch (deleteError) {
          console.error("[WIZARD] Erro ao deletar rascunho anterior obsoleto:", deleteError);
        }
      }
      const fullCaption = selContent
        ? `${selContent.titulo}\n\n${selContent.subtitulo}\n\n${Array.isArray(selContent.hashtags) ? selContent.hashtags.join(" ") : ""}`
        : "";
      const postsRef = collection(db, "users", user.uid, "posts");
      const docRef = await addDoc(postsRef, {
        text: fullCaption,
        status: "draft",
        promoText: postSummary.trim() || "",
        promptUsed: postSummary.trim() || "",
        isRetailStyle: isRetailStyle,
        createdAt: serverTimestamp(),
        scheduledAt: serverTimestamp(),
        imageUrls: [],
        platforms: [],
        isCarousel: false,
        connections: {
          instagramUsername: instagramConnection?.instagramUsername || null,
          pageName: metaConnection?.pageName || null,
          linkedinName: linkedinConnection?.isConnected
            ? linkedinConnection.publishTarget === "organization"
              ? linkedinConnection.selectedOrganizationName || "Página corporativa"
              : linkedinConnection.personName || "Perfil pessoal"
            : null,
        },
      });
      const postId = docRef.id;
      setCurrentPostId(postId);

      if (referenceImageFile) {
        // --- ETAPA 1: ANALISAR IMAGEM ---
        console.log("[WIZARD] Etapa 1: Analisando imagem de referência...");

        const analyzeFormData = new FormData();
        analyzeFormData.append("file", referenceImageFile);
        if (secondaryReferenceImageFile) {
          analyzeFormData.append("secondaryFile", secondaryReferenceImageFile);
        }

        const analyzeResponse = await fetch("/api/conteudo/gerar-referencia?action=analyze", {
          method: "POST",
          body: analyzeFormData,
        });

        if (!analyzeResponse.ok) {
          const errData = await analyzeResponse.json().catch(() => ({}));
          throw new Error(errData.error || "Falha ao analisar a imagem de referência.");
        }

        const { yamlAnalysis } = await analyzeResponse.json();
        console.log("[WIZARD] Análise YAML obtida:", yamlAnalysis);

        // --- ETAPA 2: GERAR PROMPT ---
        console.log("[WIZARD] Etapa 2: Gerando prompt de marketing...");

        const promptFormData = new FormData();
        promptFormData.append("yamlAnalysis", yamlAnalysis);
        promptFormData.append("isRetailStyle", String(isRetailStyle));
        promptFormData.append(
          "hybridPriority",
          mode === "reference-photo" && productWorkflow === "packshot-hybrid"
            ? "packshot"
            : hybridPriority
        );

        const combinedDescription = postSummary.trim()
          ? `${referenceDescription.trim()} ${secondaryReferenceDescription ? `Segunda imagem (produto): ${secondaryReferenceDescription.trim()}.` : ""} Ideia/Texto da promoção do lojista a ser destacado na imagem: "${postSummary.trim()}".`
          : `${referenceDescription.trim()} ${secondaryReferenceDescription ? `Segunda imagem (produto): ${secondaryReferenceDescription.trim()}.` : ""}`;

        promptFormData.append("description", combinedDescription);
        // Se o usuário optou por não gerar texto (generateTextSuggestions === false), não inserimos texto na imagem.
        const shouldInsertText = generateTextSuggestions ? insertTextOnImage !== false : false;

        if (selContent?.titulo && shouldInsertText) {
          promptFormData.append("title", selContent.titulo);
        }
        if (businessProfile) {
          promptFormData.append("businessProfile", JSON.stringify(businessProfile));
        }
        if (mode === "reference-link" && inspirationFile) {
          promptFormData.append("inspiration_file", inspirationFile);
        }

        const promptResponse = await fetch(
          "/api/conteudo/gerar-referencia?action=generate-prompt",
          {
            method: "POST",
            body: promptFormData,
          }
        );

        if (!promptResponse.ok) {
          const errData = await promptResponse.json().catch(() => ({}));
          throw new Error(errData.error || "Falha ao gerar o prompt de imagem.");
        }

        const resData = await promptResponse.json();
        const fluxPrompt = resData.imagePrompt;
        console.log("[WIZARD] Prompt UGC criado:", fluxPrompt);

        setCustomPrompt(fluxPrompt);
        setStep(
          generateTextSuggestions
            ? mode === "reference-photo" || mode === "reference-hybrid"
              ? 2
              : 3
            : 3
        );
        handleSubmitImageGeneration(fluxPrompt, postId, selContent);
      } else {
        // Modo conceito (sem referenceImageFile)
        let response;
        const contentForPrompt = selContent;

        const shouldInsertText = generateTextSuggestions ? insertTextOnImage !== false : false;

        if (inspirationFile) {
          const formData = new FormData();
          formData.append("content", JSON.stringify(contentForPrompt));
          if (businessProfile) {
            formData.append("businessProfile", JSON.stringify(businessProfile));
          }
          formData.append("insertTextOnImage", String(shouldInsertText));
          formData.append("userId", user.uid);
          formData.append("inspiration_file", inspirationFile);
          if (layoutStyle) {
            formData.append("layoutStyle", layoutStyle);
          }

          response = await fetch("/api/generate-prompts", {
            method: "POST",
            body: formData,
          });
        } else {
          response = await fetch("/api/generate-prompts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: contentForPrompt,
              businessProfile: businessProfile,
              insertTextOnImage: shouldInsertText,
              userId: user.uid,
              layoutStyle: layoutStyle,
            }),
          });
        }
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro na API de geração de prompts.");
        }

        const generatedPrompts = data?.[0]?.output?.prompt;

        if (!generatedPrompts || !Array.isArray(generatedPrompts)) {
          throw new Error("Não foi possível gerar os prompts.");
        }

        const defaultPrompt = generatedPrompts[0] || "";
        setCustomPrompt(defaultPrompt);
        setStep(3);
        handleSubmitImageGeneration(generatedPrompts, postId, selContent);
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro na Geração",
        description: getFriendlyErrorMessage(error.message),
      });
      setIsGeneratingImages(false);
    }
  };

  const handleSubmitImageGeneration = async (
    customPromptOverride?: string | string[],
    postIdOverride?: string,
    contentOverride?: GeneratedContent
  ) => {
    const promptToUse = customPromptOverride || customPrompt;
    const promptString = Array.isArray(promptToUse) ? promptToUse.join(" ") : promptToUse || "";
    const activePostId = (postIdOverride || currentPostId) as string;
    const selContent =
      contentOverride ||
      (selectedContentId !== undefined
        ? generatedContent[parseInt(selectedContentId, 10)]
        : generatedContent[0]);
    if (!user || !activePostId) {
      console.warn("[WIZARD] Abortando geração. Faltam parâmetros:", {
        user: !!user,
        activePostId,
      });
      return;
    }
    if (!isSyncImageMode && !selContent) {
      console.warn("[WIZARD] Abortando geração. Falta legenda para este modo.");
      return;
    }

    setIsGeneratingImages(true);
    setSelectedImage(null);
    setGeneratedImages([]);
    foundFilesRef.current.clear();

    const fullCaption = selContent
      ? `${selContent.titulo}\n\n${selContent.subtitulo}\n\n${Array.isArray(selContent.hashtags) ? selContent.hashtags.join(" ") : ""}`
      : "";

    try {
      if (referenceImageFile) {
        // Legacy setCanStartPolling removed
        // --- ETAPA 3: SUBMETER PARA FILA DO FAL.AI ---
        console.log("[WIZARD] Etapa 3: Submetendo na fila de IA...");

        const submitFormData = new FormData();
        submitFormData.append("file", referenceImageFile);
        if (secondaryReferenceImageFile) {
          submitFormData.append("secondaryFile", secondaryReferenceImageFile);
        }
        submitFormData.append("prompt", promptString);
        submitFormData.append("postId", activePostId);
        submitFormData.append("userId", user.uid);
        submitFormData.append("hybridPriority", hybridPriority);

        // 🧪 Rota de BENCHMARK: Imagen 4 (síncrono, sem polling, texto apenas)
        if (useImagen4Ref) {
          console.log("[WIZARD] 🧪 Modo BENCHMARK Imagen 4 ativado — chamada síncrona.");
          const img4FormData = new FormData();
          img4FormData.append("prompt", promptString);
          img4FormData.append("postId", activePostId);
          img4FormData.append("userId", user.uid);
          img4FormData.append("caption", fullCaption);

          const img4Response = await fetch(
            "/api/conteudo/gerar-referencia?action=submit-imagen4-ref",
            {
              method: "POST",
              body: img4FormData,
            }
          );

          if (!img4Response.ok) {
            const errData = await img4Response.json().catch(() => ({}));
            throw new Error(errData.error || "Falha na geração via Imagen 4.");
          }

          const img4Data = await img4Response.json();
          const finalUrl = img4Data.imageUrl;

          if (!finalUrl) throw new Error("Imagen 4 não retornou URL da imagem.");

          console.log(`[WIZARD] 🧪 Imagen 4 concluído (${img4Data.modelUsed}): ${finalUrl}`);
          setGeneratedImages([finalUrl]);
          setSelectedImage(finalUrl);
          setFluxImageUrl(finalUrl);
          setLastGeneratedText(fullCaption);
          setIsGeneratingImages(false);

          toast({
            title: `✅ Imagen 4 concluído! (${img4Data.modelUsed?.replace("imagen-4.0-", "").replace("-generate-001", "").toUpperCase()})`,
            description: "Imagem gerada pelo Google Imagen 4 pronta para comparação.",
          });
          return;
        }

        // 🍌 Rota Nano Banana: Geração com referência de imagem via Gemini 3 Pro Image (síncrono, sem polling)
        if (useNanoBananaRef) {
          console.log("[WIZARD] 🍌 Modo Nano Banana ativado — chamada síncrona.");
          try {
            const nanobananaFormData = new FormData();
            nanobananaFormData.append("file", referenceImageFile);
            if (secondaryReferenceImageFile) {
              nanobananaFormData.append("secondaryFile", secondaryReferenceImageFile);
            }
            nanobananaFormData.append("prompt", promptString);
            nanobananaFormData.append("postId", activePostId);
            nanobananaFormData.append("userId", user.uid);
            nanobananaFormData.append("caption", fullCaption);
            nanobananaFormData.append(
              "hybridPriority",
              mode === "reference-photo" && productWorkflow === "packshot-hybrid"
                ? "packshot"
                : hybridPriority
            );

            const nanobananaResponse = await fetch(
              "/api/conteudo/gerar-referencia?action=submit-nanobanana-ref",
              {
                method: "POST",
                body: nanobananaFormData,
              }
            );

            if (!nanobananaResponse.ok) {
              const errData = await nanobananaResponse.json().catch(() => ({}));
              throw new Error(errData.error || "Falha na resposta do servidor do Nano Banana.");
            }

            const nanobananaData = await nanobananaResponse.json();
            const finalUrl = nanobananaData.imageUrl;

            if (!finalUrl) throw new Error("Nano Banana não retornou URL da imagem.");

            console.log(
              `[WIZARD] 🍌 Nano Banana concluído (${nanobananaData.modelUsed}): ${finalUrl}`
            );
            setGeneratedImages([finalUrl]);
            setSelectedImage(finalUrl);
            setFluxImageUrl(finalUrl);
            setLastGeneratedText(fullCaption);
            setIsGeneratingImages(false);

            toast({
              title: `✅ Geração Concluída!`,
              description: "Sua imagem publicitária foi criada com sucesso.",
            });
            return;
          } catch (nanobananaError: any) {
            console.warn(
              "[WIZARD] 🍌 Falha na geração via modelo principal, acionando modelo alternativo:",
              nanobananaError.message || nanobananaError
            );

            toast({
              title: "🔄 Acionando Fallback Automático",
              description:
                "O modelo principal de imagem está temporariamente instável. Gerando sua arte via modelo alternativo...",
            });

            // Permite continuar para a geração padrão abaixo (Flux Kontext)
          }
        }

        const targetAction = "submit-kontext";
        const submitResponse = await fetch(
          `/api/conteudo/gerar-referencia?action=${targetAction}`,
          {
            method: "POST",
            body: submitFormData,
          }
        );

        if (!submitResponse.ok) {
          const errData = await submitResponse.json().catch(() => ({}));
          throw new Error(errData.error || "Falha ao submeter imagem para a IA.");
        }

        const submitResult = await submitResponse.json();
        const { requestId, statusUrl, responseUrl, garmentPublicUrl } = submitResult;
        console.log(
          "[WIZARD] ID da fila do Fal.ai recebido:",
          requestId,
          "Status URL:",
          statusUrl,
          "Response URL:",
          responseUrl,
          "Garment URL:",
          garmentPublicUrl
        );

        // --- ETAPA 4: POLLING DA FILA ---
        console.log("[WIZARD] Etapa 4: Polling iniciado...");

        let attempts = 0;
        const maxAttempts = 75; // 75 * 2s = 150s máximo

        const pollInterval = setInterval(async () => {
          attempts++;

          // Verificação de timeout garantida no topo absoluto do intervalo
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            const timeoutMsg = "Tempo limite atingido aguardando a fila da IA.";
            try {
              const postDocRef = doc(db, "users", user.uid, "posts", activePostId);
              await setDoc(
                postDocRef,
                {
                  status: "failed",
                  failureReason: timeoutMsg,
                },
                { merge: true }
              );
            } catch (fsErr) {
              console.error("[WIZARD] Falha ao registrar timeout no Firestore:", fsErr);
            }

            toast({
              variant: "destructive",
              title: "Tempo Esgotado",
              description: "A IA demorou muito para responder. Por favor, tente novamente.",
            });
            setIsGeneratingImages(false);
            return;
          }

          try {
            console.log(
              `[WIZARD] Consultando status da geração da imagem (Tentativa ${attempts})...`
            );
            const statusResponse = await fetch(
              `/api/conteudo/gerar-referencia?action=check-status&statusUrl=${encodeURIComponent(statusUrl)}&responseUrl=${encodeURIComponent(responseUrl)}&postId=${activePostId}&userId=${user.uid}`
            );

            if (!statusResponse.ok) {
              console.warn("[WIZARD] Erro ao buscar status. Continuando na próxima tentativa.");
              return;
            }

            const statusData = await statusResponse.json();

            if (statusData.status === "COMPLETED") {
              clearInterval(pollInterval);
              const finalImageUrl = statusData.imageUrl;

              if (!finalImageUrl) {
                throw new Error("URL da imagem final não fornecida pela IA.");
              }

              console.log(
                "[WIZARD] Geração por referência concluída com sucesso na Fal.ai:",
                finalImageUrl
              );
              console.log("[WIZARD] Salvando imagem no Firebase Storage...");

              // Executar o download e upload no backend Next.js
              (async () => {
                try {
                  const uploadResponse = await fetch(
                    "/api/conteudo/gerar-referencia?action=upload-to-firebase",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        postId: activePostId,
                        userId: user.uid,
                        finalImageUrl: finalImageUrl,
                        referenceImageUrl: garmentPublicUrl || null,
                        caption: fullCaption,
                      }),
                    }
                  );

                  if (!uploadResponse.ok) {
                    throw new Error("Falha ao salvar a imagem no Firebase via servidor.");
                  }

                  const uploadData = await uploadResponse.json();
                  const firebaseDownloadUrl = uploadData.imageUrl || finalImageUrl;

                  setGeneratedImages([firebaseDownloadUrl]);
                  setSelectedImage(firebaseDownloadUrl);
                  setFluxImageUrl(firebaseDownloadUrl);
                  setLastGeneratedText(fullCaption);
                  setIsGeneratingImages(false);

                  toast({
                    title: "Imagem criada com sucesso! ✨",
                    description: "Sua nova imagem publicitária está pronta e ficou linda!",
                  });
                } catch (err: any) {
                  console.warn(
                    "[WIZARD] Falha no upload no backend, usando fallback temporário da Fal.ai:",
                    err.message || err
                  );

                  setGeneratedImages([finalImageUrl]);
                  setSelectedImage(finalImageUrl);
                  setFluxImageUrl(finalImageUrl);
                  setLastGeneratedText(fullCaption);
                  setIsGeneratingImages(false);

                  try {
                    const postDocRef = doc(db, "users", user.uid, "posts", activePostId);
                    await setDoc(
                      postDocRef,
                      {
                        imageUrls: [finalImageUrl],
                        referenceImageUrl: garmentPublicUrl || null,
                        status: "completed",
                      },
                      { merge: true }
                    );
                  } catch (fsErr) {
                    console.error("[WIZARD] Erro ao gravar rascunho no Firestore local:", fsErr);
                  }
                }
              })();
            } else if (statusData.status === "FAILED") {
              clearInterval(pollInterval);
              throw new Error(statusData.error || "A geração da imagem falhou no servidor da IA.");
            }
          } catch (pollErr: any) {
            clearInterval(pollInterval);
            console.error("[WIZARD] Erro durante o polling:", pollErr);

            try {
              const postDocRef = doc(db, "users", user.uid, "posts", activePostId);
              await setDoc(
                postDocRef,
                {
                  status: "failed",
                  failureReason: pollErr.message || "Erro durante o polling da IA.",
                },
                { merge: true }
              );
            } catch (fsErr) {
              console.error("[WIZARD] Falha ao registrar erro no Firestore:", fsErr);
            }

            toast({
              variant: "destructive",
              title: "Erro na Geração",
              description: getFriendlyErrorMessage(pollErr.message),
            });
            setIsGeneratingImages(false);
          }
        }, 2000);
      } else {
        // Modo conceito (sem referenceImageFile)
        const filenames = inspirationFile ? ["1"] : ["1", "2"];
        console.log(
          `[WIZARD] Iniciando geração simultânea de ${filenames.length} imagens...`
        );

        const imagePromises = filenames.map(async (fname, i) => {
          const promptIndex = inspirationFile ? 2 : i;
          const singlePrompt = Array.isArray(promptToUse)
            ? promptToUse[promptIndex] || promptToUse[0] || ""
            : promptToUse;

          console.log(
            `[WIZARD] Disparando geração simultânea da imagem ${fname} com o prompt: "${singlePrompt.substring(0, 60)}..."`
          );
          const imgResponse = await fetch("/api/generate-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: singlePrompt,
              postId: activePostId,
              fileName: fname,
              content: selContent,
              businessProfile: businessProfile,
              userId: user.uid,
              layoutStyle: layoutStyle || "",
            }),
          });

          if (!imgResponse.ok) {
            const errData = await imgResponse.json().catch(() => ({}));
            throw new Error(errData.details || errData.error || `Erro ao gerar a imagem ${fname}`);
          }

          const imgData = await imgResponse.json();

          // Atualizar o estado do front imediatamente para dar feedback visual em tempo real
          setGeneratedImages((prev) => {
            const updated = prev.includes(imgData.imageUrl) ? prev : [...prev, imgData.imageUrl];
            setSelectedImage((currentSelected) => currentSelected || imgData.imageUrl);
            return updated;
          });

          return imgData.imageUrl;
        });

        const imageUrls = await Promise.all(imagePromises);
        console.log(
          `[WIZARD] Sucesso absoluto! As ${filenames.length} imagens foram geradas simultaneamente e salvas no Firebase Storage:`,
          imageUrls
        );

        try {
          const postDocRef = doc(db, "users", user.uid, "posts", activePostId);
          await setDoc(
            postDocRef,
            {
              imageUrls: imageUrls,
              status: "completed",
            },
            { merge: true }
          );
        } catch (firestoreError) {
          console.error(
            "[WIZARD] Erro ao atualizar o Firestore local com as imagens:",
            firestoreError
          );
        }

        setLastConceptPromptUsed(postSummary);
        setLastSelectedContentIdUsed(selectedContentId);
        setLastGeneratedText(fullCaption);
        setIsGeneratingImages(false);
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro na Geração",
        description: getFriendlyErrorMessage(error.message),
      });
      setIsGeneratingImages(false);
    }
  };

  const handleLogoProcessing = async () => {
    let targetImg = selectedImage || (generatedImages.length > 0 ? generatedImages[0] : null);
    if (!targetImg) {
      setStep(isSyncImageMode ? 4 : 5);
      return;
    }
    if (!selectedImage && targetImg) {
      setSelectedImage(targetImg);
    }

    if (!logoFile && !logoPreviewUrl) {
      setProcessedImageUrl(null);
      setStep(isSyncImageMode ? 4 : 5);
      return;
    }

    let activeLogoFile = logoFile;
    const effectiveLogoUrl =
      logoPreviewUrl ||
      businessProfile?.logo?.url ||
      businessProfile?.brandKit?.logoUrl ||
      (businessProfile as any)?.logoUrl;

    if (!activeLogoFile && effectiveLogoUrl) {
      try {
        const logoUrlToFetch = effectiveLogoUrl.startsWith("http")
          ? `/api/conteudo/gerar-referencia?action=proxy&url=${encodeURIComponent(effectiveLogoUrl)}`
          : effectiveLogoUrl;
        const logoBlob = await fetch(logoUrlToFetch, {
          signal: AbortSignal.timeout(3000),
        }).then((r) => r.blob());
        activeLogoFile = new File([logoBlob], "logo-brandkit.png", {
          type: logoBlob.type || "image/png",
        });
      } catch (errLogo) {
        console.error("[WIZARD] Erro ao carregar blob da logo para envio:", errLogo);
      }
    }

    if (!activeLogoFile) {
      if (!targetImg.startsWith("blob:")) {
        setProcessedImageUrl(null);
        setStep(isSyncImageMode ? 4 : 5);
        return;
      }
      setIsUploading(true);
      try {
        const imageUrlToFetch = targetImg.startsWith("http")
          ? `/api/conteudo/gerar-referencia?action=proxy&url=${encodeURIComponent(targetImg)}`
          : targetImg;
        const imageBlob = await fetch(imageUrlToFetch).then((r) => r.blob());
        const formData = new FormData();
        formData.append("file", new File([imageBlob], "raw-image.jpg", { type: imageBlob.type }));
        const response = await fetch("/api/proxy-webhook?target=imagem_sem_logo", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (response.ok && result?.[0]?.url_post) {
          const finalNoLogoUrl = result[0].url_post;
          setProcessedImageUrl(finalNoLogoUrl);

          // Atualizar o rascunho temporário no Firestore local com a URL convertida (caso exista rascunho)
          if (currentPostId && user) {
            try {
              const postDocRef = doc(db, "users", user.uid, "posts", currentPostId);
              await setDoc(
                postDocRef,
                {
                  imageUrls: [finalNoLogoUrl],
                },
                { merge: true }
              );
              console.log("[WIZARD] Rascunho temporário atualizado com a imagem sem logotipo.");
            } catch (firestoreError) {
              console.error(
                "[WIZARD] Erro ao salvar a imagem sem logo no Firestore local:",
                firestoreError
              );
            }
          }

          setStep(isSyncImageMode ? 4 : 5);
        } else {
          setStep(isSyncImageMode ? 4 : 5);
        }
      } catch (error) {
        console.error(error);
        setStep(isSyncImageMode ? 4 : 5);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    setIsUploading(true);
    try {
      const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
        return new Promise((resolve) => {
          let resolved = false;
          const safeResolve = (dim: { width: number; height: number }) => {
            if (!resolved) {
              resolved = true;
              resolve(dim);
            }
          };
          const timeoutId = setTimeout(() => safeResolve({ width: 1024, height: 1024 }), 3000);

          const img = document.createElement("img");
          img.crossOrigin = "anonymous";
          img.onload = () => {
            clearTimeout(timeoutId);
            safeResolve({
              width: img.naturalWidth || img.width || 1024,
              height: img.naturalHeight || img.height || 1024,
            });
          };
          img.onerror = () => {
            if (url.startsWith("http")) {
              const proxyUrl = `/api/conteudo/gerar-referencia?action=proxy&url=${encodeURIComponent(url)}`;
              const img2 = document.createElement("img");
              img2.crossOrigin = "anonymous";
              img2.onload = () => {
                clearTimeout(timeoutId);
                safeResolve({
                  width: img2.naturalWidth || img2.width || 1024,
                  height: img2.naturalHeight || img2.height || 1024,
                });
              };
              img2.onerror = () => {
                clearTimeout(timeoutId);
                safeResolve({ width: 1024, height: 1024 });
              };
              img2.src = proxyUrl;
            } else {
              clearTimeout(timeoutId);
              safeResolve({ width: 1024, height: 1024 });
            }
          };
          img.src = url;
        });
      };

      const visualLogoScale = 5 + (logoScale - 10) * (45 / 90);
      const { width: mainImageWidth, height: mainImageHeight } =
        await getImageDimensions(targetImg);
      const logoPixelWidth = mainImageWidth * (visualLogoScale / 100);

      // Obter proporção original da logo para calcular a altura real em pixels
      let logoPixelHeight = logoPixelWidth; // fallback quadrado
      if (logoPreviewUrl) {
        try {
          const { width: logoImgWidth, height: logoImgHeight } =
            await getImageDimensions(logoPreviewUrl);
          if (logoImgWidth > 0) {
            logoPixelHeight = logoPixelWidth * (logoImgHeight / logoImgWidth);
          }
        } catch (dimErr) {
          console.warn("[WIZARD] Erro ao obter dimensões da logo:", dimErr);
        }
      }

      let positionX = 0,
        positionY = 0;

      // Margem proporcional baseada em 16px em relação ao tamanho máximo de 384px (max-w-sm) do preview no front
      const margin = mainImageWidth * 0.04167;

      switch (logoPosition) {
        case "top-left":
          positionX = margin;
          positionY = margin;
          break;
        case "top-center":
          positionX = mainImageWidth / 2 - logoPixelWidth / 2;
          positionY = margin;
          break;
        case "top-right":
          positionX = mainImageWidth - logoPixelWidth - margin;
          positionY = margin;
          break;
        case "left-center":
          positionX = margin;
          positionY = mainImageHeight / 2 - logoPixelHeight / 2;
          break;
        case "center":
          positionX = mainImageWidth / 2 - logoPixelWidth / 2;
          positionY = mainImageHeight / 2 - logoPixelHeight / 2;
          break;
        case "right-center":
          positionX = mainImageWidth - logoPixelWidth - margin;
          positionY = mainImageHeight / 2 - logoPixelHeight / 2;
          break;
        case "bottom-left":
          positionX = margin;
          positionY = mainImageHeight - logoPixelHeight - margin;
          break;
        case "bottom-center":
          positionX = mainImageWidth / 2 - logoPixelWidth / 2;
          positionY = mainImageHeight - logoPixelHeight - margin;
          break;
        case "bottom-right":
          positionX = mainImageWidth - logoPixelWidth - margin;
          positionY = mainImageHeight - logoPixelHeight - margin;
          break;
      }

      const formData = new FormData();
      const imageUrlToFetch = targetImg.startsWith("http")
        ? `/api/conteudo/gerar-referencia?action=proxy&url=${encodeURIComponent(targetImg)}`
        : targetImg;
      const imageBlob = await fetch(imageUrlToFetch).then((r) => r.blob());
      formData.append("file", new File([imageBlob], "image.jpg", { type: imageBlob.type }));
      formData.append("logo", activeLogoFile);
      formData.append("logoScale", logoScale.toString());
      formData.append("logoOpacity", logoOpacity.toString());
      formData.append("positionX", Math.round(positionX).toString());
      formData.append("positionY", Math.round(positionY).toString());

      const response = await fetch("/api/proxy-webhook?target=post_manual", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error("Falha no webhook de personalização.");

      const finalLogoUrl = result?.[0]?.url_post;
      setProcessedImageUrl(finalLogoUrl);

      // Atualizar o rascunho temporário no Firestore local com a URL final com o logotipo aplicado
      if (currentPostId && user) {
        try {
          const postDocRef = doc(db, "users", user.uid, "posts", currentPostId);
          await setDoc(
            postDocRef,
            {
              imageUrls: [finalLogoUrl],
            },
            { merge: true }
          );
          console.log(
            "[WIZARD] Rascunho temporário atualizado com a imagem com logotipo aplicado."
          );
        } catch (firestoreError) {
          console.error(
            "[WIZARD] Erro ao salvar a imagem com logo no Firestore local:",
            firestoreError
          );
        }
      }

      setStep(isSyncImageMode ? 4 : 5);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao Processar",
        description: getFriendlyErrorMessage(error.message),
      });
      setStep(isSyncImageMode ? 4 : 5);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async (publishMode: "now" | "schedule") => {
    let finalImageUrl = processedImageUrl || selectedImage;
    if (!selectedContent || !finalImageUrl || !user) return;
    if (platforms.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhuma plataforma",
        description: "Selecione ao menos uma plataforma.",
      });
      return;
    }
    if (publishMode === "schedule" && !scheduleDateTime) {
      toast({
        variant: "destructive",
        title: "Data inválida",
        description: "Selecione data e hora.",
      });
      return;
    }

    setIsPublishing(true);
    if (finalImageUrl.startsWith("blob:")) {
      try {
        const imageBlob = await fetch(finalImageUrl).then((r) => r.blob());
        const formData = new FormData();
        formData.append("file", new File([imageBlob], "post-image.jpg", { type: imageBlob.type }));
        const response = await fetch("/api/proxy-webhook?target=imagem_sem_logo", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (response.ok && result?.[0]?.url_post) {
          finalImageUrl = result[0].url_post;
          setProcessedImageUrl(finalImageUrl);
        }
      } catch (error) {
        console.error(error);
      }
    }

    const fullCaption = `${selectedContent.titulo}\n\n${selectedContent.subtitulo}\n\n${selectedContent.hashtags.join(" ")}`;
    try {
      const result = await schedulePost(user.uid, {
        text: fullCaption,
        media: [{ file: new File([], ""), publicUrl: finalImageUrl || undefined }],
        isCarousel: false,
        platforms: platforms,
        scheduledAt: publishMode === "schedule" ? new Date(scheduleDateTime) : new Date(),
        collaborators: collaborators.length > 0 ? collaborators : undefined,
        userTags: userTags.length > 0 ? userTags : undefined,
        metaConnection: metaConnection || undefined,
        instagramConnection: instagramConnection || undefined,
        linkedinConnection: linkedinConnection || undefined,
      });

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: publishMode === "now" ? "Post enviado." : "Post agendado.",
        });

        // Marcar de forma reativa a imagem correspondente da galeria como já utilizada no post publicado
        if (selectedImage && user) {
          try {
            const galleryRef = collection(db, "users", user.uid, "mediaGallery");
            const q = query(galleryRef, where("url", "==", selectedImage));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(async (docSnap) => {
              await updateDoc(docSnap.ref, {
                usedInPostId: currentPostId || "published",
              });
              console.log(
                `[WIZARD_GALLERY] Imagem ${docSnap.id} marcada na galeria como usada no post ${currentPostId}`
              );
            });
          } catch (galleryError) {
            console.error(
              "[WIZARD_GALLERY_ERROR] Erro ao atualizar status de uso na galeria:",
              galleryError
            );
          }
        }

        // Deletar o rascunho temporário obsoleto do Firestore se a publicação foi concluída
        if (currentPostId) {
          try {
            await deletePost(user.uid, currentPostId);
            console.log(
              "[WIZARD] Rascunho temporário deletado com sucesso para evitar post duplicado."
            );
          } catch (deleteError) {
            console.error("[WIZARD] Erro ao deletar rascunho temporário obsoleto:", deleteError);
          }
        }

        router.push("/dashboard/posts");
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao publicar", description: error.message });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownloadImage = async (url: string) => {
    try {
      const imageUrlToFetch = url.startsWith("http")
        ? `/api/conteudo/gerar-referencia?action=proxy&url=${encodeURIComponent(url)}`
        : url;
      const blob = await fetch(imageUrlToFetch).then((r) => r.blob());
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = `numvapt-${Date.now()}.jpg`;
      a.click();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro no Download" });
    }
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Arquivo muito grande (Máx 2MB)" });
        return;
      }
      const url = URL.createObjectURL(file);
      blobURLsRef.current.add(url);
      setLogoPreviewUrl(url);
      setLogoFile(file);
    }
  };

  const handleGenerateCaption = async () => {
    if (!referenceDescription.trim() || !user) {
      toast({
        variant: "destructive",
        title: "Descrição vazia",
        description:
          "Descreva o seu produto no Passo 1 para podermos gerar a legenda baseada nele.",
      });
      return;
    }
    setIsGeneratingCaption(true);
    try {
      const response = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: referenceDescription, businessProfile }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || "Erro na API");

      const publicacoes = Array.isArray(data)
        ? data[0]?.publicacoes || data
        : data.publicacoes || data;

      if (Array.isArray(publicacoes) && publicacoes.length > 0) {
        const item = publicacoes[0];
        const mapped = {
          titulo: item.titulo || item.título || "",
          subtitulo: item.subtitulo || "",
          hashtags: item.hashtags || [],
          url_da_imagem: selectedContent?.url_da_imagem || undefined,
        };

        setGeneratedContent((prev) => {
          if (selectedContentId === undefined) return prev;
          const index = parseInt(selectedContentId, 10);
          return prev.map((c, i) => (i === index ? { ...c, ...mapped } : c));
        });

        if (currentPostId) {
          const fullCaption = `${mapped.titulo}\n\n${mapped.subtitulo}\n\n${Array.isArray(mapped.hashtags) ? mapped.hashtags.join(" ") : ""}`;
          const postDocRef = doc(db, "users", user.uid, "posts", currentPostId);
          await setDoc(
            postDocRef,
            {
              text: fullCaption,
            },
            { merge: true }
          );
        }

        toast({
          title: "Legenda gerada! ✨",
          description: "Sua legenda e hashtags foram criadas pela IA baseadas no seu produto.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar legenda",
        description: getFriendlyErrorMessage(error.message),
      });
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  return (
    <WizardContext.Provider
      value={{
        step,
        setStep,
        postSummary,
        setPostSummary,
        isLoading,
        generatedContent,
        setGeneratedContent,
        selectedContentId,
        setSelectedContentId: handleSelectedContentIdChange,
        generatedImages,
        setGeneratedImages,
        selectedImage,
        setSelectedImage: handleSelectedImageChange,
        processedImageUrl,
        setProcessedImageUrl,
        showSchedulerModal,
        setShowSchedulerModal,
        isPublishing,
        scheduleDateTime,
        setScheduleDateTime,
        platforms,
        setPlatforms,
        collaborators,
        setCollaborators,
        collaboratorsInput,
        setCollaboratorsInput,
        userTags,
        setUserTags,
        userTagsInput,
        setUserTagsInput,
        isGeneratingImages,
        setIsGeneratingImages,
        // Legacy canStartPolling removed
        contentHistory,
        unusedImagesHistory,
        referenceImageFile,
        setReferenceImageFile,
        referenceImagePreview,
        setReferenceImagePreview,
        inspirationFile,
        setInspirationFile,
        referenceDescription,
        setReferenceDescription,
        referenceLink,
        setReferenceLink,
        secondaryReferenceImageFile,
        setSecondaryReferenceImageFile,
        secondaryReferenceImagePreview,
        setSecondaryReferenceImagePreview,
        secondaryReferenceDescription,
        setSecondaryReferenceDescription,
        hybridPriority,
        setHybridPriority,
        productWorkflow,
        setProductWorkflow,
        logoFile,
        setLogoFile,
        logoPreviewUrl,
        setLogoPreviewUrl,
        logoPosition,
        setLogoPosition,
        logoScale,
        setLogoScale,
        logoOpacity,
        setLogoOpacity,
        showTextOverlay,
        setShowTextOverlay,
        textPosition,
        setTextPosition,
        textScale,
        setTextScale,
        textColor,
        setTextColor,
        fontFamily,
        setFontFamily,
        fontWeight,
        setFontWeight,
        isItalic,
        setIsItalic,
        insertTextOnImage,
        setInsertTextOnImage,
        generateTextSuggestions,
        setGenerateTextSuggestions,
        layoutStyle,
        setLayoutStyle,
        isUploading,
        mode,
        user,
        metaConnection,
        instagramConnection,
        linkedinConnection,
        businessProfile,
        currentPostId,
        visualLogoScale,
        selectedContent,
        logoInputRef,
        foundFilesRef,
        customPrompt,
        setCustomPrompt,
        handleSubmitImageGeneration,
        isRetailStyle,
        setIsRetailStyle,
        useImagen4Ref,
        setUseImagen4Ref,
        useNanoBananaRef,
        setUseNanoBananaRef,
        isGeneratingCaption,
        handleGenerateCaption,
        fluxImageUrl,
        setFluxImageUrl,

        handleGenerateText,
        handleGeneratePostContent,
        handleGeneratePrompts,
        handleLogoProcessing,
        handlePublish,
        handleReferenceImageChange,
        handleSecondaryReferenceImageChange,
        handleDownloadImage,
        handleLogoFileChange,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) throw new Error("useWizard must be used within a WizardProvider");
  return context;
};

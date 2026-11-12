"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { getOnboardingProfile } from "@/lib/services/onboarding-service";
import { saveMediaToGallery, schedulePost } from "@/lib/services/posts-service";
import {
  CarouselBackgroundVariant,
  CarouselInternalSlide,
  CarouselSlideCount,
  CarouselStoryboard,
  CoverDesignTokens,
  DEFAULT_COVER_DESIGN_TOKENS,
} from "@/types/carousel";
import {
  renderCoverOverlayWithFabric,
  renderSlideWithFabricToDataUrl,
} from "@/lib/services/carousel/fabric-slide-renderer";
import { assignLayouts } from "@/lib/services/carousel/layouts/select";

export interface CarouselBrandKitState {
  companyName: string;
  segment: string;
  targetAudience: string;
  toneOfVoice: string;
  ctaChannel: string;
  colors: string[];
  headingFont: string;
  bodyFont: string;
  logoUrl: string;
}

interface CarouselContextType {
  step: 1 | 2 | 3;
  setStep: (step: 1 | 2 | 3) => void;
  slideCount: CarouselSlideCount;
  setSlideCount: (count: CarouselSlideCount) => void;
  theme: string;
  setTheme: (theme: string) => void;
  caption: string;
  setCaption: (caption: string) => void;
  brandKit: CarouselBrandKitState;
  setBrandKit: React.Dispatch<React.SetStateAction<CarouselBrandKitState>>;
  storyboard: CarouselStoryboard | null;
  setStoryboard: React.Dispatch<React.SetStateAction<CarouselStoryboard | null>>;
  isGeneratingStoryboard: boolean;
  isGeneratingCover: boolean;
  coverProgress: number;
  rewritingSlideNumber: number | null;
  isPublishing: boolean;
  isSavingToGallery: boolean;
  savedToGallery: boolean;
  coverImageUrl: string | null;
  coverDisplayUrl: string | null;
  coverOverlayApplied: boolean;
  designTokens: CoverDesignTokens;
  setDesignTokens: React.Dispatch<React.SetStateAction<CoverDesignTokens>>;
  slideBackgroundVariants: Record<number, CarouselBackgroundVariant>;
  setSlideBackgroundVariant: (
    slideNumber: number,
    variant: CarouselBackgroundVariant
  ) => void;
  renderedSlideUrls: Record<number, string>;
  /** Layout efetivo de cada slide interno (n -> id da biblioteca). */
  slideLayoutIds: Record<number, string>;
  activeSlidePreview: number;
  setActiveSlidePreview: (n: number) => void;
  imageCallsCount: number;
  handleGenerateStoryboard: (bypassCache?: boolean) => Promise<void>;
  handleGenerateCover: () => Promise<void>;
  handleToggleCoverOverlay: () => Promise<void>;
  handleUpdateInternalSlide: (
    slideNumber: number,
    patch: Partial<CarouselInternalSlide>
  ) => void;
  handleRewriteSlideWithAI: (
    slideNumber: number,
    instruction?: string
  ) => Promise<void>;
  handlePublishCarousel: (
    publishMode: "now" | "schedule",
    scheduledAtIso?: string
  ) => Promise<boolean>;
  handleSaveToGallery: () => Promise<boolean>;
}

const CarouselContext = createContext<CarouselContextType | undefined>(
  undefined
);

export function CarouselProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [slideCount, setSlideCount] = useState<CarouselSlideCount>(5);
  const [theme, setTheme] = useState("");
  const [caption, setCaption] = useState("");

  const [brandKit, setBrandKit] = useState<CarouselBrandKitState>({
    companyName: "",
    segment: "",
    targetAudience: "Clientes e seguidores",
    toneOfVoice: "Profissional, próximo e persuasivo",
    ctaChannel: "Chame no WhatsApp pelo link da bio",
    colors: ["#0F172A", "#0083C7", "#FA6305"],
    headingFont: "Poppins",
    bodyFont: "Inter",
    logoUrl: "",
  });

  const [storyboard, setStoryboard] = useState<CarouselStoryboard | null>(null);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);
  const [rewritingSlideNumber, setRewritingSlideNumber] = useState<
    number | null
  >(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingToGallery, setIsSavingToGallery] = useState(false);
  const [savedToGallery, setSavedToGallery] = useState(false);

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverDisplayUrl, setCoverDisplayUrl] = useState<string | null>(null);
  const [coverOverlayApplied, setCoverOverlayApplied] = useState(false);
  const [designTokens, setDesignTokens] = useState<CoverDesignTokens>(
    DEFAULT_COVER_DESIGN_TOKENS
  );
  const [slideBackgroundVariants, setSlideBackgroundVariants] = useState<
    Record<number, CarouselBackgroundVariant>
  >({});
  const [renderedSlideUrls, setRenderedSlideUrls] = useState<
    Record<number, string>
  >({});
  const [activeSlidePreview, setActiveSlidePreview] = useState<number>(1);

  // Layout de cada slide interno: respeita slide.layout (LLM/usuário) e varia os demais.
  const slideLayoutIds = useMemo(
    () =>
      storyboard?.slides?.length
        ? assignLayouts(storyboard.slides, { hasCoverImage: Boolean(coverImageUrl) })
        : {},
    [storyboard, coverImageUrl]
  );
  const [imageCallsCount, setImageCallsCount] = useState<number>(0);

  // Counter circular de porcentagem durante a geração da capa com IA
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isGeneratingCover) {
      setCoverProgress(0);
      interval = setInterval(() => {
        setCoverProgress((prev) => {
          if (prev >= 98) return 98;
          let increment = 0.05;
          if (prev < 15) increment = 1.5;
          else if (prev < 35) increment = 1.0;
          else if (prev < 60) increment = 0.6;
          else if (prev < 80) increment = 0.3;
          else if (prev < 90) increment = 0.15;
          const next = prev + increment;
          return next > 98 ? 98 : next;
        });
      }, 100);
    } else if (coverImageUrl) {
      setCoverProgress(100);
    } else {
      setCoverProgress(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGeneratingCover, coverImageUrl]);

  // Carrega Cérebro do Negócio / BrandKit do usuário
  useEffect(() => {
    if (!user?.uid) return;
    let mounted = true;

    async function loadBusinessData() {
      try {
        const [onboarding, profileSnap] = await Promise.all([
          getOnboardingProfile(user!.uid).catch(() => null),
          getDoc(doc(db, `users/${user!.uid}/business/profile`)).catch(
            () => null
          ),
        ]);

        if (!mounted) return;
        const profileData = profileSnap?.exists() ? profileSnap.data() : {};

        const companyName =
          onboarding?.companyName ||
          profileData?.companyName ||
          profileData?.name ||
          "";
        const segment =
          onboarding?.segment ||
          profileData?.segment ||
          profileData?.niche ||
          "";
        const targetAudience =
          onboarding?.targetAudience ||
          profileData?.targetAudience ||
          "Clientes e seguidores";
        const toneOfVoice = Array.isArray(onboarding?.toneOfVoice)
          ? onboarding.toneOfVoice.join(", ")
          : onboarding?.toneOfVoice ||
            profileData?.toneOfVoice ||
            "Profissional, próximo e persuasivo";
        const whatsapp =
          onboarding?.whatsapp || profileData?.whatsapp || profileData?.phone;
        const ctaChannel = whatsapp
          ? `Fale no WhatsApp (${whatsapp})`
          : "Chame no WhatsApp pelo link da bio";

        const colors =
          Array.isArray(onboarding?.brandColors) &&
          onboarding.brandColors.length > 0
            ? onboarding.brandColors
            : Array.isArray(profileData?.brandColors) &&
                profileData.brandColors.length > 0
              ? profileData.brandColors
              : ["#0F172A", "#0083C7", "#FA6305"];

        const headingFont =
          (onboarding as any)?.brandFonts?.heading ||
          profileData?.brandFonts?.heading ||
          "Poppins";
        const bodyFont =
          (onboarding as any)?.brandFonts?.body ||
          profileData?.brandFonts?.body ||
          "Inter";
        const logoUrl =
          onboarding?.logoUrl ||
          profileData?.logoUrl ||
          profileData?.brandLogoUrl ||
          "";

        setBrandKit({
          companyName,
          segment,
          targetAudience,
          toneOfVoice,
          ctaChannel,
          colors,
          headingFont,
          bodyFont,
          logoUrl,
        });

        setDesignTokens((prev) => ({
          ...prev,
          headingFont,
          bodyFont,
          logoUrl: logoUrl || null,
        }));
      } catch (err) {
        console.warn("[CarouselContext] Aviso ao carregar BrandKit:", err);
      }
    }

    loadBusinessData();
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  // Re-renderiza automaticamente os slides internos 2..N via Fabric.js (0 créditos de IA)
  // sempre que o roteiro, os designTokens ou as variações de fundo mudarem.
  useEffect(() => {
    if (!storyboard?.slides?.length) return;
    let cancelled = false;

    async function renderAllInternalSlides() {
      const nextRendered: Record<number, string> = {};
      for (const slide of storyboard!.slides) {
        const variant = slideBackgroundVariants[slide.n];
        const dataUrl = await renderSlideWithFabricToDataUrl({
          slide,
          totalSlides: slideCount,
          tokens: designTokens,
          backgroundVariant: variant,
          coverImageUrl,
          layoutId: slideLayoutIds[slide.n],
        });
        if (cancelled) return;
        nextRendered[slide.n] = dataUrl;
      }
      if (!cancelled) {
        setRenderedSlideUrls(nextRendered);
      }
    }

    renderAllInternalSlides();
    return () => {
      cancelled = true;
    };
  }, [storyboard, slideCount, designTokens, slideBackgroundVariants, coverImageUrl, slideLayoutIds]);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (user && typeof (user as any).getIdToken === "function") {
      const token = await (user as any).getIdToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return headers;
  }, [user]);

  const handleGenerateStoryboard = useCallback(
    async (bypassCache = false) => {
      if (!theme || theme.trim().length < 3) {
        toast({
          title: "Informe o tema do carrossel",
          description:
            "Digite o tema ou objetivo com pelo menos 3 caracteres para gerar o roteiro.",
          variant: "destructive",
        });
        return;
      }

      setIsGeneratingStoryboard(true);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/carousel/storyboard", {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "generate_storyboard",
            theme: theme.trim(),
            slideCount,
            companyName: brandKit.companyName,
            segment: brandKit.segment,
            targetAudience: brandKit.targetAudience,
            toneOfVoice: brandKit.toneOfVoice,
            ctaChannel: brandKit.ctaChannel,
            bypassCache,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Falha ao gerar o roteiro do carrossel.");
        }

        const generated: CarouselStoryboard = data.storyboard;
        setStoryboard(generated);

        // Monta uma legenda base automática a partir do roteiro
        const autoCaption = [
          generated.chamadaCapa,
          "",
          ...generated.slides.map((s) => `• ${s.titulo}: ${s.texto || ""}`),
          "",
          `👉 ${generated.slides[generated.slides.length - 1]?.botao || brandKit.ctaChannel}`,
        ].join("\n");
        setCaption(autoCaption);

        setStep(2);
        toast({
          title: `Roteiro de ${slideCount} slides pronto!`,
          description:
            "Confira a chamada da capa e gere a arte da capa para destravar o visual completo.",
        });
      } catch (err: any) {
        toast({
          title: "Erro ao gerar roteiro",
          description: err?.message || "Tente novamente em instantes.",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingStoryboard(false);
      }
    },
    [theme, slideCount, brandKit, getAuthHeaders, toast]
  );

  const handleGenerateCover = useCallback(async () => {
    if (!storyboard) return;
    setIsGeneratingCover(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/carousel/generate-cover", {
        method: "POST",
        headers,
        body: JSON.stringify({
          slideNumber: 1, // Único slide permitido pelo Guard da Regra de Ouro
          chamadaCapa: storyboard.chamadaCapa,
          promptImagemCapa: storyboard.promptImagemCapa,
          brandKit: {
            colors: brandKit.colors,
            headingFont: brandKit.headingFont,
            bodyFont: brandKit.bodyFont,
            logoUrl: brandKit.logoUrl,
          },
          includeHeadlineInArt: true,
          includeLogo: Boolean(brandKit.logoUrl),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível gerar a capa do carrossel.");
      }

      setCoverImageUrl(data.coverImageUrl);
      setCoverDisplayUrl(data.coverImageUrl);
      setCoverOverlayApplied(false);
      if (data.designTokens) {
        setDesignTokens(data.designTokens);
      }
      setImageCallsCount((prev) => prev + 1);
      setActiveSlidePreview(1);

      toast({
        title: "Capa gerada e estilo extraído!",
        description:
          "Os slides 2 a " +
          slideCount +
          " foram atualizados mantendo a mesma identidade visual da capa.",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao gerar capa",
        description: err?.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCover(false);
    }
  }, [storyboard, brandKit, slideCount, getAuthHeaders, toast]);

  const handleToggleCoverOverlay = useCallback(async () => {
    if (!coverImageUrl || !storyboard) return;
    if (coverOverlayApplied) {
      setCoverDisplayUrl(coverImageUrl);
      setCoverOverlayApplied(false);
      return;
    }

    const overlaidDataUrl = await renderCoverOverlayWithFabric({
      coverImageUrl,
      chamadaCapa: storyboard.chamadaCapa,
      tokens: designTokens,
    });
    setCoverDisplayUrl(overlaidDataUrl);
    setCoverOverlayApplied(true);
    toast({
      title: "Chamada aplicada por sobreposição",
      description: "Texto aplicado sobre a capa com sucesso.",
    });
  }, [coverImageUrl, storyboard, coverOverlayApplied, designTokens, toast]);

  const handleUpdateInternalSlide = useCallback(
    (slideNumber: number, patch: Partial<CarouselInternalSlide>) => {
      setStoryboard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          slides: prev.slides.map((s) =>
            s.n === slideNumber ? { ...s, ...patch } : s
          ),
        };
      });
    },
    []
  );

  const handleRewriteSlideWithAI = useCallback(
    async (slideNumber: number, instruction?: string) => {
      if (!storyboard) return;
      const targetSlide = storyboard.slides.find((s) => s.n === slideNumber);
      if (!targetSlide) return;

      setRewritingSlideNumber(slideNumber);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/carousel/storyboard", {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "rewrite_slide",
            chamadaCapa: storyboard.chamadaCapa,
            slide: targetSlide,
            instruction:
              instruction ||
              "Deixe o texto mais envolvente, claro e direto ao ponto.",
            ctaChannel: brandKit.ctaChannel,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Falha ao reescrever o slide.");
        }

        if (data.slide) {
          handleUpdateInternalSlide(slideNumber, data.slide);
          toast({
            title: `Slide ${slideNumber} reescrito!`,
            description:
              "Texto atualizado e re-renderizado no template sem custo de imagem.",
          });
        }
      } catch (err: any) {
        toast({
          title: "Erro ao reescrever slide",
          description: err?.message || "Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setRewritingSlideNumber(null);
      }
    },
    [storyboard, brandKit.ctaChannel, getAuthHeaders, handleUpdateInternalSlide, toast]
  );

  const setSlideBackgroundVariant = useCallback(
    (slideNumber: number, variant: CarouselBackgroundVariant) => {
      setSlideBackgroundVariants((prev) => ({
        ...prev,
        [slideNumber]: variant,
      }));
    },
    []
  );

  const uploadCarouselSlidesToStorage = useCallback(async (): Promise<
    string[] | null
  > => {
    if (!user?.uid || !storyboard) return null;
    const finalCover = coverDisplayUrl || coverImageUrl;
    if (!finalCover) {
      toast({
        title: "Gere a capa primeiro",
        description:
          "É necessário gerar a imagem do Slide 1 (Capa) antes de continuar.",
        variant: "destructive",
      });
      return null;
    }

    const carouselBatchId = `carousel_${Date.now()}`;
    const uploadedUrls: string[] = [];

    const uploadSlideUrl = async (
      src: string,
      slideIdx: number
    ): Promise<string> => {
      if (!src.startsWith("data:")) return src;
      try {
        const slideRef = ref(
          storage,
          `users/${user.uid}/posts/${carouselBatchId}/slide_${slideIdx}.png`
        );
        await uploadString(slideRef, src, "data_url");
        return await getDownloadURL(slideRef);
      } catch {
        return src;
      }
    };

    // 1. Slide 1 (Capa) sempre no índice 0
    uploadedUrls.push(await uploadSlideUrl(finalCover, 1));

    // 2. Slides 2..N renderizados
    for (const slide of storyboard.slides) {
      const slideDataUrl =
        renderedSlideUrls[slide.n] ||
        (await renderSlideWithFabricToDataUrl({
          slide,
          totalSlides: slideCount,
          tokens: designTokens,
          backgroundVariant: slideBackgroundVariants[slide.n],
          coverImageUrl,
          layoutId: slideLayoutIds[slide.n],
        }));

      if (slideDataUrl) {
        uploadedUrls.push(await uploadSlideUrl(slideDataUrl, slide.n));
      }
    }

    return uploadedUrls;
  }, [
    user,
    storyboard,
    coverDisplayUrl,
    coverImageUrl,
    renderedSlideUrls,
    slideCount,
    designTokens,
    slideBackgroundVariants,
    slideLayoutIds,
    toast,
  ]);

  const handlePublishCarousel = useCallback(
    async (
      publishMode: "now" | "schedule",
      scheduledAtIso?: string
    ): Promise<boolean> => {
      if (!user?.uid || !storyboard) return false;
      setIsPublishing(true);
      try {
        const uploadedUrls = await uploadCarouselSlidesToStorage();
        if (!uploadedUrls || uploadedUrls.length === 0) return false;

        if (publishMode === "now") {
          const headers = await getAuthHeaders();
          const pubRes = await fetch("/api/instagram/v2/publish", {
            method: "POST",
            headers,
            body: JSON.stringify({
              userId: user.uid,
              imageUrls: uploadedUrls,
              caption: caption || storyboard.chamadaCapa,
              isCarousel: true,
              postType: "post",
            }),
          });
          const pubData = await pubRes.json();
          if (!pubRes.ok) {
            throw new Error(
              pubData.error || "Erro ao publicar o carrossel no Instagram."
            );
          }

          toast({
            title: "Carrossel publicado com sucesso!",
            description: `Todos os ${slideCount} slides foram enviados para o Instagram.`,
          });
          return true;
        } else {
          const scheduledDate = scheduledAtIso
            ? new Date(scheduledAtIso)
            : new Date(Date.now() + 3600 * 1000);

          await schedulePost(user.uid, {
            text: caption || storyboard.chamadaCapa,
            imageUrl: uploadedUrls[0],
            imageUrls: uploadedUrls,
            isCarousel: true,
            platforms: ["instagram"],
            scheduledAt: scheduledDate,
            status: "scheduled",
            postType: "post",
          } as any);

          toast({
            title: "Carrossel agendado!",
            description: `Seu carrossel de ${slideCount} slides foi agendado com sucesso.`,
          });
          return true;
        }
      } catch (err: any) {
        toast({
          title: "Erro ao finalizar carrossel",
          description: err?.message || "Verifique sua conexão e tente novamente.",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsPublishing(false);
      }
    },
    [
      user,
      storyboard,
      uploadCarouselSlidesToStorage,
      slideCount,
      caption,
      getAuthHeaders,
      toast,
    ]
  );

  const handleSaveToGallery = useCallback(async (): Promise<boolean> => {
    if (!user?.uid || !storyboard) return false;
    setIsSavingToGallery(true);
    try {
      const uploadedUrls = await uploadCarouselSlidesToStorage();
      if (!uploadedUrls || uploadedUrls.length === 0) return false;

      const res = await saveMediaToGallery(user.uid, {
        publicUrl: uploadedUrls[0],
        mediaUrls: uploadedUrls,
        caption: caption || storyboard.chamadaCapa || null,
        type: "carousel",
        fileName: `carrossel_${Date.now()}.jpg`,
        source: "ai_carousel",
        itemCount: uploadedUrls.length,
      });

      if (!res.success) {
        throw new Error(
          res.error || "Não foi possível salvar o carrossel na galeria."
        );
      }

      setSavedToGallery(true);
      toast({
        title: "Carrossel salvo na Galeria!",
        description: `As ${uploadedUrls.length} lâminas foram salvas no seu acervo para publicar quando quiser.`,
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Erro ao salvar na Galeria",
        description: err?.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSavingToGallery(false);
    }
  }, [user, storyboard, uploadCarouselSlidesToStorage, caption, toast]);

  const value = useMemo(
    () => ({
      step,
      setStep,
      slideCount,
      setSlideCount,
      theme,
      setTheme,
      caption,
      setCaption,
      brandKit,
      setBrandKit,
      storyboard,
      setStoryboard,
      isGeneratingStoryboard,
      isGeneratingCover,
      coverProgress,
      rewritingSlideNumber,
      isPublishing,
      isSavingToGallery,
      savedToGallery,
      coverImageUrl,
      coverDisplayUrl,
      coverOverlayApplied,
      designTokens,
      setDesignTokens,
      slideBackgroundVariants,
      setSlideBackgroundVariant,
      renderedSlideUrls,
      slideLayoutIds,
      activeSlidePreview,
      setActiveSlidePreview,
      imageCallsCount,
      handleGenerateStoryboard,
      handleGenerateCover,
      handleToggleCoverOverlay,
      handleUpdateInternalSlide,
      handleRewriteSlideWithAI,
      handlePublishCarousel,
      handleSaveToGallery,
    }),
    [
      step,
      slideCount,
      theme,
      caption,
      brandKit,
      storyboard,
      isGeneratingStoryboard,
      isGeneratingCover,
      coverProgress,
      rewritingSlideNumber,
      isPublishing,
      isSavingToGallery,
      savedToGallery,
      coverImageUrl,
      coverDisplayUrl,
      coverOverlayApplied,
      designTokens,
      slideBackgroundVariants,
      setSlideBackgroundVariant,
      renderedSlideUrls,
      slideLayoutIds,
      activeSlidePreview,
      imageCallsCount,
      handleGenerateStoryboard,
      handleGenerateCover,
      handleToggleCoverOverlay,
      handleUpdateInternalSlide,
      handleRewriteSlideWithAI,
      handlePublishCarousel,
      handleSaveToGallery,
    ]
  );

  return (
    <CarouselContext.Provider value={value}>
      {children}
    </CarouselContext.Provider>
  );
}

export function useCarousel() {
  const ctx = useContext(CarouselContext);
  if (!ctx) {
    throw new Error("useCarousel deve ser utilizado dentro de um CarouselProvider");
  }
  return ctx;
}

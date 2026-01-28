
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  MapPin,
  Phone,
  Star,
  Edit,
  Globe,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  Link as LinkIcon,
  User,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  Eye,
  Key,
  Clock,
  Hourglass,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  MousePointer,
  X,
  ChevronDown,
  ChevronUp,
  Save,
  PlayCircle,
  Plus,
  Trash2,
  MessageCircle as MessageCircleIcon,
  Copy,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import { getBusinessProfile, updateBusinessProfile, resetBusinessProfile, type BusinessProfileData } from "@/lib/services/business-profile-service";
import { getGoogleConnection, updateGoogleConnection, type GoogleConnectionData } from "@/lib/services/google-service";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from 'next/navigation';
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";


interface MeuNegocioClientProps {
    initialProfile: BusinessProfileData;
}

interface GalleryItem {
    url: string;
    thumbnailUrl: string;
    mediaFormat: 'PHOTO' | 'VIDEO';
    name: string;
}

interface GoogleMedia {
    coverPhoto: { url: string; thumbnailUrl: string; name: string } | null;
    profilePhoto: { url: string; thumbnailUrl: string; name: string } | null;
    gallery: GalleryItem[];
}

const MetricCard = ({ title, value, icon: Icon, loading }: { title: string, value: string | number, icon: React.ElementType, loading: boolean }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
    >
        <Card className="shadow-lg border-none h-full">
            <CardContent className="p-4 flex items-start justify-start gap-4 w-full">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[72px] w-full">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <div className="bg-primary/10 p-2 rounded-lg">
                           <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{title}</p>
                            <p className="text-lg font-bold text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    </motion.div>
);

const ReviewCard = ({ review }: { review: any }) => {
    const ratingMap: { [key: string]: number } = {
        'ONE': 1,
        'TWO': 2,
        'THREE': 3,
        'FOUR': 4,
        'FIVE': 5,
    };
    const numericRating = ratingMap[review.starRating] || 0;

    let comment = review.comment || '';
    const translationMarker = '(Translated by Google)';
    if (comment.includes(translationMarker)) {
        comment = comment.split(translationMarker)[0].trim();
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border rounded-lg bg-card"
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {review.reviewer.profilePhotoUrl ? (
                            <Image src={review.reviewer.profilePhotoUrl} alt={review.reviewer.displayName} width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-muted-foreground"/>
                        )}
                    </div>
                    <div>
                        <h4 className="font-medium text-foreground">{review.reviewer.displayName}</h4>
                        <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                        i < numericRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(review.updateTime).toLocaleDateString('pt-BR')}</span>
            </div>
            <p className="text-sm text-foreground/80">{comment}</p>
        </motion.div>
    );
};

const ConnectGoogleCard = ({ onConnect, loading }: { onConnect: () => void, loading: boolean }) => (
    <Card className="shadow-lg border-dashed border-2 max-w-2xl mx-auto">
        <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <LinkIcon className="w-6 h-6 text-foreground" />
                Conecte seu Perfil da Empresa no Google
            </CardTitle>
            <p className="text-muted-foreground text-sm pt-2">Para gerenciar seu negócio, ver métricas e interagir com clientes, você precisa conectar sua conta do Google.</p>
        </CardHeader>
        <CardContent className="flex justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={onConnect} disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Globe className="w-5 h-5 mr-2" />}
                Conectar ao Google
            </Button>
        </CardContent>
    </Card>
);

const ProfileSelectionModal = ({
  isOpen,
  profiles,
  onSelect,
  onCancel,
}: {
  isOpen: boolean;
  profiles: BusinessProfileData[];
  onSelect: (profile?: BusinessProfileData) => void;
  onCancel: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  const filteredProfiles = useMemo(() => {
    if (!searchQuery) return profiles;
    return profiles.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [profiles, searchQuery]);

  const profilesToShow = useMemo(() => {
    return filteredProfiles.slice(0, visibleCount);
  }, [filteredProfiles, visibleCount]);

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    profilesToShow.length > 0 ? profilesToShow[0].googleName || null : null
  );

  const handleSelect = () => {
    const profile = profiles.find((p) => p.googleName === selectedProfileId);
    onSelect(profile);
  };
  
  const handleLoadMore = () => {
      setVisibleCount(prev => prev + 10);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Selecione um Perfil de Empresa</DialogTitle>
          <DialogDescription>
            {profiles.length > 1 
              ? `Encontramos ${profiles.length} negócios associados a esta conta. Por favor, escolha qual você deseja conectar.`
              : "Encontramos mais de um negócio associado a esta conta Google. Por favor, escolha qual você deseja conectar."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Pesquisar por nome ou endereço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
            />
        </div>

        <div className="py-4 max-h-80 overflow-y-auto pr-2 space-y-3">
          <RadioGroup
            value={selectedProfileId || ''}
            onValueChange={setSelectedProfileId}
            className="space-y-3"
          >
            {profilesToShow.map((profile) => (
              <Label
                key={profile.googleName}
                htmlFor={profile.googleName}
                className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-primary/10"
              >
                <RadioGroupItem
                  value={profile.googleName || ''}
                  id={profile.googleName}
                />
                <div>
                  <p className="font-semibold text-foreground">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.address}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
          {filteredProfiles.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">Nenhum perfil encontrado com sua busca.</p>
          )}
        </div>
        
        {visibleCount < filteredProfiles.length && (
            <div className="flex justify-center">
                <Button variant="ghost" onClick={handleLoadMore}>Ver mais</Button>
            </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSelect} disabled={!selectedProfileId}>
            Conectar Perfil
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Lightbox = ({ mediaItem, onClose }: { mediaItem: GalleryItem | null, onClose: () => void }) => {
    if (!mediaItem) return null;

    const isVideo = mediaItem.mediaFormat === 'VIDEO';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl max-h-[90vh]"
            >
                {isVideo ? (
                     <video
                        src={mediaItem.url}
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="rounded-lg"
                        style={{ objectFit: 'contain', width: 'auto', height: 'auto', maxHeight: '90vh', maxWidth: '90vw' }}
                    />
                ) : (
                    <Image
                        src={mediaItem.url}
                        alt="Visualização ampliada"
                        width={1920}
                        height={1080}
                        style={{ objectFit: 'contain', width: 'auto', height: 'auto', maxHeight: '90vh', maxWidth: '90vw' }}
                        className="rounded-lg"
                    />
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute -top-2 -right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 z-30"
                >
                    <X className="w-6 h-6" />
                </Button>
            </motion.div>
        </motion.div>
    );
};



export default function MeuNegocioPageClient({ initialProfile }: MeuNegocioClientProps) {
  const [authLoading, setAuthLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [keywordsLoading, setKeywordsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  
  const [profile, setProfile] = useState<BusinessProfileData>(initialProfile);
  const [editableProfile, setEditableProfile] = useState<BusinessProfileData>(initialProfile);
  const [metrics, setMetrics] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [media, setMedia] = useState<GoogleMedia | null>(null);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [editableHours, setEditableHours] = useState<Array<{day: string, open: string, close: string, enabled: boolean, is24h: boolean}>>([]);


  // State for profile selection modal
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [pendingProfiles, setPendingProfiles] = useState<BusinessProfileData[]>([]);
  const [pendingConnectionData, setPendingConnectionData] = useState<any>(null);
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [lightboxMediaItem, setLightboxMediaItem] = useState<GalleryItem | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<GalleryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);


  const { user, loading: userLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  const totalViews = (metrics?.viewsSearch || 0) + (metrics?.viewsMaps || 0);
  const INITIAL_PHOTO_LIMIT = 6;
  const photosToShow = showAllPhotos ? media?.gallery : media?.gallery?.slice(0, INITIAL_PHOTO_LIMIT);

  const dayOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  const dayMapping: { [key: string]: string } = {
        MONDAY: "Segunda",
        TUESDAY: "Terça",
        WEDNESDAY: "Quarta",
        THURSDAY: "Quinta",
        FRIDAY: "Sexta",
        SATURDAY: "Sábado",
        SUNDAY: "Domingo",
  };

  const formatTime = (time: { hours?: number, minutes?: number }) => {
        if (typeof time.hours !== 'number') return "N/A";
        
        let hours = time.hours;
        let minutes = typeof time.minutes === 'number' ? time.minutes : 0;
        
        // Google's API might return 24:00 for midnight. Standard time format uses 00:00.
        if (hours === 24 && minutes === 0) {
            hours = 0;
        }

        const hoursStr = String(hours).padStart(2, '0');
        const minutesStr = String(minutes).padStart(2, '0');
        return `${hoursStr}:${minutesStr}`;
    };

    const parsedHours = useMemo(() => {
        const { regularHours, openInfo } = profile;
        if (!regularHours?.periods && openInfo?.status === "OPEN") {
            return dayOrder.map(day => ({ key: day, day: dayMapping[day], hours: "Aberto" }));
        }

        if (!regularHours?.periods) {
            return dayOrder.map(day => ({ key: day, day: dayMapping[day], hours: "Fechado" }));
        }
        
        return dayOrder.map((dayKey) => {
            const periodsForDay = regularHours.periods.filter((p: any) => p.openDay === dayKey);

            if (periodsForDay.length === 0) {
                return { key: `${dayKey}-closed`, day: dayMapping[dayKey], hours: "Fechado" };
            }

            const isOpen24h = periodsForDay.some((p: any) => 
                p.openTime.hours === 0 && (p.openTime.minutes || 0) === 0 &&
                (p.closeTime.hours === 0 && (p.closeTime.minutes || 0) === 0)
            );
            if (isOpen24h) {
                return { key: `${dayKey}-24h`, day: dayMapping[dayKey], hours: "Aberto 24 horas" };
            }
            
            const hoursString = periodsForDay
                .map((p: any, index: number) => `${formatTime(p.openTime)} - ${formatTime(p.closeTime)}`)
                .join(", ");
                
            return { key: `${dayKey}-specific`, day: dayMapping[dayKey], hours: hoursString };
        });
    }, [profile.regularHours, profile.openInfo]);


  const handleDisconnect = useCallback(async () => {
    if (!user) return;
    setAuthLoading(true);
    try {
        await updateGoogleConnection(user.uid, { isConnected: false });
        await resetBusinessProfile(user.uid);
        toast({ title: "Desconectado", description: "A conexão com o Google foi removida." });
        await fetchFullProfile(); // Refetch to update the UI to show the connect card
    } catch(err: any) {
        toast({ title: "Erro ao Desconectar", description: err.message, variant: "destructive" });
    } finally {
       setAuthLoading(false);
    }
  }, [user, toast]);


  const fetchFullProfile = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    setMetricsLoading(true);
    setReviewsLoading(true);
    setMediaLoading(true);
    setKeywordsLoading(true);

    try {
        const [firestoreProfile, googleConn] = await Promise.all([
            getBusinessProfile(user.uid),
            getGoogleConnection(user.uid),
        ]);
        
        let activeProfile = firestoreProfile;

        if (googleConn.isConnected && googleConn.accessToken && activeProfile.googleName) {
            const locationId = activeProfile.googleName;
            
            // --- Primary Data Fetch ---
            const profileAndInsightsResponse = await fetch('/api/google/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    accessToken: googleConn.accessToken, 
                    locationId: locationId,
                    startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                    endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                })
            });
            
            // If token is expired, disconnect and stop
            if (profileAndInsightsResponse.status === 401) {
                toast({
                    title: "Sessão com o Google expirada",
                    description: "Por favor, conecte sua conta novamente para ver os dados atualizados.",
                    variant: "destructive",
                });
                await handleDisconnect();
                return;
            }

            let googleProfile: Partial<BusinessProfileData> | null = null;
            if (profileAndInsightsResponse.ok) {
                const resultData = await profileAndInsightsResponse.json();
                if (resultData.success) {
                    setMetrics(resultData.insights);
                    googleProfile = resultData.profile;
                }
            }

            if (googleProfile) {
                const newPendingFields: { [key: string]: boolean } = { ...(firestoreProfile.pendingFields || {}) };
                let pendingFieldsChanged = false;
                
                const isSame = (a: any, b: any) => (a || "") === (b || "");

                if (newPendingFields.name && isSame(firestoreProfile.name, googleProfile.name)) {
                    delete newPendingFields.name;
                    pendingFieldsChanged = true;
                }
                if (newPendingFields.phone && isSame(firestoreProfile.phone, googleProfile.phone)) {
                    delete newPendingFields.phone;
                    pendingFieldsChanged = true;
                }
                if (newPendingFields.website && isSame(firestoreProfile.website, googleProfile.website)) {
                    delete newPendingFields.website;
                    pendingFieldsChanged = true;
                }
                if (newPendingFields.description && isSame(firestoreProfile.description, googleProfile.description)) {
                    delete newPendingFields.description;
                    pendingFieldsChanged = true;
                }
                 if (newPendingFields.hours && JSON.stringify(firestoreProfile.regularHours) === JSON.stringify(googleProfile.regularHours)) {
                    delete newPendingFields.hours;
                    pendingFieldsChanged = true;
                }

                const reconciledProfile = {
                    ...firestoreProfile,
                    ...googleProfile,
                    name: firestoreProfile.name,
                    phone: firestoreProfile.phone,
                    website: firestoreProfile.website,
                    description: firestoreProfile.description,
                    pendingFields: newPendingFields,
                };

                activeProfile = reconciledProfile;
                
                if (pendingFieldsChanged) {
                    await updateBusinessProfile(user.uid, { pendingFields: newPendingFields });
                }
            }

            setProfile(activeProfile);
            setEditableProfile(activeProfile);
            setDataLoading(false);
            setMetricsLoading(false);

            // Fetch Reviews
            const reviewsResponse = await fetch('/api/google/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    accessToken: googleConn.accessToken,
                    accountId: googleConn.accountId,
                    locationId: locationId.split('/')[1]
                })
            });
            if (reviewsResponse.ok) {
                const reviewsData = await reviewsResponse.json();
                if(reviewsData.success) {
                    setReviews(reviewsData.reviews || []);
                     if (reviewsData.averageRating) {
                        setProfile(prev => ({...prev, rating: reviewsData.averageRating, totalReviews: reviewsData.reviews.length}));
                    }
                }
            } else if (reviewsResponse.status === 401) { await handleDisconnect(); return; }
            setReviewsLoading(false);
             
            // Fetch Media
            const mediaResponse = await fetch('/api/google/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken: googleConn.accessToken,
                    accountId: googleConn.accountId,
                    locationId: locationId.split('/')[1]
                })
            });
            if (mediaResponse.ok) {
                const mediaData = await mediaResponse.json();
                if (mediaData.success) setMedia(mediaData.media);
            } else if (mediaResponse.status === 401) { await handleDisconnect(); return; }
            setMediaLoading(false);

            // Fetch Search Keywords
            const keywordsResponse = await fetch('/api/google/search-keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken: googleConn.accessToken,
                    locationId: locationId,
                    startDate: dateRange?.from ? { year: dateRange.from.getFullYear(), month: dateRange.from.getMonth() + 1, day: dateRange.from.getDate() } : undefined,
                    endDate: dateRange?.to ? { year: dateRange.to.getFullYear(), month: dateRange.to.getMonth() + 1, day: dateRange.to.getDate() } : undefined,
                })
            });
            if (keywordsResponse.ok) {
                const keywordsData = await keywordsResponse.json();
                if (keywordsData.success) setKeywords(keywordsData.keywords);
            } else if (keywordsResponse.status === 401) { await handleDisconnect(); return; }
            setKeywordsLoading(false);

        } else {
            setProfile(activeProfile);
            setEditableProfile(activeProfile);
            setDataLoading(false);
            setMetricsLoading(false);
            setReviewsLoading(false);
            setMediaLoading(false);
            setKeywordsLoading(false);
        }
    } catch (error: any) {
        toast({ title: "Erro ao carregar dados", description: `Não foi possível buscar os dados completos: ${error.message}`, variant: "destructive" });
        setDataLoading(false);
        setMetricsLoading(false);
        setReviewsLoading(false);
        setMediaLoading(false);
        setKeywordsLoading(false);
    }
  }, [user, toast, dateRange, handleDisconnect]);


  useEffect(() => {
    if (user) {
        fetchFullProfile();
    }
  }, [user, fetchFullProfile]);

  const handleProfileSelection = async (selectedProfileData?: BusinessProfileData) => {
    if (!user || !pendingConnectionData || !pendingAccountId) {
      toast({ title: "Erro", description: "Dados da conexão não encontrados.", variant: "destructive" });
      setIsSelectionModalOpen(false);
      return;
    }
    if (!selectedProfileData) {
        toast({ title: "Erro", description: "Nenhum perfil foi selecionado.", variant: "destructive" });
        return;
    }

    setAuthLoading(true);
    setIsSelectionModalOpen(false);

    try {
      await updateGoogleConnection(user.uid, {
        ...pendingConnectionData,
        isConnected: true,
        accountId: pendingAccountId,
      });
      
      await updateBusinessProfile(user.uid, selectedProfileData);

      toast({ title: "Sucesso!", description: "Perfil do Google conectado e dados atualizados." });
      await fetchFullProfile();

    } catch (error: any) {
       toast({ title: "Erro ao Salvar", description: error.message, variant: "destructive" });
    } finally {
       setAuthLoading(false);
       setPendingProfiles([]);
       setPendingConnectionData(null);
       setPendingAccountId(null);
    }
  };


  const handleTokenExchange = useCallback(async (code: string, state: string | null) => {
    if (!user) {
        toast({ title: "Erro de Autenticação", description: "O usuário não foi encontrado para salvar os dados.", variant: "destructive" });
        return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch('/api/google/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state, origin: window.location.origin }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
          throw new Error(result.error || "Ocorreu um erro desconhecido durante a conexão.");
      }

      if (result.businessProfiles && result.businessProfiles.length > 1) {
          setPendingProfiles(result.businessProfiles);
          setPendingConnectionData(result.connectionData);
          setPendingAccountId(result.accountId);
          setIsSelectionModalOpen(true);
      } else if (result.businessProfiles && result.businessProfiles.length === 1) {
          await updateGoogleConnection(user.uid, {
            ...result.connectionData,
            isConnected: true,
            accountId: result.accountId,
          });
          await updateBusinessProfile(user.uid, result.businessProfiles[0]);
          toast({ title: "Sucesso!", description: "Perfil do Google conectado e dados atualizados." });
          await fetchFullProfile();
      } else {
          throw new Error("Nenhum perfil de empresa válido foi encontrado para esta conta Google.");
      }


    } catch (err: any) {
      toast({ title: "Erro na Conexão", description: err.message, variant: "destructive" });
    } finally {
      router.replace('/dashboard/meu-negocio');
      setAuthLoading(false);
    }
  }, [user, toast, router, fetchFullProfile]);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      toast({ title: "Erro na Conexão", description: decodeURIComponent(error), variant: "destructive" });
      router.replace('/dashboard/meu-negocio');
    }
    
    if (code && user) {
      handleTokenExchange(code, state);
    }
  }, [searchParams, user, handleTokenExchange, router, toast]);

  const handleConnect = () => {
    if (!user) {
        toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
        return;
    }
    setAuthLoading(true);
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = new URL('/dashboard/meu-negocio', window.location.origin).toString();


    if (!googleClientId) {
      toast({ title: "Erro de Configuração", description: "O ID de cliente do Google não está configurado.", variant: "destructive" });
      setAuthLoading(false);
      return;
    }
    
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.append('client_id', googleClientId);
    googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/business.manage');
    googleAuthUrl.searchParams.append('access_type', 'offline');
    googleAuthUrl.searchParams.append('prompt', 'consent');
    googleAuthUrl.searchParams.append('state', user.uid);
    
    window.location.href = googleAuthUrl.toString();
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingLogo(true);
    toast({ title: "Enviando nova logomarca..." });

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/google/upload-logo', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || "Falha ao fazer upload da logo.");
        }

        toast({ variant: "success", title: "Sucesso!", description: "Sua nova logo foi enviada. Pode levar alguns minutos para ser atualizada pelo Google." });
        
        // Give Google a moment before refreshing
        setTimeout(() => {
            fetchFullProfile();
        }, 3000);

    } catch (error: any) {
        toast({ variant: "destructive", title: "Erro no Upload", description: error.message });
    } finally {
        setIsUploadingLogo(false);
        // Reset file input
        if (event.target) {
            event.target.value = "";
        }
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingCover(true);
    toast({ title: "Enviando nova foto de capa..." });

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/google/upload-cover', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || "Falha ao fazer upload da capa.");
        }

        toast({ variant: "success", title: "Sucesso!", description: "Sua nova capa foi enviada. Pode levar alguns minutos para ser atualizada pelo Google." });
        
        setTimeout(() => {
            fetchFullProfile();
        }, 3000);

    } catch (error: any) {
        toast({ variant: "destructive", title: "Erro no Upload", description: error.message });
    } finally {
        setIsUploadingCover(false);
        if (event.target) {
            event.target.value = "";
        }
    }
  };

    const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setIsUploadingGallery(true);
        toast({ title: "Enviando nova foto para a galeria..." });

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/google/upload-gallery-photo', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || "Falha ao fazer upload da foto.");
            }

            toast({ variant: "success", title: "Sucesso!", description: "Sua nova foto foi adicionada à galeria." });
            
            setTimeout(() => {
                fetchFullProfile();
            }, 3000);

        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro no Upload", description: error.message });
        } finally {
            setIsUploadingGallery(false);
            if (event.target) {
                event.target.value = "";
            }
        }
    };

    const handleConfirmDelete = async () => {
        if (!mediaToDelete || !user) return;

        setIsDeleting(true);
        try {
            const response = await fetch('/api/google/delete-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mediaName: mediaToDelete.name }),
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || "Falha ao excluir a mídia.");
            }

            toast({
                variant: "success",
                title: "Sucesso!",
                description: "A foto foi excluída da sua galeria."
            });
            
            // Optimistically update UI
            setMedia(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    gallery: prev.gallery.filter(item => item.name !== mediaToDelete.name)
                };
            });

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro ao Excluir",
                description: error.message
            });
        } finally {
            setIsDeleting(false);
            setMediaToDelete(null);
        }
    };

    const handleStartEditing = () => {
        setEditableProfile(profile);
        const initialHours = dayOrder.map(dayKey => {
            const periodsForDay = profile.regularHours?.periods?.filter((p: any) => p.openDay === dayKey) || [];
            const firstPeriod = periodsForDay[0];

            let dayConfig = {
                day: dayKey,
                open: "09:00",
                close: "18:00",
                enabled: false,
                is24h: false,
            };

            if (firstPeriod) {
                const isOpen24h =
                    firstPeriod.openTime.hours === 0 &&
                    (firstPeriod.openTime.minutes || 0) === 0 &&
                    (firstPeriod.closeTime.hours === 0 && (firstPeriod.closeTime.minutes || 0) === 0);

                dayConfig.enabled = true;
                dayConfig.is24h = isOpen24h;

                if (!isOpen24h) {
                    dayConfig.open = formatTime(firstPeriod.openTime);
                    dayConfig.close = formatTime(firstPeriod.closeTime);
                }
            }

            return dayConfig;
        });
        setEditableHours(initialHours);
        setIsEditing(true);
    };
    
    const handleDayToggle = (index: number, isEnabled: boolean) => {
        setEditableHours(prev => {
            const newHours = [...prev];
            newHours[index].enabled = isEnabled;
            if (!isEnabled) {
                newHours[index].is24h = false;
            }
            return newHours;
        });
    };

    const handleTimeChange = (index: number, type: 'open' | 'close', value: string) => {
        setEditableHours(prev => {
            const newHours = [...prev];
            newHours[index][type] = value;
            return newHours;
        });
    };

    const handle24hToggle = (index: number, is24h: boolean) => {
        setEditableHours(prev => {
            const newHours = [...prev];
            newHours[index].is24h = is24h;
            return newHours;
        });
    };

    const handleApplyToAll = (indexToCopy: number) => {
        const sourceDay = editableHours[indexToCopy];
        setEditableHours(prev => {
            return prev.map((day, index) => {
                if (index === indexToCopy) return day;
                return {
                    ...day,
                    enabled: sourceDay.enabled,
                    is24h: sourceDay.is24h,
                    open: sourceDay.open,
                    close: sourceDay.close,
                };
            });
        });
        toast({
            title: "Horários aplicados",
            description: `O horário de ${dayMapping[sourceDay.day]} foi copiado para todos os outros dias.`
        });
    };


 const handleSaveChanges = async () => {
    if (!user || !profile.googleName) return;

    setIsSaving(true);
    try {
        const updates: { [key: string]: any } = {};
        const updateMask: string[] = [];
        const pendingUpdates: { [key:string]: boolean } = {};


        if (editableProfile.name !== profile.name) {
            updates.title = editableProfile.name;
            updateMask.push("title");
            pendingUpdates.name = true;
        }
        if (editableProfile.phone !== profile.phone) {
            updates.phoneNumbers = { primaryPhone: editableProfile.phone };
            updateMask.push("phoneNumbers");
            pendingUpdates.phone = true;
        }
        if (editableProfile.website !== profile.website) {
            updates.websiteUri = editableProfile.website;
            updateMask.push("websiteUri");
            pendingUpdates.website = true;
        }
        if (editableProfile.description !== profile.description) {
            updates.profile = { description: editableProfile.description };
            updateMask.push("profile.description");
            pendingUpdates.description = true;
        }
        
        const initialHoursString = JSON.stringify(profile.regularHours?.periods || []);
        const newPeriods = editableHours
            .filter(h => h.enabled)
            .map(h => {
                if (h.is24h) {
                     return {
                        openDay: h.day,
                        openTime: { hours: 0, minutes: 0 },
                        closeTime: { hours: 0, minutes: 0 },
                    };
                }
                const [openHours, openMinutes] = h.open.split(':').map(Number);
                const [closeHours, closeMinutes] = h.close.split(':').map(Number);
                return {
                    openDay: h.day,
                    openTime: { hours: openHours, minutes: openMinutes || 0 },
                    closeTime: { hours: closeHours, minutes: closeMinutes || 0 },
                };
            });
        
        if (JSON.stringify(newPeriods) !== initialHoursString) {
             updates.regularHours = { periods: newPeriods };
             updateMask.push("regularHours");
             pendingUpdates.hours = true;
        }
        
        if (updateMask.length > 0) {
           const response = await fetch('/api/google/update-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  locationName: profile.googleName, 
                  updates: updates,
                  updateMask: updateMask.join(',')
              }),
           });
           const result = await response.json();
           if (!result.success) {
              throw new Error(result.error || "Falha ao atualizar o perfil no Google.");
           }
        }
        
        // Always save local profile changes
        const localProfileUpdate = {
            ...editableProfile,
            regularHours: { periods: newPeriods }
        };

        if (Object.keys(pendingUpdates).length > 0) {
            const newPendingFields = { ...(profile.pendingFields || {}), ...pendingUpdates };
            await updateBusinessProfile(user.uid, { ...localProfileUpdate, pendingFields: newPendingFields });
            setProfile({ ...localProfileUpdate, pendingFields: newPendingFields }); // Update UI immediately
        } else {
             await updateBusinessProfile(user.uid, localProfileUpdate);
             setProfile(localProfileUpdate);
        }
        
        if(updateMask.length > 0) {
            toast({ variant: "success", title: "Sucesso!", description: "Seu perfil foi atualizado. As mudanças podem levar algum tempo para aparecer no Google." });
        } else {
            toast({ title: "Nenhuma alteração", description: "Nenhum campo foi modificado." });
        }
        

        setIsEditing(false);

    } catch (err: any) {
        toast({ title: "Erro ao Salvar", description: err.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
};

  
  if (userLoading || (dataLoading && !profile?.isVerified)) {
    return (
        <div className="flex h-full w-full items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
       <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        className="hidden"
        accept="image/png, image/jpeg"
       />
       <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverUpload}
        className="hidden"
        accept="image/png, image/jpeg"
       />
       <input
        type="file"
        ref={galleryInputRef}
        onChange={handleGalleryUpload}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
       />
       <ProfileSelectionModal
        isOpen={isSelectionModalOpen}
        profiles={pendingProfiles}
        onSelect={handleProfileSelection}
        onCancel={() => {
          setIsSelectionModalOpen(false);
          setPendingProfiles([]);
          setPendingConnectionData(null);
          setPendingAccountId(null);
        }}
      />
      
      <AnimatePresence>
        {lightboxMediaItem && (
            <Lightbox mediaItem={lightboxMediaItem} onClose={() => setLightboxMediaItem(null)} />
        )}
      </AnimatePresence>
      
        <AlertDialog open={!!mediaToDelete} onOpenChange={(open) => !open && setMediaToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. A foto será removida permanentemente do seu Perfil da Empresa no Google.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Excluir Foto
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>


      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meu Negócio</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu perfil no Google Meu Negócio</p>
        </div>
        {profile?.isVerified && !isEditing && (
         <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {!profile?.isVerified ? (
         <ConnectGoogleCard onConnect={handleConnect} loading={authLoading} />
      ) : (
        <>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard title="Visualizações Totais" value={totalViews.toLocaleString() || '0'} icon={Eye} loading={metricsLoading}/>
                    <MetricCard title="Visualizações na Pesquisa" value={metrics?.viewsSearch?.toLocaleString() || '0'} icon={Search} loading={metricsLoading}/>
                    <MetricCard title="Visualizações no Google Maps" value={metrics?.viewsMaps?.toLocaleString() || '0'} icon={MapPin} loading={metricsLoading}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard title="Cliques para acessar o site" value={metrics?.websiteClicks?.toLocaleString() || '0'} icon={Globe} loading={metricsLoading}/>
                    <MetricCard title="Ligações" value={metrics?.phoneCalls?.toLocaleString() || '0'} icon={Phone} loading={metricsLoading}/>
                    <MetricCard title="Solicitações de Rota" value={metrics?.directionsRequests?.toLocaleString() || '0'} icon={Users} loading={metricsLoading}/>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="shadow-lg border-none relative overflow-hidden group">
                        {(dataLoading || authLoading || isSaving) && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg z-20"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>}
                        
                        <div className="h-48 bg-muted rounded-t-lg relative">
                            {profile.isVerified && media?.coverPhoto?.url ? (
                                <Image src={media.coverPhoto.url} alt="Foto de capa" layout="fill" objectFit="cover" objectPosition="center" className="rounded-t-lg"/>
                            ) : (
                            <div className="w-full h-full bg-muted rounded-t-lg"></div>
                            )}
                            {isEditing && (
                                <button
                                  onClick={() => coverInputRef.current?.click()}
                                  disabled={isUploadingCover}
                                  className="absolute top-4 right-4 bg-black/50 text-white rounded-lg p-2 opacity-80 hover:opacity-100 transition-opacity flex items-center gap-2 text-sm"
                                >
                                  {isUploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                  Alterar Capa
                                </button>
                            )}
                             <div className="absolute -bottom-12 left-6 z-10">
                                <div className="relative group/logo">
                                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center overflow-hidden shrink-0 border-4 border-white shadow-md">
                                        {isUploadingLogo ? (
                                            <Loader2 className="w-8 h-8 animate-spin text-primary"/>
                                        ) : profile.isVerified && media?.profilePhoto?.url ? (
                                            <Image src={media.profilePhoto.url} alt="Logo" width={96} height={96} className="w-full h-full object-cover"/>
                                        ) : (
                                            <Building2 className="w-12 h-12 text-muted-foreground" />
                                        )}
                                    </div>
                                    {isEditing && (
                                        <button 
                                            onClick={() => logoInputRef.current?.click()}
                                            disabled={isUploadingLogo}
                                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-80 hover:opacity-100 transition-opacity"
                                        >
                                           {isUploadingLogo ? <Loader2 className="w-6 h-6 animate-spin" /> : <Edit className="w-6 h-6"/>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="pt-12 w-full">
                                    {isEditing ? (
                                        <Input 
                                            value={editableProfile.name}
                                            onChange={(e) => setEditableProfile(p => ({...p, name: e.target.value}))}
                                            className="text-2xl font-bold h-auto p-2 border rounded-md"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-2xl">{profile.name}</CardTitle>
                                            {profile.pendingFields?.name && (
                                                 <div className="flex items-center gap-1.5 text-sm text-amber-600">
                                                    <span className="font-medium">Edição pendente</span>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button className="p-0 h-auto bg-transparent hover:bg-transparent"><Info className="w-4 h-4 cursor-help" /></button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Normalmente, leva até 10 minutos para ser revisada.<br />Aguarde o aviso desaparecer antes de editar novamente.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                     {profile.isVerified && (
                                        <div className="flex items-center gap-2 mt-1 text-sm">
                                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                            <span className="font-semibold">{profile.rating ? profile.rating.toFixed(1) : 'N/A'}</span>
                                            <span className="text-muted-foreground">({profile.totalReviews || 0} avaliações)</span>
                                        </div>
                                    )}
                                </div>
                                {!isEditing && (
                                    <Button variant="outline" size="sm" onClick={handleStartEditing}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar Perfil
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 pt-6 border-t mt-4">
                                <div className="flex items-center gap-3 text-foreground/80">
                                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm">{profile.address}</span>
                                </div>
                                <div className="flex items-center gap-3 text-foreground/80">
                                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                                    {isEditing ? (
                                        <Input
                                            value={editableProfile.phone}
                                            onChange={(e) => setEditableProfile(p => ({...p, phone: e.target.value}))}
                                            placeholder="(00) 00000-0000"
                                            className="h-8 text-sm"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{profile.phone}</span>
                                            {profile.pendingFields?.phone && (
                                                 <div className="flex items-center gap-1.5 text-sm text-amber-600">
                                                    <span className="font-medium">Edição pendente</span>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button className="p-0 h-auto bg-transparent hover:bg-transparent"><Info className="w-4 h-4 cursor-help" /></button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Normalmente, leva até 10 minutos para ser revisada.<br />Aguarde o aviso desaparecer antes de editar novamente.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                 <div className="flex items-center gap-3 text-foreground/80">
                                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                                    {isEditing ? (
                                        <Input 
                                            value={editableProfile.website}
                                            onChange={(e) => setEditableProfile(p => ({...p, website: e.target.value}))}
                                            placeholder="https://seu-site.com"
                                            className="h-8 text-sm"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{profile.website || "Nenhum site informado"}</a>
                                            {profile.pendingFields?.website && (
                                                <div className="flex items-center gap-1.5 text-sm text-amber-600">
                                                    <span className="font-medium">Edição pendente</span>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button className="p-0 h-auto bg-transparent hover:bg-transparent"><Info className="w-4 h-4 cursor-help" /></button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Normalmente, leva até 10 minutos para ser revisada.<br />Aguarde o aviso desaparecer antes de editar novamente.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                 </div>
                                <div className="pt-2">
                                     {isEditing ? (
                                        <Textarea
                                            value={editableProfile.description}
                                            onChange={(e) => setEditableProfile(p => ({...p, description: e.target.value}))}
                                            placeholder="Descreva sua empresa aqui..."
                                            className="text-sm"
                                            rows={5}
                                        />
                                    ) : (
                                        <div className="flex items-start gap-2">
                                            <p className="text-sm text-muted-foreground">{profile.description}</p>
                                            {profile.pendingFields?.description && (
                                                <div className="flex items-center gap-1.5 text-sm text-amber-600 shrink-0">
                                                     <span className="font-medium">Edição pendente</span>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button className="p-0 h-auto bg-transparent hover:bg-transparent"><Info className="w-4 h-4 cursor-help" /></button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Normalmente, leva até 10 minutos para ser revisada.<br />Aguarde o aviso desaparecer antes de editar novamente.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="pt-4 mt-4 border-t">
                                <div className="flex justify-between items-center mb-4">
                                     <h4 className="font-semibold text-foreground flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-muted-foreground" />
                                        Horários de Funcionamento
                                    </h4>
                                     {profile.pendingFields?.hours && !isEditing && (
                                        <div className="flex items-center gap-1.5 text-sm text-amber-600">
                                            <span className="font-medium">Edição pendente</span>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button className="p-0 h-auto bg-transparent hover:bg-transparent"><Info className="w-4 h-4 cursor-help" /></button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>A atualização dos horários está em revisão pelo Google.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    )}
                                </div>
                                {isEditing ? (
                                    <div className="space-y-4">
                                        {editableHours.map((hour, index) => (
                                            <div key={hour.day} className="p-4 border rounded-lg bg-muted/30">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Switch
                                                            id={`day-switch-${index}`}
                                                            checked={hour.enabled}
                                                            onCheckedChange={(checked) => handleDayToggle(index, checked)}
                                                        />
                                                        <Label htmlFor={`day-switch-${index}`} className="text-base font-semibold">{dayMapping[hour.day]}</Label>
                                                    </div>
                                                    {hour.enabled && (
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={`day-24h-${index}`}
                                                                checked={hour.is24h}
                                                                onCheckedChange={(checked) => handle24hToggle(index, checked as boolean)}
                                                            />
                                                            <Label htmlFor={`day-24h-${index}`} className="text-sm">Aberto 24 horas</Label>
                                                        </div>
                                                    )}
                                                </div>
                                
                                                <AnimatePresence>
                                                    {hour.enabled && !hour.is24h && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                            animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="flex items-end gap-4">
                                                                <div className="flex-1 space-y-1.5">
                                                                    <Label htmlFor={`open-time-${index}`} className="text-xs">Abre às</Label>
                                                                    <Input
                                                                        id={`open-time-${index}`}
                                                                        type="time"
                                                                        value={hour.open}
                                                                        onChange={(e) => handleTimeChange(index, 'open', e.target.value)}
                                                                        className="h-10"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 space-y-1.5">
                                                                    <Label htmlFor={`close-time-${index}`} className="text-xs">Fecha às</Label>
                                                                    <Input
                                                                        id={`close-time-${index}`}
                                                                        type="time"
                                                                        value={hour.close}
                                                                        onChange={(e) => handleTimeChange(index, 'close', e.target.value)}
                                                                        className="h-10"
                                                                    />
                                                                </div>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => handleApplyToAll(index)}
                                                                                className="h-10 w-10 shrink-0"
                                                                            >
                                                                                <Copy className="w-4 h-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Copiar este horário para todos os dias</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                 {!hour.enabled && (
                                                     <div className="text-sm text-center text-muted-foreground pt-4">Fechado</div>
                                                 )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    dataLoading ? (
                                        <div className="space-y-3">
                                            {[...Array(7)].map((_, i) => <div key={i} className="h-8 bg-muted rounded-md animate-pulse"></div>)}
                                        </div>
                                    ) : (profile.regularHours || profile.openInfo) ? (
                                        <div className="space-y-3">
                                            {parsedHours.map((hour) => (
                                                <div key={hour.key} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted/50">
                                                    <span className="text-foreground">{hour.day}</span>
                                                    <span className={`font-semibold ${hour.hours === 'Fechado' ? 'text-red-500' : 'text-green-600'}`}>{hour.hours}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground py-4">
                                            <p>Nenhum horário de funcionamento informado.</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </CardContent>
                        {isEditing && (
                            <CardFooter className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => { setIsEditing(false); setEditableProfile(profile); }}>Cancelar</Button>
                                <Button onClick={handleSaveChanges} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Salvar Alterações
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="shadow-lg border-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5 text-green-500" />
                            Palavras-chave de Busca
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {keywordsLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                            ) : keywords.length > 0 ? (
                            keywords.map((kw, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 border rounded-lg">
                                <span className="text-sm font-medium text-foreground">{kw.keyword}</span>
                                <span className="text-sm font-bold text-green-600">{kw.exact ? kw.value : `${kw.value}+`}</span>
                                </div>
                            ))
                            ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <Key className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                                <p>Nenhuma palavra-chave encontrada para o período.</p>
                            </div>
                            )}
                        </div>
                        </CardContent>
                    </Card>
                </motion.div>

            </div>
            
            <div className="lg:col-span-1 space-y-8">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="shadow-lg border-none h-full">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />Avaliações Recentes</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {reviewsLoading ? (
                            <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                        ) : reviews.length > 0 ? (
                            reviews.map((review) => <ReviewCard key={review.name} review={review} />)
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <Star className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2"/>
                                <p>Nenhuma avaliação encontrada.</p>
                            </div>
                        )}
                        </div>
                    </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="shadow-lg border-none">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ImageIcon className="w-5 h-5 text-purple-500" /> Galeria de Mídia
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()} disabled={isUploadingGallery}>
                                {isUploadingGallery ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                Adicionar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {mediaLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : photosToShow && photosToShow.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                                {photosToShow.map((item, index) => (
                                    <div key={index} className="aspect-square relative rounded-md overflow-hidden group cursor-pointer" onClick={() => setLightboxMediaItem(item)}>
                                        <Image
                                            src={item.thumbnailUrl || item.url}
                                            alt={`Foto da galeria ${index + 1}`}
                                            layout="fill"
                                            objectFit="cover"
                                            className="group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                             <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMediaToDelete(item);
                                                }}
                                                disabled={isEditing}
                                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 z-20 hover:bg-red-500 disabled:cursor-not-allowed"
                                                title="Excluir foto"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            {item.mediaFormat === 'VIDEO' ? (
                                                <PlayCircle className="w-8 h-8 text-white" />
                                            ) : (
                                                <Search className="w-6 h-6 text-white" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                                <p className="text-sm">Nenhuma mídia na galeria.</p>
                            </div>
                        )}
                    </CardContent>
                     {media && media.gallery.length > INITIAL_PHOTO_LIMIT && (
                        <CardFooter className="pt-4 justify-center">
                             <Button variant="ghost" onClick={() => setShowAllPhotos(!showAllPhotos)} className="text-sm text-primary hover:text-primary">
                                {showAllPhotos ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                                {showAllPhotos ? 'Ver menos' : `Ver mais ${media.gallery.length - INITIAL_PHOTO_LIMIT} mídias`}
                            </Button>
                        </CardFooter>
                    )}
                    </Card>
                </motion.div>

                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="shadow-lg border-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                            <LinkIcon className="w-5 h-5 text-foreground" />
                            Integração Google
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <div>
                                    <h3 className="font-semibold text-green-900">Conectado</h3>
                                    <p className="text-sm text-muted-foreground">{profile.name}</p>
                                </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleDisconnect} disabled={authLoading}>
                                Desconectar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
            </div>
        </>
      )}
    </div>
  );
}

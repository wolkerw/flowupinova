
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import { getBusinessProfile, updateBusinessProfile, type BusinessProfileData } from "@/lib/services/business-profile-service";
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
import { config } from "@/lib/config";


interface MeuNegocioClientProps {
    initialProfile: BusinessProfileData;
}

interface GalleryItem {
    url: string;
    thumbnailUrl: string;
    mediaFormat: 'PHOTO' | 'VIDEO';
}

interface GoogleMedia {
    coverPhoto: { url: string; thumbnailUrl: string; } | null;
    profilePhoto: { url: string; thumbnailUrl: string; } | null;
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
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <>
                        <div className="bg-blue-100 p-2 rounded-lg">
                           <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">{title}</p>
                            <p className="text-lg font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
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
            className="p-4 border rounded-lg bg-white"
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {review.reviewer.profilePhotoUrl ? (
                            <Image src={review.reviewer.profilePhotoUrl} alt={review.reviewer.displayName} width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-gray-500"/>
                        )}
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900">{review.reviewer.displayName}</h4>
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
                <span className="text-xs text-gray-500">{new Date(review.updateTime).toLocaleDateString('pt-BR')}</span>
            </div>
            <p className="text-sm text-gray-700">{comment}</p>
        </motion.div>
    );
};

const ConnectGoogleCard = ({ onConnect, loading }: { onConnect: () => void, loading: boolean }) => (
    <Card className="shadow-lg border-dashed border-2 max-w-2xl mx-auto">
        <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <LinkIcon className="w-6 h-6 text-gray-700" />
                Conecte seu Perfil da Empresa no Google
            </CardTitle>
            <p className="text-gray-600 text-sm pt-2">Para gerenciar seu negócio, ver métricas e interagir com clientes, você precisa conectar sua conta do Google.</p>
        </CardHeader>
        <CardContent className="flex justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={onConnect} disabled={loading}>
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
                className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-primary has-[:checked]:bg-blue-50"
              >
                <RadioGroupItem
                  value={profile.googleName || ''}
                  id={profile.googleName}
                />
                <div>
                  <p className="font-semibold text-gray-800">{profile.name}</p>
                  <p className="text-sm text-gray-500">{profile.address}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
          {filteredProfiles.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-4">Nenhum perfil encontrado com sua busca.</p>
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
  
  const [profile, setProfile] = useState<BusinessProfileData>(initialProfile);
  const [metrics, setMetrics] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [media, setMedia] = useState<GoogleMedia | null>(null);
  const [keywords, setKeywords] = useState<any[]>([]);

  // State for profile selection modal
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [pendingProfiles, setPendingProfiles] = useState<BusinessProfileData[]>([]);
  const [pendingConnectionData, setPendingConnectionData] = useState<any>(null);
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [lightboxMediaItem, setLightboxMediaItem] = useState<GalleryItem | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);


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
  const photosToShow = showAllPhotos ? media?.gallery : media?.gallery.slice(0, INITIAL_PHOTO_LIMIT);

  const fetchFullProfile = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    setMetricsLoading(true);
    setReviewsLoading(true);
    setMediaLoading(true);
    setKeywordsLoading(true);

    try {
        const [fetchedProfile, googleConn] = await Promise.all([
            getBusinessProfile(user.uid),
            getGoogleConnection(user.uid),
        ]);
        
        setProfile(fetchedProfile);
        setDataLoading(false);

        if (googleConn.isConnected && googleConn.accessToken && fetchedProfile.googleName && googleConn.accountId) {
            const locationId = fetchedProfile.googleName.split('/')[1];

            // Fetch Insights
            const insightsResponse = await fetch('/api/google/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    accessToken: googleConn.accessToken, 
                    locationId: locationId,
                    startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                    endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                })
            });
            if (insightsResponse.ok) {
                const insightsData = await insightsResponse.json();
                if (insightsData.success) setMetrics(insightsData.insights);
            }
            setMetricsLoading(false);
            
            // Fetch Reviews
            const reviewsResponse = await fetch('/api/google/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    accessToken: googleConn.accessToken,
                    accountId: googleConn.accountId,
                    locationId: locationId
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
            }
             setReviewsLoading(false);
             
            // Fetch Media
            const mediaResponse = await fetch('/api/google/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken: googleConn.accessToken,
                    accountId: googleConn.accountId,
                    locationId: locationId
                })
            });
            if (mediaResponse.ok) {
                const mediaData = await mediaResponse.json();
                if (mediaData.success) setMedia(mediaData.media);
            }
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
            }
            setKeywordsLoading(false);


        } else {
            setMetricsLoading(false);
            setReviewsLoading(false);
            setMediaLoading(false);
            setKeywordsLoading(false);
        }
    } catch (error: any) {
        toast({ title: "Erro ao carregar dados", description: `Não foi possível buscar os dados completos: ${'error'}.message}`, variant: "destructive" });
        setDataLoading(false);
        setMetricsLoading(false);
        setReviewsLoading(false);
        setMediaLoading(false);
        setKeywordsLoading(false);
    }
  }, [user, toast, dateRange]);


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
    
    const { clientId, redirectUri } = config.google;

    if (!clientId) {
      toast({ title: "Erro de Configuração", description: "O ID de cliente do Google não está configurado.", variant: "destructive" });
      setAuthLoading(false);
      return;
    }
    
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.append('client_id', clientId);
    googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/business.manage');
    googleAuthUrl.searchParams.append('access_type', 'offline');
    googleAuthUrl.searchParams.append('prompt', 'consent');
    googleAuthUrl.searchParams.append('state', user.uid);
    
    window.location.href = googleAuthUrl.toString();
  };
  
  const handleDisconnect = async () => {
    if (!user) return;
    setAuthLoading(true);
    try {
        await updateGoogleConnection(user.uid, { isConnected: false });
        await updateBusinessProfile(user.uid, { isVerified: false, googleName: "" });
        toast({ title: "Desconectado", description: "A conexão com o Google foi removida." });
        await fetchFullProfile();
    } catch(err: any) {
        toast({ title: "Erro ao Desconectar", description: err.message, variant: "destructive" });
    } finally {
       setAuthLoading(false);
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


      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meu Negócio</h1>
          <p className="text-gray-600 mt-1">Gerencie seu perfil no Google Meu Negócio</p>
        </div>
        {profile?.isVerified && (
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
                    <Card className="shadow-lg border-none relative overflow-hidden">
                        {(dataLoading || authLoading) && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg z-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>}
                        
                        <div className="h-48 bg-gray-100 rounded-t-lg relative">
                            {profile.isVerified && media?.coverPhoto?.url ? (
                                <Image src={media.coverPhoto.url} alt="Foto de capa" layout="fill" objectFit="cover" objectPosition="center" className="rounded-t-lg"/>
                            ) : (
                            <div className="w-full h-full bg-gray-200 rounded-t-lg"></div>
                            )}
                             <div className="absolute -bottom-12 left-6 z-10">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0 border-4 border-white shadow-md">
                                    {profile.isVerified && media?.profilePhoto?.url ? (
                                        <Image src={media.profilePhoto.url} alt="Logo" width={96} height={96} className="w-full h-full object-cover"/>
                                    ) : (
                                        <Building2 className="w-12 h-12 text-gray-400" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="relative px-6 pb-6">
                             <div className="pt-14 pb-2">
                                <CardTitle className="text-2xl">{profile.name}</CardTitle>
                                {profile.isVerified && (
                                    <div className="flex items-center gap-2 mt-1 text-sm">
                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                        <span className="font-semibold">{profile.rating ? profile.rating.toFixed(1) : 'N/A'}</span>
                                        <span className="text-gray-600">({profile.totalReviews || 0} avaliações)</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 pt-6 border-t mt-4">
                                <div className="flex items-start gap-3 text-gray-700"><MapPin className="w-4 h-4 text-gray-500 mt-1 shrink-0" /><span className="text-sm">{profile.address}</span></div>
                                <div className="flex items-center gap-3 text-gray-700"><Phone className="w-4 h-4 text-gray-500" /><span className="text-sm">{profile.phone}</span></div>
                                <div className="flex items-center gap-3 text-gray-700"><Globe className="w-4 h-4 text-gray-500" /><a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{profile.website}</a></div>
                                <p className="text-sm text-gray-600 pt-2">{profile.description}</p>
                            </div>
                        </div>
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
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                            ) : keywords.length > 0 ? (
                            keywords.map((kw, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                                <span className="text-sm font-medium text-gray-800">{kw.keyword}</span>
                                <span className="text-sm font-bold text-green-600">{kw.exact ? kw.value : `${kw.value}+`}</span>
                                </div>
                            ))
                            ) : (
                            <div className="text-center text-gray-500 py-10">
                                <Key className="w-10 h-10 mx-auto text-gray-400 mb-2" />
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
                            <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                        ) : reviews.length > 0 ? (
                            reviews.map((review) => <ReviewCard key={review.name} review={review} />)
                        ) : (
                            <div className="text-center text-gray-500 py-10">
                                <Star className="w-10 h-10 mx-auto text-gray-400 mb-2"/>
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
                        <CardTitle className="flex items-center gap-2 text-base">
                        <ImageIcon className="w-5 h-5 text-purple-500" /> Galeria de Fotos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {mediaLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
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
                                            <Search className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-10">
                                <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm">Nenhuma foto na galeria.</p>
                            </div>
                        )}
                    </CardContent>
                     {media && media.gallery.length > INITIAL_PHOTO_LIMIT && (
                        <CardFooter className="pt-4 justify-center">
                             <Button variant="ghost" onClick={() => setShowAllPhotos(!showAllPhotos)} className="text-sm text-primary hover:text-primary">
                                {showAllPhotos ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                                {showAllPhotos ? 'Ver menos' : `Ver mais ${media.gallery.length - INITIAL_PHOTO_LIMIT} fotos`}
                            </Button>
                        </CardFooter>
                    )}
                    </Card>
                </motion.div>

                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="shadow-lg border-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                            <LinkIcon className="w-5 h-5 text-gray-700" />
                            Integração Google
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <div>
                                    <h3 className="font-semibold text-green-900">Conectado</h3>
                                    <p className="text-sm text-gray-700">{profile.name}</p>
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

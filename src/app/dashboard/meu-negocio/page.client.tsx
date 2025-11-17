
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { getBusinessProfile, updateBusinessProfile, type BusinessProfileData, type BusinessHoursPeriod } from "@/lib/services/business-profile-service";
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


interface MeuNegocioClientProps {
    initialProfile: BusinessProfileData;
}

interface GoogleMedia {
    coverPhoto: { url: string; thumbnailUrl: string; } | null;
    profilePhoto: { url: string; thumbnailUrl: string; } | null;
    gallery: { url: string; thumbnailUrl: string; }[];
}


const MetricCard = ({ title, value, icon: Icon, loading }: { title: string, value: string, icon: React.ElementType, loading: boolean }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
    >
        <Card className="shadow-lg border-none h-full">
            <CardContent className="p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[96px]">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">{title}</p>
                            <p className="text-2xl font-bold text-gray-900">{value}</p>
                        </div>
                        <Icon className="w-8 h-8 text-blue-500" />
                    </div>
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
            className="p-4 border rounded-lg"
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

const OperatingHoursCard = ({ hours, loading }: { hours: BusinessProfileData['regularHours'], loading: boolean }) => {
    const allDays = [
        { key: "MONDAY", name: "Segunda-feira" },
        { key: "TUESDAY", name: "Terça-feira" },
        { key: "WEDNESDAY", name: "Quarta-feira" },
        { key: "THURSDAY", name: "Quinta-feira" },
        { key: "FRIDAY", name: "Sexta-feira" },
        { key: "SATURDAY", name: "Sábado" },
        { key: "SUNDAY", name: "Domingo" },
    ];

    const formatTime = (time: { hours?: number, minutes?: number }) => {
        if (time.hours === undefined) return ""; // Should not happen if period exists
        const hours = String(time.hours).padStart(2, '0');
        const minutes = String(time.minutes || 0).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-lg border-none">
                <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-500" />Horários de Funcionamento</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                        ) : (
                            allDays.map((day) => {
                                const period = hours?.periods.find(p => p.openDay === day.key);
                                return (
                                    <div key={day.key} className="flex justify-between items-center text-sm p-2 rounded-md even:bg-gray-50/50">
                                        <span className="font-medium text-gray-800">{day.name}</span>
                                        {period ? (
                                            <span className="font-semibold text-gray-700">{formatTime(period.openTime)} – {formatTime(period.closeTime)}</span>
                                        ) : (
                                            <span className="font-semibold text-red-600">Fechado</span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        {!loading && !hours?.periods.length && (
                             <div className="text-center text-gray-500 py-10">
                                <Clock className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                                <p>Nenhum horário de funcionamento informado.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
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

  const { user, loading: userLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  const totalViews = (metrics?.viewsSearch || 0) + (metrics?.viewsMaps || 0);

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
      
      await updateGoogleConnection(user.uid, {
          ...result.connectionData,
          isConnected: true,
          accountId: result.accountId,
      });
      await updateBusinessProfile(user.uid, result.businessProfileData);

      toast({ title: "Sucesso!", description: "Perfil do Google conectado e dados atualizados." });
      await fetchFullProfile();

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
  
  if (userLoading || (dataLoading && !profile.name)) {
    return (
        <div className="flex h-full w-full items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meu Negócio</h1>
          <p className="text-gray-600 mt-1">Gerencie seu perfil no Google Meu Negócio</p>
        </div>
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
      </div>

      {/* Card de Integração Google */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LinkIcon className="w-5 h-5 text-gray-700" />
              Integração Google Meu Negócio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {authLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <p className="ml-2">Aguardando autenticação com o Google...</p>
              </div>
            ) : profile.isVerified ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Status: Conectado</h3>
                    <p className="text-sm text-green-700">Sincronizando com: {profile.name}</p>
                  </div>
                </div>
                <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleDisconnect} disabled={authLoading}>
                   Desconectar
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                <XCircle className="w-10 h-10 text-gray-400 mb-3" />
                <h3 className="font-semibold text-gray-800">Não conectado</h3>
                <p className="text-sm text-gray-600 mb-4 text-center">Conecte sua conta do Google para sincronizar os dados do seu perfil.</p>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConnect} disabled={authLoading}>
                  {authLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                  Conectar ao Google
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {profile.isVerified && (
        <>
          {/* Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            <MetricCard title="Visualizações Totais" value={totalViews.toLocaleString() || '0'} icon={Eye} loading={metricsLoading}/>
            <MetricCard title="Visualizações na Pesquisa" value={metrics?.viewsSearch?.toLocaleString() || '0'} icon={Search} loading={metricsLoading}/>
            <MetricCard title="Visualizações no Google Maps" value={metrics?.viewsMaps?.toLocaleString() || '0'} icon={MapPin} loading={metricsLoading}/>
            <MetricCard title="Cliques para acessar o site" value={metrics?.websiteClicks?.toLocaleString() || '0'} icon={Globe} loading={metricsLoading}/>
            <MetricCard title="Ligações" value={metrics?.phoneCalls?.toLocaleString() || '0'} icon={Phone} loading={metricsLoading}/>
            <MetricCard title="Solicitações de Rota" value={metrics?.directionsRequests?.toLocaleString() || '0'} icon={Users} loading={metricsLoading}/>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Perfil do Negócio */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
              <Card className="shadow-lg border-none relative">
                 {(dataLoading || authLoading) && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg z-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>}
                 
                {media?.coverPhoto?.url && (
                    <div className="aspect-video relative w-full rounded-t-lg overflow-hidden bg-gray-100">
                        <Image src={media.coverPhoto.url} alt="Foto de capa" layout="fill" objectFit="cover"/>
                    </div>
                )}
                 
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" /> Perfil do Negócio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                           {media?.profilePhoto?.url ? <Image src={media.profilePhoto.url} alt="Logo" width={64} height={64} className="w-full h-full object-cover"/> : <Building2 className="w-8 h-8 text-gray-400" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="font-semibold">{profile.rating ? profile.rating.toFixed(1) : 'N/A'}</span>
                                <span className="text-gray-600">({profile.totalReviews || 0} avaliações)</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 text-gray-700"><MapPin className="w-4 h-4 text-gray-500 mt-1 shrink-0" /><span className="text-sm">{profile.address}</span></div>
                        <div className="flex items-center gap-3 text-gray-700"><Phone className="w-4 h-4 text-gray-500" /><span className="text-sm">{profile.phone}</span></div>
                        <div className="flex items-center gap-3 text-gray-700"><Globe className="w-4 h-4 text-gray-500" /><a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{profile.website}</a></div>
                        <p className="text-sm text-gray-600 pt-2">{profile.description}</p>
                    </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <OperatingHoursCard hours={profile.regularHours} loading={dataLoading} />
          </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Avaliações Recentes */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="shadow-lg border-none">
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

            {/* Palavras-chave de Busca */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="shadow-lg border-none">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Key className="w-5 h-5 text-green-500" />Palavras-chave de Busca</CardTitle></CardHeader>
                    <CardContent>
                       {keywordsLoading ? (
                            <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                        ) : keywords.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {keywords.map((kw, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                                        <span className="text-sm font-medium text-gray-800">{kw.keyword}</span>
                                        <span className="text-sm font-bold text-green-600">{kw.exact ? kw.value : `${kw.value}+`}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-10">
                                <Key className="w-10 h-10 mx-auto text-gray-400 mb-2"/>
                                <p>Nenhuma palavra-chave encontrada para o período.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
          </div>


          {/* Galeria de Fotos */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="shadow-lg border-none">
                    <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-purple-500" /> Galeria de Fotos</CardTitle></CardHeader>
                    <CardContent>
                        {mediaLoading ? (
                             <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                        ) : media && media.gallery.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {media.gallery.map((item, index) => (
                                    <div key={index} className="aspect-square relative rounded-lg overflow-hidden group">
                                        <Image src={item.thumbnailUrl || item.url} alt={`Foto da galeria ${index + 1}`} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300"/>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                <Search className="w-8 h-8 text-white" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="text-center text-gray-500 py-10">
                                <ImageIcon className="w-10 h-10 mx-auto text-gray-400 mb-2"/>
                                <p>Nenhuma foto na galeria.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </>
      )}
    </div>
  );
}

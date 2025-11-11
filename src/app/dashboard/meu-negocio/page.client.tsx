
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
  Plus,
  ExternalLink,
  Globe,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  CheckCircle,
  XCircle,
  Loader2,
  Info
} from "lucide-react";
import { motion } from "framer-motion";
import { getBusinessProfile, updateBusinessProfile, type BusinessProfileData } from "@/lib/services/business-profile-service";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from 'next/navigation';
import { Label } from "@/components/ui/label";

interface MeuNegocioClientProps {
    initialProfile: BusinessProfileData;
}

export default function MeuNegocioPageClient({ initialProfile }: MeuNegocioClientProps) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [profile, setProfile] = useState<BusinessProfileData>(initialProfile);
  const [formState, setFormState] = useState<BusinessProfileData>(initialProfile);
  const { user, loading: userLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchProfileData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    const fetchedProfile = await getBusinessProfile(user.uid);
    if (fetchedProfile) {
        setProfile(fetchedProfile);
        setFormState(fetchedProfile);
    } else {
        toast({ title: "Erro ao carregar perfil", description: "Não foi possível buscar os dados do seu negócio.", variant: "destructive" });
    }
    setDataLoading(false);
  }, [user, toast]);

  useEffect(() => {
    if (user) {
        fetchProfileData();
    }
  }, [user, fetchProfileData]);

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
          body: JSON.stringify({ code, state }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
          throw new Error(result.error || "Ocorreu um erro desconhecido durante a conexão.");
      }
      
      // A API retornou os dados do perfil, agora o cliente salva.
      await updateBusinessProfile(user.uid, result.businessProfileData);

      toast({ title: "Sucesso!", description: "Perfil do Google conectado e dados atualizados." });
      await fetchProfileData();

    } catch (err: any) {
      toast({ title: "Erro na Conexão", description: err.message, variant: "destructive" });
    } finally {
      router.replace('/dashboard/meu-negocio');
      setAuthLoading(false);
    }
  }, [user, toast, router, fetchProfileData]);

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
    setAuthLoading(true);
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/dashboard/meu-negocio`;

    if (!googleClientId) {
      toast({ title: "Erro de Configuração", description: "O ID de cliente do Google não está configurado.", variant: "destructive" });
      setAuthLoading(false);
      return;
    }

    // Criação do valor de 'state' para segurança
    const stateValue = Math.random().toString(36).substring(2, 15);
    // Idealmente, você armazenaria 'stateValue' na sessão do usuário para validar no callback.
    
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.append('client_id', googleClientId);
    googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/business.manage');
    googleAuthUrl.searchParams.append('access_type', 'offline');
    googleAuthUrl.searchParams.append('prompt', 'consent');
    googleAuthUrl.searchParams.append('state', stateValue);
    
    window.location.href = googleAuthUrl.toString();
  };
  
  const handleDisconnect = async () => {
    if (!user) return;
    setAuthLoading(true);
    try {
        await updateBusinessProfile(user.uid, { isVerified: false });
        toast({ title: "Desconectado", description: "A conexão com o Google foi removida." });
        await fetchProfileData();
    } catch (err: any) {
        toast({ title: "Erro ao Desconectar", description: err.message, variant: "destructive" });
    } finally {
        setAuthLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({...prev, [name]: value} as BusinessProfileData));
  }

  const handleSaveProfile = async () => {
    if (!user) return;
    setDataLoading(true);
     try {
        await updateBusinessProfile(user.uid, formState);
        setProfile(formState);
        setEditingProfile(false);
        toast({ title: "Sucesso!", description: "Perfil atualizado." });
    } catch (err: any) {
        toast({ title: "Erro ao Salvar", description: err.message, variant: "destructive" });
    } finally {
        setDataLoading(false);
    }
  }

  const handleCancelEdit = () => {
    setFormState(profile);
    setEditingProfile(false);
  }
  
  const recentReviews = [
    {
      id: 1,
      author: "Maria Silva",
      rating: 5,
      date: "há 2 dias",
      comment: "Excelente atendimento! Equipe muito profissional e resultados incríveis."
    },
    {
      id: 2,
      author: "João Santos", 
      rating: 5,
      date: "há 1 semana",
      comment: "Recomendo! Aumentaram muito a visibilidade do meu negócio online."
    }
  ];

  const businessMetrics = [
    { title: "Visualizações do Perfil", value: "2.4K", change: "+18%", icon: Users },
    { title: "Buscas Diretas", value: "856", change: "+12%", icon: TrendingUp },
    { title: "Cliques no Site", value: "342", change: "+25%", icon: Globe },
    { title: "Solicitações de Rota", value: "89", change: "+8%", icon: MapPin }
  ];

  if (userLoading || (dataLoading && profile.name === 'Carregando...')) {
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
        
        <div className="flex gap-3">
          <Button variant="outline" disabled={!profile.isVerified}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver no Google
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" disabled={!profile.isVerified}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Postagem
          </Button>
        </div>
      </div>

      {/* Card de Integração Google */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-700" />
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
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-900">Status: Conectado</h3>
                      <p className="text-sm text-green-700">
                        Sincronizando com: {profile.name}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="text-red-600 hover:bg-red-50 hover:text-red-700" 
                    onClick={handleDisconnect}
                    disabled={authLoading}
                  >
                    {authLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                    Desconectar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                <XCircle className="w-10 h-10 text-gray-400 mb-3" />
                <h3 className="font-semibold text-gray-800">Não conectado</h3>
                <p className="text-sm text-gray-600 mb-4 text-center">Conecte sua conta do Google para sincronizar os dados do seu perfil.</p>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700" 
                  onClick={handleConnect}
                  disabled={authLoading}
                >
                  {authLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                  Conectar ao Google
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Seções de dados */}
        <>
          {/* Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {businessMetrics.map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="shadow-lg border-none">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{metric.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                        <p className="text-sm text-green-600 font-medium">{metric.change}</p>
                      </div>
                      <metric.icon className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Perfil do Negócio */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="shadow-lg border-none relative">
                 {(dataLoading || authLoading) && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg z-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>}
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    Perfil do Negócio
                  </CardTitle>
                  {!editingProfile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingProfile(true)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
                      <p className="text-gray-600">{profile.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-semibold">{profile.rating}</span>
                        <span className="text-gray-600">({profile.totalReviews} avaliações)</span>
                      </div>
                    </div>
                  </div>

                  {editingProfile ? (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nome do Negócio</Label>
                            <Input id="name" name="name" value={formState.name} onChange={handleFormChange} />
                        </div>
                        <div>
                            <Label htmlFor="category">Categoria</Label>
                            <Input id="category" name="category" value={formState.category} onChange={handleFormChange} />
                        </div>
                        <div>
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea id="description" name="description" value={formState.description} onChange={handleFormChange} className="h-20" />
                        </div>
                        <div>
                            <Label htmlFor="brandSummary">Resumo da Marca (para IA)</Label>
                            <Textarea id="brandSummary" name="brandSummary" value={formState.brandSummary} onChange={handleFormChange} placeholder="Ex: Cores: azul e branco. Tom de voz: amigável. Público: pequenas empresas." className="h-24" />
                        </div>
                        <div>
                            <Label htmlFor="address">Endereço</Label>
                            <Input id="address" name="address" value={formState.address} onChange={handleFormChange} />
                        </div>
                        <div>
                            <Label htmlFor="phone">Telefone</Label>
                            <Input id="phone" name="phone" value={formState.phone} onChange={handleFormChange} />
                        </div>
                        <div>
                            <Label htmlFor="website">Website</Label>
                            <Input id="website" name="website" value={formState.website} onChange={handleFormChange} />
                        </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={handleSaveProfile} disabled={dataLoading}>
                          {dataLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Salvar Alterações
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 text-gray-700">
                        <MapPin className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
                        <span className="text-sm">{profile.address}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{profile.phone}</span>
                      </div>
                       <div className="flex items-center gap-3 text-gray-700">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{profile.website}</a>
                      </div>
                      <p className="text-sm text-gray-600 pt-2">{profile.description}</p>
                      
                      {profile.brandSummary && (
                        <div className="p-3 bg-gray-50 rounded-lg mt-4 border">
                            <h4 className="font-semibold text-sm flex items-center gap-2"><Info className="w-4 h-4 text-blue-500" /> Resumo da Marca (para IA)</h4>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap mt-2">{profile.brandSummary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Avaliações Recentes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Avaliações Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentReviews.map((review, index) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{review.author}</h4>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">{review.date}</span>
                        </div>
                        <p className="text-sm text-gray-700">{review.comment}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      
    </div>
  );
}

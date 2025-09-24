
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Image,
  Video,
  FileText,
  Instagram,
  Facebook,
  Linkedin,
  Sparkles,
  Clock,
  CheckCircle,
  Loader2,
  Check,
  Paperclip,
  Link as LinkIcon,
  Settings,
  Users,
  BarChart,
  RefreshCw,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getMetaConnection, MetaConnectionData } from "@/lib/services/meta-service";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function Conteudo() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [postToSchedule, setPostToSchedule] = useState<{ text: string, imageUrl: string | null }>({ text: "", imageUrl: null });
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const router = useRouter();

  const [metaData, setMetaData] = useState<MetaConnectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const connectedAccounts = [
    { id: 'instagram', platform: 'instagram', name: metaData?.instagramAccountName || 'Instagram', icon: Instagram, isConnected: metaData?.isConnected && !!metaData.instagramAccountId },
    { id: 'facebook', platform: 'facebook', name: metaData?.facebookPageName || 'Facebook', icon: Facebook, isConnected: metaData?.isConnected && !!metaData.facebookPageId },
    { id: 'linkedin', platform: 'linkedin', name: 'LinkedIn', icon: Linkedin, isConnected: false },
  ];

  const fetchMetaConnection = async () => {
    setLoading(true);
    try {
        const data = await getMetaConnection();
        setMetaData(data);
    } catch (error) {
        console.error("Failed to fetch meta connection:", error);
        alert("Não foi possível carregar os dados da conexão Meta.");
    } finally {
        setLoading(false);
    }
  };

  const processMetaAuthCode = async (code: string) => {
    setLoading(true);
    try {
      const apiResponse = await fetch('/api/meta/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok || !data.success) {
        throw new Error(data.error || "Falha ao processar a autenticação da Meta no backend.");
      }
      
      alert('Conta Meta conectada com sucesso!');
      await fetchMetaConnection(); 
      
    } catch (error: any) {
      console.error("Error in processMetaAuthCode:", error);
      alert(`Falha ao conectar a conta Meta: ${error.message}`);
      await fetchMetaConnection(); 
    } finally {
      setLoading(false);
      window.history.replaceState({}, document.title, "/dashboard/conteudo");
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      processMetaAuthCode(code);
    } else {
      fetchMetaConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  
  const handleConnectMeta = () => {
    setLoading(true);
    const appId = "826418333144156";
    const redirectUri = `${window.location.origin}/dashboard/conteudo`;
    
    const requiredScopes = [
        "public_profile",
        "pages_show_list",
        "business_management",
        "instagram_basic",
        "instagram_content_publish",
        "pages_read_engagement"
    ];

    const metaAuthUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${requiredScopes.join(',')}`;

    window.location.href = metaAuthUrl;
  };

  const scheduledPosts = [
    {
      id: 1,
      title: "Dica sobre produtividade",
      platforms: ["instagram", "facebook"],
      date: new Date(),
      time: "14:00",
      status: "scheduled",
      type: "image"
    },
    {
      id: 2,
      title: "Novidade do produto",
      platforms: ["facebook"],
      date: new Date(),
      time: "18:30",
      status: "published",
      type: "video"
    },
    {
      id: 3,
      title: "Artigo sobre marketing",
      platforms: ["linkedin"],
      date: new Date(),
      time: "09:00",
      status: "scheduled",
      type: "text"
    }
  ];

  const platformIcons: { [key: string]: React.ElementType } = {
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin
  };

  const typeIcons: { [key: string]: React.ElementType } = {
    image: Image,
    video: Video,
    text: FileText
  };

  const handleOpenScheduler = (postContent = { text: "", imageUrl: null }) => {
    setPostToSchedule(postContent);
    setSelectedAccounts(new Set());
    setShowSchedulerModal(true);
  };

  const handleAccountSelection = (accountId: any) => {
    setSelectedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const handleSchedulePost = async () => {
    if (selectedAccounts.size === 0) {
      alert("Selecione pelo menos uma conta para publicar.");
      return;
    }
     if (!postToSchedule.text.trim()) {
      alert("O conteúdo do post não pode estar vazio.");
      return;
    }
    if (!postToSchedule.imageUrl) {
      alert("Anexe uma imagem para o post.");
      return;
    }
    
    setIsPublishing(true);

    if(selectedAccounts.has('instagram')) {
        if (!metaData?.instagramAccountId || !metaData?.longLivedToken) {
            alert("Conta do Instagram não está configurada corretamente. Verifique a conexão.");
            setIsPublishing(false);
            return;
        }

        try {
            const response = await fetch('/api/instagram/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    igUserId: metaData.instagramAccountId,
                    pageToken: metaData.longLivedToken,
                    caption: postToSchedule.text,
                    imageUrl: postToSchedule.imageUrl,
                }),
            });

            const result = await response.json();

            if (result.success) {
                alert(`Post publicado no Instagram com sucesso! Post ID: ${result.postId}`);
                setShowSchedulerModal(false);
            } else {
                throw new Error(result.error || 'Falha ao publicar no Instagram.');
            }
        } catch (error: any) {
            console.error("Erro ao publicar no Instagram:", error);
            alert(`Erro ao publicar: ${error.message}`);
        }
    }

    // Futura lógica para Facebook e LinkedIn
    // ...

    setIsPublishing(false);
  };

  const SocialConnectionCard = ({ platform, icon: Icon, color, data, onConnect }: { platform: string, icon: React.FC<any>, color: string, data: MetaConnectionData | null, onConnect: () => void }) => {
    const isConnected = data?.isConnected;
    const isInstagram = platform === 'Instagram';
    const profileName = isInstagram ? data?.instagramAccountName : data?.facebookPageName;
    const followers = isInstagram ? data?.igFollowersCount : data?.followersCount;
    const profilePic = isInstagram ? data?.igProfilePictureUrl : data?.profilePictureUrl;
    
    const isPlatformConnected = isInstagram ? !!data?.instagramAccountId : !!data?.facebookPageId;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="p-4 border rounded-xl transition-all duration-300 ease-in-out hover:shadow-md hover:border-blue-200"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: color + '1A'}}>
              <Icon className="w-6 h-6" style={{ color: color }} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{platform}</h4>
              <p className={`text-xs font-medium ${isPlatformConnected ? 'text-green-600' : 'text-gray-500'}`}>
                {isPlatformConnected && profileName ? `Conectado como ${profileName}` : 'Não conectado'}
              </p>
            </div>
          </div>
          
          <div className="w-full sm:w-auto flex-shrink-0">
             <Button
              size="sm"
              onClick={onConnect}
              disabled={loading}
              className={`w-full sm:w-auto transition-all ${
                isConnected 
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' 
                  : 'text-white border-transparent'
              }`}
              style={!isConnected ? { background: 'linear-gradient(135deg, #7DD3FC 0%, #3B82F6 50%, #1E40AF 100%)' } : {}}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isConnected ? (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Gerenciar
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Conectar
                </>
              )}
            </Button>
          </div>
        </div>
        {isPlatformConnected && (
             <Card className="mt-4 bg-gray-50 border-gray-200">
                <CardHeader className="p-3">
                    <CardTitle className="text-sm font-semibold flex justify-between items-center">
                        Métricas Principais
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fetchMetaConnection()}>
                            <RefreshCw className="w-3 h-3"/>
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        {profilePic ? <img src={profilePic} className="w-8 h-8 rounded-full" alt="profile"/> : <Users className="w-6 h-6 text-gray-500"/>}
                        <div>
                            <p className="text-xs text-gray-600">Seguidores</p>
                            <p className="text-base font-bold">{followers?.toLocaleString() ?? 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <BarChart className="w-6 h-6 text-gray-500"/>
                        <div>
                            <p className="text-xs text-gray-600">Alcance (30d)</p>
                            <p className="text-base font-bold">12.3K</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}
      </motion.div>
    );
  };


  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conteúdo & Marketing</h1>
          <p className="text-gray-600 mt-1">Crie e gerencie conteúdo para suas redes sociais com IA</p>
        </div>
        
        <div className="flex gap-3">
          <Link href="/dashboard/conteudo/gerar">
            <Button 
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar conteúdo com IA
            </Button>
          </Link>
          <Button 
            onClick={() => handleOpenScheduler()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agendar Post
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-500" />
                    Calendário Editorial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border-none"
                  />
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Posts agendados</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Posts publicados</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="shadow-lg border-none bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-blue-600" />
                    Contas Conectadas
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Conecte suas redes sociais para publicar automaticamente
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading && !metaData ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <>
                      <SocialConnectionCard platform="Facebook" icon={Facebook} color="#1877F2" data={metaData} onConnect={handleConnectMeta} />
                      <SocialConnectionCard platform="Instagram" icon={Instagram} color="#E4405F" data={metaData} onConnect={handleConnectMeta} />
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>Posts do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        {React.createElement(typeIcons[post.type as keyof typeof typeIcons], { 
                          className: "w-5 h-5 text-gray-500" 
                        })}
                        <div className="flex">
                          {post.platforms.map((platform, pIdx) => {
                            const PlatformIcon = platformIcons[platform as keyof typeof platformIcons];
                            return (
                              <PlatformIcon 
                                key={platform}
                                className={`w-5 h-5 text-blue-500 bg-white rounded-full p-0.5 border ${pIdx > 0 ? '-ml-2' : ''}`} 
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{post.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{post.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={post.status === 'published' ? 'default' : 'outline'}
                        className={post.status === 'published' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {post.status === 'published' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {post.status === 'published' ? 'Publicado' : 'Agendado'}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {showSchedulerModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSchedulerModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-6 h-6 text-blue-500" />
                Criar Nova Postagem
              </h3>
               <Button variant="ghost" size="icon" onClick={() => setShowSchedulerModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publicar em:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {connectedAccounts.map(account => {
                    const Icon = account.icon;
                    const isSelected = selectedAccounts.has(account.id);
                    return (
                      <div
                        key={account.id}
                        onClick={() => account.isConnected && handleAccountSelection(account.id)}
                        className={`p-3 border rounded-lg flex items-center gap-3 transition-all ${
                          account.isConnected 
                            ? 'cursor-pointer' 
                            : 'cursor-not-allowed opacity-50 bg-gray-50'
                        } ${
                          isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
                          {isSelected && <Check className="w-3 h-3 text-white"/>}
                        </div>
                        <Icon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-sm">{account.name}</span>
                        {!account.isConnected && <Badge variant="destructive" className="ml-auto text-xs">Não conectado</Badge>}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo
                </label>
                <Textarea 
                  placeholder="Digite o conteúdo do seu post..."
                  className="h-32"
                  value={postToSchedule.text}
                  onChange={(e) => setPostToSchedule(prev => ({ ...prev, text: e.target.value }))}
                />
              </div>
              
              {postToSchedule.imageUrl ? (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mídia Anexada
                    </label>
                    <div className="relative">
                        <img src={postToSchedule.imageUrl} alt="Prévia da imagem" className="rounded-lg w-full h-auto max-h-60 object-cover border"/>
                         <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => setPostToSchedule(prev => ({...prev, imageUrl: null}))}>
                           <X className="w-4 h-4" />
                         </Button>
                    </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2 text-gray-600"
                  onClick={() => setPostToSchedule(prev => ({...prev, imageUrl: "https://picsum.photos/seed/manualpost/800/1000"}))}
                >
                  <Paperclip className="w-4 h-4"/>
                  Anexar Mídia (Simulado)
                </Button>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data
                  </label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário
                  </label>
                  <Input type="time" defaultValue="10:00"/>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSchedulerModal(false)} disabled={isPublishing}>
                Cancelar
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700" 
                onClick={handleSchedulePost}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CalendarIcon className="w-4 h-4 mr-2" />
                )}
                Publicar Post
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

    
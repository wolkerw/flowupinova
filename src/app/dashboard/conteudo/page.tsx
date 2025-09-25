
"use client";

import React, { useState, useEffect } from "react";
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
  X,
  Send,
  CalendarClock
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getMetaConnection, MetaConnectionData } from "@/lib/services/meta-service";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { getScheduledPosts, schedulePost, PostDataInput, PostDataOutput } from "@/lib/services/posts-service";


interface DisplayPost extends PostDataOutput {
    date: Date;
    time: string;
    type: 'image' | 'text';
}


export default function Conteudo() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const router = useRouter();

  const [metaData, setMetaData] = useState<MetaConnectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduledPosts, setScheduledPosts] = useState<DisplayPost[]>([]);

  const fetchConnectionsAndPosts = async () => {
    setLoading(true);
    try {
        const metaPromise = getMetaConnection();
        const postsPromise = getScheduledPosts();
        
        const [metaResult, postsResult] = await Promise.all([metaPromise, postsPromise]);

        setMetaData(metaResult);

        const displayPosts = postsResult.map(post => {
            const scheduledDate = post.scheduledAt; // Already a Date object
            return {
                ...post,
                date: scheduledDate,
                time: format(scheduledDate, 'HH:mm'),
                type: (post.imageUrl ? 'image' : 'text') as 'image' | 'text',
            };
        });
        setScheduledPosts(displayPosts);

    } catch (error) {
        console.error("Failed to fetch initial data:", error);
        alert("Não foi possível carregar os dados. Tente recarregar a página.");
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
      await fetchConnectionsAndPosts(); 
      
    } catch (error: any) {
      console.error("Error in processMetaAuthCode:", error);
      alert(`Falha ao conectar a conta Meta: ${error.message}`);
      await fetchConnectionsAndPosts(); 
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
      fetchConnectionsAndPosts();
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
        "pages_manage_posts",
        "instagram_basic",
        "instagram_content_publish",
        "pages_read_engagement"
    ];

    const metaAuthUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${requiredScopes.join(',')}`;

    window.location.href = metaAuthUrl;
  };


  const NewPostModal = ({ onClose, onPostScheduled }: { onClose: () => void, onPostScheduled: () => void }) => {
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !text || !dateTime) {
            alert('Por favor, preencha o título, texto e data/hora.');
            return;
        }

        setIsSubmitting(true);
        const postData: PostDataInput = {
            title,
            text,
            imageUrl: imageUrl || null,
            platforms: ['instagram', 'facebook'], // Exemplo
            scheduledAt: new Date(dateTime),
        };
        
        try {
            await schedulePost(postData);
            alert('Post agendado com sucesso!');
            onPostScheduled();
            onClose();
        } catch (error) {
            alert('Falha ao agendar post.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full"
          >
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Agendar Novo Post
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Título do Post" value={title} onChange={(e) => setTitle(e.target.value)} required/>
                  <Textarea placeholder="Texto do post..." value={text} onChange={(e) => setText(e.target.value)} required/>
                  <Input placeholder="URL da Imagem (opcional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}/>
                  <Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required/>
                </CardContent>
                <CardContent className="flex justify-end gap-3">
                  <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <CalendarClock className="w-4 h-4 mr-2"/>}
                    Agendar
                  </Button>
                </CardContent>
              </Card>
            </form>
          </motion.div>
        </motion.div>
    );
  };


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
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fetchConnectionsAndPosts()}>
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
      {showNewPostModal && <NewPostModal onClose={() => setShowNewPostModal(false)} onPostScheduled={fetchConnectionsAndPosts} />}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conteúdo & Marketing</h1>
          <p className="text-gray-600 mt-1">Crie e gerencie conteúdo para suas redes sociais com IA</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            onClick={() => router.push('/dashboard/conteudo/gerar')}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar com IA
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            onClick={() => setShowNewPostModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Conteúdo
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
                    disabled={loading}
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
                {scheduledPosts
                  .filter(post => selectedDate && format(post.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
                  .map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        {post.imageUrl ? 
                            <Image className="w-5 h-5 text-gray-500" /> :
                            <FileText className="w-5 h-5 text-gray-500" />
                        }
                        <div className="flex">
                          {post.platforms.map((platform, pIdx) => {
                            const PlatformIcon = platformIcons[platform as keyof typeof platformIcons];
                            return (
                              PlatformIcon && <PlatformIcon 
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
                        className={post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
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
                {scheduledPosts.filter(post => selectedDate && format(post.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')).length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                       {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /> : "Nenhum post para a data selecionada."}
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

    
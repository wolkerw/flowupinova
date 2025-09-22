"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Conteudo() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [postToSchedule, setPostToSchedule] = useState({ text: "", imageUrl: null });
  const [selectedAccounts, setSelectedAccounts] = useState(new Set());
  
  const [connectedAccounts] = useState([
    { id: 'ig1', platform: 'instagram', name: '@impulso_app', icon: Instagram },
    { id: 'fb1', platform: 'facebook', name: 'Página Impulso Marketing', icon: Facebook },
    { id: 'li1', platform: 'linkedin', name: 'Impulso Co.', icon: Linkedin },
  ]);

  const socialAccounts = [
    { name: 'Instagram', icon: Instagram, color: '#E4405F', connected: false },
    { name: 'Facebook', icon: Facebook, color: '#1877F2', connected: false },
    { name: 'LinkedIn', icon: Linkedin, color: '#0A66C2', connected: false },
  ];

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

  const platformIcons = {
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin
  };

  const typeIcons = {
    image: Image,
    video: Video,
    text: FileText
  };

  const handleOpenScheduler = (postContent = { text: "", imageUrl: null }) => {
    setPostToSchedule(postContent);
    setSelectedAccounts(new Set());
    setShowSchedulerModal(true);
  };

  const handleAccountSelection = (accountId) => {
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
      alert("Selecione pelo menos uma conta para agendar a postagem.");
      return;
    }
    console.log("Agendando post para as contas:", Array.from(selectedAccounts));
    console.log("Conteúdo:", postToSchedule);
    alert("Simulação: Post agendado com sucesso!");
    setShowSchedulerModal(false);
  };

  const handleConnectMeta = () => {
    // Esta função irá futuramente chamar o Login do Facebook
    alert("Iniciando conexão com Meta (Facebook/Instagram)...");
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <style>{`
        :root {
          --flowup-gradient: linear-gradient(135deg, #7DD3FC 0%, #3B82F6 50%, #1E40AF 100%);
          --flowup-cyan: #7DD3FC;
          --flowup-blue: #3B82F6;
        }
      `}</style>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conteúdo & Marketing</h1>
          <p className="text-gray-600 mt-1">Crie e gerencie conteúdo para suas redes sociais com IA</p>
        </div>
        
        <div className="flex gap-3">
          <Button asChild className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
            <Link href="/dashboard/conteudo/gerar">
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar com IA
            </Link>
          </Button>
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
                    locale={ptBR}
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
                  {socialAccounts.map((account, index) => (
                    <motion.div
                      key={account.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 border rounded-xl transition-all duration-300 ease-in-out hover:shadow-md hover:border-blue-200"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: account.color + '1A'}}>
                            <account.icon className="w-6 h-6" style={{ color: account.color }} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{account.name}</h4>
                            <p className={`text-xs font-medium ${account.connected ? 'text-green-600' : 'text-gray-500'}`}>
                              {account.connected ? 'Conectado' : 'Não conectado'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="w-full sm:w-auto flex-shrink-0">
                           <Button
                            size="sm"
                            onClick={account.name === 'Facebook' || account.name === 'Instagram' ? handleConnectMeta : undefined}
                            className={`w-full sm:w-auto transition-all ${
                              account.connected 
                                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' 
                                : 'text-white border-transparent'
                            }`}
                            style={!account.connected ? { background: 'var(--flowup-gradient)' } : {}}
                          >
                            {account.connected ? (
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
                    </motion.div>
                  ))}
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
                        {React.createElement(typeIcons[post.type], { 
                          className: "w-5 h-5 text-gray-500" 
                        })}
                        <div className="flex">
                          {post.platforms.map((platform, pIdx) => {
                            const PlatformIcon = platformIcons[platform];
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
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
          >
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-6 h-6 text-blue-500" />
                Agendar Nova Postagem
              </h3>
            </div>
            <div className="p-6 space-y-6">
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
                        onClick={() => handleAccountSelection(account.id)}
                        className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
                          {isSelected && <Check className="w-3 h-3 text-white"/>}
                        </div>
                        <Icon className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-sm">{account.name}</span>
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
              
              {postToSchedule.imageUrl && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Média
                    </label>
                    <div className="relative">
                        <img src={postToSchedule.imageUrl} alt="Prévia da imagem" className="rounded-lg w-full h-auto max-h-60 object-cover border"/>
                    </div>
                </div>
              )}
              
              <Button variant="outline" className="w-full flex items-center gap-2 text-gray-600">
                <Paperclip className="w-4 h-4"/>
                Anexar Mídia
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data
                  </label>
                  <Input type="date" defaultValue={format(new Date(), "yyyy-MM-dd")}/>
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
              <Button variant="outline" onClick={() => setShowSchedulerModal(false)}>
                Cancelar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSchedulePost}>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Agendar Post
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}


"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Mail,
  TrendingUp,
  Star,
  Plus,
  Eye,
  Send,
  User,
  Phone,
  X,
  AtSign,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";


const ContactFormModal = () => {
  // State for the form fields could be added here
  // For now, it's a simple presentational component
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5"/>
            Adicionar Novo Contato
        </DialogTitle>
        <DialogDescription>
            Insira os detalhes do novo contato para adicioná-lo à sua lista.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Nome</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="contact-name" placeholder="Nome completo do contato" className="pl-10" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">E-mail</Label>
           <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="contact-email" type="email" placeholder="email@exemplo.com" className="pl-10" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Telefone (WhatsApp)</Label>
           <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="contact-phone" type="tel" placeholder="(00) 00000-0000" className="pl-10" />
          </div>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit">Salvar Contato</Button>
      </DialogFooter>
    </DialogContent>
  );
};


export default function Relacionamento() {
  const contacts = [
    {
      id: 1,
      name: "Maria Silva",
      email: "maria@exemplo.com",
      status: "lead",
      score: 85,
      lastContact: "2 dias atrás",
      source: "Facebook Ads"
    },
    {
      id: 2,
      name: "João Santos",
      email: "joao@exemplo.com",
      status: "cliente",
      score: 95,
      lastContact: "1 semana atrás",
      source: "Indicação"
    },
    {
      id: 3,
      name: "Ana Costa",
      email: "ana@exemplo.com",
      status: "prospect",
      score: 65,
      lastContact: "3 dias atrás",
      source: "Site"
    }
  ];

  const emailCampaigns = [
    {
      id: 1,
      name: "Newsletter Semanal",
      sent: 1250,
      opened: 387,
      clicked: 45,
      status: "sent"
    },
    {
      id: 2,
      name: "Promoção Black Friday",
      sent: 890,
      opened: 267,
      clicked: 89,
      status: "draft"
    }
  ];

  const statusColors: { [key: string]: string } = {
    lead: "bg-yellow-100 text-yellow-700",
    cliente: "bg-green-100 text-green-700",
    prospect: "bg-blue-100 text-blue-700"
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relacionamento</h1>
          <p className="text-gray-600 mt-1">Gerencie leads e clientes</p>
        </div>
        
        <div className="flex gap-3">
            <Dialog>
                <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Contato
                    </Button>
                </DialogTrigger>
                <ContactFormModal />
            </Dialog>
          <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
            <Mail className="w-4 h-4 mr-2" />
            Enviar Email
          </Button>
        </div>
      </div>

      {/* Métricas de relacionamento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Contatos</p>
                  <p className="text-2xl font-bold text-gray-900">2,847</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Leads Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">432</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taxa de Abertura</p>
                  <p className="text-2xl font-bold text-gray-900">31%</p>
                </div>
                <Eye className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversão</p>
                  <p className="text-2xl font-bold text-gray-900">12.5%</p>
                </div>
                <Star className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lista de contatos */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Contatos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contacts.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{contact.name}</h4>
                        <p className="text-sm text-gray-500">{contact.email}</p>
                        <p className="text-xs text-gray-400">{contact.source} • {contact.lastContact}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={statusColors[contact.status]}>
                        {contact.status}
                      </Badge>
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className="text-sm text-gray-600">{contact.score}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Campanhas de email */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-500" />
                Campanhas de Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {emailCampaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                      <Badge variant={campaign.status === 'sent' ? 'default' : 'outline'}>
                        {campaign.status === 'sent' ? 'Enviado' : 'Rascunho'}
                      </Badge>
                    </div>
                    
                    {campaign.status === 'sent' && (
                      <>
                        <div className="grid grid-cols-3 gap-4 mb-3 text-center">
                          <div>
                            <p className="text-sm text-gray-600">Enviados</p>
                            <p className="font-semibold">{campaign.sent.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Abertos</p>
                            <p className="font-semibold">{campaign.opened}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Cliques</p>
                            <p className="font-semibold">{campaign.clicked}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Taxa de Abertura</span>
                            <span>{Math.round((campaign.opened / campaign.sent) * 100)}%</span>
                          </div>
                          <Progress value={(campaign.opened / campaign.sent) * 100} className="h-2" />
                        </div>
                      </>
                    )}
                    
                    {campaign.status === 'draft' && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3 mr-1" />
                          Visualizar
                        </Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          <Send className="w-3 h-3 mr-1" />
                          Enviar
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

    
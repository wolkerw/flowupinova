
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AtSign,
  Loader2,
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
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { addContact, getContacts, type Contact } from "@/lib/services/contacts-service";


const ContactFormModal = ({ onContactAdded }: { onContactAdded: () => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: "destructive", title: "Erro", description: "Você precisa estar logado para adicionar contatos." });
            return;
        }
        if (!name.trim() || !email.trim()) {
            toast({ variant: "destructive", title: "Campos obrigatórios", description: "Nome e e-mail são obrigatórios." });
            return;
        }

        setIsSaving(true);
        try {
            await addContact(user.uid, { name, email, phone });
            toast({ title: "Sucesso!", description: "Contato adicionado." });
            onContactAdded(); // Callback to refresh the list
            // Close the modal by triggering the close button
            document.getElementById('close-dialog-button')?.click();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        } finally {
            setIsSaving(false);
        }
    };
  
    return (
      <DialogContent>
        <form onSubmit={handleSubmit}>
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
                        <Input id="contact-name" placeholder="Nome completo do contato" value={name} onChange={e => setName(e.target.value)} required className="pl-10" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contact-email">E-mail</Label>
                    <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="contact-email" type="email" placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} required className="pl-10" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contact-phone">Telefone (WhatsApp)</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="contact-phone" type="tel" placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(e.target.value)} className="pl-10" />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" id="close-dialog-button">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar Contato
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    );
};


export default function Relacionamento() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchContacts = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const fetchedContacts = await getContacts(user.uid);
            setContacts(fetchedContacts);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao buscar contatos", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if(user) {
            fetchContacts();
        }
    }, [user]);

    const handleContactAdded = () => {
        setIsFormOpen(false); // Close the dialog
        fetchContacts(); // Refresh the contact list
    }

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

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relacionamento</h1>
          <p className="text-gray-600 mt-1">Gerencie leads e clientes</p>
        </div>
        
        <div className="flex gap-3">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Contato
                    </Button>
                </DialogTrigger>
                <ContactFormModal onContactAdded={handleContactAdded} />
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
                  <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
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
                Contatos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : contacts.length > 0 ? (
                    contacts.map((contact, index) => (
                        <motion.div
                            key={contact.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">{contact.name}</h4>
                                    <p className="text-sm text-gray-500">{contact.email}</p>
                                    <p className="text-xs text-gray-400">{contact.phone}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-10">
                        <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="font-semibold">Nenhum contato encontrado</h3>
                        <p className="text-sm">Clique em "Novo Contato" para começar a adicionar.</p>
                    </div>
                )}
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

    
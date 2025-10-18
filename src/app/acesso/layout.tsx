
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Send, X, User, AtSign, Type, Instagram } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ContactModal = ({ isOpen, onClose, initialSubject = '' }: { isOpen: boolean, onClose: () => void, initialSubject?: string }) => {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [subject, setSubject] = React.useState(initialSubject);
    const [message, setMessage] = React.useState('');

    React.useEffect(() => {
        if (isOpen) {
            setSubject(initialSubject);
        }
    }, [isOpen, initialSubject]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui iria a lógica de envio do formulário
    console.log({ name, email, subject, message });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
        <motion.div
            initial={{ scale: 0.9, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: -20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full"
        >
            <CardHeader className="flex flex-row items-center justify-between border-b">
                <h3 className="text-xl font-bold">Entre em Contato</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-5 h-5" />
                </Button>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="name" placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} required className="pl-10" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                            <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subject">Assunto</Label>
                            <div className="relative">
                            <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="subject" placeholder="Sobre o que você gostaria de falar?" value={subject} onChange={(e) => setSubject(e.target.value)} required className="pl-10" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Mensagem</Label>
                        <Textarea id="message" placeholder="Escreva sua mensagem aqui..." value={message} onChange={(e) => setMessage(e.target.value)} required className="h-28" />
                    </div>
                    <Button type="submit" size="lg" className="w-full text-white" style={{ background: 'var(--flowup-gradient)' }}>
                        <Send className="w-5 h-5 mr-2" />
                        Enviar Mensagem
                    </Button>
                </form>
            </CardContent>
        </motion.div>
    </motion.div>
  );
};


export default function AcessoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const pathname = usePathname();
    const activeTab = pathname.includes('/login') ? 'login' : 'cadastrar';
    const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);
    const [modalSubject, setModalSubject] = React.useState('');

    const openContactModal = (subject = '') => {
        setModalSubject(subject);
        setIsContactModalOpen(true);
    };

    return (
        <div className="bg-white text-gray-800 flex flex-col min-h-screen">
             <style>{`
                :root {
                    --flowup-gradient: linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--primary)) 100%);
                }
            `}</style>
            
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.svg" alt="FlowUp Logo" width={120} height={25} />
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/#features" className="text-sm font-medium text-gray-600 hover:text-primary">Funcionalidades</Link>
                        <Link href="/#how-it-works" className="text-sm font-medium text-gray-600 hover:text-primary">Como Funciona</Link>
                        <Link href="/#pricing" className="text-sm font-medium text-gray-600 hover:text-primary">Preços</Link>
                    </nav>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" asChild>
                            <Link href="/acesso/login">Login</Link>
                        </Button>
                        <Button asChild className="text-white" style={{ background: 'var(--flowup-gradient)' }}>
                            <Link href="/acesso/cadastro">Criar Conta</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                <div className="flex min-h-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 pt-24">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="w-full max-w-sm shadow-xl border-none overflow-hidden bg-card">
                            <div className="p-8 pb-6" style={{ background: 'var(--flowup-gradient)' }}>
                                <CardHeader className="text-center space-y-2 p-0">
                                    <CardDescription className="text-white/80 !mt-4">Acesse sua conta ou cadastre-se para começar.</CardDescription>
                                </CardHeader>
                            </div>

                            <CardContent className="p-0">
                                <Tabs value={activeTab} className="w-full">
                                    <TabsList className="w-full justify-center bg-transparent rounded-none border-b">
                                        <TabsTrigger value="login" asChild>
                                            <Link href="/acesso/login" className={cn(
                                                "text-sm font-semibold rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground",
                                                "focus-visible:ring-0 focus-visible:ring-offset-0"
                                            )}>Login</Link>
                                        </TabsTrigger>
                                        <TabsTrigger value="cadastrar" asChild>
                                            <Link href="/acesso/cadastro" className={cn(
                                                "text-sm font-semibold rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground",
                                                "focus-visible:ring-0 focus-visible:ring-offset-0"
                                            )}>Cadastrar</Link>
                                        </TabsTrigger>
                                    </TabsList>
                                {children}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </main>

             {/* Footer */}
            <footer className="bg-gray-100 text-gray-800">
                <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Image src="/logo.svg" alt="FlowUp Logo" width={120} height={25} />
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <Link href="/termos" className="text-gray-600 hover:text-primary">Termos</Link>
                    <Link href="/privacidade" className="text-gray-600 hover:text-primary">Privacidade</Link>
                    <button onClick={() => openContactModal()} className="text-gray-600 hover:text-primary">Contato</button>
                    <a href="https://www.instagram.com/flowup.inova" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 text-white hover:opacity-90 transition-opacity">
                        <Instagram className="w-5 h-5" />
                    </a>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-200 pt-8 text-center text-gray-500 text-sm">
                    <p>&copy; 2025 Flowup Soluções e Inovações I.S. Todos os direitos reservados.</p>
                </div>
                </div>
            </footer>
            <ContactModal 
                isOpen={isContactModalOpen} 
                onClose={() => setIsContactModalOpen(false)} 
                initialSubject={modalSubject}
            />
            {/* WhatsApp Button */}
            <a
                href="https://wa.me/555199922177?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20a%20FlowUp."
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50"
                aria-label="Entre em contato pelo WhatsApp"
            >
                <Button size="icon" className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-transform hover:scale-110">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-8 h-8"
                    >
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.902-.539-5.586-1.543l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.849 6.037l-1.09 3.972 4.025-1.05z"/>
                    </svg>
                </Button>
            </a>
        </div>
    );
}

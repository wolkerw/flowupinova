
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Megaphone, BarChart3, Edit, Send, CheckCircle, Mail, MessageCircle, X, User, AtSign, Type } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const ParallaxShapes = () => {
    const { scrollYProgress } = useScroll();

    // Different transforms for variety
    const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
    const y3 = useTransform(scrollYProgress, [0, 1], [0, 100]);
    const y4 = useTransform(scrollYProgress, [0, 1], [0, -250]);
    const y5 = useTransform(scrollYProgress, [0, 1], [0, 50]);

    const x1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
    const x2 = useTransform(scrollYProgress, [0, 1], [0, 80]);

    const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 90]);
    const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -90]);

    const Shape1 = ({ y, x, rotate, className }: { y: any, x?: any, rotate?: any, className: string }) => (
        <motion.div style={{ y, x, rotate }} className={`absolute ${className}`}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2"/>
            </svg>
        </motion.div>
    );

    const Shape2 = ({ y, x, rotate, className }: { y: any, x?: any, rotate?: any, className: string }) => (
        <motion.div style={{ y, x, rotate }} className={`absolute ${className}`}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="10"/>
            </svg>
        </motion.div>
    );
    
    const Shape3 = ({ y, x, rotate, className }: { y: any, x?: any, rotate?: any, className: string }) => (
        <motion.div style={{ y, x, rotate }} className={`absolute ${className}`}>
             <svg width="100%" height="100%" viewBox="0 0 112 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M56 1L110.165 99.25H1.83501L56 1Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
        </motion.div>
    );

    const Shape4 = ({ y, x, rotate, className }: { y: any, x?: any, rotate?: any, className: string }) => (
        <motion.div style={{ y, x, rotate }} className={`absolute ${className}`}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="98" height="98" rx="15" stroke="currentColor" strokeWidth="2"/>
            </svg>
        </motion.div>
    );

    return (
        <div className="absolute inset-0 overflow-hidden z-0">
            <Shape1 y={y1} x={x1} className="w-32 h-32 text-gray-200/50 top-[10%] left-[5%]" />
            <Shape2 y={y2} rotate={rotate1} className="w-16 h-16 text-gray-200/40 top-[20%] right-[10%]" />
            <Shape3 y={y3} x={x2} className="w-24 h-24 text-gray-200/60 top-[60%] left-[15%]" />
            <Shape4 y={y4} rotate={rotate2} className="w-12 h-12 text-gray-200/30 top-[80%] right-[20%]" />
            <Shape1 y={y5} x={x2} className="w-8 h-8 text-gray-200/70 top-[5%] left-[40%]" />
            <Shape2 y={y1} className="w-20 h-20 text-gray-200/20 top-[40%] left-[50%]" />
            <Shape3 y={y2} rotate={rotate2} className="w-14 h-14 text-gray-200/50 top-[75%] left-[60%]" />
            <Shape4 y={y3} x={x1} className="w-40 h-40 text-gray-200/30 top-[-10%] right-[5%]" />
            <Shape1 y={y4} className="w-20 h-20 text-gray-200/40 bottom-[5%] left-[30%]" />
        </div>
    );
};


const ContactModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

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
                <CardTitle className="text-xl">Entre em Contato</CardTitle>
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


export default function HomePage() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const features = [
    {
      icon: Bot,
      title: "Geração de Conteúdo com IA",
      description: "Crie posts, legendas e ideias para suas redes sociais em segundos.",
    },
    {
      icon: Megaphone,
      title: "Gestão de Anúncios",
      description: "Lance e gerencie campanhas de anúncios no Facebook e Instagram.",
    },
    {
      icon: BarChart3,
      title: "Relatórios Simplificados",
      description: "Acompanhe suas métricas de marketing em um dashboard intuitivo.",
    },
  ];

  return (
    <div className="bg-white text-gray-800">
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
            <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-primary">Funcionalidades</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-primary">Como Funciona</Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-primary">Preços</Link>
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

      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-20 px-6 bg-gray-50 relative overflow-hidden">
             <ParallaxShapes />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="container mx-auto relative z-10"
          >
            <div className="grid md:grid-cols-2 items-center gap-12">
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                  Sua plataforma de marketing com <span className="text-primary">Inteligência Artificial</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-xl mx-auto md:mx-0 mb-8">
                  Automatize a criação de conteúdo, gerencie seus anúncios e analise seus resultados em um só lugar.
                </p>
                <Button size="lg" asChild className="text-white" style={{ background: 'var(--flowup-gradient)' }}>
                  <Link href="/acesso/cadastro">Começar Grátis</Link>
                </Button>
              </div>
              <div>
                 <Image 
                    src="/mascote-flowy.svg" 
                    alt="Mascote Flowy da FlowUp" 
                    width={500} 
                    height={500} 
                    className="rounded-lg mx-auto"
                  />
              </div>
            </div>
          </motion.div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="py-20 px-6">
            <div className="container mx-auto text-center">
                <h2 className="text-3xl font-bold mb-2">Como funciona? É simples.</h2>
                <p className="text-gray-600 mb-12">Em apenas três passos, seu conteúdo está pronto para brilhar.</p>
                <div className="grid md:grid-cols-3 gap-10">
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-2xl bg-blue-100 text-primary flex items-center justify-center mb-4">
                            <Edit className="w-10 h-10"/>
                        </div>
                        <h3 className="text-xl font-bold mb-2">1. Descreva</h3>
                        <p className="text-gray-600">Diga à nossa IA sobre o que você quer postar. Forneça um tema, uma ideia ou algumas palavras-chave.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-2xl bg-blue-100 text-primary flex items-center justify-center mb-4">
                            <Bot className="w-10 h-10"/>
                        </div>
                        <h3 className="text-xl font-bold mb-2">2. Receba</h3>
                        <p className="text-gray-600">A IA gera textos e sugere imagens. Escolha a opção que mais te agrada e personalize como quiser.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-2xl bg-blue-100 text-primary flex items-center justify-center mb-4">
                            <Send className="w-10 h-10"/>
                        </div>
                        <h3 className="text-xl font-bold mb-2">3. Publique</h3>
                        <p className="text-gray-600">Agende suas publicações para as melhores horas e deixe nossa plataforma postar por você.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6 bg-gray-50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Tudo que você precisa para decolar seu marketing</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-shadow h-full">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-6">
            <div className="container mx-auto">
                <h2 className="text-3xl font-bold text-center mb-2">Planos que cabem no seu bolso</h2>
                <p className="text-center text-gray-600 mb-12">Escolha o plano perfeito para impulsionar seu negócio.</p>
                <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <Card className="shadow-lg border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-bold">Plano Fundamental</CardTitle>
                            <p className="text-4xl font-bold text-primary pt-2">R$299<span className="text-lg font-medium text-gray-500">/mês</span></p>
                            <p className="text-gray-600 text-sm">Acesso completo às ferramentas de automação.</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" />Geração de Conteúdo com IA</li>
                                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" />Agendamento de Posts</li>
                                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" />Gestão de Anúncios (Meta)</li>
                                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" />Integração com Google Meu Negócio</li>
                                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" />Relatórios de Performance</li>
                            </ul>
                            <Button className="w-full text-white mt-4" style={{ background: 'var(--flowup-gradient)' }}>Assinar Agora</Button>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg border-primary border-2 relative">
                        <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                            <div className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">Mais Popular</div>
                        </div>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-bold">Plano Personal</CardTitle>
                             <p className="text-4xl font-bold text-gray-800 pt-2">Personalizado</p>
                            <p className="text-gray-600 text-sm">Tudo do Fundamental, e mais!</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" /><span className="font-bold text-primary">Tudo do Plano Fundamental, e mais:</span></li>
                                <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />Consultoria profissional de marketing 24h para auxiliar na maximização dos resultados.</li>
                            </ul>
                            <Button variant="outline" className="w-full mt-4 border-primary text-primary hover:bg-primary/10 hover:text-primary">Quero saber mais</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pronto para escalar seu conteúdo?</h2>
            <p className="text-lg text-gray-600 mb-8">Junte-se a milhares de empresas que já estão economizando tempo e dinheiro.</p>
            <Button size="lg" asChild className="text-white" style={{ background: 'var(--flowup-gradient)' }}>
              <Link href="/acesso/cadastro">Criar minha conta agora</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2">
                <Image src="/logo.svg" alt="FlowUp Logo" width={120} height={25} style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="/termos" className="text-gray-400 hover:text-white">Termos</Link>
              <Link href="/privacidade" className="text-gray-400 hover:text-white">Privacidade</Link>
              <button onClick={() => setIsContactModalOpen(true)} className="text-gray-400 hover:text-white">Contato</button>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Flowy. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  );
}


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
    const rotate3 = useTransform(scrollYProgress, [0, 1], [0, 60]);
    const rotate4 = useTransform(scrollYProgress, [0, 1], [0, -120]);
    const rotate5 = useTransform(scrollYProgress, [0, 1], [15, -80]);


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
    
    const Shape5 = ({ y, x, rotate, className }: { y: any, x?: any, rotate?: any, className: string }) => (
        <motion.div style={{ y, x, rotate }} className={`absolute ${className}`}>
             <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 69.1 133.3" fill="currentColor">
              <g>
                <path d="M46.1,96.2h-23.6l-.5-.7c-5.6-7.6-14.7-23.6-13.8-45.2C8.9,32.1,17.4,14.6,32,.9l1-.9,1.2.8c2.5,1.8,24.6,18.9,26.6,49.5,1.5,22.6-9.4,39.2-14.2,45.2l-.5.6h0ZM24.2,92.9h20.3c4.7-6.2,14.3-21.6,13-42.3-1.7-26.4-19.1-42.2-24.1-46.2-13.4,12.9-21.1,29.3-21.8,46.2-.8,19.9,7.4,34.9,12.7,42.4h-.1Z"/>
                <path d="M5,107.8c-.3,0-.5,0-.8,0-5.1-1.3-4.4-13.7-3.7-18,1.2-7.5,4.6-14.5,10.2-20.9l2.1-2.4.8,3.1c1,3.9,2.3,7.7,4,11.4,2,4.4,4.4,8.6,7.2,12.5l1.4,1.9-2.3.6c-3.3.9-6.4,2.3-9.1,4.2-2.5,1.7-4.2,3.4-5.5,4.8-1.4,1.5-2.7,2.8-4.3,2.8h0ZM11.1,73.6c-4,5.2-6.5,10.8-7.4,16.7-1.1,7.2,0,13.5,1.2,14.2.4-.2,1.2-1,1.9-1.7,1.3-1.4,3.2-3.3,6-5.2,2.4-1.6,5-3,7.9-3.9-2.4-3.6-4.5-7.3-6.3-11.2-1.3-2.9-2.4-5.8-3.3-8.8h0Z"/>
                <path d="M64.1,107.8c-1.6,0-2.8-1.3-4.3-2.8-1.3-1.4-2.9-3-5.5-4.8-2.7-1.9-5.8-3.3-9.1-4.2l-2.3-.6,1.4-1.9c2.8-3.9,5.3-8.1,7.2-12.5,1.6-3.7,3-7.5,4-11.4l.8-3.1,2.1,2.4c5.6,6.3,9,13.4,10.2,20.9.7,4.2,1.4,16.6-3.7,18-.3,0-.5,0-.8,0h0ZM48.4,93.6c2.8,1,5.5,2.3,7.9,3.9,2.8,1.9,4.7,3.8,6,5.2.7.7,1.5,1.5,1.9,1.7,1.1-.7,2.3-6.9,1.2-14.2-.9-5.9-3.4-11.5-7.4-16.7-.9,3-2,6-3.3,8.8-1.8,3.9-3.9,7.7-6.3,11.2h0Z"/>
                <path d="M34.5,133.3l-1-.7c-.5-.3-11.5-8.1-10.6-20.9.5-6.8,4.1-11.6,6.2-13.9l.5-.5h10l.5.6c2,2.3,5.4,7.1,5.8,13.9.7,12.4-9.4,20-10.6,20.8l-1,.7h.2ZM31.1,100.7c-1.8,2.1-4.5,6-4.8,11.3-.6,8.9,5.7,15.1,8.2,17.1,2.5-2.1,8.7-8.3,8.2-17.2-.3-5.2-2.8-9.1-4.5-11.3h-7.1Z"/>
                <path d="M34.9,54.4c-6.7,0-12.1-5.4-12.1-12.1s5.4-12.1,12.1-12.1,12.1,5.4,12.1,12.1-5.4,12.1-12.1,12.1ZM34.9,33.6c-4.8,0-8.7,3.9-8.7,8.7s3.9,8.7,8.7,8.7,8.7-3.9,8.7-8.7-3.9-8.7-8.7-8.7Z"/>
              </g>
            </svg>
        </motion.div>
    );

    const Shape6 = ({ y, x, rotate, className }: { y: any, x?: any, rotate?: any, className: string }) => (
        <motion.div style={{ y, x, rotate }} className={`absolute ${className}`}>
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 75.3 94.1" fill="currentColor">
                <g>
                  <path d="M37.7,23.7c23.2-1.6,35.3,25.3,20.1,42.3-3,3.4-5.5,5.5-6,10.4s1,8.5-3.7,10.4c0,3-1.9,5.9-4.8,6.8s-6.5.5-8.1,0c-3-1-4.9-3.9-4.8-7.1-4.7-2-3.1-6.6-3.4-10.5-.5-7.1-6.3-10-9.2-15.9-7.7-15.6,2.2-35.2,19.9-36.5h0ZM44.7,76.6h3.4l.2-.2c.3-2.5,1.1-4.9,2.3-7.1,2.1-3.7,5.6-6,7.7-9.8,9.5-17.2-6.5-37.6-25.3-31.1-13.6,4.6-18.4,21.4-10.3,33,1.3,1.9,3,3.3,4.3,5.1,2.1,2.8,3.3,6.2,3.6,9.7l.2.3h3.4l.2-12.3h-2.6c-1.6,0-3.7-2.2-4.2-3.6-1.6-5.2,4.6-9.2,8.6-5.6s1.7,2.2,1.7,2.9v2.6c.6.4,2.2.4,3,.3s.4,0,.6-.2v-2.6c0-.7,1.2-2.4,1.8-2.9,4.1-3.6,10.4.8,8.3,6.1-2.1,5.3-2.7,3.3-4.2,3.2h-2.6l-.2,12.3h0ZM34.4,60.6c0-1,.3-2.4-.5-3.2s-2.9-.3-2.9,1.2,2,2,3.5,2h0ZM44.9,60.8c1.5,0,3.5,0,3.5-1.8s-1.8-2.2-2.9-1.3-.5,2.1-.6,3.1ZM41.4,64.2h-3.6l-.2,12.3h3.6l.2-12.3ZM48.1,80.1l-17.5-.3v2.4c0,.3.9,1.2,1.3,1.1,4.7-.3,9.9.6,14.5.2s1.6-.5,1.6-1.1v-2.4h.1ZM44.5,87.2l-10.6-.2c.2,3.8,4,3.8,7,3.6s3.4-1.3,3.6-3.4Z"/>
                  <g>
                    <path d="M2.6,25.3l12.2,6.5c.8.4,1.1,1.5.7,2.3h0c-.4.8-1.5,1.1-2.3.7L1,28.3c-.8-.4-1.1-1.5-.7-2.3h0c.4-.8,1.5-1.1,2.3-.7Z"/>
                    <rect x="19.2" y="5.9" width="3.4" height="17.2" rx="1.7" ry="1.7" transform="translate(-4.5 15) rotate(-35.8)"/>
                    <path d="M39.8,1.6l.7,13.8c0,.9-.7,1.7-1.6,1.8h0c-.9,0-1.7-.7-1.8-1.6l-.7-13.8c0-.9.7-1.7,1.6-1.8h0c.9,0,1.7.7,1.8,1.6Z"/>
                    <rect x="46" y="11.2" width="17.2" height="3.4" rx="1.7" ry="1.7" transform="translate(18.2 55.7) rotate(-62.9)"/>
                    <path d="M74.6,21l-11.2,8.1c-.8.5-1.8.4-2.4-.4h0c-.5-.8-.4-1.8.4-2.4l11.2-8.1c.8-.5,1.8-.4,2.4.4h0c.5.8.4,1.8-.4,2.4Z"/>
                  </g>
                </g>
            </svg>
        </motion.div>
    );

    const Shape7 = ({ y, x, rotate, className }: { y: any, x?: any, rotate?: any, className: string }) => (
        <motion.div style={{ y, x, rotate }} className={`absolute ${className}`}>
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32.2 26.6" fill="currentColor">
                <path d="M7.9,0c3.3-.3,6.2,1.4,8.2,4,.1,0,.5-.6.7-.7,6.2-6.7,16.1-2.3,15.5,6.7-.4,5.5-7.1,11.3-11.3,14.3s-1.8,1.3-2.7,1.8c-2.7,1.5-4.7-.3-6.8-1.8C7.3,21.3,1.7,16.5.3,11.5-1.1,6.1,2.3.5,7.9,0ZM8.1,1.9C3.9,2.2,1.5,6,1.9,10s6.9,10.1,10.6,12.7c3.7,2.6,2.6,2,3.6,2s3.1-1.5,4-2.2c3.6-2.6,10-8,10.3-12.7.6-7.5-7.9-10.8-12.5-4.9-.3.4-.9,1.5-1.3,1.7-1,.5-1.4-.7-1.9-1.3-1.6-2.1-3.8-3.5-6.6-3.3h0Z"/>
            </svg>
        </motion.div>
    );


    return (
        <div className="absolute inset-0 overflow-hidden z-0">
            <Shape5 y={y1} x={x1} rotate={rotate3} className="w-32 h-32 text-gray-200/50 top-[10%] left-[5%]" />
            <Shape2 y={y2} rotate={rotate1} className="w-16 h-16 text-gray-200/40 top-[20%] right-[10%]" />
            <Shape5 y={y1} x={x2} rotate={rotate1} className="w-10 h-10 text-gray-200/60 top-[50%] right-[5%]" />
            <Shape6 y={y5} x={x2} rotate={rotate5} className="w-12 h-12 text-gray-200/70 top-[5%] left-[40%]" />
            <Shape7 y={y1} rotate={rotate4} className="w-16 h-16 text-gray-200/40 top-[35%] left-[55%]" />
            <Shape1 y={y2} rotate={rotate2} className="w-14 h-14 text-gray-200/50 top-[75%] left-[60%]" />
            <Shape5 y={y5} rotate={rotate2} className="w-16 h-16 text-gray-200/40 top-[90%] left-[5%]" />
            <Shape6 y={y4} rotate={rotate3} className="w-20 h-20 text-gray-200/40 bottom-[5%] left-[30%]" />
            <Shape7 y={y3} rotate={rotate1} className="w-8 h-8 text-gray-200/60 top-[85%] right-[5%]" />
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

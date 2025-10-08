
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Megaphone, BarChart3, Edit, Send, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FlowUpLogo } from '@/components/logo';

export default function HomePage() {
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
            <div className="w-8 h-8">
              <FlowUpLogo />
            </div>
            <span className="font-bold text-xl text-gray-900">FlowUp</span>
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
        <section className="py-20 px-6 bg-gray-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="container mx-auto"
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
                    src="/mascote-flowup.png" 
                    alt="Mascote da plataforma FlowUp" 
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
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20">
                  <FlowUpLogo className="text-white" />
                </div>
                <span className="font-bold text-xl">FlowUp</span>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white">Termos</Link>
              <Link href="#" className="text-gray-400 hover:text-white">Privacidade</Link>
              <Link href="#" className="text-gray-400 hover:text-white">Contato</Link>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} FlowUp. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

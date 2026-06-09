"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bot,
  BarChart3,
  Edit,
  Send,
  CheckCircle,
  MessageCircle,
  Sparkles as SparklesIcon,
  Instagram,
  Clock,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const WHATSAPP_LINK = "https://wa.me/555199922177?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20a%20NumVapt.";

export function HomePageContent() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { user, loading } = useAuth();

  const features = [
    {
      icon: Bot,
      title: "IA Treinada para o seu Negócio",
      description:
        "Não é um ChatGPT genérico. O Vapti aprende sobre seu nicho, seu tom de voz e escreve exatamente o que seu público quer ler.",
    },
    {
      icon: Edit,
      title: "Design Automático",
      description:
        "Geramos imagens incríveis via IA e aplicamos sua logomarca automaticamente. Sem precisar abrir o Photoshop ou o Canva.",
    },
    {
      icon: Send,
      title: "Piloto Automático de Posts",
      description:
        "Integração oficial com Facebook e Instagram. Agende seus posts e deixe nossa plataforma trabalhar por você enquanto você dorme.",
    },
    {
      icon: BarChart3,
      title: "Inteligência de Dados",
      description:
        "Dashboard claro com métricas que realmente importam. Saiba exatamente o que está dando certo no seu marketing.",
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Ganhe Horas na Semana",
      description: "Reduza o tempo gasto com marketing em 90%. De horas de sufoco para apenas 3 cliques.",
    },
    {
      icon: TrendingUp,
      title: "Consistência Absoluta",
      description: "Nunca mais deixe de postar por 'falta de tempo'. Mantenha sua marca viva e atraia mais clientes todos os dias.",
    },
    {
      icon: ShieldCheck,
      title: "Zero Curva de Aprendizado",
      description: "Nossa interface é tão intuitiva que você cria seu primeiro post profissional em menos de 5 minutos.",
    },
  ];

  return (
    <div className="bg-background text-foreground selection:bg-primary/20">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-primary/10 bg-background/95 shadow-sm backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <Image
              src="/logo-numvapt.png"
              alt="NumVapt Logo"
              width={140}
              height={50}
              className="h-auto"
            />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#how-it-works"
              className="text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
            >
              Como Funciona
            </Link>
            <Link
              href="#features"
              className="text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
            >
              Funcionalidades
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
            >
              Preços
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-10 w-24 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <Button
                asChild
                className="rounded-full bg-primary px-6 font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
              >
                <Link href="/dashboard">Ir para Painel</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden rounded-full font-bold sm:inline-flex">
                  <Link href="/acesso/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-full bg-primary px-6 font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
                >
                  <Link href="/acesso/cadastro">Criar Conta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative bg-white px-6 py-24 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="container relative z-10 mx-auto text-center"
          >
            <div className="mx-auto max-w-4xl">
              <Badge
                variant="outline"
                className="mb-6 rounded-full border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-bold text-primary"
              >
                <SparklesIcon className="mr-2 h-4 w-4" /> Nova Era do Marketing Digital
              </Badge>
              <h1 className="mb-6 text-5xl font-black leading-[1.1] tracking-tight text-slate-900 md:text-7xl">
                Seu marketing no modo <span className="text-primary">Ultra Vapt</span>
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-xl font-medium leading-relaxed text-slate-600">
                A primeira plataforma com IA que cria textos brilhantes, gera imagens com a sua marca e agenda seus posts automaticamente. Tudo em um só lugar.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  asChild
                  className="h-16 w-full rounded-full bg-primary px-10 text-lg font-bold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl sm:w-auto"
                >
                  <Link href="/acesso/cadastro">Começar Teste Grátis de 7 Dias</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="h-16 w-full rounded-full border-2 border-primary/20 px-10 text-lg font-bold text-primary hover:bg-primary/5 sm:w-auto"
                >
                  <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" /> Falar no WhatsApp
                  </a>
                </Button>
              </div>
              <p className="mt-6 text-sm font-medium text-slate-400">
                Não exigimos cartão de crédito para testar.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Problema vs Solução */}
        <section className="bg-slate-50 px-6 py-24">
          <div className="container mx-auto">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-black md:text-4xl text-slate-900">
                Criar conteúdo não precisa ser um <span className="text-primary">segundo trabalho.</span>
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
              <Card className="border-red-100 bg-red-50/50 shadow-none">
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <X className="h-6 w-6" /> O Jeito Antigo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-slate-600 font-medium">
                  <p>❌ Horas perdidas pensando em "o que postar hoje".</p>
                  <p>❌ Luta constante com ferramentas de design complexas.</p>
                  <p>❌ Pagando caro por agências que não entendem a sua voz.</p>
                  <p>❌ Redes sociais abandonadas por falta de tempo.</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5 shadow-md">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <CheckCircle className="h-6 w-6" /> Com o NumVapt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-slate-700 font-medium">
                  <p>✅ Ideias de conteúdo geradas por IA em segundos.</p>
                  <p>✅ Imagens lindas geradas e com sua logo aplicada automaticamente.</p>
                  <p>✅ Publicação e agendamento diretos para Facebook e Instagram.</p>
                  <p>✅ Consistência profissional que cabe no seu bolso.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="bg-white px-6 py-24 border-y border-slate-100">
          <div className="container mx-auto text-center">
            <h2 className="mb-4 text-4xl font-black text-slate-900">
              Simples como <span className="italic text-primary">Vapt Vupt!</span>
            </h2>
            <p className="mx-auto mb-16 max-w-2xl text-lg text-slate-500 font-medium">
              Nossa plataforma foi desenhada para que você gaste o menor tempo possível configurando
              e o máximo colhendo resultados.
            </p>
            <div className="grid gap-12 md:grid-cols-3 max-w-6xl mx-auto">
              <div className="group flex flex-col items-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary/10 text-primary transition-all duration-300 group-hover:-translate-y-2 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg">
                  <Bot className="h-10 w-10" />
                </div>
                <h3 className="mb-3 text-2xl font-black text-slate-800">1. Dê a Ideia</h3>
                <p className="px-4 text-slate-500 font-medium leading-relaxed">
                  Diga ao Vapti sobre o que você quer postar hoje. Ele entende seu negócio e cria opções prontas.
                </p>
              </div>
              <div className="group flex flex-col items-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary/10 text-primary transition-all duration-300 group-hover:-translate-y-2 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg">
                  <Edit className="h-10 w-10" />
                </div>
                <h3 className="mb-3 text-2xl font-black text-slate-800">2. Personalize</h3>
                <p className="px-4 text-slate-500 font-medium leading-relaxed">
                  Escolha entre as imagens geradas pela IA. Nossa ferramenta embute sua marca no post na hora.
                </p>
              </div>
              <div className="group flex flex-col items-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary/10 text-primary transition-all duration-300 group-hover:-translate-y-2 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg">
                  <Send className="h-10 w-10" />
                </div>
                <h3 className="mb-3 text-2xl font-black text-slate-800">3. Publique</h3>
                <p className="px-4 text-slate-500 font-medium leading-relaxed">
                  Envie direto para suas redes ou deixe agendado para o melhor horário. O resto é com a gente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-slate-50 px-6 py-24">
          <div className="container mx-auto">
            <div className="mb-16 text-center">
              <h2 className="text-4xl font-black text-slate-900">A Plataforma Definitiva</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500 font-medium">Tudo o que você precisa para dominar as redes sociais, reunido em uma interface elegante e poderosa.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full border-none shadow-md hover:shadow-lg transition-shadow bg-white">
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <feature.icon className="h-7 w-7" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900 mb-2">{feature.title}</CardTitle>
                        <p className="text-slate-500 font-medium leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefícios / Motivos Section */}
        <section className="bg-primary px-6 py-24 text-white">
          <div className="container mx-auto">
            <div className="mb-16 text-center">
              <h2 className="text-4xl font-black">Por que escolher o NumVapt?</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    <benefit.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold">{benefit.title}</h3>
                  <p className="text-primary-foreground/80 font-medium leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-16 text-center">
              <Button asChild size="lg" className="rounded-full bg-white text-primary hover:bg-slate-100 font-bold px-10 h-14 text-lg">
                <Link href="/acesso/cadastro">Quero começar a economizar tempo</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-slate-50 px-6 py-24">
          <div className="container mx-auto">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-black text-slate-900">Planos sem pegadinhas</h2>
              <p className="mx-auto max-w-xl text-lg text-slate-500 font-medium">
                Escolha a velocidade ideal para o crescimento do seu negócio.
              </p>

              <div className="mt-10 flex items-center justify-center gap-6">
                <Label
                  htmlFor="billing-cycle"
                  className={cn(
                    "text-lg font-bold transition-all",
                    !isAnnual ? "text-primary scale-105" : "text-slate-400"
                  )}
                >
                  Mensal
                </Label>
                <Switch
                  id="billing-cycle"
                  checked={isAnnual}
                  onCheckedChange={setIsAnnual}
                  className="data-[state=checked]:bg-primary"
                />
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="billing-cycle"
                    className={cn(
                      "text-lg font-bold transition-all",
                      isAnnual ? "text-primary scale-105" : "text-slate-400"
                    )}
                  >
                    Anual
                  </Label>
                  <Badge className="bg-accent text-white border-none font-bold">
                    -20%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
              {/* Trial */}
              <Card className="flex flex-col border-2 border-slate-200 bg-white shadow-sm transition-colors hover:border-primary/30">
                <CardHeader className="pb-4 pt-10">
                  <CardTitle className="text-2xl font-black text-slate-900">Modo Start</CardTitle>
                  <p className="pt-4 text-5xl font-black text-slate-900">
                    R$0<span className="text-xl font-bold text-slate-400">/7 dias</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-500 font-medium">
                    Experimente o poder da IA sem compromisso.
                  </p>
                </CardHeader>
                <CardContent className="flex-grow space-y-4 pt-6">
                  <ul className="space-y-4">
                    {["Geração de Conteúdo IA", "Criação Automática de Imagens", "Agendamento Facebook/Instagram", "Relatórios de Desempenho", "Suporte por E-mail"].map((item) => (
                      <li key={item} className="flex items-center gap-3 font-bold text-slate-700">
                        <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-8 pt-0">
                  <Button
                    asChild
                    variant="outline"
                    className="h-14 w-full rounded-full border-2 border-primary text-primary hover:bg-primary/5 font-bold text-lg"
                  >
                    <Link href="/acesso/cadastro">Iniciar Teste Grátis</Link>
                  </Button>
                </div>
              </Card>

              {/* Standard */}
              <Card className="relative flex flex-col border-[3px] border-primary bg-white shadow-xl lg:scale-105">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-6 py-1.5 text-sm font-black uppercase tracking-wider text-white shadow-md">
                  Mais Assinado
                </div>
                <CardHeader className="pb-4 pt-10 text-center">
                  <CardTitle className="text-3xl font-black text-slate-900">Plano Standard</CardTitle>
                  <div className="pt-6">
                    <p className="text-6xl font-black text-primary">
                      {isAnnual ? "R$400" : "R$490"}
                      <span className="text-xl font-bold text-slate-400">/mês</span>
                    </p>
                    <p className="mt-3 text-sm font-medium text-slate-500">
                      {isAnnual ? "Faturado anualmente (economia de R$ 1.080)" : "Faturado mensalmente"}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-5 pt-8 px-10">
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 font-bold text-slate-800">
                      <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
                      Tudo do modo Start
                    </li>
                    <li className="flex items-center gap-3 font-bold text-slate-800">
                      <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
                      Vapti AI sem limites
                    </li>
                    <li className="flex items-center gap-3 font-bold text-slate-800">
                      <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
                      Gestão de Anúncios Meta
                    </li>
                    <li className="flex items-center gap-3 font-bold text-slate-800">
                      <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
                      Google Meu Negócio Pro
                    </li>
                    <li className="flex items-center gap-3 font-bold text-slate-800">
                      <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
                      Suporte Humanizado Prioritário
                    </li>
                  </ul>
                </CardContent>
                <div className="p-8 pt-0">
                  <Button
                    asChild
                    className="h-14 w-full rounded-full bg-primary text-lg font-black text-white shadow-lg transition-all hover:scale-105 hover:bg-primary/90"
                  >
                    <Link href="/acesso/cadastro">Assinar Agora</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white px-6 py-32 border-t border-slate-100">
          <div className="container mx-auto text-center">
            <h2 className="mb-6 text-4xl font-black text-slate-900 md:text-5xl">
              Pare de postar por obrigação.<br/>Comece a postar para <span className="text-primary">crescer</span>.
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-xl font-medium text-slate-500">
              O Vapti está pronto para impulsionar seu marketing. E você?
            </p>
            <Button
              size="lg"
              asChild
              className="h-16 rounded-full bg-primary px-12 text-xl font-black text-white shadow-xl transition-all hover:scale-105"
            >
              <Link href="/acesso/cadastro">Criar minha conta grátis agora</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 pb-12 pt-20 text-white">
        <div className="container mx-auto px-6">
          <div className="mb-16 grid gap-12 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <Image
                src="/logo-numvapt.png"
                alt="NumVapt Logo"
                width={160}
                height={60}
                className="mb-8 h-auto brightness-0 invert"
              />
              <p className="max-w-sm text-lg font-medium leading-relaxed text-slate-400">
                A plataforma de marketing inteligente focada em velocidade e resultados reais
                para donos de negócios.
              </p>
            </div>
            <div>
              <h4 className="mb-6 text-xl font-bold">Plataforma</h4>
              <ul className="space-y-4 font-medium text-slate-400">
                <li>
                  <Link href="#how-it-works" className="transition-colors hover:text-white">
                    Como Funciona
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="transition-colors hover:text-white">
                    Funcionalidades
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="transition-colors hover:text-white">
                    Preços
                  </Link>
                </li>
                <li>
                  <Link href="/acesso/login" className="transition-colors hover:text-white">
                    Acessar Painel
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 text-xl font-bold">Contato e Legal</h4>
              <ul className="space-y-4 font-medium text-slate-400">
                <li>
                  <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" /> Suporte via WhatsApp
                  </a>
                </li>
                <li>
                  <Link href="/termos" className="transition-colors hover:text-white">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="transition-colors hover:text-white">
                    Política de Privacidade
                  </Link>
                </li>
                <li className="pt-4">
                  <a
                    href="https://www.instagram.com/numvapt.oficial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-primary"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm font-medium text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} NumVapt Soluções e Inovações I.S. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="group fixed bottom-8 right-8 z-50 flex items-center gap-3"
        aria-label="Entre em contato pelo WhatsApp"
      >
        <span className="hidden rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-lg md:block group-hover:bg-slate-50">
          Precisa de ajuda?
        </span>
        <div className="relative">
          <div className="absolute -inset-2 rounded-full bg-green-500/20 blur-lg transition-colors group-hover:bg-green-500/40"></div>
          <Button
            size="icon"
            className="relative h-16 w-16 rounded-full bg-green-500 text-white shadow-2xl transition-all hover:scale-110 hover:bg-green-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-10 w-10"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.902-.539-5.586-1.543l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.849 6.037l-1.09 3.972 4.025-1.05z" />
            </svg>
          </Button>
        </div>
      </a>
    </div>
  );
}

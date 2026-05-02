"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Send, X, User, AtSign, Type, Instagram } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/auth-provider";

const ContactModal = ({
  isOpen,
  onClose,
  initialSubject = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: string;
}) => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState(initialSubject);
  const [message, setMessage] = React.useState("");

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: -20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-card shadow-2xl"
      >
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <h3 className="text-xl font-bold">Entre em Contato</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="subject"
                  placeholder="Sobre o que você gostaria de falar?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Escreva sua mensagem aqui..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="h-28"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary text-white transition-all hover:bg-primary/90"
            >
              <Send className="mr-2 h-5 w-5" />
              Enviar Mensagem
            </Button>
          </form>
        </CardContent>
      </motion.div>
    </motion.div>
  );
};

export default function AcessoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = pathname.includes("/login") ? "login" : "cadastrar";
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);
  const [modalSubject, setModalSubject] = React.useState("");
  const { user, loading } = useAuth();

  const openContactModal = (subject = "") => {
    setModalSubject(subject);
    setIsContactModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 bg-background/80 shadow-sm backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-numvapt.png"
              alt="NumVapt Logo"
              width={120}
              height={60}
              className="h-auto"
            />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/#features"
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Funcionalidades
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Como Funciona
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Preços
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
            ) : user ? (
              <Button asChild className="bg-primary text-white">
                <Link href="/dashboard">Entrar</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/acesso/login">Login</Link>
                </Button>
                <Button asChild className="bg-primary text-white">
                  <Link href="/acesso/cadastro">Criar Conta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-grow items-center justify-center bg-muted px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <Card className="mx-auto w-full max-w-sm overflow-hidden border-none bg-card shadow-xl">
            <div className="bg-primary p-8 pb-6 text-primary-foreground">
              <CardHeader className="space-y-2 p-0 text-center">
                <CardDescription className="!mt-4 text-primary-foreground/90">
                  Acesse sua conta ou cadastre-se para começar.
                </CardDescription>
              </CardHeader>
            </div>

            <CardContent className="p-0">
              <Tabs value={activeTab} className="w-full">
                <TabsList className="w-full justify-center rounded-none border-b bg-transparent">
                  <TabsTrigger value="login" asChild>
                    <Link
                      href="/acesso/login"
                      className={cn(
                        "rounded-none bg-transparent text-sm font-semibold text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none",
                        "focus-visible:ring-0 focus-visible:ring-offset-0"
                      )}
                    >
                      Login
                    </Link>
                  </TabsTrigger>
                  <TabsTrigger value="cadastrar" asChild>
                    <Link
                      href="/acesso/cadastro"
                      className={cn(
                        "rounded-none bg-transparent text-sm font-semibold text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none",
                        "focus-visible:ring-0 focus-visible:ring-offset-0"
                      )}
                    >
                      Cadastrar
                    </Link>
                  </TabsTrigger>
                </TabsList>
                {children}
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-muted text-foreground">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="flex items-center gap-2">
              <Image
                src="/logo-numvapt.png"
                alt="NumVapt Logo"
                width={120}
                height={60}
                className="h-auto"
              />
            </div>
            <div className="mt-4 flex items-center gap-4 md:mt-0">
              <Link href="/termos" className="text-muted-foreground hover:text-primary">
                Termos
              </Link>
              <Link href="/privacidade" className="text-muted-foreground hover:text-primary">
                Privacidade
              </Link>
              <button
                onClick={() => openContactModal()}
                className="text-muted-foreground hover:text-primary"
              >
                Contato
              </button>
              <a
                href="https://www.instagram.com/numvapt.oficial"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 text-white transition-opacity hover:opacity-90"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 NumVapt Soluções e Inovações I.S. Todos os direitos reservados.</p>
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
        href="https://wa.me/555199922177?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20a%20NumVapt."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50"
        aria-label="Entre em contato pelo WhatsApp"
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-green-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-8 w-8"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.902-.539-5.586-1.543l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.849 6.037l-1.09 3.972 4.025-1.05z" />
          </svg>
        </Button>
      </a>
    </div>
  );
}

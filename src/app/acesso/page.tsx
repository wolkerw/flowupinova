
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves, Mail, Lock, User } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AcessoPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Lógica de login aqui
        console.log("Login com:", email, password);
    };

    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault();
        // Lógica de cadastro aqui
        console.log("Cadastro com:", name, email, password);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
             <style>{`
                :root {
                    --flowup-gradient: linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--primary)) 100%);
                }
            `}</style>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="w-full max-w-sm shadow-xl border-none overflow-hidden bg-card">
                    <div className="p-6" style={{ background: 'var(--flowup-gradient)' }}>
                         <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Waves className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <CardHeader className="text-center space-y-2 p-0">
                            <CardTitle className="text-2xl font-bold text-white">Bem-vindo(a) ao FlowUp</CardTitle>
                            <CardDescription className="text-white/80">Acesse sua conta ou cadastre-se para começar.</CardDescription>
                        </CardHeader>
                    </div>

                    <CardContent className="p-0">
                        <Tabs defaultValue="login" className="w-full">
                            <TabsList className="w-full justify-center bg-transparent rounded-none border-b">
                                <TabsTrigger value="login" className="text-sm font-semibold rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground">Login</TabsTrigger>
                                <TabsTrigger value="cadastrar" className="text-sm font-semibold rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground">Cadastrar</TabsTrigger>
                            </TabsList>
                            <TabsContent value="login" className="p-6">
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="login-email">E-mail</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input id="login-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="login-password">Senha</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input id="login-password" type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-10" />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full !mt-6 text-white" style={{ background: 'var(--flowup-gradient)' }}>
                                        Entrar na Plataforma
                                    </Button>
                                </form>
                            </TabsContent>
                            <TabsContent value="cadastrar" className="p-6">
                                <form onSubmit={handleSignUp} className="space-y-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="signup-name">Nome Completo</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input id="signup-name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required className="pl-10" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">E-mail</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input id="signup-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">Senha</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input id="signup-password" type="password" placeholder="Crie uma senha forte" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-10" />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full !mt-6 text-white" style={{ background: 'var(--flowup-gradient)' }}>
                                        Criar Minha Conta
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

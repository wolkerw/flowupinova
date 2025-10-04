
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";

export default function CadastroPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Cadastro com:", name, email, password);
    };

    return (
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
    );
}

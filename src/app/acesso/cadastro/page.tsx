
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Building, Loader2 } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { useAuth } from '@/components/auth/auth-provider';

export default function CadastroPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signUpWithEmail } = useAuth();


    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await signUpWithEmail(name, email, password);
        setIsLoading(false);
    };

    return (
        <TabsContent value="cadastrar" className="p-6">
            <form onSubmit={handleSignUp} className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome da Empresa</Label>
                    <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="signup-name" placeholder="Sua empresa" value={name} onChange={(e) => setName(e.target.value)} required className="pl-10" />
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
                        <Input id="signup-password" type="password" placeholder="Mínimo de 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-10" minLength={6}/>
                    </div>
                </div>
                <Button type="submit" className="w-full !mt-6 text-white" style={{ background: 'var(--flowup-gradient)' }} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Criar Minha Conta'}
                </Button>
            </form>
        </TabsContent>
    );
}

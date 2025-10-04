
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Login com:", email, password);
    };

    return (
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
    );
}

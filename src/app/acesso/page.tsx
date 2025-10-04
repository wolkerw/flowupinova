"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves } from "lucide-react";
import { useAuth } from '@/components/auth/auth-provider';
import { motion } from "framer-motion";

export default function AcessoPage() {
    const { loginWithGoogle, loading } = useAuth();

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
             <style>{`
                :root {
                    --flowup-gradient: linear-gradient(135deg, #7DD3FC 0%, #3B82F6 50%, #1E40AF 100%);
                }
            `}</style>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="w-full max-w-sm shadow-xl border-none">
                    <CardHeader className="text-center space-y-4 pt-8">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--flowup-gradient)' }}>
                            <Waves className="h-8 w-8 text-white" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold">Acesse sua conta</CardTitle>
                            <CardDescription>Use seu e-mail e senha para acessar a plataforma.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                       {/* O formulário de login/cadastro será adicionado aqui */}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

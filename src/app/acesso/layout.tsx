"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function AcessoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const pathname = usePathname();
    const activeTab = pathname.includes('/login') ? 'login' : 'cadastrar';

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
                            <div className="w-24 h-8 flex items-center justify-center">
                                <Image src="/logo.svg" alt="FlowUp Logo" width={120} height={25} style={{ filter: 'brightness(0) invert(1)' }} />
                            </div>
                        </div>
                        <CardHeader className="text-center space-y-2 p-0">
                            <CardTitle className="text-2xl font-bold text-white">Bem-vindo(a) ao FlowUp</CardTitle>
                            <CardDescription className="text-white/80">Acesse sua conta ou cadastre-se para começar.</CardDescription>
                        </CardHeader>
                    </div>

                    <CardContent className="p-0">
                        <Tabs value={activeTab} className="w-full">
                            <TabsList className="w-full justify-center bg-transparent rounded-none border-b">
                                <TabsTrigger value="login" asChild>
                                    <Link href="/acesso/login" className={cn(
                                        "text-sm font-semibold rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground",
                                        "focus-visible:ring-0 focus-visible:ring-offset-0"
                                    )}>Login</Link>
                                </TabsTrigger>
                                <TabsTrigger value="cadastrar" asChild>
                                    <Link href="/acesso/cadastro" className={cn(
                                        "text-sm font-semibold rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground",
                                        "focus-visible:ring-0 focus-visible:ring-offset-0"
                                    )}>Cadastrar</Link>
                                </TabsTrigger>
                            </TabsList>
                           {children}
                        </Tabs>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

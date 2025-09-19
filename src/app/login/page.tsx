"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves } from "lucide-react";
import { useAuth } from '@/components/auth/auth-provider';
import { motion } from "framer-motion";

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.8 0-5.18-1.88-6.04-4.42H2.34v2.84C4.13 20.98 7.79 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M6.04 14.31c-.2-.6-.31-1.25-.31-1.91s.11-1.31.31-1.91V7.66H2.34C1.5 9.25 1 10.79 1 12.4s.5 3.15 1.34 4.74l3.7-2.83z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.79 1 4.13 3.02 2.34 5.82l3.7 2.84C6.82 6.26 9.2 5.38 12 5.38z"
    />
  </svg>
);


export default function LoginPage() {
    const { loginWithGoogle, loading } = useAuth();

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
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
                <Card className="w-full max-w-sm shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--flowup-gradient)' }}>
                            <Waves className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Bem-vindo à FlowUp</CardTitle>
                        <CardDescription>Faça login para continuar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            onClick={loginWithGoogle}
                            disabled={loading}
                            variant="outline" 
                            className="w-full h-12 text-base"
                        >
                            <GoogleIcon />
                            Entrar com Google
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
    
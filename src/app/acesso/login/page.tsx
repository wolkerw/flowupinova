"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().min(1, "O e-mail é obrigatório.").email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const customZodResolver = (schema: z.ZodTypeAny) => (data: any) => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { values: result.data, errors: {} };
  } else {
    const errors: Record<string, any> = {};
    result.error.issues.forEach(issue => {
      const path = issue.path[0] as string;
      if (!errors[path]) {
        errors[path] = { type: issue.code, message: issue.message };
      }
    });
    return { values: {}, errors };
  }
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { loginWithEmail, resetPassword } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<LoginFormValues>({
    mode: "onBlur",
    resolver: customZodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await loginWithEmail(data.email, data.password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = getValues("email");
    const isEmailValid = await trigger("email");
    
    if (!email || !isEmailValid) {
      toast({
        variant: "destructive",
        title: "Informe um e-mail válido",
        description: "Digite seu e-mail no campo acima corretamente para receber o link de recuperação.",
      });
      return;
    }

    if (resetPassword) {
      setIsResetting(true);
      try {
        await resetPassword(email);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <Card className="w-full border shadow-sm rounded-lg bg-card p-6 md:p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
          Acesse sua conta
        </h1>
        <p className="text-sm text-slate-500">
          Preencha seus dados para continuar
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="seu@email.com"
              className={`pl-10 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Senha</Label>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isResetting}
              className="text-xs font-semibold text-[#FA6305] hover:underline"
            >
              {isResetting ? "Enviando..." : "Esqueci minha senha"}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`pl-10 pr-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full mt-2 bg-[#FA6305] hover:bg-[#FA6305]/90 text-white font-medium"
          disabled={isLoading || isResetting}
        >
          {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Entrar"}
        </Button>
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-slate-600">
          Não tem uma conta?{" "}
          <Link
            href="/acesso/cadastro"
            className="text-[#FA6305] font-semibold hover:underline"
          >
            Criar conta grátis
          </Link>
        </p>
      </div>
    </Card>
  );
}

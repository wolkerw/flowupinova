"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Building, Loader2, Phone, Briefcase } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

const signupSchema = z.object({
  name: z.string().min(2, "O nome da empresa deve ter pelo menos 2 caracteres."),
  phone: z.string().min(10, "Informe um telefone válido com DDD."),
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  segment: z.string().min(1, "Por favor, selecione um segmento."),
  customSegment: z.string().optional(),
}).refine(data => {
  if (data.segment === "outro" && (!data.customSegment || data.customSegment.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Por favor, informe o seu segmento.",
  path: ["customSegment"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

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

export default function CadastroPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signUpWithEmail } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormValues>({
    mode: "onBlur",
    resolver: customZodResolver(signupSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      segment: "",
      customSegment: "",
    },
  });

  const watchSegment = watch("segment");

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    const finalSegment = data.segment === "outro" ? data.customSegment : data.segment;
    await signUpWithEmail(data.name, data.email, data.password, data.phone, finalSegment || "");
    setIsLoading(false);
  };

  return (
    <Card className="w-full border shadow-sm rounded-lg bg-card p-6 md:p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Cadastro
        </h1>
        <p className="text-sm text-slate-500">
          Preencha os dados da sua empresa
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="signup-name">Nome da Empresa</Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-name"
              placeholder="Sua empresa"
              className={`pl-10 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="signup-phone">Telefone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-phone"
              type="tel"
              placeholder="(00) 00000-0000"
              className={`pl-10 ${errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="signup-email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-email"
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
          <Label htmlFor="signup-password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo de 6 caracteres"
              className={`pl-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="segmento">Segmento de Negócio</Label>
          <div className="relative">
            <Select 
              onValueChange={(val) => setValue("segment", val, { shouldValidate: true })} 
              value={watchSegment}
            >
              <SelectTrigger id="segmento" className={`pl-10 ${errors.segment ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <SelectValue placeholder="Selecione seu segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="varejo">Varejo</SelectItem>
                <SelectItem value="imobiliario">Imobiliário</SelectItem>
                <SelectItem value="saude">Saúde e Bem-estar</SelectItem>
                <SelectItem value="alimentacao">Alimentação</SelectItem>
                <SelectItem value="servicos">Serviços</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {errors.segment && (
            <p className="text-sm text-red-500">{errors.segment.message}</p>
          )}
        </div>

        {watchSegment === "outro" && (
          <div className="space-y-2">
            <Label htmlFor="custom-segment">Qual o seu segmento?</Label>
            <Input
              id="custom-segment"
              placeholder="Ex: Consultoria de TI"
              className={`pl-4 ${errors.customSegment ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              {...register("customSegment")}
            />
            {errors.customSegment && (
              <p className="text-sm text-red-500">{errors.customSegment.message}</p>
            )}
          </div>
        )}

        <Button type="submit" className="!mt-6 w-full bg-primary text-white hover:bg-primary/90" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Criar Minha Conta"}
        </Button>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            Já tem uma conta?{" "}
            <Link href="/acesso/login" className="text-[#FA6305] font-semibold hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </form>
    </Card>
  );
}

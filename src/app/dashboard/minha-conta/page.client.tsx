"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Shield, User, Loader2 } from "lucide-react";

export function MinhaContaPageClient() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [userPlan, setUserPlan] = useState<string>("Carregando...");
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, `users/${user.uid}`);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const plan = docSnap.data().plan || "trial";
        setUserPlan(plan.toUpperCase());
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !user.email) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: "As senhas não conferem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Re-autenticar o usuário
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Atualizar a senha
      await updatePassword(user, newPassword);

      toast({
        title: "Senha alterada com sucesso!",
        description: "Sua senha foi atualizada. Use-a no seu próximo login.",
      });

      // Limpar formulário
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      let errorMessage = "Ocorreu um erro ao alterar sua senha. Tente novamente.";

      if (error.code === "auth/invalid-credential") {
        errorMessage = "A senha atual informada está incorreta.";
      }

      toast({
        title: "Erro ao alterar senha",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Minha Conta</h1>
        <p className="mt-2 text-muted-foreground">
          Gerencie os detalhes do seu plano e suas configurações de segurança.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Coluna 1: Informações do Plano e E-mail */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Assinatura
              </CardTitle>
              <CardDescription>Informações sobre seu plano atual na NumVapt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Plano Atual</Label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xl font-bold text-slate-900">{userPlan}</span>
                  {userPlan === "PRO" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informações de Login
              </CardTitle>
              <CardDescription>
                Este é o e-mail que você usa para acessar a plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="text-muted-foreground">E-mail</Label>
                <div className="mt-1 font-medium text-slate-900">{user.email}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Alteração de Senha */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>
              Mantenha sua conta segura. Se sua conta foi criada pela nossa equipe, recomendamos que
              altere a senha padrão agora mesmo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-800">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="text-sm">
                <strong>Dica de Segurança:</strong> Não use senhas fáceis como "mudar123" ou
                "numvapt123". Sua Vitrine Digital e seus acessos sociais são valiosos!
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Sua senha atual..."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="No mínimo 6 caracteres..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a nova senha novamente..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#0083C7] hover:bg-[#006ca3]"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Atualizar Senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

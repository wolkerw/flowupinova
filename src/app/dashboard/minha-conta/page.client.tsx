"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Shield, User, Loader2, FileText, Printer, Eye } from "lucide-react";
import { DigitalContractViewer } from "@/components/dashboard/DigitalContractViewer";
import type { UserContractDoc } from "@/lib/types/contract";

export function MinhaContaPageClient() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [userPlan, setUserPlan] = useState<string>("Carregando...");
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [contract, setContract] = useState<UserContractDoc | null>(null);
  const [loadingContract, setLoadingContract] = useState(true);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, `users/${user.uid}`);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const plan = docSnap.data().plan || "trial";
        setUserPlan(plan.toUpperCase());
      }
    });

    // Buscar contrato de assinatura do cliente
    const fetchContract = async () => {
      try {
        setLoadingContract(true);
        const res = await fetch("/api/contracts");
        if (res.ok) {
          const data = await res.json();
          setContract(data.contract || null);
        }
      } catch (err) {
        console.warn("Erro ao buscar contrato do usuário:", err);
      } finally {
        setLoadingContract(false);
      }
    };
    fetchContract();

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
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      toast({
        title: "Senha alterada com sucesso!",
        description: "Sua senha foi atualizada. Use-a no seu próximo login.",
      });

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
          Gerencie os detalhes do seu plano, seu contrato de assinatura e suas configurações de segurança.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Coluna 1: Informações do Plano e Contrato */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#0083C7]" />
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

          {/* Card: Contrato de Assinatura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#0083C7]" />
                Contrato de Assinatura
              </CardTitle>
              <CardDescription>
                Consulte o contrato digital de adesão e os termos de contratação conscious.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingContract ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#0083C7]" />
                  Carregando informações do contrato...
                </div>
              ) : contract ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      Assinado Digitalmente
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-1.5 text-xs text-slate-700">
                    <p>
                      <strong>Modalidade:</strong> Plano {contract.modalidade?.toUpperCase()}
                    </p>
                    <p>
                      <strong>Valor do Ciclo:</strong> R$ {contract.valorTotalCiclo?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p>
                      <strong>Data da Assinatura:</strong> {contract.signedAtFormatted || "Confirmada"}
                    </p>
                    <p className="truncate text-slate-400 font-mono text-[11px]">
                      <strong>Autenticação:</strong> {contract.id}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsContractModalOpen(true)}
                    className="w-full gap-2 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4 text-[#0083C7]" />
                    Visualizar Contrato Completo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Você ainda não possui um contrato de assinatura assinado. Ao contratar ou renovar um plano PRO, seu contrato digital assinado com valor legal ficará armazenado aqui para consulta e download.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsContractModalOpen(true)}
                    className="w-full text-xs text-[#0083C7] hover:text-[#006ca3] hover:bg-blue-50"
                  >
                    <FileText className="mr-1.5 h-4 w-4" />
                    Consultar Minuta Padrão de Contrato
                  </Button>
                </div>
              )}
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

      {/* Modal de Visualização Completa do Contrato */}
      <Dialog open={isContractModalOpen} onOpenChange={setIsContractModalOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DigitalContractViewer
            modalidade={contract?.modalidade || "anual"}
            formaPagamento={contract?.formaPagamento || "pix"}
            readOnly={true}
            signedContract={contract}
            initialAssinante={{
              nomeOuRazaoSocial: contract?.assinante?.nomeOuRazaoSocial || user.displayName || "",
              cpfOuCnpj: contract?.assinante?.cpfOuCnpj || "",
              email: user.email || "",
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

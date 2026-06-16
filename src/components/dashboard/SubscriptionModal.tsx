"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { 
  Loader2, 
  Sparkles, 
  Check, 
  Copy, 
  Upload, 
  FileText, 
  Crown, 
  Zap, 
  Image as ImageIcon, 
  Infinity as InfinityIcon, 
  BarChart3,
  HelpCircle,
  Calendar,
  AlertCircle
} from "lucide-react";
import Image from "next/image";

// Interface clara para o documento do usuário no Firestore conforme a regra 3
export interface UserSubscriptionDoc {
  uid: string;
  email: string;
  plan?: "trial" | "pro" | "free";
  role?: "free" | "pro" | "admin";
  subscriptionStatus?: "pending_verification" | "active" | "inactive" | "expired" | "";
  paymentProofUrl?: string; // Armazena a imagem base64 ou URL do comprovante
  paymentProofUploadedAt?: any;
  updatedAt?: any;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export function SubscriptionModal({ isOpen, onClose, userId }: SubscriptionModalProps) {
  const { toast } = useToast();
  
  // States
  const [userData, setUserData] = useState<UserSubscriptionDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const PIX_KEY = "numvaptinova@gmail.com";
  const PIX_RECIPIENT = "NumVapt Inovações LTDA";
  const SUBSCRIPTION_PRICE = "R$ 97,00";

  // Escutar dados de assinatura do usuário no Firestore em tempo real
  useEffect(() => {
    if (!userId || !isOpen) {
      setFetchingUser(false);
      return;
    }

    setFetchingUser(true);
    const userDocRef = doc(db, "users", userId);
    
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            uid: userId,
            email: data.email || "",
            plan: data.plan || "trial",
            role: data.role || "free",
            subscriptionStatus: data.subscriptionStatus || "",
            paymentProofUrl: data.paymentProofUrl || "",
            paymentProofUploadedAt: data.paymentProofUploadedAt,
            updatedAt: data.updatedAt,
          });
        }
        setFetchingUser(false);
      },
      (error) => {
        console.error("Erro ao obter dados de assinatura do usuário:", error);
        setFetchingUser(false);
      }
    );

    return () => unsubscribe();
  }, [userId, isOpen]);

  const handleCopyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Chave Pix copiada com sucesso para a área de transferência.",
        variant: "success",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a chave automaticamente.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem (PNG/JPG) ou um arquivo PDF.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho do arquivo deve ser menor que 5MB.",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedFile(e.target.result as string);
      }
    };
    reader.onerror = () => {
      toast({
        title: "Erro ao ler arquivo",
        description: "Ocorreu um erro ao carregar o arquivo do seu dispositivo.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProof = async () => {
    if (!userId) {
      toast({
        title: "Erro de autenticação",
        description: "Por favor, faça login novamente para prosseguir.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione ou tire uma foto do seu comprovante Pix.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const userDocRef = doc(db, "users", userId);
      
      // Atualiza o Firestore com as informações do comprovante e altera o status para pending_verification
      await updateDoc(userDocRef, {
        subscriptionStatus: "pending_verification",
        paymentProofUrl: selectedFile,
        paymentProofUploadedAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: "Comprovante enviado! 🚀",
        description: "Nosso time foi notificado e sua assinatura PRO será liberada em breve.",
        variant: "success",
      });
      
      setSelectedFile(null);
      setFileName("");
    } catch (error: any) {
      console.error("Erro ao salvar comprovante:", error);
      toast({
        title: "Erro ao enviar comprovante",
        description: error.message || "Tente novamente ou fale conosco via WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh] p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-2 text-2xl font-black text-gray-900">
            <Crown className="h-7 w-7 text-amber-500 fill-amber-400 animate-bounce" />
            {userData?.subscriptionStatus === "pending_verification" ? "Comprovante em Análise" : "Acesso Premium PRO"}
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            {userData?.subscriptionStatus === "pending_verification" 
              ? "Estamos analisando o comprovante enviado para ativar seus benefícios PRO." 
              : "Desbloqueie o potencial máximo do seu marketing digital com o NumVapt PRO."}
          </DialogDescription>
        </DialogHeader>

        {fetchingUser ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : userData?.subscriptionStatus === "pending_verification" ? (
          // Vista: Comprovante em Análise
          <div className="py-6 space-y-6">
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-6 flex items-start gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-full shrink-0">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 text-lg">Validação de Assinatura Pendente</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Já recebemos o comprovante Pix enviado e nosso time de suporte está validando a transação. 
                  Sua conta PRO será liberada em alguns minutos e você poderá usufruir de todas as ferramentas ilimitadas.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-gray-700 text-sm flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> Detalhes do Envio
              </Label>
              <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 space-y-3">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500 font-medium">Data do Upload:</span>
                  <span className="text-gray-900 font-semibold flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-500" />
                    {userData.paymentProofUploadedAt?.toDate ? 
                      userData.paymentProofUploadedAt.toDate().toLocaleString("pt-BR") : 
                      new Date().toLocaleString("pt-BR")}
                  </span>
                </div>
                {userData.paymentProofUrl && userData.paymentProofUrl.startsWith("data:image") && (
                  <div className="space-y-2">
                    <span className="text-xs text-gray-500 font-medium block">Imagem do Comprovante:</span>
                    <div className="relative border rounded-lg overflow-hidden h-40 w-full bg-white flex items-center justify-center p-2 shadow-inner">
                      <img 
                        src={userData.paymentProofUrl} 
                        alt="Comprovante de pagamento" 
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
                Precisa de urgência ou quer mandar o comprovante por outro canal? Clique no botão abaixo para nos enviar diretamente no WhatsApp e agilizar sua liberação!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-100">
              <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
                Fechar Janela
              </Button>
              <Button asChild className="w-full sm:w-auto bg-green-500 hover:bg-green-600 font-bold">
                <a
                  href={`https://wa.me/555199922177?text=Olá!%20Acabei%20de%20anexar%20meu%20comprovante%20PIX%20de%20assinatura%20PRO%20no%20painel%20da%20NumVapt%20para%20o%20email%20${encodeURIComponent(userData.email)}.%20Poderiam%20validar?`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mr-2 h-5 w-5">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.894 11.892-1.99 0-3.902-.539-5.586-1.543l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.849 6.037l-1.09 3.972 4.025-1.05z" />
                  </svg>
                  Acelerar no WhatsApp
                </a>
              </Button>
            </div>
          </div>
        ) : (
          // Vista: Assinar e Fazer Upgrade
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 items-start">
            {/* Vantagens PRO (Left Side) */}
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-amber-500 fill-amber-400" />
                Vantagens de ser PRO
              </h3>

              <ul className="space-y-4 text-sm">
                <li className="flex gap-3">
                  <div className="p-1 bg-amber-100 rounded-lg text-amber-600 shrink-0 h-7 w-7 flex items-center justify-center">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 block">Inteligência Artificial Flux Kontext</span>
                    <span className="text-gray-500 text-xs">Criação de textos e conceitos que aprendem o tom da sua marca.</span>
                  </div>
                </li>

                <li className="flex gap-3">
                  <div className="p-1 bg-pink-100 rounded-lg text-pink-600 shrink-0 h-7 w-7 flex items-center justify-center">
                    <Crown className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 block">Ideogram 4.0 Turbo</span>
                    <span className="text-gray-500 text-xs">Geração de criativos e imagens realistas com altíssima definição de fontes e rostos.</span>
                  </div>
                </li>

                <li className="flex gap-3">
                  <div className="p-1 bg-blue-100 rounded-lg text-blue-600 shrink-0 h-7 w-7 flex items-center justify-center">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 block">Remoção de Fundo com 1-Clique</span>
                    <span className="text-gray-500 text-xs">Lave o fundo de fotos de produtos e insira-as em belos layouts criativos.</span>
                  </div>
                </li>

                <li className="flex gap-3">
                  <div className="p-1 bg-green-100 rounded-lg text-green-600 shrink-0 h-7 w-7 flex items-center justify-center">
                    <InfinityIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 block">Downloads Ilimitados</span>
                    <span className="text-gray-500 text-xs">Exporte todos os seus criativos criados sem marca d&apos;água ou limitações.</span>
                  </div>
                </li>

                <li className="flex gap-3">
                  <div className="p-1 bg-purple-100 rounded-lg text-purple-600 shrink-0 h-7 w-7 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 block">Relatórios de Concorrência</span>
                    <span className="text-gray-500 text-xs">Análise métricas e posts de concorrentes diretos para se antecipar no mercado.</span>
                  </div>
                </li>
              </ul>

              <div className="rounded-xl border bg-gray-50 p-4 border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">Assinatura Mensal</span>
                  <span className="text-2xl font-black text-gray-900">{SUBSCRIPTION_PRICE}</span>
                </div>
                <span className="text-[10px] text-gray-400 block mt-1 text-right">Cancele quando quiser, sem fidelidade.</span>
              </div>
            </div>

            {/* Pagamento Pix e Envio (Right Side) */}
            <div className="space-y-6 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5">
                <HelpCircle className="h-5 w-5 text-primary" />
                Como assinar via Pix?
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase block">1. Transfira pelo App do seu Banco</span>
                  
                  {/* Detalhes da chave Pix */}
                  <div className="relative flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                    <div className="overflow-hidden">
                      <span className="text-xs text-gray-400 block font-medium">Chave Pix (E-mail):</span>
                      <span className="font-mono font-bold text-gray-800 block truncate">{PIX_KEY}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleCopyPixKey}
                      className="text-primary hover:bg-gray-100 p-2 h-auto"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="text-[11px] text-gray-400 flex flex-col gap-0.5 px-1">
                    <span>Beneficiário: <strong className="text-gray-600">{PIX_RECIPIENT}</strong></span>
                    <span>Valor sugerido: <strong className="text-gray-600">{SUBSCRIPTION_PRICE}</strong></span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase block">2. Envie o Comprovante Pix</span>
                  
                  {/* Upload de Comprovante */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-center w-full">
                      <label 
                        htmlFor="dropzone-file" 
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors p-4"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-1 text-xs sm:text-sm text-gray-500 font-bold">
                            {fileName ? fileName : "Clique para anexar o comprovante"}
                          </p>
                          <p className="text-[10px] text-gray-400">PNG, JPG, JPEG ou PDF (máx. 5MB)</p>
                        </div>
                        <input 
                          id="dropzone-file" 
                          type="file" 
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="hidden" 
                        />
                      </label>
                    </div>

                    {selectedFile && (
                      <Button
                        onClick={handleUploadProof}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/95 text-white font-bold"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando comprovante...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Enviar Comprovante de Pagamento
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 justify-center pt-2">
                <Button asChild variant="outline" className="w-full font-bold">
                  <a
                    href="https://wa.me/555199922177?text=Olá!%20Gostaria%20de%20assinar%20o%20plano%20PRO%20da%20NumVapt."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Falar com Vendedor no WhatsApp
                  </a>
                </Button>
                <Button variant="ghost" onClick={onClose} className="w-full text-xs text-gray-400 hover:text-gray-600">
                  Voltar ao painel inicial grátis
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

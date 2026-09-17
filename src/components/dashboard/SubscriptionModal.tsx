"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { Loader2, Check, Copy, CreditCard, QrCode, FileText, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import Image from "next/image";
import { DigitalContractViewer } from "./DigitalContractViewer";
import type { SubscriptionPlanModalidade, PaymentMethodType } from "@/lib/types/contract";

export interface UserSubscriptionDoc {
  uid: string;
  email: string;
  displayName?: string;
  businessName?: string;
  cnpj?: string;
  plan?: "trial" | "pro" | "free";
  role?: "free" | "pro" | "admin";
  subscriptionStatus?: "pending_verification" | "active" | "inactive" | "expired" | "";
  paymentProofUploadedAt?: any;
  updatedAt?: any;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

interface PaymentSettings {
  pixKey: string;
  pixQrCodeUrl: string;
  creditLinkMonthly: string;
  creditLinkTrimestral: string;
  creditLinkSemestral: string;
  creditLinkYearly: string;
  creditLinkYearlyRecurrent?: string;
}

export function SubscriptionModal({ isOpen, onClose, userId }: SubscriptionModalProps) {
  const { toast } = useToast();
  const { logout, getIdToken, user } = useAuth();

  const [userData, setUserData] = useState<UserSubscriptionDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [copied, setCopied] = useState(false);

  // Etapas: 1. Escolha do Plano | 2. Contrato Digital | 3. Pagamento
  const [currentStep, setCurrentStep] = useState<"select-plan" | "review-contract" | "payment">("select-plan");
  const [isSigningContract, setIsSigningContract] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanModalidade>("mensal");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("pix");
  const [coupon, setCoupon] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [discount, setDiscount] = useState<{ code: string; percentage: number } | null>(null);

  const [settings, setSettings] = useState<PaymentSettings>({
    pixKey: "d696cfdb-a875-4219-ae41-494a619a9e00",
    pixQrCodeUrl: "",
    creditLinkMonthly: "",
    creditLinkTrimestral: "",
    creditLinkSemestral: "",
    creditLinkYearly: "",
    creditLinkYearlyRecurrent: "https://www.asaas.com/c/2unkh9p3t6apkcvm",
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const PIX_KEY = "d696cfdb-a875-4219-ae41-494a619a9e00";
  const PIX_RECIPIENT = "BMG Publicidade e Propaganda Ltda";

  const planPrices: Record<SubscriptionPlanModalidade, number> = {
    mensal: 490,
    trimestral: 441, // 10% off
    semestral: 416.5, // 15% off
    anual: 399, // 12x R$ 399/mês (+ 1 mês grátis, equivalente a R$ 308,30/mês)
  };

  useEffect(() => {
    if (!userId || !isOpen) {
      setFetchingUser(false);
      return;
    }

    // Resetar etapa ao reabrir modal
    setCurrentStep("select-plan");

    setFetchingUser(true);
    const userDocRef = doc(db, "users", userId);

    const fetchSettings = async () => {
      try {
        setIsLoadingSettings(true);
        const res = await fetch("/api/transactions?action=get-settings");
        const data = await res.json();
        if (res.ok && data.success) {
          setSettings(data.settings);
        }
      } catch (err) {
        console.error("Erro ao carregar configurações de pagamento:", err);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            uid: userId,
            email: data.email || "",
            displayName: data.displayName || data.name || "",
            businessName: data.businessProfile?.businessName || data.name || "",
            cnpj: data.cnpj || data.businessProfile?.cnpj || "",
            plan: data.plan || "trial",
            role: data.role || "free",
            subscriptionStatus: data.subscriptionStatus || "",
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

  const [isGeneratingCheckout, setIsGeneratingCheckout] = useState(false);

  const handleOpenCreditLink = async () => {
    setIsGeneratingCheckout(true);
    try {
      let token: string | null = null;
      try {
        token = await getIdToken();
      } catch (tErr) {
        console.warn("Aviso ao obter getIdToken:", tErr);
      }

      // 1. Tentar gerar checkout dinâmico integrado no Asaas vinculado ao usuário
      const res = await fetch("/api/asaas/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          plan: selectedPlan,
          coupon: discount ? discount.code : undefined,
          userId: userId || user?.uid,
        }),
      });

      const data = await res.json();

      if (res.ok && data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
        toast({
          title: "Checkout Seguro Asaas Aberto! 💳",
          description: "Conclua o pagamento no cartão na nova aba. Sua assinatura será liberada automaticamente.",
          variant: "success",
        });
        return;
      }

      // 2. Fallback caso a API falhe: usar os links oficiais pré-configurados do Asaas
      let targetLink = "";
      if (selectedPlan === "mensal") targetLink = settings.creditLinkMonthly;
      else if (selectedPlan === "trimestral") targetLink = settings.creditLinkTrimestral;
      else if (selectedPlan === "semestral") targetLink = settings.creditLinkSemestral;
      else if (selectedPlan === "anual") {
        targetLink = settings.creditLinkYearlyRecurrent || "https://www.asaas.com/c/2unkh9p3t6apkcvm";
      }

      if (targetLink) {
        window.open(targetLink, "_blank");
        toast({
          title: "Link Asaas Aberto! 💳",
          description: "Conclua o pagamento na aba aberta. O Asaas confirmará seu plano automaticamente.",
          variant: "success",
        });
      } else {
        throw new Error(data.error || "Não foi possível carregar o checkout.");
      }
    } catch (err: any) {
      console.warn("Falha ao gerar checkout Asaas, usando fallback:", err);
      // Se não tiver nenhum link, encaminhar para WhatsApp
      const planNames: Record<string, string> = {
        mensal: "Mensal",
        trimestral: "Trimestral",
        semestral: "Semestral",
        anual: "Anual",
      };
      const planName = planNames[selectedPlan] || selectedPlan;
      const formattedTotal = totalToPay.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      let textMsg = `Olá! Gostaria de pagar com Cartão de Crédito o plano ${planName} (Total: ${formattedTotal}).`;
      if (userData?.email) textMsg += ` Email: ${userData.email}.`;
      window.open(`https://wa.me/5551920044035?text=${encodeURIComponent(textMsg)}`, "_blank");
    } finally {
      setIsGeneratingCheckout(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        subscriptionStatus: "pending_verification",
        paymentProofUploadedAt: new Date(),
        selectedPlan: selectedPlan,
        appliedCoupon: discount ? discount.code : null,
        updatedAt: new Date(),
      });
      toast({
        title: "Confirmado! 🚀",
        description: "Nosso time foi notificado e sua assinatura PRO será liberada em breve.",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Erro de comunicação",
        description: error.message || "Tente novamente ou fale conosco via WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await fetch(`/api/cupons/validar?code=${encodeURIComponent(coupon)}`);
      const data = await res.json();
      if (data.valid) {
        setDiscount({ code: data.code, percentage: data.discountPercentage });
        toast({
          title: "Cupom aplicado!",
          description: `Desconto de ${data.discountPercentage}% garantido.`,
          variant: "success",
        });
      } else {
        setDiscount(null);
        toast({
          title: "Cupom inválido",
          description: data.error || "Tente outro código.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao validar cupom.", variant: "destructive" });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const getDiscountedPrice = (price: number) => {
    if (!discount) return price;
    return price - price * (discount.percentage / 100);
  };
  const finalPrice = getDiscountedPrice(planPrices[selectedPlan]);

  const getTotalToPay = (plan: SubscriptionPlanModalidade, monthlyPrice: number) => {
    if (plan === "trimestral") return monthlyPrice * 3;
    if (plan === "semestral") return monthlyPrice * 6;
    if (plan === "anual") return monthlyPrice; // R$ 400/mês debitado mensalmente no cartão (+1 mês grátis)
    return monthlyPrice;
  };

  const totalToPay = getTotalToPay(selectedPlan, finalPrice);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-h-[95vh] w-full overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl transition-all duration-200 sm:p-8",
          currentStep === "review-contract" ? "max-w-4xl" : "max-w-[480px]"
        )}
      >
        {fetchingUser ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#1da051]" />
          </div>
        ) : userData?.subscriptionStatus === "pending_verification" ? (
          // Vista: Comprovante em Análise
          <div className="space-y-6 py-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
              <Loader2 className="h-10 w-10 animate-spin text-[#FA6305]" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">
              Pagamento em Análise
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Já fomos notificados do seu pagamento. Nosso time de suporte está validando a
              transação e sua conta PRO será liberada em alguns minutos!
            </p>

            <Button
              asChild
              className="w-full rounded-xl bg-[#25D366] py-6 font-bold text-white hover:bg-[#20bd5a]"
            >
              <a
                href={`https://wa.me/5551920044035?text=Olá!%20Acabei%20de%20confirmar%20meu%20pagamento%20PIX%20de%20assinatura%20PRO%20no%20painel%20da%20NumVapt%20para%20o%20email%20${encodeURIComponent(userData.email)}.%20Poderiam%20validar?`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Acelerar no WhatsApp
              </a>
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-600"
            >
              Voltar ao painel
            </Button>
          </div>
        ) : currentStep === "review-contract" ? (
          // Vista: Contrato Digital
          <DigitalContractViewer
            modalidade={selectedPlan}
            formaPagamento={paymentMethod}
            initialAssinante={{
              nomeOuRazaoSocial: userData?.businessName || userData?.displayName || "",
              cpfOuCnpj: userData?.cnpj || "",
              email: userData?.email || "",
            }}
            onBack={() => setCurrentStep("select-plan")}
            isSigning={isSigningContract}
            onSignContract={async (contractData) => {
              setIsSigningContract(true);
              try {
                let token: string | null = null;
                try {
                  token = await getIdToken();
                } catch (tErr) {
                  console.warn("Aviso ao obter getIdToken:", tErr);
                }

                const res = await fetch("/api/contracts/sign", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({
                    ...contractData,
                    userId: userId || user?.uid,
                  }),
                });
                const data = await res.json();
                if (!res.ok) {
                  throw new Error(data.error || "Erro ao registrar assinatura do contrato.");
                }

                toast({
                  title: "Contrato Assinado Digitalmente! ✍️",
                  description: "Agora realize o pagamento para ativação imediata do seu plano.",
                  variant: "success",
                });
                setCurrentStep("payment");
              } catch (err: any) {
                toast({
                  title: "Falha na assinatura",
                  description: err.message,
                  variant: "destructive",
                });
              } finally {
                setIsSigningContract(false);
              }
            }}
          />
        ) : currentStep === "payment" ? (
          // Vista: Pagamento (Liberada após assinatura do contrato)
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Contrato Assinado Digitalmente
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Conclua seu Pagamento
              </h2>
              <p className="text-xs text-slate-500">
                Plano <strong>{selectedPlan.toUpperCase()}</strong> • Total: <strong>R$ {totalToPay.toLocaleString("pt-BR")}</strong>
              </p>
            </div>

            {paymentMethod === "pix" ? (
              <div className="space-y-6 rounded-2xl border border-slate-100 bg-[#f8f9fa] p-5">
                <div className="flex justify-center">
                  <div className="inline-block rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <Image
                      src="/qrcode-pix.png"
                      alt="QR Code Pix"
                      width={160}
                      height={160}
                      className="rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-center">
                  <span className="text-sm font-medium text-slate-500">Total a pagar:</span>
                  <span className="text-[26px] font-black text-[#1da051]">
                    R$ {totalToPay.toLocaleString("pt-BR")}
                  </span>
                </div>

                <div className="space-y-2 border-t border-slate-200/80 pt-5">
                  <span className="block text-center text-xs font-bold text-slate-700">
                    Ou use o Pix Copia e Cola:
                  </span>
                  <div className="relative flex items-center justify-between rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
                    <span className="block w-[200px] truncate px-3 font-mono text-[11px] text-slate-500">
                      {PIX_KEY}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleCopyPixKey}
                      className="h-8 shrink-0 gap-1.5 rounded-md bg-slate-50 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-[#1da051]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copiar
                    </Button>
                  </div>
                  <p className="mt-3 text-center text-[10px] font-medium text-slate-400">
                    Favorecido: {PIX_RECIPIENT}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-blue-100 bg-[#F8FAFC] p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                  <CreditCard className="h-7 w-7 text-[#0083C7]" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Checkout Cartão de Crédito Asaas</h4>
                <p className="text-xs leading-relaxed text-slate-500">
                  Pague com segurança máxima através do gateway oficial Asaas. Liberação automática da sua conta!
                </p>

                {selectedPlan === "anual" ? (
                  <div className="rounded-xl border border-blue-200/80 bg-white p-4 text-center shadow-sm">
                    <div className="flex items-center justify-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800">
                        Sem travar limite
                      </span>
                      <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#FA6305]">
                        +1 Mês Grátis
                      </span>
                    </div>
                    <span className="mt-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Mensalidade no Cartão de Crédito
                    </span>
                    <p className="mt-1 text-2xl font-black text-[#0083C7]">
                      R$ 400,00 <span className="text-sm font-bold text-slate-400">/mês</span>
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      Entra apenas <strong>R$ 400 por mês</strong> no seu cartão. Você aproveita todos os benefícios do plano anual com <strong>13 meses liberados</strong> sem comprometer o limite total!
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-blue-200/60 bg-white p-4 shadow-sm">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Condição de Pagamento
                    </span>
                    <p className="mt-1 text-base font-extrabold text-slate-900">
                      {selectedPlan === "mensal" && "R$ 490,00 à vista no cartão"}
                      {selectedPlan === "trimestral" && "Até 3x de R$ 441,00 sem juros"}
                      {selectedPlan === "semestral" && "Até 6x de R$ 416,50 sem juros"}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-emerald-600">
                      Total: R$ {totalToPay.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Ambiente criptografado com Antifraude ativo
                </div>
              </div>
            )}

            <div className="pt-2">
              {paymentMethod === "pix" ? (
                <Button
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="w-full rounded-xl border-b-4 border-[#126b34] bg-[#1da051] py-7 text-[15px] font-bold text-white shadow-md transition-all hover:-translate-y-px hover:bg-[#168541] active:translate-y-px active:border-b-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    "Já paguei! Enviar Comprovante"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleOpenCreditLink}
                  disabled={isGeneratingCheckout || isLoadingSettings}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-b-4 border-[#006ca3] bg-[#0083C7] py-7 text-[15px] font-bold text-white shadow-md transition-all hover:-translate-y-px hover:bg-[#006ca3] active:translate-y-px active:border-b-0"
                >
                  {isGeneratingCheckout ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Abrindo Checkout Seguro...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Pagar com Cartão de Crédito (Asaas)
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-2 pt-2 text-center">
              <button
                type="button"
                onClick={() => setCurrentStep("review-contract")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
              >
                Revisar contrato assinado
              </button>
            </div>
          </div>
        ) : (
          // Vista: Escolha do Plano (Etapa 1)
          <div className="space-y-6">
            <div className="space-y-3 px-2 text-center">
              <h2 className="text-[26px] font-black leading-tight tracking-tight text-slate-900">
                Escolha o seu plano
              </h2>
              <p className="text-[13px] font-medium leading-relaxed text-slate-500">
                Selecione a modalidade ideal para o seu negócio e leia o contrato digital antes do pagamento:
              </p>
            </div>

            {/* Plan Toggle */}
            <div className="flex justify-center pt-2">
              <div className="relative flex w-full flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
                <button
                  onClick={() => setSelectedPlan("mensal")}
                  className={cn(
                    "relative min-w-[70px] flex-1 rounded-xl py-2 text-xs font-bold transition-all",
                    selectedPlan === "mensal"
                      ? "bg-[#0B1426] text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setSelectedPlan("trimestral")}
                  className={cn(
                    "relative flex min-w-[70px] flex-1 flex-col items-center justify-center rounded-xl py-1 text-xs font-bold transition-all",
                    selectedPlan === "trimestral"
                      ? "bg-[#0B1426] text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  3 Meses
                  <span
                    className={cn(
                      "mt-0.5 rounded-full px-1.5 py-[1px] text-[8px] font-black uppercase",
                      selectedPlan === "trimestral"
                        ? "bg-[#FA6305] text-white"
                        : "bg-orange-100 text-[#FA6305]"
                    )}
                  >
                    -10%
                  </span>
                </button>
                <button
                  onClick={() => setSelectedPlan("semestral")}
                  className={cn(
                    "relative flex min-w-[70px] flex-1 flex-col items-center justify-center rounded-xl py-1 text-xs font-bold transition-all",
                    selectedPlan === "semestral"
                      ? "bg-[#0B1426] text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  6 Meses
                  <span
                    className={cn(
                      "mt-0.5 rounded-full px-1.5 py-[1px] text-[8px] font-black uppercase",
                      selectedPlan === "semestral"
                        ? "bg-[#FA6305] text-white"
                        : "bg-orange-100 text-[#FA6305]"
                    )}
                  >
                    -15%
                  </span>
                </button>
                <button
                  onClick={() => setSelectedPlan("anual")}
                  className={cn(
                    "relative flex min-w-[70px] flex-1 flex-col items-center justify-center rounded-xl py-1 text-xs font-bold transition-all",
                    selectedPlan === "anual"
                      ? "bg-[#0B1426] text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Anual
                  <span
                    className={cn(
                      "mt-0.5 rounded-full px-1.5 py-[1px] text-[8px] font-black uppercase",
                      selectedPlan === "anual"
                        ? "bg-[#FA6305] text-white"
                        : "bg-orange-100 text-[#FA6305]"
                    )}
                  >
                    +1 Mês Grátis
                  </span>
                </button>
              </div>
            </div>

            {selectedPlan === "anual" && (
              <div className="mb-2 mt-3 overflow-hidden rounded-xl bg-gradient-to-r from-[#FA6305] to-[#f58b45] p-[2px] shadow-md duration-300 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-center gap-3 rounded-[10px] bg-white/95 px-4 py-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <span className="text-xl">🎁</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-black leading-tight text-slate-900">
                      Ganhe o 13º Mês Grátis!
                    </p>
                    <p className="text-[11px] font-bold text-[#FA6305]">
                      Benefícios do anual por apenas 12x de R$ 399/mês
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Price Display */}
            <div className="pb-2 text-center">
              <div className="flex items-end justify-center gap-1">
                <span className="text-4xl font-black text-[#1da051]">
                  R$ 
                  {finalPrice % 1 === 0
                    ? finalPrice
                    : finalPrice.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                </span>
                <span className="mb-1 text-sm font-bold text-slate-400">/mês</span>
              </div>
              {discount && (
                <p className="mt-1 text-[12px] font-bold text-[#FA6305]">
                  Cupom {discount.code} ({discount.percentage}% OFF) aplicado!
                </p>
              )}
              {selectedPlan === "trimestral" && !discount && (
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  cobrado R$ 1.323 a cada 3 meses
                </p>
              )}
              {selectedPlan === "semestral" && !discount && (
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  cobrado R$ 2.499 a cada 6 meses
                </p>
              )}
              {selectedPlan === "anual" && !discount && (
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  12x de R$ 399 (equivalente a R$ 368,30/mês com 13º mês bônus — R$ 4.788 total)
                </p>
              )}
            </div>

            {/* Coupon */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="CUPOM DE DESCONTO"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                className="h-10 rounded-lg border-slate-200 text-center text-sm uppercase shadow-sm placeholder:text-xs"
              />
              <Button
                variant="secondary"
                onClick={handleApplyCoupon}
                disabled={applyingCoupon || !coupon.trim()}
                className="h-10 rounded-lg border border-slate-100 bg-slate-50 px-6 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
              </Button>
            </div>

            {/* Payment Tabs */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600">Forma de Pagamento Desejada:</Label>
              <div className="flex rounded-xl border border-slate-100 bg-slate-50/80 p-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all",
                    paymentMethod === "pix"
                      ? "bg-white text-[#1da051] shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <QrCode className="h-4 w-4" /> Pix
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cartao_credito")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all",
                    paymentMethod === "cartao_credito"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <CreditCard className="h-4 w-4" /> Cartão de Crédito
                </button>
              </div>
            </div>

            {/* Action Button: Continuar para o Contrato */}
            <div className="pt-2">
              <Button
                type="button"
                onClick={() => setCurrentStep("review-contract")}
                className="w-full rounded-xl border-b-4 border-[#006ca3] bg-[#0083C7] py-7 text-[15px] font-bold text-white shadow-md transition-all hover:-translate-y-px hover:bg-[#006ca3] active:translate-y-px active:border-b-0"
              >
                <FileText className="mr-2 h-5 w-5" />
                Continuar para o Contrato Digital
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                Você revisará as cláusulas e assinará digitalmente antes de efetuar o pagamento.
              </p>
            </div>

            <div className="space-y-3 pt-3">
              <a
                href="https://wa.me/5551920044035?text=Olá!%20Gostaria%20de%20tirar%20dúvidas%20sobre%20os%20planos%20da%20NumVapt."
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-800"
              >
                Tirar dúvidas sobre os planos
              </a>

              <button
                onClick={() => logout()}
                className="w-full text-center text-[13px] font-semibold text-red-500 transition-colors hover:text-red-600"
              >
                Sair (Logout)
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

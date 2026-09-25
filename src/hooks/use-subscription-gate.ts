"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export interface SubscriptionGateStatus {
  isSubscribed: boolean;
  userPlan: string;
  paymentStatus: string;
  loading: boolean;
  checkSubscriptionOrPrompt: (actionDescription?: string) => boolean;
  openSubscriptionModal: () => void;
}

/**
 * Hook centralizado para controle de acesso a recursos exclusivos para assinantes.
 * Permite que usuários com plano gratuito naveguem livremente pelo app (modo vitrine),
 * mas intercepta ações pagas (como conectar redes sociais ou gerar posts) abrindo o modal de planos.
 */
export function useSubscriptionGate(): SubscriptionGateStatus {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [userPlan, setUserPlan] = useState<string>("free");
  const [paymentStatus, setPaymentStatus] = useState<string>("inactive");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user || !user.uid) {
      setUserPlan("free");
      setPaymentStatus("inactive");
      setLoading(false);
      return;
    }

    try {
      if (!db || typeof doc !== "function" || typeof onSnapshot !== "function") {
        setUserPlan("free");
        setPaymentStatus("inactive");
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap && typeof docSnap.exists === "function" && docSnap.exists()) {
            const data = docSnap.data();
            setUserPlan(data?.plan || "free");
            setPaymentStatus(data?.paymentStatus || "inactive");
          } else {
            setUserPlan("free");
            setPaymentStatus("inactive");
          }
          setLoading(false);
        },
        (error) => {
          console.warn("[useSubscriptionGate] Erro ao carregar plano do usuário:", error);
          setLoading(false);
        }
      );

      return () => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      };
    } catch (err) {
      console.warn("[useSubscriptionGate] Erro ao conectar listener:", err);
      setLoading(false);
    }
  }, [user]);

  // Considera ativo se o plano for pago (pro, mensal, trimestral, semestral, anual) e o status for ativo/aprovado
  const isSubscribed = Boolean(
    userPlan &&
      userPlan !== "free" &&
      userPlan !== "unsubscribed" &&
      (paymentStatus === "active" || paymentStatus === "approved")
  );

  const openSubscriptionModal = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-subscription-modal"));
    }
  }, []);

  const checkSubscriptionOrPrompt = useCallback(
    (actionDescription?: string): boolean => {
      if (isSubscribed) {
        return true;
      }

      openSubscriptionModal();

      const message = actionDescription
        ? `Para ${actionDescription}, assine um de nossos planos e desbloqueie o potencial completo da IA.`
        : "Para utilizar este recurso, assine um de nossos planos e desbloqueie o potencial completo da IA.";

      toast({
        title: "Recurso Exclusivo para Assinantes",
        description: message,
      });

      return false;
    },
    [isSubscribed, openSubscriptionModal, toast]
  );

  return {
    isSubscribed,
    userPlan,
    paymentStatus,
    loading: authLoading || loading,
    checkSubscriptionOrPrompt,
    openSubscriptionModal,
  };
}

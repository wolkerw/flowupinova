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
  subscriptionStatus?: string;
  canEditImages: boolean;
  isConcierge: boolean;
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("inactive");
  const [userRole, setUserRole] = useState<string>("free");
  const [canEditImages, setCanEditImages] = useState<boolean>(false);
  const [isConcierge, setIsConcierge] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user || !user.uid) {
      setUserPlan("free");
      setPaymentStatus("inactive");
      setSubscriptionStatus("inactive");
      setUserRole("free");
      setIsConcierge(false);
      setLoading(false);
      return;
    }

    try {
      if (!db || typeof doc !== "function" || typeof onSnapshot !== "function") {
        setUserPlan("free");
        setPaymentStatus("inactive");
        setSubscriptionStatus("inactive");
        setUserRole("free");
        setIsConcierge(false);
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
            setSubscriptionStatus(data?.subscriptionStatus || "inactive");
            setUserRole(data?.role || "free");
            setCanEditImages(Boolean(data?.canEditImages) || data?.role === "admin" || data?.plan === "admin");
            setIsConcierge(
              Boolean(
                data?.isConcierge ||
                  data?.managedService?.serviceMode === "concierge" ||
                  data?.role === "admin" ||
                  data?.plan === "admin"
              )
            );
          } else {
            setUserPlan("free");
            setPaymentStatus("inactive");
            setSubscriptionStatus("inactive");
            setUserRole("free");
            setCanEditImages(false);
            setIsConcierge(false);
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

  // Considera ativo se o plano for pago (standard, pro, mensal, anual, etc) e liberado por paymentStatus, subscriptionStatus ou role
  const isSubscribed = Boolean(
    userRole === "admin" ||
      userPlan === "admin" ||
      userRole === "pro" ||
      (userPlan === "standard" &&
        (subscriptionStatus === "active" ||
          paymentStatus === "active" ||
          paymentStatus === "approved")) ||
      (userPlan &&
        userPlan !== "free" &&
        userPlan !== "trial" &&
        userPlan !== "unsubscribed" &&
        (paymentStatus === "active" ||
          paymentStatus === "approved" ||
          subscriptionStatus === "active"))
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
    canEditImages,
    isConcierge,
    loading: authLoading || loading,
    checkSubscriptionOrPrompt,
    openSubscriptionModal,
  };
}

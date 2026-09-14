"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  User,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setCookie, eraseCookie } from "@/lib/cookie";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
  signUpWithEmail: (
    name: string,
    email: string,
    pass: string,
    phone: string,
    segment?: string
  ) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword?: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Processa retorno de autenticação via redirect (ex: em navegadores onde popup foi bloqueado)
    getRedirectResult(auth)
      .then(async (userCredential) => {
        if (userCredential?.user) {
          const user = userCredential.user;
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || "Usuário",
              phone: user.phoneNumber || "",
              segment: null,
              createdAt: new Date(),
              plan: "trial",
              paymentStatus: "active",
            });
            fetch("/api/email/welcome", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: user.displayName, email: user.email }),
            }).catch(() => {});
          }
          const token = await user.getIdToken(true);
          setCookie("firebase-id-token", token, 1);
          setUser(user);
          router.push("/dashboard");
        }
      })
      .catch((err) => {
        console.warn("Erro ao obter resultado de redirect:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        const token = await user.getIdToken(true); // Force refresh
        setCookie("firebase-id-token", token, 1); // Store token in cookie for Server Components
      } else {
        eraseCookie("firebase-id-token");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // Não executa a lógica de redirecionamento se ainda estiver carregando
    if (loading) return;

    const isAuthPage = pathname.startsWith("/acesso");
    const isPublicPage =
      isAuthPage || pathname === "/" || pathname === "/termos" || pathname === "/privacidade";

    if (user) {
      // Se o usuário está logado e em uma página de autenticação, redireciona para o dashboard
      if (isAuthPage) {
        router.push("/dashboard");
      }
    } else {
      // Se o usuário não está logado, redireciona para la página de acesso,
      // a menos que ele já esteja em uma página pública.
      if (!isPublicPage) {
        router.push("/acesso/login");
      }
    }
  }, [user, loading, router, pathname]);

  const getIdToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  const signUpWithEmail = async (
    name: string,
    email: string,
    pass: string,
    phone: string,
    segment?: string
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          email: user.email,
          displayName: name,
          phone: phone,
          segment: segment || null,
          createdAt: new Date(), // This is the trial start date
          plan: "trial",
          paymentStatus: "active",
        },
        { merge: true }
      );

      // Send welcome email via our API route (fire-and-forget)
      fetch("/api/email/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, email: email }),
      }).catch((error) => {
        // Log error but don't show a toast or block user flow
        console.error("Failed to trigger welcome email:", error);
      });

      const token = await userCredential.user.getIdToken();
      setCookie("firebase-id-token", token, 1);
      setUser(auth.currentUser);
      // O useEffect acima cuidará do redirecionamento
    } catch (error: any) {
      console.warn("Erro ao criar conta:", error.code);
      let errorMessage = "Ocorreu um erro desconhecido ao criar a conta.";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Este endereço de e-mail já está em uso por outra conta.";
          break;
        case "auth/invalid-email":
          errorMessage = "O endereço de e-mail fornecido não é válido.";
          break;
        case "auth/weak-password":
          errorMessage = "A senha fornecida é muito fraca. Use pelo menos 6 caracteres.";
          break;
      }
      toast({
        variant: "destructive",
        title: "Erro no Cadastro",
        description: errorMessage,
      });
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const token = await userCredential.user.getIdToken();
      setCookie("firebase-id-token", token, 1);
      // O useEffect acima cuidará do redirecionamento
    } catch (error: any) {
      console.warn("Erro ao fazer login:", error.code);
      let errorMessage = "Ocorreu um erro desconhecido ao tentar fazer login.";
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/invalid-email":
          errorMessage = "Nenhum usuário encontrado com este e-mail.";
          break;
        case "auth/wrong-password":
          errorMessage = "A senha está incorreta. Tente novamente.";
          break;
        case "auth/invalid-credential":
          errorMessage = "As credenciais fornecidas são inválidas.";
          break;
      }
      toast({
        variant: "destructive",
        title: "Erro no Login",
        description: errorMessage,
      });
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "Usuário",
          phone: user.phoneNumber || "",
          segment: null,
          createdAt: new Date(),
          plan: "trial",
          paymentStatus: "active",
        });
        fetch("/api/email/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: user.displayName, email: user.email }),
        }).catch(() => {});
      }

      const token = await user.getIdToken();
      setCookie("firebase-id-token", token, 1);
      setUser(user);
      router.push("/dashboard");
    } catch (error: any) {
      if (
        error?.code === "auth/popup-closed-by-user" ||
        error?.code === "auth/cancelled-popup-request"
      ) {
        // Usuário apenas fechou o popup
        return;
      }

      if (error?.code === "auth/popup-blocked") {
        console.warn("Popup bloqueado pelo navegador. Tentando redirecionamento...");
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          console.error("Erro ao redirecionar para Google:", redirectError);
        }
      }

      console.warn("Erro ao fazer login com Google:", error);
      toast({
        variant: "destructive",
        title: "Erro ao autenticar",
        description: "Ocorreu um erro ao conectar com o Google. Tente novamente.",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "E-mail enviado",
        description: "Enviamos instruções de redefinição para o seu e-mail.",
      });
    } catch (error: any) {
      console.error("Erro ao enviar email de redefinição:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar o e-mail de recuperação. Verifique o endereço digitado.",
      });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      eraseCookie("firebase-id-token");
      // O useEffect cuidará do redirecionamento
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível fazer logout. Tente novamente.",
      });
    }
  };

  const value = { user, loading, getIdToken, signUpWithEmail, loginWithEmail, loginWithGoogle, resetPassword, logout };

  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/acesso") ||
    pathname === "/termos" ||
    pathname === "/privacidade";

  // Mostra um loader em páginas protegidas enquanto o estado de auth está sendo verificado
  if (loading && !isPublicPage) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};


"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Não executa a lógica de redirecionamento se ainda estiver carregando
    if (loading) return;

    const isAuthPage = pathname.startsWith('/acesso');
    const isHomePage = pathname === '/';

    if (user) {
      // Se o usuário está logado e em uma página de autenticação, redireciona para o dashboard
      if (isAuthPage) {
        router.push('/dashboard');
      }
    } else {
      // Se o usuário não está logado, redireciona para a página de acesso,
      // a menos que ele já esteja em uma página pública (home ou acesso).
      if (!isAuthPage && !isHomePage) {
        router.push('/acesso');
      }
    }
  }, [user, loading, router, pathname]);

  const getIdToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  const signUpWithEmail = async (name: string, email: string, pass: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: name });
      setUser(auth.currentUser); 
      // O useEffect acima cuidará do redirecionamento
    } catch (error: any) {
      console.error("Erro ao criar conta:", error.code);
      let errorMessage = "Ocorreu um erro desconhecido ao criar a conta.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Este endereço de e-mail já está em uso por outra conta.";
          break;
        case 'auth/invalid-email':
          errorMessage = "O endereço de e-mail fornecido não é válido.";
          break;
        case 'auth/weak-password':
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
      await signInWithEmailAndPassword(auth, email, pass);
      // O useEffect acima cuidará do redirecionamento
    } catch (error: any) {
      console.error("Erro ao fazer login:", error.code);
      let errorMessage = "Ocorreu um erro desconhecido ao tentar fazer login.";
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-email':
          errorMessage = "Nenhum usuário encontrado com este e-mail.";
          break;
        case 'auth/wrong-password':
          errorMessage = "A senha está incorreta. Tente novamente.";
          break;
        case 'auth/invalid-credential':
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

  const logout = async () => {
    try {
      await signOut(auth);
      // O useEffect cuidará do redirecionamento
    } catch (error: any)
{
      console.error("Erro ao fazer logout:", error);
       toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível fazer logout. Tente novamente.",
      });
    }
  };

  const value = { user, loading, getIdToken, signUpWithEmail, loginWithEmail, logout };

  // Mostra um loader em páginas protegidas enquanto o estado de auth está sendo verificado
  if (loading && !pathname.startsWith('/acesso') && pathname !== '/') {
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
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

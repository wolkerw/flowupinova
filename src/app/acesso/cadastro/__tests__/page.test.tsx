"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import CadastroPage from '../page';
import { AuthProvider } from '@/components/auth/auth-provider';

// Mock useAuth hook
jest.mock('@/components/auth/auth-provider', () => ({
  ...jest.requireActual('@/components/auth/auth-provider'),
  useAuth: () => ({
    signUpWithEmail: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/acesso/cadastro',
}));

describe('CadastroPage', () => {
  it('renders all required form fields', () => {
    render(
      <AuthProvider>
        <CadastroPage />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/Nome da Empresa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Segmento de Negócio/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Criar Minha Conta/i })).toBeInTheDocument();
  });
});

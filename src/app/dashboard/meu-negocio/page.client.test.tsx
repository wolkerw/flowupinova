
"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import MeuNegocioPageClient from './page';
import { AuthProvider } from '@/components/auth/auth-provider';
import { Toaster } from '@/components/ui/toaster';

jest.mock('@/components/auth/auth-provider', () => ({
  ...jest.requireActual('@/components/auth/auth-provider'),
  useAuth: () => ({
    user: { uid: 'test-user' },
    loading: false,
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

const mockProfile = {
  name: "Minha Empresa Teste",
  category: "Consultoria",
  address: "Rua Teste, 123",
  phone: "(11) 99999-9999",
  website: "www.teste.com",
  description: "Descrição de teste.",
  brandSummary: "Resumo da marca.",
  logo: { url: '', width: 0, height: 0 },
  rating: 4.5,
  totalReviews: 10,
  isVerified: false
};

describe('MeuNegocioPage', () => {
  it('renders the main title', async () => {
    render(
      <AuthProvider>
        <Toaster />
        <MeuNegocioPageClient initialProfile={mockProfile} />
      </AuthProvider>
    );

    expect(screen.getByText('Meu Negócio')).toBeInTheDocument();
    expect(screen.getByText('Gerencie seu perfil no Google Meu Negócio')).toBeInTheDocument();
  });
});

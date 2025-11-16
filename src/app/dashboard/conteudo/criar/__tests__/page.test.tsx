"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import CriarConteudoPage from '../page';
import { AuthProvider } from '@/components/auth/auth-provider';
import { Toaster } from '@/components/ui/toaster';

jest.mock('@/components/auth/auth-provider', () => ({
  ...jest.requireActual('@/components/auth/auth-provider'),
  useAuth: () => ({
    user: { uid: 'test-user', photoURL: null, displayName: 'Test User' },
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock a service used in the component
jest.mock('@/lib/services/meta-service', () => ({
  getMetaConnection: jest.fn().mockResolvedValue({ isConnected: true, instagramUsername: 'test_user' }),
}));

describe('CriarConteudoPage', () => {
  it('renders the main title for the first step', () => {
    render(
      <AuthProvider>
        <Toaster />
        <CriarConteudoPage />
      </AuthProvider>
    );
    expect(screen.getByText('Criar Novo Conteúdo')).toBeInTheDocument();
    expect(screen.getByText('Etapa 1: Qual tipo de conteúdo você quer criar?')).toBeInTheDocument();
  });
});

"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import Anuncios from '../page';
import { AuthProvider } from '@/components/auth/auth-provider';
import { Toaster } from '@/components/ui/toaster';

jest.mock('@/components/auth/auth-provider', () => ({
  ...jest.requireActual('@/components/auth/auth-provider'),
  useAuth: () => ({
    user: { uid: 'test-user' },
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('Anuncios Page', () => {
  it('renders the main title', () => {
    render(
      <AuthProvider>
        <Toaster />
        <Anuncios />
      </AuthProvider>
    );
    expect(screen.getByText('Criar Novo Anúncio')).toBeInTheDocument();
  });
});

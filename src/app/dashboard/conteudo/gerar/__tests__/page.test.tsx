"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import GerarConteudoPage from '../page';
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

// Mock services
jest.mock('@/lib/services/meta-service', () => ({
  getMetaConnection: jest.fn().mockResolvedValue({ isConnected: false }),
}));
jest.mock('@/lib/services/business-profile-service', () => ({
  getBusinessProfile: jest.fn().mockResolvedValue({ brandSummary: '' }),
}));
jest.mock('@/lib/services/user-data-service', () => ({
  getUnusedImages: jest.fn().mockResolvedValue([]),
  getContentHistory: jest.fn().mockResolvedValue([]),
  saveUnusedImages: jest.fn().mockResolvedValue(undefined),
  removeUnusedImage: jest.fn().mockResolvedValue(undefined),
  saveContentHistory: jest.fn().mockResolvedValue(undefined),
}));


describe('GerarConteudoPage', () => {
  it('renders the main title for the first step', async () => {
    render(
      <AuthProvider>
        <Toaster />
        <GerarConteudoPage />
      </AuthProvider>
    );
    // Use findByText for async elements
    expect(await screen.findByText('Gerar Conteúdo com IA')).toBeInTheDocument();
    expect(await screen.findByText('Etapa 1: Sobre o que é o post?')).toBeInTheDocument();
  });
});

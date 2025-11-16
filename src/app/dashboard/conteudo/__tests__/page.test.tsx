"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import Conteudo from '../page';
import { AuthProvider } from '@/components/auth/auth-provider';
import { Toaster } from '@/components/ui/toaster';

jest.mock('@/components/auth/auth-provider', () => ({
  ...jest.requireActual('@/components/auth/auth-provider'),
  useAuth: () => ({
    user: { uid: 'test-user' },
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

// Mock services
jest.mock('@/lib/services/posts-service', () => ({
  getScheduledPosts: jest.fn().mockResolvedValue([]),
  deletePost: jest.fn().mockResolvedValue(undefined),
  schedulePost: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/services/meta-service', () => ({
  getMetaConnection: jest.fn().mockResolvedValue({ isConnected: false }),
  updateMetaConnection: jest.fn().mockResolvedValue(undefined),
}));


describe('Conteudo Page', () => {
  it('renders the main title', async () => {
    render(
      <AuthProvider>
        <Toaster />
        <Conteudo />
      </AuthProvider>
    );
    expect(await screen.findByText('Conteúdo & Marketing')).toBeInTheDocument();
  });
});

"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../page';
import { AuthProvider } from '@/components/auth/auth-provider';
import { Toaster } from '@/components/ui/toaster';

jest.mock('@/components/auth/auth-provider', () => ({
  ...jest.requireActual('@/components/auth/auth-provider'),
  useAuth: () => ({
    user: { uid: 'test-user', email: 'test@test.com' },
  }),
}));

// Mock services to prevent actual API calls during testing
jest.mock('@/lib/services/meta-service', () => ({
  getMetaConnection: jest.fn().mockResolvedValue({ isConnected: false }),
}));
jest.mock('@/lib/services/business-profile-service', () => ({
  getBusinessProfile: jest.fn().mockResolvedValue({ isVerified: false, logo: null }),
}));
jest.mock('@/lib/services/chat-service', () => ({
  getChatHistory: jest.fn().mockResolvedValue([]),
  saveChatHistory: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => true, data: () => ({ plan: 'trial', createdAt: { toDate: () => new Date() }}) }),
}));
jest.mock('@/lib/firebase', () => ({
  db: {},
}));


describe('Dashboard Page', () => {
  it('renders the main title and welcome message', async () => {
    render(
      <AuthProvider>
        <Toaster />
        <Dashboard />
      </AuthProvider>
    );
    expect(await screen.findByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Visão geral do seu marketing digital')).toBeInTheDocument();
  });
});

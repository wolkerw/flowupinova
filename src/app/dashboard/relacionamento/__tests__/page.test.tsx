"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import Relacionamento from '../page';
import { AuthProvider } from '@/components/auth/auth-provider';
import { Toaster } from '@/components/ui/toaster';

jest.mock('@/components/auth/auth-provider', () => ({
  ...jest.requireActual('@/components/auth/auth-provider'),
  useAuth: () => ({
    user: { uid: 'test-user' },
  }),
}));

jest.mock('@/lib/services/contacts-service', () => ({
  getContacts: jest.fn().mockResolvedValue([]),
  addContact: jest.fn().mockResolvedValue(undefined),
}));

describe('Relacionamento Page', () => {
  it('renders the main title', async () => {
    render(
      <AuthProvider>
        <Toaster />
        <Relacionamento />
      </AuthProvider>
    );
    expect(await screen.findByText('Relacionamento')).toBeInTheDocument();
    expect(screen.getByText('Gerencie leads e clientes')).toBeInTheDocument();
  });
});

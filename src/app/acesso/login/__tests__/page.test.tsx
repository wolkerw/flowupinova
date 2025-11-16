"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage from '../page';
import { AuthProvider } from '@/components/auth/auth-provider';

// Mock useAuth hook
jest.mock('@/components/auth/auth-provider', () => ({
    ...jest.requireActual('@/components/auth/auth-provider'),
    useAuth: () => ({
      loginWithEmail: jest.fn().mockResolvedValue(undefined),
    }),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
    usePathname: () => '/acesso/login',
}));

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(
        <AuthProvider>
            <LoginPage />
        </AuthProvider>
    );

    // Check for email input
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();

    // Check for password input
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();

    // Check for login button
    expect(screen.getByRole('button', { name: /Entrar na Plataforma/i })).toBeInTheDocument();
  });
});

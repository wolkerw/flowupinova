"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import Relatorios from '../page';
import { AuthProvider } from '@/components/auth/auth-provider';

jest.mock('@/components/auth/auth-provider', () => ({
  ...jest.requireActual('@/components/auth/auth-provider'),
  useAuth: () => ({
    user: { uid: 'test-user' },
  }),
}));

jest.mock('@/lib/services/meta-service', () => ({
  getMetaConnection: jest.fn().mockResolvedValue({ isConnected: false }),
}));

// Mock Recharts to prevent errors during server-side rendering in tests
jest.mock('recharts', () => ({
  ...jest.requireActual('recharts'),
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
}));


describe('Relatorios Page', () => {
  it('renders the main title', () => {
    render(
        <AuthProvider>
            <Relatorios />
        </AuthProvider>
    );
    expect(screen.getByText('Relatórios')).toBeInTheDocument();
    expect(screen.getByText('Análise detalhada de performance')).toBeInTheDocument();
  });
});

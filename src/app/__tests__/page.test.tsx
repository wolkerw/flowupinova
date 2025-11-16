"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/',
  useScroll: () => ({ scrollYProgress: { toJSON: () => 0 } }),
  useTransform: (value: any) => value,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  ...jest.requireActual('framer-motion'),
  useScroll: () => ({ scrollYProgress: { toJSON: () => 0 } }),
  useTransform: (value: any) => value,
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

describe('HomePage', () => {
  it('renders the main headline', () => {
    render(<HomePage />);
    expect(screen.getByText(/Sua plataforma de marketing com/i)).toBeInTheDocument();
    expect(screen.getByText(/Inteligência Artificial/i)).toBeInTheDocument();
  });
});

"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import AcessoRedirectPage from '../page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

describe('AcessoRedirectPage', () => {
  it('renders a loader', () => {
    render(<AcessoRedirectPage />);
    // Check for an element that has the animate-spin class, which indicates the loader
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });
});

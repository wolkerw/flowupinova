"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import TermosDeUsoPage from '../page';

describe('TermosDeUsoPage', () => {
  it('renders the terms of use title', () => {
    render(<TermosDeUsoPage />);
    expect(screen.getByText('Termos de Uso')).toBeInTheDocument();
  });
});

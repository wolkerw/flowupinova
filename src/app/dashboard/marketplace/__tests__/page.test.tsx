"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import Marketplace from '../page';

describe('Marketplace Page', () => {
  it('renders the main title and modules', () => {
    render(<Marketplace />);
    
    expect(screen.getByText('Marketplace de Módulos')).toBeInTheDocument();
    
    // Check if a few modules are rendered
    expect(screen.getByText('Email Marketing Avançado')).toBeInTheDocument();
    expect(screen.getByText('IA para Conteúdo Avançado')).toBeInTheDocument();
  });
});

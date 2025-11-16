"use client";

import React from 'react';
import { render, screen } from '@testing-library/react';
import PrivacidadePage from '../page';

describe('PrivacidadePage', () => {
  it('renders the privacy policy title', () => {
    render(<PrivacidadePage />);
    expect(screen.getByText('Política de Privacidade')).toBeInTheDocument();
  });
});

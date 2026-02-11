"use client";

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Step2TextSelection } from '../_components/Step2TextSelection';

describe('Step2TextSelection', () => {
  const mockGeneratedContent = [
    { título: 'Título 1', subtitulo: 'Sub 1', hashtags: ['#tag1'] },
    { título: 'Título 2', subtitulo: 'Sub 2', hashtags: ['#tag2'] },
  ];

  const mockProps = {
    generatedContent: mockGeneratedContent,
    selectedContentId: '0',
    onSelectedContentIdChange: jest.fn(),
    onBack: jest.fn(),
    onNext: jest.fn(),
    isGeneratingImages: false,
    user: { displayName: 'Teste' },
    instagramConnection: null,
  };

  it('renders all options and handles selection', () => {
    render(<Step2TextSelection {...mockProps} />);
    
    expect(screen.getByText('Título 1')).toBeInTheDocument();
    expect(screen.getByText('Título 2')).toBeInTheDocument();
    
    const option2 = screen.getByLabelText(/Título 2/i);
    fireEvent.click(option2);
    
    expect(mockProps.onSelectedContentIdChange).toHaveBeenCalledWith('1');
  });

  it('calls onBack and onNext', () => {
    render(<Step2TextSelection {...mockProps} />);
    
    fireEvent.click(screen.getByText(/Voltar/i));
    expect(mockProps.onBack).toHaveBeenCalled();
    
    fireEvent.click(screen.getByText(/Gerar Imagens e Avançar/i));
    expect(mockProps.onNext).toHaveBeenCalled();
  });
});

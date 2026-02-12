"use client";

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Step3ImageSelection } from '../_components/Step3ImageSelection';

describe('Step3ImageSelection', () => {
  const mockImages = ['https://picsum.photos/200', 'https://picsum.photos/201'];
  
  const mockProps = {
    generatedImages: mockImages,
    selectedImage: null,
    onSelectedImageChange: jest.fn(),
    onBack: jest.fn(),
    onNext: jest.fn(),
    isGeneratingImages: false,
    onDownload: jest.fn(),
  };

  it('renders images and handles selection', () => {
    render(<Step3ImageSelection {...mockProps} />);
    
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    
    fireEvent.click(images[0]);
    expect(mockProps.onSelectedImageChange).toHaveBeenCalledWith(mockImages[0]);
  });

  it('shows loading state', () => {
    render(<Step3ImageSelection {...mockProps} isGeneratingImages={true} />);
    expect(screen.getByText(/Criando imagens incríveis/i)).toBeInTheDocument();
  });

  it('calls onBack and onNext', () => {
    render(<Step3ImageSelection {...mockProps} />);
    
    fireEvent.click(screen.getByText(/Voltar/i));
    expect(mockProps.onBack).toHaveBeenCalled();
    
    fireEvent.click(screen.getByText(/Avançar/i));
    expect(mockProps.onNext).toHaveBeenCalled();
  });
});

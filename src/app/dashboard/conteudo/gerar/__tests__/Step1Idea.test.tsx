"use client";

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Step1Idea } from '../_components/Step1Idea';

describe('Step1Idea', () => {
  const mockProps = {
    postSummary: '',
    onPostSummaryChange: jest.fn(),
    onGenerate: jest.fn(),
    isLoading: false,
    contentHistory: [],
    unusedImagesHistory: [],
    selectedHistoryContent: null,
    selectedUnusedImage: null,
    onHistoryContentSelect: jest.fn(),
    onUnusedImageSelect: jest.fn(),
    onGenerateImagesForHistory: jest.fn(),
    onUseUnusedImage: jest.fn(),
    onReuseBoth: jest.fn(),
    isGeneratingImages: false,
    referenceImagePreview: null,
    onReferenceImageChange: jest.fn(),
    referenceDescription: '',
    onReferenceDescriptionChange: jest.fn(),
  };

  it('renders correctly and handles input change', () => {
    render(<Step1Idea {...mockProps} />);
    
    expect(screen.getByText(/Etapa 1: Sobre o que é o post?/i)).toBeInTheDocument();
    
    const textarea = screen.getByPlaceholderText(/Ex: Criar um post sobre os benefícios/i);
    fireEvent.change(textarea, { target: { value: 'Nova ideia de post' } });
    
    expect(mockProps.onPostSummaryChange).toHaveBeenCalledWith('Nova ideia de post');
  });

  it('disables generate button when summary is empty', () => {
    render(<Step1Idea {...mockProps} />);
    const button = screen.getByRole('button', { name: /Avançar/i });
    expect(button).toBeDisabled();
  });

  it('disables generate button when reference image is present but description is empty', () => {
    render(<Step1Idea {...mockProps} postSummary="Uma ideia" referenceImagePreview="blob:preview" />);
    const button = screen.getByRole('button', { name: /Avançar/i });
    expect(button).toBeDisabled();
  });

  it('enables generate button when summary and required description are present', () => {
    render(
      <Step1Idea 
        {...mockProps} 
        postSummary="Uma ideia" 
        referenceImagePreview="blob:preview" 
        referenceDescription="Uma descrição do produto" 
      />
    );
    const button = screen.getByRole('button', { name: /Avançar/i });
    expect(button).not.toBeDisabled();
  });

  it('calls onGenerate when button is clicked', () => {
    render(<Step1Idea {...mockProps} postSummary="Uma ideia" />);
    const button = screen.getByRole('button', { name: /Avançar/i });
    fireEvent.click(button);
    expect(mockProps.onGenerate).toHaveBeenCalled();
  });
});

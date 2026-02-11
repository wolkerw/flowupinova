"use client";

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Step4BrandCustomization } from '../_components/Step4BrandCustomization';

describe('Step4BrandCustomization', () => {
  const mockProps = {
    selectedImage: 'https://picsum.photos/400',
    logoFile: null,
    logoPreviewUrl: null,
    logoPosition: 'bottom-right' as any,
    logoScale: 30,
    logoOpacity: 80,
    onLogoUpload: jest.fn(),
    onLogoRemove: jest.fn(),
    onPositionChange: jest.fn(),
    onScaleChange: jest.fn(),
    onOpacityChange: jest.fn(),
    onBack: jest.fn(),
    onNext: jest.fn(),
    isUploading: false,
    visualLogoScale: 15,
    logoInputRef: { current: null } as any,
  };

  it('renders customization options', () => {
    render(<Step4BrandCustomization {...mockProps} />);
    expect(screen.getByText(/Personalize com sua Marca/i)).toBeInTheDocument();
    expect(screen.getByText(/Anexar Logomarca/i)).toBeInTheDocument();
  });

  it('calls onNext when review button is clicked', () => {
    render(<Step4BrandCustomization {...mockProps} />);
    const button = screen.getByText(/Revisar publicação/i);
    fireEvent.click(button);
    expect(mockProps.onNext).toHaveBeenCalled();
  });
});

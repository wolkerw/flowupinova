"use client";

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Step5ReviewPublish } from '../_components/Step5ReviewPublish';

describe('Step5ReviewPublish', () => {
  const mockProps = {
    processedImageUrl: null,
    selectedImage: 'https://picsum.photos/400',
    selectedContent: { título: 'Título Final', subtitulo: 'Legenda', hashtags: ['#ia'] },
    user: { displayName: 'User' },
    metaConnection: { isConnected: true, pageName: 'Página FB' } as any,
    instagramConnection: { isConnected: true, instagramUsername: 'insta_user' } as any,
    platforms: ['instagram', 'facebook'] as any[],
    onPlatformChange: jest.fn(),
    onPublish: jest.fn(),
    onBack: jest.fn(),
    isPublishing: false,
  };

  it('renders preview and handles platform selection', () => {
    render(<Step5ReviewPublish {...mockProps} />);
    
    expect(screen.getByText(/Etapa 5: Revise e publique seu post/i)).toBeInTheDocument();
    expect(screen.getByText('Título Final')).toBeInTheDocument();
    
    const instaCheckbox = screen.getByLabelText(/Instagram/i);
    fireEvent.click(instaCheckbox);
    expect(mockProps.onPlatformChange).toHaveBeenCalledWith('instagram');
  });

  it('calls onPublish with correct mode', () => {
    render(<Step5ReviewPublish {...mockProps} />);
    
    const publishNow = screen.getByText(/Publicar Agora/i);
    fireEvent.click(publishNow);
    expect(mockProps.onPublish).toHaveBeenCalledWith('now');
    
    const schedule = screen.getByText(/Agendar/i);
    fireEvent.click(schedule);
    expect(mockProps.onPublish).toHaveBeenCalledWith('schedule');
  });
});

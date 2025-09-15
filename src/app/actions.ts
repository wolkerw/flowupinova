'use server';

import { generateMarketingContent } from '@/ai/flows/generate-marketing-content';

export async function getAiResponse(prompt: string): Promise<string> {
  if (!prompt) {
    throw new Error('O prompt é obrigatório.');
  }

  try {
    const result = await generateMarketingContent({ prompt });
    return result.content;
  } catch (error) {
    console.error('Erro ao obter resposta da IA:', error);
    return 'Desculpe, um erro inesperado ocorreu ao contatar a IA. Por favor, tente novamente.';
  }
}

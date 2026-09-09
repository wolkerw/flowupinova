import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: false,
          data: () => ({}),
        }),
      }),
    }),
  },
}));

describe('API /api/conteudo/melhorar-texto', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'mock-key-123' };
    global.fetch = vi.fn();
  });

  it('retorna erro 400 se textoOriginal não for fornecido', async () => {
    const req = new NextRequest('http://localhost:9002/api/conteudo/melhorar-texto', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Texto original');
  });

  it('retorna formato estruturado com titulo, legenda e hashtags quando format === "structured"', async () => {
 const mockGeminiReply = {
 candidates: [
 {
 content: {
 parts: [
 {
 text: JSON.stringify({
 titulo: 'Título Incrível de Post',
 legenda: 'Legenda persuasiva com emojis e CTA!',
 hashtags: ['#novidade', '#estilo'],
 }),
 },
 ],
 },
 },
 ],
 };

 global.fetch = vi.fn().mockResolvedValueOnce({
 ok: true,
 json: async () => mockGeminiReply,
 });

 const req = new NextRequest('http://localhost:9002/api/conteudo/melhorar-texto', {
 method: 'POST',
 body: JSON.stringify({
 textoOriginal: 'Vendo casaco de lã',
 format: 'structured',
 contextInfo: 'Casaco de lã 100% merino',
 }),
 });

 const res = await POST(req);
 expect(res.status).toBe(200);
 const data = await res.json();

 expect(data.titulo).toBe('Título Incrível de Post');
 expect(data.legenda).toBe('Legenda persuasiva com emojis e CTA!');
 expect(data.hashtags).toEqual(['#novidade', '#estilo']);
 });

 it('retorna textoMelhorado no formato simples legado quando format não for structured', async () => {
 const mockGeminiReply = {
 candidates: [
 {
 content: {
 parts: [
 {
 text: 'Texto aprimorado simples e direto.',
 },
 ],
 },
 },
 ],
 };

 global.fetch = vi.fn().mockResolvedValueOnce({
 ok: true,
 json: async () => mockGeminiReply,
 });

 const req = new NextRequest('http://localhost:9002/api/conteudo/melhorar-texto', {
 method: 'POST',
 body: JSON.stringify({
 textoOriginal: 'Texto rascunho',
 }),
 });

 const res = await POST(req);
 expect(res.status).toBe(200);
 const data = await res.json();

 expect(data.textoMelhorado).toBe('Texto aprimorado simples e direto.');
 });
});

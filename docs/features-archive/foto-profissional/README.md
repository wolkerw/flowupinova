# Arquivo da Feature: Foto Profissional (Avatar IA)

Este documento registra o arquivamento seguro da funcionalidade **Foto Profissional** (Avatar IA com fusão biométrica facial) da plataforma NumVapt, realizado a pedido do usuário em 16/11/2026.

Todo o código, componentes, rotas de API, prompts e modelos continuam **100% preservados no repositório**, permitindo sua reativação imediata quando desejado.

---

## 🚀 Como Reativar a Feature no Futuro (2 Passos Rápidos)

### Passo 1: Restaurar a Página do Dashboard
No arquivo `src/app/dashboard/avatar/page.tsx`, substitua o componente de redirecionamento temporário pela exportação direta da tela original:

```tsx
"use client";

export { default } from "./AvatarOriginalView";
```

### Passo 2: Reativar o Link no Menu Lateral
No arquivo `src/app/dashboard/layout.tsx`, localize a lista `mainNavItems` e descomente o bloco:

```tsx
  {
    title: "Foto Profissional",
    url: "/dashboard/avatar",
    icon: User,
  },
```

Pronto! A página e o menu voltarão a funcionar imediatamente.

---

## 📁 Estrutura de Arquivos e Componentes Preservados

1. **Frontend / Interface do Usuário:**
   - `src/app/dashboard/avatar/AvatarOriginalView.tsx`: Tela completa com upload de selfie, envio de foto de estilo, catálogo de sugestões (corporativo, criativo, poses), prévias e download.
   - `src/app/dashboard/avatar/_components/ImageCropperModal.tsx`: Modal para recorte proporcional de fotos e enquadramentos faciais.
   - `src/app/dashboard/avatar/_components/AvatarAnimationDemo.tsx`: Demonstração interativa de animação/transformação do avatar.

2. **Backend / Endpoints de Geração:**
   - `src/app/api/avatar/generate/route.ts`: Endpoint de geração de imagens com upload para Firebase Storage, análise de estilo e visão computacional via Gemini Flash, fallback resiliente e suporte ao webhook n8n.
   - `src/app/api/avatar/generate/__tests__/route.test.ts`: Testes unitários cobrindo o fluxo de geração e escala anatômica.

3. **Inteligência Artificial & Prompts:**
   - `src/lib/services/avatar/avatar-prompt-v2.ts`: Prompt homologado focado em alta fidelidade facial (traços concretos da selfie, ausência de embelezamento artificial e correção de lente de celular).
   - `docs/prompts-snapshot/2026-11-16-avatar/`: Snapshot dos prompts e rotas de produção para auditoria e histórico.

4. **Modelos de IA Homologados:**
   - **Motor Primário:** `gpt-image-2.6-sunburst` (OpenAI Image-to-Image / Edits com `/identylock`).
   - **Fallback Automático:** Família **Google Gemini Nano Banana Pro** (`gemini-3-pro-image`, `gemini-2.0-flash-exp`).
   - **Visão Forense / Análise de Selfie:** `gemini-3.5-flash` (Structured Output JSON).

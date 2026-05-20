---
name: n8n-integration
description: Documentação e padrões para integração com workflows do n8n no projeto NumVapt.
---

# n8n Integration Skill

Esta skill documenta a integração do projeto NumVapt com os workflows do n8n para automação de conteúdo.

## Endpoints e Webhooks

O projeto utiliza um sistema de proxy (`/api/proxy-webhook`) e chamadas diretas para o domínio `webhook.flowupinova.com.br`.

### 1. Geração por Link de Referência
- **Target**: `gerador_link_referencia`
- **Método**: POST (FormData)
- **Campos**:
  - `inspiration_file`: Arquivo de imagem (print/referência).
  - `description`: Texto descrevendo o que aproveitar da referência.
  - `user_id`: ID do usuário Firebase.
  - `business_name`: Nome da empresa.
  - `product_file` (Opcional): Foto do produto real.
- **Resposta**: JSON contendo lista de `publicacoes`.

### 2. Geração de Imagem (Main)
- **URL**: `https://webhook.flowupinova.com.br/webhook/gerador-imagem`
- **Método**: POST (JSON)
- **Payload**:
  ```json
  {
    "prompt": "...",
    "postId": "...",
    "fileName": "1|2|3",
    "content": { ... }
  }
  ```
- **Fluxo**: Inicia a geração assíncrona. O frontend deve realizar polling após o sucesso desta chamada.

### 3. Busca de Imagens (Polling)
- **URL**: `https://webhook.flowupinova.com.br/webhook/buscar-imagens-supabase`
- **Método**: POST (JSON)
- **Payload**:
  ```json
  {
    "postId": "...",
    "filename": "1|2|3",
    "fileExtension": "png"
  }
  ```
- **Intervalo sugerido**: 10 segundos, começando 10s após o trigger de geração.

### 4. Personalização de Marca
- **Target**: `personalizador_imagem`
- **Método**: POST (FormData)
- **Campos**: `logo`, `image`, `position`, `scale`, `opacity`, `text`, `text_color`, etc.

## Melhores Práticas

1.  **Polling Seguro**: Sempre usar `attempts` e `maxAttempts` para evitar loops infinitos.
2.  **FormData vs JSON**: Webhooks que envolvem arquivos (logo, fotos) devem usar `FormData`.
3.  **Proxy Webhook**: Utilize o endpoint `/api/proxy-webhook` para ocultar URLs sensíveis e evitar problemas de CORS no frontend quando possível.
4.  **Tratamento de Blob**: Ao receber imagens binárias, utilize `URL.createObjectURL` e lembre-se de revogar a URL no `cleanup` do componente para evitar vazamento de memória.

## Depuração
- Verifique os logs do n8n em `https://n8n.flowupinova.com.br` (se acessível).
- Utilize a aba "Network" do navegador para inspecionar os payloads enviados para o `/api/proxy-webhook`.

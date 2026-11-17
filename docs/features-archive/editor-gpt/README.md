# Arquivo da Feature: Novo Editor GPT (Camadas & Canvas Visual)

Este documento registra o arquivamento seguro da nova versão do **Editor GPT** (edição em camadas canvas e extração visual de elementos), preservada com segurança a pedido do usuário em 17/11/2026.

---

## 🔒 Regra de Isolamento Permanente

- **A nova versão do Editor GPT NÃO deve ser incluída em merges, commits ou deploys para `uat` ou `main` automaticamente.**
- Qualquer alteração deste editor deve permanecer exclusivamente na branch isolada `feature/editor-gpt-layers`.
- A integração para `uat` e `main` só poderá ocorrer quando o usuário solicitar **expressa e nominalmente** (ex: *"suba o novo editor gpt para uat/main"*). O agente não deve esperar o usuário ter que lembrar ou dizer "exceto editor GPT".

---

## 🌿 Onde a Feature Está Preservada

- **Branch Dedicada:** `feature/editor-gpt-layers`
- **Commits Principais:**
  - `9db71398`: `fix(editor-gpt): inicia modo camadas com canvas limpo sem titulos mockup avulsos`
  - `933a16d2`: `feat(editor-gpt): implementa extracao automatica dos elementos da arte em camadas selecionaveis via GPT Vision`
  - `2999e554`: `feat(editor-gpt): implementa edicao em camadas estilo canvas e suporte gpt-image-2.6-sunburst`

---

## 🚀 Como Integrar e Reativar no Futuro

Quando o usuário solicitar a integração do novo Editor GPT para `uat` e `main`:

1. Trocar para a branch `uat`:
   ```bash
   git checkout uat
   ```
2. Fazer o merge da branch da feature:
   ```bash
   git merge feature/editor-gpt-layers
   ```
3. Executar os testes automatizados:
   ```bash
   npm run test
   npm run test:e2e
   ```
4. Subir para `uat` e posteriormente para `main` com tag semântica.

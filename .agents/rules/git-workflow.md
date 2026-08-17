# Regras de Git e Deploy para Agentes de IA

## 🚨 REGRA INVIOLÁVEL: PROIBIDO `git push` AUTOMÁTICO

1. **Aprovação Expressa Obrigatória**:
   - Mesmo que o usuário esteja utilizando o modo **"Always Proceed"** ou permissões automáticas no terminal, **NENHUM agente de IA pode executar `git push` por iniciativa própria**.
   - O agente pode criar branches locais, fazer `git add` e `git commit`, rodar todos os testes de validação, mas **DEVE OBRIGATORIAMENTE PARAR** e solicitar confirmação explícita ao usuário:
     > *"As alterações foram validadas e commitadas localmente. Deseja que eu realize o `git push` para a branch `uat` agora?"*

2. **Fluxo de Branches**:
   - Todo desenvolvimento deve ser realizado na branch `uat`.
   - A branch `main` só recebe merge/push após execução e aprovação 100% dos testes de E2E do Playwright (`npm run test:e2e`).

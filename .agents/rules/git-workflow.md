# Regras de Git e Deploy para Agentes de IA

## 🚨 REGRA INVIOLÁVEL: NUNCA SUBIR AUTOMATICAMENTE (GIT PUSH SÓ SOB PEDIDO EXPLÍCITO)

1. **Proibição Total de Push Automático**:
   - Mesmo com opções como **"Always Proceed"** habilitadas no IDE, **NENHUM agente de IA tem permissão para executar `git push` automaticamente**.
   - O agente NUNCA deve subir código para repositórios remotos (`origin/uat`, `origin/main` ou qualquer outra branch) a menos que o usuário dê a ordem direta e expressa na conversa (ex: *"suba para uat"*, *"faça o push"*).
   - Conclua sempre as alterações, faça o commit local, valide os testes e informe ao usuário o status atual. O `git push` só ocorrerá se o usuário solicitar nominalmente.

2. **Fluxo de Branches**:
   - Todo desenvolvimento deve ser realizado na branch `uat`.
   - A branch `main` só recebe merge/push após execução e aprovação 100% dos testes de E2E do Playwright (`npm run test:e2e`) e autorização expressa do usuário.


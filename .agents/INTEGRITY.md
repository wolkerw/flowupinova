# Regras de Integridade do Projeto (AI Agents)

Para garantir a estabilidade do código e a satisfação do usuário, todos os agentes de IA operando neste repositório DEVEM seguir estas regras:

## 1. Verificação de Tipagem (TypeScript)

Sempre que uma alteração for feita em arquivos `.ts` ou `.tsx`, ou quando novas dependências forem adicionadas, você **DEVE** executar o comando de typecheck e garantir que não existam erros remanescentes.

**Comando:**

```powershell
node node_modules\typescript\bin\tsc --noEmit
```

_(Nota: Use o caminho direto para o `tsc` via `node` se os scripts `.ps1` estiverem bloqueados no ambiente)._

## 2. Padronização de Nomenclatura

- Sempre utilize `titulo` (sem acento) para campos de conteúdo gerado, conforme padronizado na interface `GeneratedContent`.

## 3. Testes Unitários

- Todas as novas funcionalidades ou correções de bugs devem ser acompanhadas de testes unitários.
- Execute os testes antes de considerar a tarefa concluída:

```powershell
npm test
```

## 4. Arquitetura Next.js 15

- **Server vs Client**: Mantenha lógica de backend e acesso ao Firebase Admin em Server Components ou rotas de API. Use `"use client"` apenas quando houver interatividade.
- **Async APIs**: Lembre-se que no Next.js 15, `cookies()`, `headers()` e `params` são assíncronos. Sempre use `await`.

## 5. UI/UX e Estilização

- **Componentes**: Utilize prioritariamente os componentes do `@/components/ui` (Shadcn/UI).
- **Tailwind**: Use o utilitário `cn()` para gerenciar classes dinâmicas. Evite estilos inline.
- **Responsividade**: Garanta que novos layouts funcionem em dispositivos móveis (uso de classes `sm:`, `md:`, `lg:`).

## 6. Tratamento de Erros e Feedback

- **Robustez**: Toda chamada de rede ou operação de banco de dados deve estar dentro de um bloco `try/catch`.
- **Feedback**: Utilize o hook `useToast` para informar o sucesso ou falha de ações ao usuário, sempre em PT-BR.

## 7. Firebase e Segurança

- **Admin SDK**: Nunca utilize `firebase-admin` em componentes do lado do cliente.
- **Regras**: Ao alterar a estrutura de dados (Firestore), verifique se as Security Rules precisam de ajuste.

## 8. IA e Prompts

- **JSON Estruturado**: Ao interagir com modelos de IA para geração de dados, sempre exija saída em formato JSON e valide o esquema antes de processar.

## 9. Próximas Modificações

- Antes de iniciar qualquer modificação, verifique se a tipagem atual está correta para evitar herdar erros de sessões anteriores.

## 10. Boas Práticas de Código e Next.js

- **Imagens e Links**: Sempre utilize `<Image />` (`next/image`) e `<Link />` (`next/link`) em vez das tags HTML padrão para garantir a otimização automática.
- **Variáveis de Ambiente**: Sempre valide a existência das variáveis no `process.env` antes de usá-las. Em caso de ausência de chaves obrigatórias, lance um erro claro imediatamente (Early Fail). Lembre-se: apenas variáveis com o prefixo `NEXT_PUBLIC_` são seguras para o lado do cliente.

## 11. Formatação e Linting

- **Código Limpo**: O projeto está configurado com Prettier e ESLint. Quando houver alterações extensas, verifique a padronização utilizando:

```powershell
npm run lint
npm run format
```

## 12. Acessibilidade Básica (A11y)

- **Elementos UI**: Garanta que todas as imagens possuam o atributo `alt` descritivo e que botões compostos apenas por ícones contenham propriedades `aria-label` adequadas.

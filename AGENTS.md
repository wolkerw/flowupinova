# AGENTS.md

Welcome, AI Agent! This file provides essential guidelines, context, and configurations to help you develop, test, and contribute to this repository safely and efficiently.

## 🚀 Tech Stack & Setup

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript (strict mode, interfaces mandatory for Firestore docs)
- **Database & BaaS:** Firebase (Auth, Cloud Firestore, Storage)
- **Testing:** Vitest + JSDOM + V8 Coverage (Note: The repository has been migrated from Jest to Vitest)
- **Styling:** Tailwind CSS (Strictly solid colors, no complex gradients, follow the brand guide)

## 📦 Run & Test Commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev` (running on port 9002)
- Run tests: `npm run test` (Vitest with coverage verification)
- Run specific test file: `npx vitest run path/to/test-file.test.tsx`
- Lint check: `npm run lint`
- Format code: `npm run format` (Runs Prettier)

## ⚠️ Coding Standards & Guidelines (DO's and DONT's)

1. **Always use TypeScript** for new files, components, and service functions. Define explicit types/interfaces for Firestore documents (e.g., `UserSubscriptionDoc`).
2. **Never push directly to `main`**. Always make changes on the `uat` branch, run tests, and merge only after verification.
3. **Follow the brand identity** defined in [docs/GUIA_DE_MARCA.md](file:///docs/GUIA_DE_MARCA.md):
   - Typography: Poppins for headings, Inter for body.
   - Primary: `#0083C7` (NumVapt Blue)
   - Accent: `#FA6305` (NumVapt Orange)
   - Rounded corners: `0.5rem` (8px)
   - Buttons: Solid colors only (no gradients).
4. **Garantir o envio das imagens fixas**: Sempre inclua e comite no repositório todas as imagens estáticas/fixas utilizadas pelas páginas do site (na pasta `public/`), para que estejam sempre visíveis nos ambientes de deploy e homologação.
5. **Sincronização de Prompts no Admin**: Sempre que atualizar alguma regra, instrução ou parâmetro nos prompts de IA ou modelos de imagens no back-end (endpoints/APIs), lembre-se de atualizar também a exibição desses prompts e modelos na tela de "Configurações" (painel admin) para manter a interface de auditoria do usuário 100% fiel e sincronizada.

## 🧪 Testing and Mocking Guidelines

1. **Asynchronous `onSnapshot` callbacks:** In tests, the `onNext` callback of `onSnapshot` must be executed asynchronously inside a `setTimeout` block (e.g., `setTimeout(() => onNext(snap), 0)`) to prevent React 18 infinite rendering loops and `Maximum call stack size exceeded` errors.
2. **Stable Hook Mocks:** Mocks for hooks like `useAuth` must return a statically declared object (e.g., `const mockAuth = { ... }; useAuth: () => mockAuth`) rather than generating a new object literal on every call. This prevents infinite render loops inside React `useEffect` hooks.
3. **Unused Mock Cleanup:** Avoid defining mock functions (like `vi.fn()`) that are not executed in the test, as this drags down function coverage metrics. Keep mocks focused and minimal.

## 🚀 AI Agent Workflow Rules

1. **Planning Phase**: Prior to implementing any changes, run research commands (grep/view files) and present a detailed implementation plan in Markdown. Obtain user approval before writing code.
2. **Test-First Principle**: When creating a new service or feature, proactively create corresponding unit or integration tests under `__tests__` directories.
3. **No Placeholders**: Never write placeholder components or mock image strings. Generate functional logic and use image assets correctly.
4. **Explicit Push Approval**: Never run `git push` or push changes to remote branches (`uat` or `main`) automatically. Always ask for explicit user permission or command before sending any commits.

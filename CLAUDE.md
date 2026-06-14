# CLAUDE.md

Guidelines and instructions for developing and testing in this repository.

## 📦 Build, Run, and Test Commands

* **Install Dependencies**: `npm install`
* **Development Server**: `npm run dev` (Runs locally on port `9002`)
* **Production Build**: `npm run build`
* **Run Tests**: `npm run test` (Runs Vitest with v8 coverage)
* **Run Specific Test File**: `npx vitest run path/to/test-file.test.tsx`
* **Lint Check**: `npm run lint`
* **Format Code**: `npm run format` (Runs Prettier)

## 🛠️ Code Style & Architecture Guidelines

* **TypeScript**: Strict mode is enabled. Always write explicit types and interfaces.
* **Firebase Docs**: Declare interfaces for all Firestore documents (e.g., `UserSubscriptionDoc` or `OnboardingProfileData`) inside `src/components/` or `src/lib/services/`.
* **State & Effects Mocks (React 18)**:
  * In tests, the `onNext` callback of Firestore's `onSnapshot` must be wrapped in `setTimeout(() => onNext(snap), 0)` to prevent React 18 infinite rendering loops and Maximum stack size exceeded errors.
  * Mocks for React hooks (e.g., `useAuth`) must return a statically declared stable object reference to prevent infinite rerendering inside `useEffect` hooks.
* **Component Design**: Follow the strict brand identity rules in [docs/GUIA_DE_MARCA.md](file:///docs/GUIA_DE_MARCA.md):
  * Typography: Poppins for headings, Inter for body.
  * Colors: Sólid colors only (no gradients). Primary is NumVapt Blue (`#0083C7`), Accent is NumVapt Orange (`#FA6305`).
  * Rounding: Standard border radius of `0.5rem` (8px).
* **Git Strategy**: Never make direct changes or push to `main`. Always execute development work, run tests, and push to the `uat` branch first.

## 🚀 AI Agent Workflow Rules

1. **Planning Phase**: Prior to implementing any changes, run research commands (grep/view files) and present a detailed implementation plan in Markdown. Obtain user approval before writing code.
2. **Test-First Principle**: When creating a new service or feature, proactively create corresponding unit or integration tests under `__tests__` directories.
3. **No Placeholders**: Never write placeholder components or mock image strings. Generate functional logic and use image assets correctly.

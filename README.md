
# NumVapt - Plataforma de Marketing com Inteligência Artificial

Bem-vindo à documentação técnica da plataforma NumVapt. Este documento fornece uma visão geral da arquitetura, tecnologias utilizadas e diretrizes para contribuir com o projeto.

---

## 🚀 Visão Geral do Projeto

A NumVapt é uma plataforma SaaS (Software as a Service) projetada para empoderar pequenas e médias empresas, automatizando e otimizando suas estratégias de marketing digital através de Inteligência Artificial. A aplicação centraliza a criação de conteúdo, gestão de anúncios, análise de performance e relacionamento com o cliente em um único lugar.

## 🛠️ Tecnologias e Stacks

A plataforma é construída sobre uma stack moderna, robusta e escalável, utilizando as melhores práticas do ecossistema JavaScript/TypeScript.

### Core
- **Framework:** [Next.js](https://nextjs.org/) (v15+) - Utilizando o App Router para renderização híbrida (Server e Client Components), otimização de performance e rotas baseadas em arquivos.
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) - Para um código mais seguro, legível e manutenível.
- **Backend (BaaS):** [Firebase](https://firebase.google.com/) - Solução completa para autenticação, banco de dados (Firestore), armazenamento de arquivos (Storage) e hospedagem.

### Frontend
- **UI Library:** [React](https://react.dev/) (v18+) - Para a construção de interfaces de usuário dinâmicas e reativas.
- **Componentes UI:** [ShadCN/UI](https://ui.shadcn.com/) - Uma coleção de componentes de UI reusáveis, acessíveis e customizáveis, construídos sobre Radix UI.
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utility-first para um design rápido, consistente e responsivo.
- **Ícones:** [Lucide React](https://lucide.dev/) - Biblioteca de ícones open-source, leve e customizável.
- **Animações:** [Framer Motion](https://www.framer.com/motion/) - Para a criação de animações fluidas e complexas.
- **Formulários:** [React Hook Form](https://react-hook-form.com/) - Gerenciamento de formulários performático e eficiente.

### Backend & APIs
- **Infraestrutura:** [Firebase App Hosting](https://firebase.google.com/docs/app-hosting) - Hospedagem gerenciada e escalável para aplicações web.
- **Banco de Dados:** [Cloud Firestore](https://firebase.google.com/docs/firestore) - Banco de dados NoSQL, flexível e escalável para armazenar dados da aplicação em tempo real.
- **Autenticação:** [Firebase Authentication](https://firebase.google.com/docs/auth) - Gerenciamento de usuários com suporte a login por e-mail/senha e provedores sociais.
- **Armazenamento de Arquivos:** [Firebase Storage](https://firebase.google.com/docs/storage) - Para upload e armazenamento de mídias como imagens e vídeos.
- **APIs Externas:** Integração com as APIs Graph do Facebook/Instagram e Google My Business para publicação de conteúdo e análise de métricas.

### Testes
- **Framework de Testes:** [Jest](https://jestjs.io/)
- **Testes de Componentes:** [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## 📁 Estrutura de Diretórios

A estrutura do projeto segue as convenções do Next.js App Router para uma organização clara e escalável.

```
/
├── src/
│   ├── app/                    # Rotas principais da aplicação (App Router)
│   │   ├── (acesso)/           # Rotas públicas de login e cadastro
│   │   ├── (dashboard)/        # Rotas protegidas do painel do usuário
│   │   ├── api/                # API Routes para comunicação com serviços externos
│   │   └── layout.tsx          # Layout raiz da aplicação
│   │
│   ├── components/
│   │   ├── ui/                 # Componentes base (gerados pelo ShadCN/UI)
│   │   └── auth/               # Componentes relacionados à autenticação
│   │
│   ├── lib/
│   │   ├── firebase.ts         # Configuração e inicialização do Firebase (client-side)
│   │   ├── firebase-admin.ts   # Configuração e inicialização do Firebase (server-side)
│   │   ├── services/           # Lógica de negócio e comunicação com Firestore/APIs
│   │   └── utils.ts            # Funções utilitárias
│   │
│   └── hooks/                  # Hooks customizados do React
│
├── public/                     # Arquivos estáticos (imagens, fontes, etc.)
│
├── .env                        # Variáveis de ambiente (não versionado)
├── next.config.ts              # Configurações do Next.js
└── package.json                # Dependências e scripts do projeto
```

---

## 📦 Scripts Disponíveis

Os seguintes scripts estão disponíveis no `package.json`:

- `npm run dev`: Inicia o servidor de desenvolvimento em `http://localhost:9002`.
- `npm run build`: Compila a aplicação para produção.
- `npm run start`: Inicia o servidor de produção após o build.
- `npm run lint`: Executa o linter para analisar o código em busca de problemas.
- `npm run test`: Executa os testes unitários e de integração.

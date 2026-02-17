# AgendaZap - Micro-SaaS de Agendamento Multi-Tenant

Plataforma de agendamento para negócios locais (clínicas e coworkings) com automação de WhatsApp.

## Estrutura do Monorepo

```
agendazap/
├── apps/
│   └── web/                    # Next.js 14 (App Router)
│       ├── app/
│       │   ├── (auth)/         # Páginas de login/registro
│       │   ├── (dashboard)/    # Dashboard administrativo (privado)
│       │   ├── (public)/       # Páginas públicas de agendamento
│       │   └── api/            # API Routes (WhatsApp webhook, etc.)
│       └── ...
├── packages/
│   ├── config/                 # Configs compartilhadas (TS, ESLint, Tailwind)
│   ├── database/               # Prisma schema + Supabase + migrations
│   └── ui/                     # Componentes compartilhados (Shadcn/UI base)
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## Stack Tecnológica

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Shadcn/UI
- **Backend:** Next.js API Routes + Server Actions
- **Banco de Dados:** Supabase (PostgreSQL) + Prisma ORM
- **Multi-tenancy:** Row Level Security (RLS) por `organization_id`
- **WhatsApp:** Evolution API
- **Deploy:** Vercel + Supabase
- **Monorepo:** Turborepo + pnpm

## Setup

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm db:generate
pnpm db:push
pnpm dev
```

## Variáveis de Ambiente

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## 📚 Documentação Adicional

- **[EMAIL_SETUP.md](EMAIL_SETUP.md)** - Configuração de envio de emails (SMTP, Gmail, Resend)
- **[SETUP.md](SETUP.md)** - Guia completo de instalação e configuração
- **[WHATSAPP_GUIDE.md](WHATSAPP_GUIDE.md)** - Integração com Evolution API
- **[VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)** - Deploy na Vercel

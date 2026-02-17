# ============================================================
# AGENDAZAP - Variáveis de Ambiente
# ============================================================
# Copie este arquivo para apps/web/.env.local e preencha os valores

# ============================================================
# SUPABASE
# ============================================================
# Acesse: https://app.supabase.com → Seu Projeto → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (NUNCA exponha no frontend!)
# Settings → API → service_role key (secret)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================
# DATABASE (Supabase PostgreSQL)
# ============================================================
# Settings → Database → Connection string → URI
# Connection pooling (Supavisor) - Use para Prisma:
DATABASE_URL=postgresql://postgres.[projeto]:[senha]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection (sem pooler) - Use para migrations:
DIRECT_URL=postgresql://postgres.[projeto]:[senha]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres

# ============================================================
# EVOLUTION API (WhatsApp)
# ============================================================
# URL da sua instância Evolution API
# Exemplos:
# - Docker local: http://localhost:8080
# - Railway: https://sua-app.up.railway.app
# - Render: https://sua-app.onrender.com
EVOLUTION_API_URL=https://sua-evolution-api.com

# API Key configurada na Evolution API
# Defina uma chave forte e guarde com segurança
EVOLUTION_API_KEY=sua-chave-secreta-aqui

# Nome da instância criada na Evolution API
# Deve corresponder ao instanceName usado no POST /instance/create
EVOLUTION_INSTANCE=agendazap

# ============================================================
# APLICAÇÃO
# ============================================================
# URL pública da aplicação
# Desenvolvimento: http://localhost:3000
# Produção: https://seu-dominio.vercel.app
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================================
# OPCIONAL: Configurações Avançadas
# ============================================================

# Node Environment (development, production, test)
NODE_ENV=development

# Ativar logs detalhados do Prisma
# DEBUG=prisma:*

# Timezone padrão das organizações
# TZ=America/Sao_Paulo

# ============================================================
# EMAIL (Configuração no Supabase, não aqui!)
# ============================================================
# Envio de emails de confirmação é configurado no painel do Supabase:
# https://app.supabase.com → Settings → Auth → SMTP Settings
#
# Veja EMAIL_SETUP.md para instruções detalhadas sobre:
# - Como desabilitar confirmação de email (dev)
# - Como configurar SMTP com Gmail
# - Como usar Resend, SendGrid, etc.

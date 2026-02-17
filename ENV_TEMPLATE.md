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
# EMAIL (Para reativação de organização)
# ============================================================
# OPÇÃO 1: Usar Resend (Recomendado)
# 1. Crie conta em https://resend.com
# 2. Obtenha sua API Key em https://resend.com/api-keys
# Remova o # para ativar:
# RESEND_API_KEY=re_xxx...
# RESEND_FROM_EMAIL=noreply@seu-dominio.com

# OPÇÃO 2: Usar SMTP do Supabase (para confirmação de account)
# Configure no painel: https://app.supabase.com → Settings → Auth → SMTP Settings
# Veja EMAIL_SETUP.md para instruções detalhadas



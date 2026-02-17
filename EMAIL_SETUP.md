# Configuração de Email no Supabase

Este guia explica como configurar o envio de emails no Supabase usando SMTP customizado (ex: Gmail, SendGrid, Resend, etc.).

## 🚨 Problema Comum

Se você está vendo o erro **"Error sending confirmation email"** ao criar uma conta, é porque o Supabase precisa de configuração SMTP.

## 📧 Opções de Configuração

### Opção 1: Desabilitar Confirmação de Email (Desenvolvimento)

**Mais rápido para desenvolvimento local:**

1. Acesse: https://app.supabase.com → Seu Projeto
2. Vá em **Authentication** → **Settings** → **Email Auth**
3. **Desabilite**: "Enable email confirmations"
4. Salve as alterações

✅ **Vantagem**: Funciona imediatamente  
⚠️ **Desvantagem**: Menos seguro (use apenas em dev)

---

### Opção 2: Configurar SMTP Customizado (Gmail)

**Recomendado para produção:**

#### Passo 1: Gerar Senha de App no Gmail

1. Acesse: https://myaccount.google.com/security
2. Ative a **Verificação em duas etapas** (se ainda não estiver)
3. Vá em **Senhas de app**: https://myaccount.google.com/apppasswords
4. Crie uma senha de app:
   - Nome: "AgendaZap"
   - Copie a senha gerada (16 caracteres sem espaços)

#### Passo 2: Configurar SMTP no Supabase

1. Acesse: https://app.supabase.com → Seu Projeto
2. Vá em **Project Settings** → **Auth** → **SMTP Settings**
3. Ative: **Enable Custom SMTP**
4. Preencha:

```
Host: smtp.gmail.com
Port: 587
Username: seu-email@gmail.com
Password: [senha de app gerada no passo 1]
Sender email: seu-email@gmail.com
Sender name: AgendaZap
```

5. Clique em **Save**

#### Passo 3: Testar

1. Tente criar uma nova conta no `/register`
2. Verifique se o email de confirmação chegou

---

### Opção 3: Usar Serviço de Email Profissional

Para produção, considere usar serviços especializados:

#### **Resend** (Recomendado - Gratuito até 3.000 emails/mês)

1. Crie conta: https://resend.com
2. Obtenha sua API Key
3. Configure no Supabase:
   ```
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: [sua-api-key]
   Sender email: noreply@seu-dominio.com
   ```

#### **SendGrid** (Gratuito até 100 emails/dia)

1. Crie conta: https://sendgrid.com
2. Gere uma API Key
3. Configure no Supabase:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [sua-api-key]
   Sender email: noreply@seu-dominio.com
   ```

---

## 🔍 Verificando a Configuração

Após configurar o SMTP:

1. Vá em **Authentication** → **Email Templates**
2. Você pode customizar os templates de email
3. Use variáveis como `{{ .ConfirmationURL }}` e `{{ .SiteURL }}`

---

## � Emails de Reativação de Organização

AgendaZap envia emails de reativação quando uma organização é desativada. Estes emails são enviados via **Resend** ou necessitam de configuração adicional.

### Opção 1: Usar Resend (Recomendado para Reativação)

1. Crie uma conta em [Resend](https://resend.com)
2. Obtenha sua API Key: https://resend.com/api-keys
3. Configure em `apps/web/.env.local`:
   ```
   RESEND_API_KEY=re_sua-api-key-aqui
   RESEND_FROM_EMAIL=noreply@seu-dominio.com
   ```
4. Teste solicitando reativação em `/request-reactivation`

### Opção 2: Usar SMTP Customizado

Se preferir usar o SMTP já configurado no Supabase:

1. A rota `/api/auth/send-reactivation-email` tentará usar Resend
2. Se não tiver Resend, os emails serão registrados em logs
3. Para ativar envio real, implemente a integração com seu serviço SMTP preferido

---

## �🐛 Troubleshooting

### Erro: "Error sending confirmation email"
- ✅ Verifique se o SMTP está habilitado
- ✅ Confira usuário/senha (sem espaços)
- ✅ Para Gmail, use senha de app (não a senha normal)
- ✅ Verifique se a porta está correta (587 ou 465)

### Erro: "Authentication failed"
- ✅ Gmail: Use senha de app, não a senha da conta
- ✅ Verifique se a verificação em duas etapas está ativa

### Email não chega
- ✅ Verifique a pasta de spam
- ✅ Confirme o sender email no Supabase
- ✅ Para produção, configure SPF/DKIM no domínio

---

## 📚 Referências

- [Supabase SMTP Settings](https://supabase.com/docs/guides/auth/auth-smtp)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Resend Documentation](https://resend.com/docs/send-with-smtp)

---

## 💡 Dica para Desenvolvimento

Durante o desenvolvimento, você pode:

1. Desabilitar confirmação de email no Supabase
2. Ou usar um serviço como [Mailpit](https://github.com/axllent/mailpit) para capturar emails localmente

```bash
# Docker
docker run -d -p 8025:8025 -p 1025:1025 axllent/mailpit

# Configurar no Supabase:
# Host: localhost (ou host.docker.internal)
# Port: 1025
# Ver emails em: http://localhost:8025
```

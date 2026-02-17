-- ============================================================
-- AgendaZap - Atualização RLS para Soft Delete
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. Habilitar RLS em todas as tabelas (caso ainda não esteja)
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Atualizar Helper Functions
-- ============================================================

-- Função: obter organization_ids do usuário atual (apenas ATIVAS)
CREATE OR REPLACE FUNCTION public.user_organization_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT om.organization_id
  FROM public.organization_members om
  INNER JOIN public.users u ON u.id = om.user_id
  INNER JOIN public.organizations o ON o.id = om.organization_id
  WHERE u.supabase_id = auth.uid()::text
    AND o.status = 'ACTIVE'
$$;

-- Função: verificar se é membro de uma organização (apenas ATIVAS)
CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    INNER JOIN public.users u ON u.id = om.user_id
    INNER JOIN public.organizations o ON o.id = om.organization_id
    WHERE u.supabase_id = auth.uid()::text
      AND om.organization_id = org_id
      AND o.status = 'ACTIVE'
  )
$$;

-- Função: verificar se é OWNER/ADMIN (apenas ATIVAS)
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    INNER JOIN public.users u ON u.id = om.user_id
    INNER JOIN public.organizations o ON o.id = om.organization_id
    WHERE u.supabase_id = auth.uid()::text
      AND om.organization_id = org_id
      AND om.role IN ('OWNER', 'ADMIN')
      AND o.status = 'ACTIVE'
  )
$$;

-- ============================================================
-- 3. Atualizar Políticas de ORGANIZATIONS
-- ============================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "org_select_member" ON organizations;
DROP POLICY IF EXISTS "org_update_admin" ON organizations;

-- Recriar políticas atualizadas
CREATE POLICY "org_select_member" ON organizations
  FOR SELECT
  USING (
    id IN (SELECT public.user_organization_ids())
    AND status = 'ACTIVE'
  );

CREATE POLICY "org_update_admin" ON organizations
  FOR UPDATE
  USING (
    public.is_org_admin(id)
    AND status = 'ACTIVE'
  );

-- ============================================================
-- 4. Atualizar Políticas de SERVICES
-- ============================================================

-- Remover política pública antiga
DROP POLICY IF EXISTS "service_select_public" ON services;

-- Recriar política pública atualizada
CREATE POLICY "service_select_public" ON services
  FOR SELECT
  TO anon, authenticated
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id
      AND o.status = 'ACTIVE'
    )
  );

-- ============================================================
-- 5. Atualizar Políticas de BOOKINGS
-- ============================================================

-- Remover política pública antiga
DROP POLICY IF EXISTS "booking_insert_public" ON bookings;

-- Recriar política pública atualizada
CREATE POLICY "booking_insert_public" ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id
      AND o.status = 'ACTIVE'
    )
  );

-- ============================================================
-- 6. Adicionar Política UPDATE faltante em ORGANIZATION_MEMBERS
-- ============================================================

-- Remover se existir (caso seja reexecutado)
DROP POLICY IF EXISTS "member_update_admin" ON organization_members;

-- Apenas admins podem atualizar membros (ex: mudar role)
CREATE POLICY "member_update_admin" ON organization_members
  FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

-- ============================================================
-- 7. Adicionar Política INSERT faltante em USERS
-- ============================================================

-- Remover políticas antigas para recriar com melhores práticas
DROP POLICY IF EXISTS "user_select_self" ON users;
DROP POLICY IF EXISTS "user_insert_self" ON users;
DROP POLICY IF EXISTS "user_update_self" ON users;

-- Usuário pode ver apenas seu próprio perfil
CREATE POLICY "user_select_self" ON users
  FOR SELECT
  TO authenticated
  USING (supabase_id = (SELECT auth.uid())::text);

-- Usuário pode criar apenas seu próprio perfil (após signup)
CREATE POLICY "user_insert_self" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (supabase_id = (SELECT auth.uid())::text);

-- Usuário pode atualizar apenas seu próprio perfil
CREATE POLICY "user_update_self" ON users
  FOR UPDATE
  TO authenticated
  USING (supabase_id = (SELECT auth.uid())::text)
  WITH CHECK (supabase_id = (SELECT auth.uid())::text);

-- ============================================================
-- 8. Índices adicionais para performance com RLS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_org_members_user_org
  ON organization_members(user_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_org_members_org
  ON organization_members(organization_id);

CREATE INDEX IF NOT EXISTS idx_users_supabase_id
  ON users(supabase_id);

CREATE INDEX IF NOT EXISTS idx_bookings_org_start
  ON bookings(organization_id, start_time);

CREATE INDEX IF NOT EXISTS idx_services_org_active
  ON services(organization_id, active);

CREATE INDEX IF NOT EXISTS idx_organizations_status
  ON organizations(status);

-- ============================================================
-- 9. Verificação
-- ============================================================

SELECT 'RLS policies updated successfully for soft delete feature!' AS status;

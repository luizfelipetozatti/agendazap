-- ============================================================
-- AgendaZap - Supabase Row Level Security (RLS)
-- Execute este SQL no Supabase SQL Editor após prisma db push
-- ============================================================

-- ============================================================
-- 1. Habilitar RLS em todas as tabelas
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Helper function: obter organization_ids do usuário atual
-- ATUALIZADO: apenas organizações ATIVAS
-- ============================================================

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

-- ============================================================
-- 3. Helper function: verificar se é membro de uma organização
-- ATUALIZADO: apenas organizações ATIVAS
-- ============================================================

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

-- ============================================================
-- 4. Helper function: verificar se é OWNER/ADMIN
-- ATUALIZADO: apenas organizações ATIVAS
-- ============================================================

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
-- 5. Policies: ORGANIZATIONS
-- ============================================================

-- Membros podem ver suas organizações ATIVAS
CREATE POLICY "org_select_member" ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT public.user_organization_ids())
    AND status = 'ACTIVE'
  );

-- Apenas owners/admins podem atualizar organizações ATIVAS
CREATE POLICY "org_update_admin" ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_admin(id)
    AND status = 'ACTIVE'
  );

-- Qualquer usuário autenticado pode criar organização
CREATE POLICY "org_insert_authenticated" ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 6. Policies: USERS
-- ============================================================

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
-- 7. Policies: ORGANIZATION_MEMBERS
-- ============================================================

-- Membros podem ver outros membros da mesma org
CREATE POLICY "member_select" ON organization_members
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.user_organization_ids()));

-- Apenas admins podem adicionar membros
CREATE POLICY "member_insert_admin" ON organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));

-- Apenas admins podem atualizar membros (ex: mudar role)
CREATE POLICY "member_update_admin" ON organization_members
  FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

-- Apenas admins podem remover membros
CREATE POLICY "member_delete_admin" ON organization_members
  FOR DELETE
  TO authenticated
  USING (public.is_org_admin(organization_id));

-- ============================================================
-- 8. Policies: SERVICES
-- ============================================================

-- Membros podem ver serviços da sua org ATIVA
CREATE POLICY "service_select_member" ON services
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.user_organization_ids()));

-- Público pode ver serviços ativos de organizações ATIVAS (para página de booking)
CREATE POLICY "service_select_public" ON services
  FOR SELECT
  TO anon, authenticated
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id
      AND o.status = 'ACTIVE'
    )
  );

-- Admins podem criar/atualizar/deletar serviços
CREATE POLICY "service_insert_admin" ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "service_update_admin" ON services
  FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(organization_id));

CREATE POLICY "service_delete_admin" ON services
  FOR DELETE
  TO authenticated
  USING (public.is_org_admin(organization_id));

-- ============================================================
-- 9. Policies: BOOKINGS
-- ============================================================

-- Membros podem ver bookings da sua org ATIVA
CREATE POLICY "booking_select_member" ON bookings
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.user_organization_ids()));

-- Público pode criar bookings apenas em organizações ATIVAS (página de agendamento)
CREATE POLICY "booking_insert_public" ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id
      AND o.status = 'ACTIVE'
    )
  );

-- Admins podem atualizar status dos bookings
CREATE POLICY "booking_update_admin" ON bookings
  FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(organization_id));

-- Admins podem deletar bookings
CREATE POLICY "booking_delete_admin" ON bookings
  FOR DELETE
  TO authenticated
  USING (public.is_org_admin(organization_id));

-- ============================================================
-- 10. Índices adicionais para performance com RLS
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

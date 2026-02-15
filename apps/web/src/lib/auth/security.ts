import { prisma } from "@agendazap/database";
import { getCurrentUserOrgId, getCurrentUser } from "@/lib/auth/dashboard";

/**
 * Middleware de segurança que valida se o usuário tem acesso ao orgId especificado
 * Use isso em todas as funções que recebem orgId como parâmetro
 */
export async function validateUserOrgAccess(orgId: string): Promise<boolean> {
  try {
    const userOrgId = await getCurrentUserOrgId();
    return userOrgId === orgId;
  } catch {
    return false;
  }
}

/**
 * Wrapper seguro para queries que filtram por organizationId
 * Força o uso do orgId do usuário logado, ignorando qualquer orgId fornecido externamente
 */
export async function safeOrgQuery<T>(
  queryFn: (orgId: string) => Promise<T>
): Promise<T> {
  const orgId = await getCurrentUserOrgId();
  return queryFn(orgId);
}

/**
 * Checagem de integridade - verifica se há dados órfãos ou problemas de segurança
 * Use isso em development para auditar o sistema
 */
export async function auditDataIntegrity() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Audit function should not be used in production");
  }

  const issues: string[] = [];

  // Check 1: Usuários sem organização
  const usersWithoutOrg = await prisma.user.findMany({
    where: {
      memberships: { none: {} }
    }
  });

  if (usersWithoutOrg.length > 0) {
    issues.push(`${usersWithoutOrg.length} usuários sem organização encontrados`);
  }

  // Check 2: Organizações sem membros
  const orgsWithoutMembers = await prisma.organization.findMany({
    where: {
      members: { none: {} }
    }
  });

  if (orgsWithoutMembers.length > 0) {
    issues.push(`${orgsWithoutMembers.length} organizações órfãs encontradas`);
  }

  // Check 3: Bookings com serviceId de outra organização (violação de segurança)
  const invalidBookings = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.organization_id != s.organization_id
  `;

  const invalidBookingsCount = Number(invalidBookings[0]?.count || 0);
  if (invalidBookingsCount > 0) {
    issues.push(`${invalidBookingsCount} bookings com serviços de outras organizações (CRÍTICO!)`);
  }

  return {
    hasIssues: issues.length > 0,
    issues
  };
}
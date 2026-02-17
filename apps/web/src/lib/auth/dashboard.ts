import { prisma } from "@agendazap/database";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Obtém o ID da organização do usuário logado de forma segura
 * Redireciona para login se não autenticado
 * Levanta erro se usuário não tem organização
 */
export async function getCurrentUserOrgId(): Promise<string> {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect("/login");
  }

  // Busca o usuário no banco pelo supabaseId com retry para race conditions
  let dbUser = null;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (!dbUser && attempts < maxAttempts) {
    dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        memberships: {
          where: {
            organization: {
              status: "ACTIVE" // Apenas organizações ativas
            }
          },
          include: {
            organization: true
          }
        }
      }
    });
    
    if (!dbUser && attempts < maxAttempts - 1) {
      // Aguardar um pouco antes de tentar novamente (race condition com pooler)
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
      console.log(`[getCurrentUserOrgId] Retry attempt ${attempts} for user ${user.id}`);
    } else {
      break;
    }
  }

  if (!dbUser) {
    // Usuário autenticado no Supabase mas não criado no banco
    console.log("[getCurrentUserOrgId] User not found in DB after retries. Supabase ID:", user.id);
    redirect("/setup");
  }

  if (dbUser.memberships.length === 0) {
    // Usuário existe mas não tem organização ativa
    console.log("[getCurrentUserOrgId] User has no active org. User ID:", dbUser.id);
    redirect("/setup?reason=no-organization");
  }

  // Retorna o ID da primeira organização do usuário
  // TODO: Em versões futuras, permitir seleção de organização
  return dbUser.memberships[0].organizationId;
}

/**
 * Obtém dados completos do usuário logado incluindo suas organizações
 */
export async function getCurrentUser() {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      memberships: {
        where: {
          organization: {
            status: "ACTIVE" // Apenas organizações ativas
          }
        },
        include: {
          organization: true
        }
      }
    }
  });

  if (!dbUser) {
    redirect("/setup");
  }

  return {
    supabaseUser: user,
    dbUser
  };
}
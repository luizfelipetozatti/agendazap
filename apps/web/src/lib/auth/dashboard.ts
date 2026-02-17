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

  // Busca o usuário no banco pelo supabaseId
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
    // Usuário autenticado no Supabase mas não criado no banco
    // Redirecionar para página de setup
    redirect("/setup");
  }

  if (dbUser.memberships.length === 0) {
    // Usuário existe mas não tem organização ativa
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
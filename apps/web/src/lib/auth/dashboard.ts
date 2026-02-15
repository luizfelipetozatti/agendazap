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
        include: {
          organization: true
        }
      }
    }
  });

  if (!dbUser) {
    throw new Error("Usuário não encontrado no sistema");
  }

  if (dbUser.memberships.length === 0) {
    throw new Error("Usuário não está associado a nenhuma organização");
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
        include: {
          organization: true
        }
      }
    }
  });

  if (!dbUser) {
    throw new Error("Usuário não encontrado no sistema");
  }

  return {
    supabaseUser: user,
    dbUser
  };
}
"use server";

import { prisma } from "@agendazap/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import crypto from "crypto";

const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  slug: z
    .string()
    .min(1, "Slug é obrigatório")
    .max(50, "Slug muito longo")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug deve conter apenas letras minúsculas, números e hífens"
    )
    .refine((slug) => !slug.startsWith("-") && !slug.endsWith("-"), {
      message: "Slug não pode começar ou terminar com hífen",
    }),
  whatsappNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{10,15}$/.test(val.replace(/\D/g, "")),
      "Número de WhatsApp inválido"
    ),
});

async function getCurrentUserOrgId(): Promise<string> {
  try {
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
          take: 1,
          include: {
            organization: true,
          },
        },
      },
    });

    if (!dbUser) {
      throw new Error("Usuário não encontrado no banco de dados");
    }

    if (dbUser.memberships.length === 0) {
      throw new Error("Usuário não pertence a nenhuma organização");
    }

    return dbUser.memberships[0].organizationId;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Usuário não encontrado")) {
      throw error;
    }
    console.error("Erro ao obter organização do usuário:", error);
    throw new Error("Não foi possível obter a organização");
  }
}

export async function updateOrganization(formData: FormData) {
  try {
    const orgId = await getCurrentUserOrgId();

    // Extrair dados do FormData com validação
    const name = formData.get("name");
    const slug = formData.get("slug");
    const whatsappNumber = formData.get("whatsappNumber");

    // Validar que os campos obrigatórios existem
    if (!name || !slug) {
      return {
        success: false,
        error: "Nome e slug são obrigatórios",
      };
    }

    const rawData = {
      name: String(name),
      slug: String(slug),
      whatsappNumber: whatsappNumber ? String(whatsappNumber) : undefined,
    };

    // Validar dados com Zod
    const validatedData = updateOrganizationSchema.parse(rawData);

    // Verificar se slug já existe (exceto para a própria organização)
    const existingOrg = await prisma.organization.findFirst({
      where: {
        slug: validatedData.slug,
        id: { not: orgId },
      },
    });

    if (existingOrg) {
      return {
        success: false,
        error: "Este slug já está sendo usado por outra organização",
      };
    }

    // Atualizar organização
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        whatsappNumber: validatedData.whatsappNumber || null,
      },
    });

    // Revalidar após sucesso
    revalidatePath("/dashboard/settings");

    return {
      success: true,
      message: "Organização atualizada com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao atualizar organização:", error);

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || "Dados fornecidos são inválidos",
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erro ao atualizar organização. Tente novamente.",
    };
  }
}

/**
 * Desativa a organização (soft delete)
 * Remove acesso dos membros mas mantém histórico
 */
export async function deactivateOrganization(confirmationText: string) {
  try {
    const orgId = await getCurrentUserOrgId();
    
    // Validar texto de confirmação
    if (confirmationText !== "EXCLUIR PERMANENTEMENTE") {
      return {
        success: false,
        error: "Texto de confirmação incorreto",
      };
    }

    // Buscar informações do usuário atual
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: "Usuário não autenticado",
      };
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true }
    });

    if (!dbUser) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    // Desativar a organização
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
        deletedBy: dbUser.id,
      },
    });

    // Fazer logout do usuário
    await supabase.auth.signOut();

    return {
      success: true,
      message: "Organização desativada com sucesso",
    };
  } catch (error) {
    console.error("Erro ao desativar organização:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erro ao desativar organização. Tente novamente.",
    };
  }
}

/**
 * Solicita reativação da organização
 * Gera token e envia email de confirmação
 */
export async function requestReactivation(email: string) {
  try {
    const organization = await prisma.organization.findFirst({
      where: {
        status: "DELETED",
        members: {
          some: {
            user: {
              email: email.toLowerCase()
            }
          }
        }
      },
      include: {
        members: {
          where: {
            role: "OWNER"
          },
          include: {
            user: true
          }
        }
      }
    });

    if (!organization) {
      return {
        success: false,
        error: "Organização não encontrada ou você não tem permissão",
      };
    }

    // Verificar se o email é de um OWNER
    const isOwner = organization.members.some(m => m.user.email === email.toLowerCase());
    if (!isOwner) {
      return {
        success: false,
        error: "Apenas proprietários podem reativar a organização",
      };
    }

    // Gerar token de reativação
    const reactivationToken = crypto.randomBytes(32).toString("hex");
    const reactivationExpires = new Date();
    reactivationExpires.setHours(reactivationExpires.getHours() + 24); // 24 horas

    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        status: "PENDING_REACTIVATION",
        reactivationToken,
        reactivationExpires,
      },
    });

    // TODO: Integrar com serviço de email para enviar link de confirmação
    // Por enquanto, retornar o token (em produção, apenas enviar email)
    const reactivationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reactivate/${reactivationToken}`;
    
    console.log("URL de reativação:", reactivationUrl);

    return {
      success: true,
      message: "Link de reativação enviado para seu email",
      // Remove em produção, apenas para desenvolvimento:
      developmentToken: process.env.NODE_ENV === "development" ? reactivationUrl : undefined,
    };
  } catch (error) {
    console.error("Erro ao solicitar reativação:", error);

    return {
      success: false,
      error: "Erro ao processar solicitação. Tente novamente.",
    };
  }
}

/**
 * Reativa a organização usando o token enviado por email
 */
export async function reactivateOrganization(token: string) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { reactivationToken: token },
    });

    if (!organization) {
      return {
        success: false,
        error: "Token inválido ou expirado",
      };
    }

    // Verificar se o token ainda é válido
    if (!organization.reactivationExpires || organization.reactivationExpires < new Date()) {
      return {
        success: false,
        error: "Token expirado. Solicite um novo link de reativação",
      };
    }

    if (organization.status !== "PENDING_REACTIVATION") {
      return {
        success: false,
        error: "Esta organização não está pendente de reativação",
      };
    }

    // Reativar a organização
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        status: "ACTIVE",
        deletedAt: null,
        deletedBy: null,
        reactivationToken: null,
        reactivationExpires: null,
      },
    });

    return {
      success: true,
      message: "Organização reativada com sucesso!",
      organizationSlug: organization.slug,
    };
  } catch (error) {
    console.error("Erro ao reativar organização:", error);

    return {
      success: false,
      error: "Erro ao reativar organização. Tente novamente.",
    };
  }
}
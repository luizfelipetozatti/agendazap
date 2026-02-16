"use server";

import { prisma } from "@agendazap/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
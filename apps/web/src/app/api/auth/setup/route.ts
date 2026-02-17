import { prisma, UserRole } from "@agendazap/database";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const { supabaseId, email, name, orgName, whatsapp } = await request.json();

    if (!supabaseId || !email || !name || !orgName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Gerar slug a partir do nome da org
    const slug = orgName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Verificar se existe organização deletada ou pendente de reativação com o mesmo nome
    const inactiveOrg = await prisma.organization.findFirst({
      where: {
        name: orgName,
        status: { in: ["DELETED", "PENDING_REACTIVATION"] },
      },
    });

    if (inactiveOrg) {
      const statusMessage = inactiveOrg.status === "PENDING_REACTIVATION" 
        ? "Já existe uma organização com este nome aguardando reativação. Verifique seu email ou solicite um novo link."
        : "Já existe uma organização com este nome que foi desativada. Entre em contato para reativá-la.";
      
      return NextResponse.json(
        { 
          error: "ORGANIZATION_DELETED",
          message: statusMessage,
          organizationName: inactiveOrg.name,
        },
        { status: 409 }
      );
    }

    // Verificar duplicata de slug para organizações ativas
    const existingOrg = await prisma.organization.findFirst({
      where: { 
        slug,
        status: "ACTIVE",
      },
    });

    const finalSlug = existingOrg
      ? `${slug}-${Date.now().toString(36)}`
      : slug;

    // Criar ou buscar user, criar org e membership em transação
    const result = await prisma.$transaction(async (tx) => {
      // Usar upsert para criar ou atualizar o usuário
      const user = await (tx as any).user.upsert({
        where: { email },
        update: {
          name,
          supabaseId,
        },
        create: {
          email,
          name,
          supabaseId,
        },
      });

      const org = await (tx as any).organization.create({
        data: {
          name: orgName,
          slug: finalSlug,
          whatsappNumber: whatsapp || null,
        },
      });

      await (tx as any).organizationMember.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: UserRole.OWNER,
        },
      });

      return { user, org };
    });

    // Revalidar cache do dashboard
    revalidatePath("/dashboard");

    return NextResponse.json({
      userId: result.user.id,
      organizationId: result.org.id,
      slug: result.org.slug,
    });
  } catch (error: any) {
    console.error("[Auth Setup] Error:", error);
    
    // Tratar erro de constraint unique do Prisma
    if (error.code === "P2002") {
      const target = error.meta?.target;
      if (target?.includes("name")) {
        return NextResponse.json(
          { 
            error: "ORGANIZATION_EXISTS",
            message: "Já existe uma organização ativa com este nome. Escolha outro nome.",
          },
          { status: 409 }
        );
      }
      if (target?.includes("slug")) {
        return NextResponse.json(
          { 
            error: "SLUG_EXISTS",
            message: "Este nome gera um identificador já utilizado. Tente um nome diferente.",
          },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

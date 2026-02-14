import { prisma, UserRole, type Prisma } from "@agendazap/database";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { supabaseId, email, name, orgName } = await request.json();

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

    // Verificar duplicata de slug
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    const finalSlug = existingOrg
      ? `${slug}-${Date.now().toString(36)}`
      : slug;

    // Criar user, org e membership em transação
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          supabaseId,
        },
      });

      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug: finalSlug,
        },
      });

      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: UserRole.OWNER,
        },
      });

      return { user, org };
    });

    return NextResponse.json({
      userId: result.user.id,
      organizationId: result.org.id,
      slug: result.org.slug,
    });
  } catch (error) {
    console.error("[Auth Setup] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

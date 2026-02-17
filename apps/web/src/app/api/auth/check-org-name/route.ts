import { prisma } from "@agendazap/database";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { orgName } = await request.json();

    if (!orgName) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    // Verificar se existe organização com esse nome (ativa, deletada ou pendente)
    const existingOrg = await prisma.organization.findFirst({
      where: {
        name: orgName,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!existingOrg) {
      return NextResponse.json({ available: true });
    }

    // Se encontrou, retornar informação sobre o status
    if (existingOrg.status === "ACTIVE") {
      return NextResponse.json(
        {
          available: false,
          error: "ORGANIZATION_EXISTS",
          message: "Já existe uma organização ativa com este nome. Escolha outro nome.",
        },
        { status: 409 }
      );
    }

    if (existingOrg.status === "PENDING_REACTIVATION") {
      return NextResponse.json(
        {
          available: false,
          error: "ORGANIZATION_PENDING_REACTIVATION",
          message: "Já existe uma organização com este nome aguardando reativação. Verifique seu email ou solicite um novo link.",
        },
        { status: 409 }
      );
    }

    if (existingOrg.status === "DELETED") {
      return NextResponse.json(
        {
          available: false,
          error: "ORGANIZATION_DELETED",
          message: "Já existe uma organização com este nome que foi desativada. Entre em contato para reativá-la.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error("[Check Org Name] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

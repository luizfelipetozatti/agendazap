import { PrismaClient, UserRole } from "@prisma/client";
import { createSupabaseAdmin } from "./supabase";

const prisma = new PrismaClient();
const supabase = createSupabaseAdmin();

async function main() {
  console.log("🌱 Seeding database...");

  // Criar organização de exemplo (upsert para evitar duplicação)
  const org = await prisma.organization.upsert({
    where: { slug: "clinica-exemplo" },
    update: {},
    create: {
      name: "Clínica Exemplo",
      slug: "clinica-exemplo",
      whatsappNumber: "5511999999999",
      timezone: "America/Sao_Paulo",
    },
  });

  console.log(`✅ Organization: ${org.name} (${org.id})`);

  // Buscar ou criar usuário no Supabase Auth
  let authUserId: string;
  
  // Tentar buscar usuário existente por email
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find(u => u.email === "admin@clinicaexemplo.com");
  
  if (existingUser) {
    console.log(`✅ Auth user already exists: ${existingUser.id}`);
    authUserId = existingUser.id;
  } else {
    // Criar novo usuário
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@clinicaexemplo.com",
      password: "admin123",
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      console.error("❌ Error creating auth user:", authError);
      throw authError;
    }
    
    console.log(`✅ Auth user created: ${authUser.user.id}`);
    authUserId = authUser.user.id;
  }

  // Criar usuário no banco de dados (upsert)
  const user = await prisma.user.upsert({
    where: { email: "admin@clinicaexemplo.com" },
    update: { supabaseId: authUserId },
    create: {
      email: "admin@clinicaexemplo.com",
      name: "Dr. Admin",
      supabaseId: authUserId,
    },
  });

  // Vincular user à org como OWNER (se ainda não existir)
  const existingMembership = await prisma.organizationMember.findFirst({
    where: {
      userId: user.id,
      organizationId: org.id,
    },
  });

  if (!existingMembership) {
    await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: UserRole.OWNER,
      },
    });
    console.log(`✅ User created and linked: ${user.email} (OWNER)`);
  } else {
    console.log(`✅ User already linked: ${user.email} (${existingMembership.role})`);
  }

  // Criar serviços (apenas se não existirem)
  const existingServices = await prisma.service.findMany({
    where: { organizationId: org.id },
  });

  if (existingServices.length === 0) {
    const services = await Promise.all([
      prisma.service.create({
        data: {
          organizationId: org.id,
          name: "Consulta Geral",
          description: "Consulta médica geral de 30 minutos",
          price: 150.0,
          durationMinutes: 30,
        },
      }),
      prisma.service.create({
        data: {
          organizationId: org.id,
          name: "Consulta Especializada",
          description: "Consulta com especialista de 60 minutos",
          price: 280.0,
          durationMinutes: 60,
        },
      }),
      prisma.service.create({
        data: {
          organizationId: org.id,
          name: "Retorno",
          description: "Consulta de retorno de 15 minutos",
          price: 0,
          durationMinutes: 15,
        },
      }),
    ]);
    console.log(`✅ ${services.length} services created`);
  } else {
    console.log(`✅ Services already exist (${existingServices.length} found)`);
  }

  // Criar organização coworking (upsert)
  const coworking = await prisma.organization.upsert({
    where: { slug: "cowork-hub" },
    update: {},
    create: {
      name: "CoWork Hub",
      slug: "cowork-hub",
      whatsappNumber: "5511888888888",
      timezone: "America/Sao_Paulo",
    },
  });

  const existingCoworkServices = await prisma.service.findMany({
    where: { organizationId: coworking.id },
  });

  if (existingCoworkServices.length === 0) {
    await Promise.all([
      prisma.service.create({
        data: {
          organizationId: coworking.id,
          name: "Sala de Reunião - 1h",
          description: "Sala para até 6 pessoas",
          price: 80.0,
          durationMinutes: 60,
        },
      }),
      prisma.service.create({
        data: {
          organizationId: coworking.id,
          name: "Sala de Reunião - 2h",
          description: "Sala para até 6 pessoas",
          price: 140.0,
          durationMinutes: 120,
        },
      }),
      prisma.service.create({
        data: {
          organizationId: coworking.id,
          name: "Day Use",
          description: "Acesso ao coworking por um dia inteiro",
          price: 60.0,
          durationMinutes: 480,
        },
      }),
    ]);
    console.log(`✅ CoWork Hub created with services`);
  } else {
    console.log(`✅ CoWork Hub already exists with ${existingCoworkServices.length} services`);
  }

  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

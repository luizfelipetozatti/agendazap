import { createSupabaseAdmin } from "./supabase";

const supabase = createSupabaseAdmin();

async function createAuthUser() {
  console.log("🔐 Creating auth user...");

  // Criar usuário no Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email: "admin@clinicaexemplo.com",
    password: "admin123",
    email_confirm: true,
  });

  if (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  console.log(`✅ Auth user created!`);
  console.log(`   Email: admin@clinicaexemplo.com`);
  console.log(`   Password: admin123`);
  console.log(`   Supabase ID: ${data.user?.id}`);

  // Atualizar user no banco com supabase_id
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  await prisma.user.update({
    where: { email: "admin@clinicaexemplo.com" },
    data: { supabaseId: data.user?.id },
  });

  console.log(`✅ User updated in database with supabase_id`);

  await prisma.$disconnect();
}

createAuthUser();

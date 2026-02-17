import { prisma } from "@agendazap/database";
import { Calendar } from "lucide-react";
import { notFound } from "next/navigation";

import { BookingPageClient } from "./booking-client";

export const dynamic = 'force-dynamic';

interface BookingPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: BookingPageProps) {
  const org = await prisma.organization.findFirst({
    where: { 
      slug: params.slug,
      status: "ACTIVE",
    },
  });

  if (!org) return { title: "Não encontrado" };

  return {
    title: `Agendar - ${org.name} | AgendaZap`,
    description: `Agende seu horário em ${org.name}`,
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const org = await prisma.organization.findFirst({
    where: { 
      slug: params.slug,
      status: "ACTIVE",
    },
    include: {
      services: {
        where: { active: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!org) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center gap-3 px-4 py-6">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um serviço e agende seu horário
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <BookingPageClient
          organization={{
            id: org.id,
            name: org.name,
            slug: org.slug,
            timezone: org.timezone,
          }}
          services={org.services.map((s: typeof org.services[number]) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price: Number(s.price),
            durationMinutes: s.durationMinutes,
          }))}
        />
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Powered by{" "}
        <a href="/" className="font-medium text-primary hover:underline">
          AgendaZap
        </a>
      </footer>
    </div>
  );
}

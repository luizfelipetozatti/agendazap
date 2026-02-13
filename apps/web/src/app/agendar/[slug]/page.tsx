import { notFound } from "next/navigation";
import { prisma } from "@agendazap/database";
import type { Service } from "@prisma/client";
import { Calendar } from "lucide-react";

import { BookingPageClient } from "./booking-client";

interface BookingPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: BookingPageProps) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
  });

  if (!org) return { title: "Não encontrado" };

  return {
    title: `Agendar - ${org.name} | AgendaZap`,
    description: `Agende seu horário em ${org.name}`,
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">{org.name}</h1>
            <p className="text-xs text-muted-foreground">
              Agendamento online
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <BookingPageClient
          organization={{
            id: org.id,
            name: org.name,
            slug: org.slug,
          }}
          services={org.services.map((s: Service) => ({
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

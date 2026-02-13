import { notFound } from "next/navigation";
import { prisma, Service } from "@agendazap/database";
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

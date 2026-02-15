import { prisma } from "@agendazap/database";
import { format } from "date-fns";

// Force dynamic rendering (no static generation at build time)
export const dynamic = 'force-dynamic';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from "@agendazap/ui";
import { Clock, DollarSign } from "lucide-react";

import { getCurrentUserOrgId } from "@/lib/auth/dashboard";

export default async function ServicesPage() {
  const orgId = await getCurrentUserOrgId();

  const services = await prisma.service.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { bookings: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie os serviços oferecidos
          </p>
        </div>
        {/* TODO: Botão de adicionar serviço */}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const priceFormatted = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(Number(service.price));

          return (
            <Card key={service.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <Badge variant={service.active ? "success" : "secondary"}>
                    {service.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {service.description && (
                  <CardDescription>{service.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {priceFormatted}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {service.durationMinutes} min
                  </span>
                  <span>
                    {service._count.bookings} agendamento
                    {service._count.bookings !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhum serviço cadastrado. Crie seu primeiro serviço.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

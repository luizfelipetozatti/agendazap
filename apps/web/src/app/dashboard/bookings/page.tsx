import { prisma, BookingStatus } from "@agendazap/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Force dynamic rendering (no static generation at build time)
export const dynamic = 'force-dynamic';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@agendazap/ui";

import { BookingStatusActions } from "./booking-actions";

// TODO: Pegar org_id da session
async function getOrgId() {
  const org = await prisma.organization.findFirst();
  return org?.id ?? "";
}

const statusConfig: Record<BookingStatus, { label: string; variant: "warning" | "success" | "destructive" | "secondary" }> = {
  PENDENTE: { label: "Pendente", variant: "warning" as const },
  CONFIRMADO: { label: "Confirmado", variant: "success" as const },
  CANCELADO: { label: "Cancelado", variant: "destructive" as const },
  CONCLUIDO: { label: "Concluído", variant: "secondary" as const },
};

export default async function BookingsPage() {
  const orgId = await getOrgId();

  const bookings = await prisma.booking.findMany({
    where: { organizationId: orgId },
    include: { service: true },
    orderBy: { startTime: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agendamentos</h1>
        <p className="text-muted-foreground">
          Gerencie todos os agendamentos da sua organização
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              Nenhum agendamento encontrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Cliente</th>
                    <th className="pb-3 font-medium">Serviço</th>
                    <th className="pb-3 font-medium">Data/Hora</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">WhatsApp</th>
                    <th className="pb-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bookings.map((booking: typeof bookings[number]) => {
                    const status = statusConfig[booking.status];
                    return (
                      <tr key={booking.id} className="hover:bg-muted/50">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">
                              {booking.clientName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.clientPhone}
                            </p>
                          </div>
                        </td>
                        <td className="py-3">{booking.service.name}</td>
                        <td className="py-3">
                          <div>
                            <p>
                              {format(
                                booking.startTime,
                                "dd/MM/yyyy",
                                { locale: ptBR }
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(booking.startTime, "HH:mm")} -{" "}
                              {format(booking.endTime, "HH:mm")}
                            </p>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={
                              booking.whatsappSent ? "success" : "outline"
                            }
                          >
                            {booking.whatsappSent ? "Enviado" : "Pendente"}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <BookingStatusActions
                            bookingId={booking.id}
                            currentStatus={booking.status}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

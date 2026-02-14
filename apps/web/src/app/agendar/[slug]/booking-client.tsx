"use client";

// ============================================================
// AgendaZap - Página de Booking (Client Component)
// Fluxo: Selecionar Serviço → Escolher Horário → Preencher Dados
// ============================================================

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@agendazap/ui";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Check, Clock, DollarSign } from "lucide-react";
import { useState, useCallback } from "react";

import { getAvailableSlotsAction } from "@/app/actions/booking";
import { BookingCalendar } from "@/components/booking/booking-calendar";
import { BookingForm } from "@/components/booking/booking-form";

interface ServiceData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
}

interface BookingPageClientProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
  };
  services: ServiceData[];
}

type Step = "service" | "datetime" | "form" | "success";

export function BookingPageClient({
  organization,
  services,
}: BookingPageClientProps) {
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<ServiceData | null>(
    null
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Buscar slots quando o dia muda
  const handleDateChange = useCallback(
    async (date: string) => {
      if (!selectedService) return;
      setIsLoadingSlots(true);
      setSelectedSlot(null);

      const result = await getAvailableSlotsAction(
        organization.id,
        selectedService.id,
        date
      );

      if (result.success) {
        setAvailableSlots(result.slots);
      } else {
        setAvailableSlots([]);
      }

      setIsLoadingSlots(false);
    },
    [organization.id, selectedService]
  );

  const handleSelectService = (service: ServiceData) => {
    setSelectedService(service);
    setStep("datetime");
    setSelectedSlot(null);
    setAvailableSlots([]);
  };

  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot);
  };

  const handleConfirmSlot = () => {
    if (selectedSlot) {
      setStep("form");
    }
  };

  const handleBack = () => {
    if (step === "datetime") {
      setStep("service");
      setSelectedService(null);
    } else if (step === "form") {
      setStep("datetime");
    }
  };

  const priceFormatted = selectedService
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(selectedService.price)
    : "";

  // ============================================================
  // Step 1: Selecionar Serviço
  // ============================================================
  if (step === "service") {
    return (
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-6 text-2xl font-bold">Escolha o serviço</h2>
        <div className="grid gap-4">
          {services.map((service) => (
            <Card
              key={service.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => handleSelectService(service)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.description && (
                      <CardDescription className="mt-1">
                        {service.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {service.price > 0
                        ? new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(service.price)
                        : "Grátis"}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {service.durationMinutes} min
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // Step 2: Selecionar Data e Horário
  // ============================================================
  if (step === "datetime") {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Escolha o horário</h2>
            <p className="text-sm text-muted-foreground">
              {selectedService?.name} • {priceFormatted} •{" "}
              {selectedService?.durationMinutes} min
            </p>
          </div>
        </div>

        <BookingCalendar
          availableSlots={availableSlots}
          onSelectSlot={handleSelectSlot}
          onDateChange={handleDateChange}
          selectedSlot={selectedSlot}
          durationMinutes={selectedService?.durationMinutes}
          isLoading={isLoadingSlots}
        />

        {selectedSlot && (
          <div className="mt-6 flex justify-end">
            <Button size="lg" onClick={handleConfirmSlot} className="gap-2">
              Continuar com{" "}
              {format(new Date(selectedSlot), "HH:mm")}
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // Step 3: Formulário de dados
  // ============================================================
  if (step === "form" && selectedService && selectedSlot) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Seus dados</h2>
            <p className="text-sm text-muted-foreground">
              {selectedService.name} •{" "}
              {format(new Date(selectedSlot), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>

        <BookingForm
          organizationId={organization.id}
          serviceId={selectedService.id}
          serviceName={selectedService.name}
          selectedSlot={selectedSlot}
          price={selectedService.price}
          onSuccess={() => setStep("success")}
        />
      </div>
    );
  }

  // ============================================================
  // Step 4: Sucesso
  // ============================================================
  if (step === "success") {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-whatsapp/20">
          <Check className="h-8 w-8 text-whatsapp" />
        </div>
        <h2 className="text-2xl font-bold">Agendamento Realizado!</h2>
        <p className="mt-2 text-muted-foreground">
          Você receberá uma mensagem de confirmação no seu WhatsApp em instantes.
        </p>
        {selectedService && selectedSlot && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="space-y-2 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serviço</span>
                  <span className="font-medium">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data/Hora</span>
                  <span className="font-medium">
                    {format(
                      new Date(selectedSlot),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-medium">{priceFormatted}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Button
          className="mt-6"
          onClick={() => {
            setStep("service");
            setSelectedService(null);
            setSelectedSlot(null);
          }}
        >
          Fazer novo agendamento
        </Button>
      </div>
    );
  }

  return null;
}

"use client";

// ============================================================
// AgendaZap - Formulário de Booking
// ============================================================

import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@agendazap/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageCircle, User, Phone, Mail, FileText } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createBookingAction } from "@/app/actions/booking";
import { createBookingSchema, type CreateBookingInput } from "@/lib/validations";

interface BookingFormProps {
  organizationId: string;
  serviceId: string;
  serviceName: string;
  selectedSlot: string;
  price: number;
  onSuccess?: () => void;
}

export function BookingForm({
  organizationId,
  serviceId,
  serviceName,
  selectedSlot,
  price,
  onSuccess,
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      organizationId,
      serviceId,
      startTime: selectedSlot,
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      notes: "",
    },
  });

  const onSubmit = async (data: CreateBookingInput) => {
    setIsSubmitting(true);

    try {
      const result = await createBookingAction(data);

      if (result.success) {
        toast.success("Agendamento realizado com sucesso!", {
          description:
            "Você receberá uma mensagem de confirmação no WhatsApp.",
        });
        onSuccess?.();
      } else {
        const errorMsg =
          typeof result.error === "string"
            ? result.error
            : "Verifique os campos e tente novamente";
        toast.error("Erro ao agendar", { description: errorMsg });
      }
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-whatsapp" />
          Confirmar Agendamento
        </CardTitle>
        <CardDescription>
          {serviceName} • {formattedPrice}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="clientName" className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Nome completo
            </Label>
            <Input
              id="clientName"
              placeholder="Seu nome"
              {...register("clientName")}
            />
            {errors.clientName && (
              <p className="text-xs text-destructive">
                {errors.clientName.message}
              </p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="clientPhone" className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> WhatsApp
            </Label>
            <Input
              id="clientPhone"
              placeholder="5511999999999"
              {...register("clientPhone")}
            />
            {errors.clientPhone && (
              <p className="text-xs text-destructive">
                {errors.clientPhone.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Formato: código do país + DDD + número (ex: 5511999999999)
            </p>
          </div>

          {/* Email (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="clientEmail" className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> Email (opcional)
            </Label>
            <Input
              id="clientEmail"
              type="email"
              placeholder="seu@email.com"
              {...register("clientEmail")}
            />
            {errors.clientEmail && (
              <p className="text-xs text-destructive">
                {errors.clientEmail.message}
              </p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Observações (opcional)
            </Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Alguma informação adicional..."
              {...register("notes")}
            />
          </div>

          {/* Hidden fields */}
          <input type="hidden" {...register("organizationId")} />
          <input type="hidden" {...register("serviceId")} />
          <input type="hidden" {...register("startTime")} />
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            variant="whatsapp"
            className="w-full gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Agendando...
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" />
                Confirmar e Receber no WhatsApp
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

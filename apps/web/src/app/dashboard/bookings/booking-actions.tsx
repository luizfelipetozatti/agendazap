"use client";

import { Button } from "@agendazap/ui";
import { Check, X, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { updateBookingStatusAction } from "@/app/actions/booking";

interface BookingStatusActionsProps {
  bookingId: string;
  currentStatus: string;
}

export function BookingStatusActions({
  bookingId,
  currentStatus,
}: BookingStatusActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusUpdate = async (
    status: "CONFIRMADO" | "CANCELADO" | "CONCLUIDO"
  ) => {
    setIsLoading(true);
    const result = await updateBookingStatusAction(bookingId, status);

    if (result.success) {
      toast.success(`Status atualizado para ${status.toLowerCase()}`);
    } else {
      toast.error("Erro ao atualizar status");
    }
    setIsLoading(false);
  };

  if (currentStatus === "CANCELADO" || currentStatus === "CONCLUIDO") {
    return (
      <span className="text-xs text-muted-foreground">
        {currentStatus === "CANCELADO" ? "Cancelado" : "Concluído"}
      </span>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {currentStatus === "PENDENTE" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStatusUpdate("CONFIRMADO")}
          disabled={isLoading}
          title="Confirmar"
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
      )}
      {currentStatus === "CONFIRMADO" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStatusUpdate("CONCLUIDO")}
          disabled={isLoading}
          title="Marcar como concluído"
        >
          <CheckCircle className="h-4 w-4 text-blue-600" />
        </Button>
      )}
      {(currentStatus === "PENDENTE" || currentStatus === "CONFIRMADO") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStatusUpdate("CANCELADO")}
          disabled={isLoading}
          title="Cancelar"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      )}
    </div>
  );
}

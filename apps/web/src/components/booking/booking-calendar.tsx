"use client";

// ============================================================
// AgendaZap - Componente de Calendário para Seleção de Horários
// Usa date-fns para manipulação de datas
// ============================================================

import { cn } from "@agendazap/ui";
import { Button } from "@agendazap/ui";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

interface BookingCalendarProps {
  /** Horários disponíveis no formato ISO para o dia selecionado */
  availableSlots: string[];
  /** Callback quando um slot é selecionado */
  onSelectSlot: (slot: string) => void;
  /** Callback quando o dia muda (para buscar novos slots) */
  onDateChange: (date: string) => void;
  /** Slot atualmente selecionado */
  selectedSlot?: string | null;
  /** Duração do serviço em minutos (para exibir) */
  durationMinutes?: number;
  /** Estado de loading */
  isLoading?: boolean;
  /** Datas desabilitadas (ex: dias sem funcionamento) */
  disabledDates?: Date[];
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function BookingCalendar({
  availableSlots,
  onSelectSlot,
  onDateChange,
  selectedSlot,
  durationMinutes = 30,
  isLoading = false,
  disabledDates = [],
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Gerar dias do calendário
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { locale: ptBR });
    const calEnd = endOfWeek(monthEnd, { locale: ptBR });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // Navegar entre meses
  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Selecionar dia
  const handleDayClick = (day: Date) => {
    if (isBefore(startOfDay(day), startOfDay(new Date()))) return;
    if (isDayDisabled(day)) return;

    setSelectedDate(day);
    onDateChange(format(day, "yyyy-MM-dd"));
  };

  // Verificar se dia está desabilitado
  const isDayDisabled = (day: Date) => {
    // Domingos desabilitados por padrão
    if (day.getDay() === 0) return true;
    return disabledDates.some((d) => isSameDay(d, day));
  };

  // Agrupar slots por período
  const groupedSlots = useMemo(() => {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    availableSlots.forEach((slot) => {
      const hour = new Date(slot).getHours();
      if (hour < 12) morning.push(slot);
      else if (hour < 18) afternoon.push(slot);
      else evening.push(slot);
    });

    return { morning, afternoon, evening };
  }, [availableSlots]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Calendário */}
      <div className="w-full lg:w-auto">
        <div className="rounded-lg border bg-card p-4">
          {/* Header do mês */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={goToPrevMonth}
              className="rounded-md p-1 hover:bg-muted"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-semibold capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <button
              onClick={goToNextMonth}
              className="rounded-md p-1 hover:bg-muted"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Dias da semana */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-center text-xs font-medium text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid de dias */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
              const disabled = isPast || isDayDisabled(day);

              return (
                <button
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  disabled={disabled}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-md text-sm transition-colors",
                    !isCurrentMonth && "text-muted-foreground/30",
                    isCurrentMonth &&
                      !disabled &&
                      "hover:bg-primary/10 cursor-pointer",
                    isToday(day) &&
                      !isSelected &&
                      "border border-primary font-bold",
                    isSelected &&
                      "bg-primary text-primary-foreground font-semibold",
                    disabled && "cursor-not-allowed opacity-30"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Horários disponíveis */}
      <div className="flex-1">
        {!selectedDate ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              Selecione uma data no calendário para ver os horários disponíveis
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex h-full items-center justify-center rounded-lg border p-8">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Carregando horários...
              </p>
            </div>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum horário disponível para{" "}
              <strong>
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </strong>
              . Tente outra data.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border p-4">
            <h3 className="mb-1 text-sm font-semibold">
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Duração: {durationMinutes} min •{" "}
              {availableSlots.length} horários disponíveis
            </p>

            <div className="space-y-4">
              {/* Manhã */}
              {groupedSlots.morning.length > 0 && (
                <SlotGroup
                  label="Manhã"
                  slots={groupedSlots.morning}
                  selectedSlot={selectedSlot}
                  onSelect={onSelectSlot}
                />
              )}

              {/* Tarde */}
              {groupedSlots.afternoon.length > 0 && (
                <SlotGroup
                  label="Tarde"
                  slots={groupedSlots.afternoon}
                  selectedSlot={selectedSlot}
                  onSelect={onSelectSlot}
                />
              )}

              {/* Noite */}
              {groupedSlots.evening.length > 0 && (
                <SlotGroup
                  label="Noite"
                  slots={groupedSlots.evening}
                  selectedSlot={selectedSlot}
                  onSelect={onSelectSlot}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Sub-componente: Grupo de Slots por período
// ============================================================

function SlotGroup({
  label,
  slots,
  selectedSlot,
  onSelect,
}: {
  label: string;
  slots: string[];
  selectedSlot?: string | null;
  onSelect: (slot: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => {
          const isActive = selectedSlot === slot;
          return (
            <Button
              key={slot}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onSelect(slot)}
              className={cn(
                "text-sm",
                isActive && "ring-2 ring-primary ring-offset-2"
              )}
            >
              {format(new Date(slot), "HH:mm")}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

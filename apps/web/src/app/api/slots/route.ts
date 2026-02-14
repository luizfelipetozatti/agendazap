import { prisma } from "@agendazap/database";
import { addMinutes } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!orgId || !serviceId || !date) {
    return NextResponse.json(
      { error: "Missing orgId, serviceId, or date" },
      { status: 400 }
    );
  }

  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || service.organizationId !== orgId) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const startHour = 8;
    const endHour = 18;
    const durationMinutes = service.durationMinutes;

    // Gerar slots
    const slots: string[] = [];
    const baseDate = new Date(`${date}T00:00:00`);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += durationMinutes) {
        const slotStart = new Date(baseDate);
        slotStart.setHours(hour, minute, 0, 0);
        const slotEnd = addMinutes(slotStart, durationMinutes);

        const limitEnd = new Date(baseDate);
        limitEnd.setHours(endHour, 0, 0, 0);
        if (slotEnd > limitEnd) continue;

        slots.push(slotStart.toISOString());
      }
    }

    // Buscar bookings existentes
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    const existingBookings = await prisma.booking.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["PENDENTE", "CONFIRMADO"] },
        startTime: { gte: dayStart, lte: dayEnd },
      },
      select: { startTime: true, endTime: true },
    });

    const availableSlots = slots.filter((slotIso) => {
      const slotStart = new Date(slotIso);
      const slotEnd = addMinutes(slotStart, durationMinutes);

      return !existingBookings.some(
        (b: { startTime: Date; endTime: Date }) => slotStart < b.endTime && slotEnd > b.startTime
      );
    });

    return NextResponse.json({
      slots: availableSlots,
      duration: durationMinutes,
      total: availableSlots.length,
    });
  } catch (error) {
    console.error("[API Slots] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

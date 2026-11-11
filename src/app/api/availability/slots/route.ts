/**
 * GET /api/availability/slots?doctorId=&date=YYYY-MM-DD&typeId=&excludeAppointmentId=
 * Returns ISO available starts (`slots`) plus full day grid (`cells`) for SchedulingPanel.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { computeAvailabilitySlots } from "@/lib/availability-slots";
import { parseAvailabilitySlotsQuery } from "@/lib/scheduling/availability-api-query";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = parseAvailabilitySlotsQuery(new URL(req.url).searchParams);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const { slots, timezone, cells } = await computeAvailabilitySlots(prisma, {
      doctorId: parsed.doctorId,
      dateStr: parsed.dateStr,
      typeId: parsed.typeId,
      excludeAppointmentId: parsed.excludeAppointmentId,
    });

    return NextResponse.json({ slots, cells, timezone });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

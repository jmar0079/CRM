import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateOrgSettingsSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await db.organization.findUnique({ where: { id: session.user.orgId } });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = updateOrgSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((issue) => issue.message).join(" ") },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const customBookingUrl = data.customBookingUrl?.trim() || null;

    if (data.bookingMode === "CUSTOM_WEBSITE" && !customBookingUrl) {
      return NextResponse.json(
        { error: "When using a custom website booking mode, a valid URL is required." },
        { status: 400 }
      );
    }

    const updatedOrg = await db.organization.update({
      where: { id: session.user.orgId },
      data: {
        name: data.name,
        logo: data.logo?.trim() || null,
        phone: data.phone,
        email: data.email,
        address: data.address,
        website: data.website,
        timezone: data.timezone,
        bookingMode: data.bookingMode,
        customBookingUrl,
        bookingFormType: data.bookingFormType,
      },
    });

    await db.orgSettings.upsert({
      where: { orgId: session.user.orgId },
      create: {
        orgId: session.user.orgId,
        workingHoursStart: data.workingHoursStart ?? "09:00",
        workingHoursEnd: data.workingHoursEnd ?? "17:00",
        bufferMinutes: data.bufferMinutes ?? 15,
        depositRequired: data.depositRequired ?? false,
        depositPercent: data.depositPercent ?? 25,
        reminderHoursBefore: data.reminderHoursBefore ?? 24,
        autoReplyEnabled: data.autoReplyEnabled ?? true,
        autoReplyMessage: data.autoReplyMessage ?? "",
      },
      update: {
        workingHoursStart: data.workingHoursStart,
        workingHoursEnd: data.workingHoursEnd,
        bufferMinutes: data.bufferMinutes,
        depositRequired: data.depositRequired,
        depositPercent: data.depositPercent,
        reminderHoursBefore: data.reminderHoursBefore,
        autoReplyEnabled: data.autoReplyEnabled,
        autoReplyMessage: data.autoReplyMessage,
      },
    });

    return NextResponse.json({ org: updatedOrg });
  } catch (err) {
    console.error("[PATCH /api/settings/organization]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

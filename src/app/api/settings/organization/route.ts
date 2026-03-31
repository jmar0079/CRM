import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await db.organization.findUnique({ where: { id: session.user.orgId } });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    // Allow only safe fields to be updated
    const { name, phone, email, address, website, timezone, bookingMode, customBookingUrl } = body;

    // Validate bookingMode value
    if (bookingMode !== undefined && bookingMode !== "BUILT_IN" && bookingMode !== "CUSTOM_WEBSITE") {
      return NextResponse.json({ error: "Invalid bookingMode value." }, { status: 400 });
    }

    // Validate bookingFormType value
    const { bookingFormType } = body;
    if (bookingFormType !== undefined && bookingFormType !== "SERVICE" && bookingFormType !== "PRODUCT") {
      return NextResponse.json({ error: "Invalid bookingFormType value." }, { status: 400 });
    }

    // Validate customBookingUrl when mode is CUSTOM_WEBSITE
    if (bookingMode === "CUSTOM_WEBSITE" && customBookingUrl) {
      try {
        const parsed = new URL(customBookingUrl);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          return NextResponse.json({ error: "Custom booking URL must be a valid http/https URL." }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Custom booking URL is not a valid URL." }, { status: 400 });
      }
    }

    const updated = await db.organization.update({
      where: { id: session.user.orgId },
      data: { name, phone, email, address, website, timezone, bookingMode, customBookingUrl, bookingFormType },
    });
    return NextResponse.json({ org: updated });
  } catch (err) {
    console.error("[PATCH /api/settings/organization]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

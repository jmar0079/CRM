import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { convertLeadToCustomer } from "@/lib/crm";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await db.lead.findFirst({
    where: { id: id, orgId: session.user.orgId },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (lead.convertedToId) {
    return NextResponse.json({ error: "Lead already converted", customerId: lead.convertedToId }, { status: 409 });
  }

  try {
    const customer = await convertLeadToCustomer(id, session.user.orgId);
    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leads/:id/convert]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

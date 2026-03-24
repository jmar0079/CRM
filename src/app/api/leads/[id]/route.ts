import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { updateLeadSchema } from "@/lib/validations";
import { logActivity } from "@/lib/crm";

async function getLeadOrError(id: string, orgId: string) {
  const lead = await db.lead.findFirst({ where: { id, orgId } });
  if (!lead) return null;
  return lead;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await db.lead.findFirst({
    where: { id: id, orgId: session.user.orgId },
    include: {
      stage: true,
      tags: { include: { tag: true } },
      tasks: { orderBy: { dueAt: "asc" } },
      quotes: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await getLeadOrError(id, session.user.orgId);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = updateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updated = await db.lead.update({
      where: { id: id },
      data: parsed.data as never,
    });

    if (parsed.data.status && parsed.data.status !== lead.status) {
      await logActivity({ orgId: session.user.orgId, userId: session.user.id, type: "LEAD_STAGE_CHANGED",
        description: `Status changed from ${lead.status} to ${parsed.data.status}`,
        leadId: id });
    }

    return NextResponse.json({ lead: updated });
  } catch (err) {
    console.error("[PATCH /api/leads/:id]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await getLeadOrError(id, session.user.orgId);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.lead.delete({ where: { id: id } });
  return NextResponse.json({ success: true });
}

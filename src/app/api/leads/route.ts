import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { createLeadSchema } from "@/lib/validations";
import { logActivity, detectDuplicate, createDraftQuote } from "@/lib/crm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.orgId;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("q");
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = 25;

  const where = {
    orgId,
    ...(status ? { status: status as never } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      include: {
        stage: true,
        tags: { include: { tag: true } },
        _count: { select: { tasks: true, quotes: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.lead.count({ where }),
  ]);

  return NextResponse.json({ leads, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.orgId;

  try {
    const body = await req.json();
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Duplicate detection (skipped when explicitly creating from an inquiry)
    const skipDuplicateCheck = (body as Record<string, unknown>).skipDuplicateCheck === true;
    if (!skipDuplicateCheck) {
      const dupId = await detectDuplicate(orgId, parsed.data.phone, parsed.data.email);
      if (dupId) {
        return NextResponse.json({ error: "A lead or customer with this contact already exists.", duplicateId: dupId }, { status: 409 });
      }
    }

    const { tags, ...data } = parsed.data as typeof parsed.data & { tags?: string[] };

    const lead = await db.lead.create({
      data: {
        ...data,
        orgId,
        assignedToId: session.user.id,
        ...(tags?.length && {
          tags: { create: tags.map((tagId: string) => ({ tag: { connect: { id: tagId } } })) },
        }),
      } as never,
    });

    await logActivity({ orgId, userId: session.user.id, type: "LEAD_CREATED", description: `Lead ${lead.firstName} ${lead.lastName} created`, leadId: lead.id });
    await createDraftQuote(orgId, lead.id);

    // Create task to contact lead by end of the week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);

    await db.task.create({
      data: {
        orgId,
        title: `Contact lead: ${lead.firstName} ${lead.lastName}`,
        description: `Follow up with the new lead.`,
        dueAt: endOfWeek,
        assignedToId: session.user.id,
        leadId: lead.id,
        isAutomatic: true,
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { createJobSchema } from "@/lib/validations";
import { logActivity, createAutoTasks } from "@/lib/crm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.orgId;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = 25;

  const where = {
    orgId,
    ...(status ? { status: status as never } : {}),
    ...(customerId ? { customerId } : {}),
    ...(from || to
      ? {
          scheduledAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [jobs, total] = await Promise.all([
    db.job.findMany({
      where,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { scheduledAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.job.count({ where }),
  ]);

  return NextResponse.json({ jobs, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const job = await db.job.create({
      data: { ...parsed.data, orgId: session.user.orgId },
    });

    await logActivity({ orgId: session.user.orgId, userId: session.user.id, type: "JOB_CREATED",
      description: `Job "${job.title}" created`, jobId: job.id, customerId: job.customerId ?? undefined });

    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/jobs]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

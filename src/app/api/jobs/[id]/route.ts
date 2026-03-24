import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { updateJobSchema } from "@/lib/validations";
import { logActivity, createAutoTasks } from "@/lib/crm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const job = await db.job.findFirst({
    where: { id: id, orgId: session.user.orgId },
    include: {
      customer: true,
      tasks: { orderBy: { dueAt: "asc" } },
      invoices: { include: { items: true } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const job = await db.job.findFirst({
    where: { id: id, orgId: session.user.orgId },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = updateJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = { ...parsed.data };

    // Auto-set completedAt when marking complete
    if (data.status === "COMPLETED" && job.status !== "COMPLETED") {
      (data as Record<string, unknown>).completedAt = new Date();
    }

    const updated = await db.job.update({ where: { id: id }, data });

    if (data.status && data.status !== job.status) {
      await logActivity({ orgId: session.user.orgId, userId: session.user.id, type: "JOB_STATUS_CHANGED",
        description: `Job status changed to ${data.status}`, jobId: id });

      if (data.status === "COMPLETED") {
        await createAutoTasks({
          orgId: session.user.orgId,
          trigger: "JOB_COMPLETED",
          jobId: id,
          customerId: job.customerId ?? undefined,
        });
      }
    }

    return NextResponse.json({ job: updated });
  } catch (err) {
    console.error("[PATCH /api/jobs/:id]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const job = await db.job.findFirst({
    where: { id: id, orgId: session.user.orgId },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.job.delete({ where: { id: id } });
  return NextResponse.json({ success: true });
}

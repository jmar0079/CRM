import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { createTaskSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.orgId;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const tasks = await db.task.findMany({
    where: {
      orgId,
      ...(status ? { status: status as never } : {}),
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      lead: { select: { id: true, firstName: true, lastName: true } },
      customer: { select: { id: true, firstName: true, lastName: true } },
      job: { select: { id: true, title: true } },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const task = await db.task.create({
      data: {
        ...parsed.data,
        orgId: session.user.orgId,
        assignedToId: parsed.data.assignedToId ?? session.user.id,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/tasks]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

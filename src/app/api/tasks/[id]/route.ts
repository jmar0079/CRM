import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await db.task.findFirst({
    where: { id: id, orgId: session.user.orgId },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const updated = await db.task.update({ where: { id: id }, data: body });
    return NextResponse.json({ task: updated });
  } catch (err) {
    console.error("[PATCH /api/tasks/:id]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await db.task.findFirst({ where: { id: id, orgId: session.user.orgId } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.task.delete({ where: { id: id } });
  return NextResponse.json({ success: true });
}

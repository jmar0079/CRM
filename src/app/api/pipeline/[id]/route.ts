import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stage = await db.pipelineStage.findFirst({
    where: { id: id, orgId: session.user.orgId },
  });
  if (!stage) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const updated = await db.pipelineStage.update({ where: { id: id }, data: body });
    return NextResponse.json({ stage: updated });
  } catch (err) {
    console.error("[PATCH /api/pipeline/:id]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stage = await db.pipelineStage.findFirst({
    where: { id: id, orgId: session.user.orgId },
  });
  if (!stage) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const leadsInStage = await db.lead.count({ where: { stageId: id } });
  if (leadsInStage > 0) {
    return NextResponse.json(
      { error: `Cannot delete stage with ${leadsInStage} leads. Move them first.` },
      { status: 409 }
    );
  }

  await db.pipelineStage.delete({ where: { id: id } });
  return NextResponse.json({ success: true });
}

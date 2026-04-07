import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stages = await db.pipelineStage.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { position: "asc" },
    include: {
      leads: {
        where: { status: { not: "LOST" } },
        include: {
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ stages });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, color } = body as { name: string; color?: string };
    if (!name?.trim()) {
      return NextResponse.json({ error: "Stage name is required." }, { status: 400 });
    }

    const maxPosition = await db.pipelineStage.aggregate({
      where: { orgId: session.user.orgId },
      _max: { position: true },
    });

    const stage = await db.pipelineStage.create({
      data: {
        name: name.trim(),
        color: color ?? "#6366f1",
        orgId: session.user.orgId,
        position: (maxPosition._max.position ?? 0) + 1,
      },
    });

    return NextResponse.json({ stage }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/pipeline]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await db.service.findFirst({
      where: { id, orgId: session.user.orgId },
    });
    if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const body = await req.json();
    const { name, description, price, durationMinutes, category } = body as {
      name?: string;
      description?: string;
      price?: number | null;
      durationMinutes?: number | null;
      category?: string;
    };

    const service = await db.service.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(price !== undefined && { price: price != null ? Number(price) : null }),
        ...(durationMinutes !== undefined && {
          durationMinutes: durationMinutes != null ? Number(durationMinutes) : null,
        }),
        ...(category !== undefined && { category: category?.trim() || null }),
      },
    });

    return NextResponse.json({ service });
  } catch (err) {
    console.error("[PATCH /api/services/:id]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await db.service.findFirst({
      where: { id, orgId: session.user.orgId },
    });
    if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

    await db.service.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/services/:id]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

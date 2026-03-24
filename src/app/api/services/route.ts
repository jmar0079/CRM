import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const services = await db.service.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ services });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, description, price, durationMinutes, category } = body as {
      name: string;
      description?: string;
      price?: number;
      durationMinutes?: number;
      category?: string;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Service name is required." }, { status: 400 });
    }

    const service = await db.service.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: price != null ? Number(price) : null,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        category: category?.trim() || null,
        orgId: session.user.orgId,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/services]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

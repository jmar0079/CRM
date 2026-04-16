import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/public/services?orgSlug=xxx
// Public — no auth required. Returns active services for the org.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgSlug = searchParams.get("orgSlug");

  if (!orgSlug) {
    return NextResponse.json({ error: "Missing orgSlug" }, { status: 400 });
  }

  const org = await db.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const services = await db.service.findMany({
    where: { orgId: org.id, isActive: true },
    select: { id: true, name: true, description: true, price: true, category: true, hasColorOption: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ services });
}

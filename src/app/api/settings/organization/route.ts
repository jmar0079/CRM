import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await db.organization.findUnique({ where: { id: session.user.orgId } });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    // Allow only safe fields to be updated
    const { name, phone, email, address, website, timezone } = body;
    const updated = await db.organization.update({
      where: { id: session.user.orgId },
      data: { name, phone, email, address, website, timezone },
    });
    return NextResponse.json({ org: updated });
  } catch (err) {
    console.error("[PATCH /api/settings/organization]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

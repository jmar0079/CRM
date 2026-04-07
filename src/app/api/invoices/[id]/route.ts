import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoice = await db.invoice.findFirst({
    where: { id: id, orgId: session.user.orgId },
    include: { items: true, customer: true, payments: true },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ invoice });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoice = await db.invoice.findFirst({
    where: { id: id, orgId: session.user.orgId },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const updated = await db.invoice.update({ where: { id: id }, data: body });
    return NextResponse.json({ invoice: updated });
  } catch (err) {
    console.error("[PATCH /api/invoices/:id]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoice = await db.invoice.findFirst({ where: { id: id, orgId: session.user.orgId } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.invoice.delete({ where: { id: id } });
  return NextResponse.json({ success: true });
}

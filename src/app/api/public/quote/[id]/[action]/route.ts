import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; action: string }> }) {
  const { id, action } = await params;
  if (action !== "approve" && action !== "decline") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const quote = await db.quote.findUnique({ where: { id } });
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (quote.status === "APPROVED" || quote.status === "DECLINED") {
    return NextResponse.json({ error: "Quote already actioned" }, { status: 409 });
  }

  const updated = await db.quote.update({
    where: { id },
    data: {
      status: action === "approve" ? "APPROVED" : "DECLINED",
      approvedAt: action === "approve" ? new Date() : null,
    },
  });

  return NextResponse.json({ quote: updated });
}

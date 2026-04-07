import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thread = await db.messageThread.findFirst({
    where: { id: id, orgId: session.user.orgId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      },
      customer: true,
      lead: true,
    },
  });

  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Mark unread messages as read
  await db.message.updateMany({
    where: { threadId: id, direction: "INBOUND", status: { not: "READ" } },
    data: { status: "READ" },
  });

  return NextResponse.json({ thread });
}

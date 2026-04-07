import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET: list recent activities (notifications)
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.orgId;

  const activities = await db.activity.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const lastViewed = session.user.notificationsLastViewedAt ? new Date(session.user.notificationsLastViewedAt) : null;

  const payload = activities.map((a) => ({
    id: a.id,
    type: a.type,
    description: a.description,
    metadata: a.metadata ? JSON.parse(a.metadata) : null,
    createdAt: a.createdAt,
    isNew: lastViewed ? a.createdAt > lastViewed : true,
  }));

  return NextResponse.json({ notifications: payload });
}

// PATCH: mark notifications as viewed (sets user's notificationsLastViewedAt to now)
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await db.user.update({ where: { id: session.user.id }, data: { notificationsLastViewedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/notifications]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

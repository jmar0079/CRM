import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submitReviewSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = submitReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { token, rating, comment } = parsed.data;

    // Try to find existing review record by reviewToken
    const existing = await db.review.findFirst({ where: { reviewToken: token } });
    if (existing) {
      if (existing.rating) {
        return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
      }
      await db.review.update({
        where: { id: existing.id },
        data: { rating, comment },
      });
    } else {
      // Fallback: match by customer portal token
      const customer = await db.customer.findFirst({ where: { portalToken: token } });
      if (!customer) {
        return NextResponse.json({ error: "Invalid token" }, { status: 404 });
      }
      await db.review.create({
        data: {
          orgId: customer.orgId,
          customerId: customer.id,
          rating,
          comment,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/public/review]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

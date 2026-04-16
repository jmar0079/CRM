import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/public/categories
// Returns a sorted, deduplicated list of all categories across all organizations
export async function GET() {
  try {
    const orgs = await db.organization.findMany({
      select: { categories: true },
    });

    const categorySet = new Set<string>();
    for (const org of orgs) {
      try {
        const cats: unknown = JSON.parse(org.categories ?? "[]");
        if (Array.isArray(cats)) {
          for (const c of cats) {
            if (typeof c === "string" && c.trim()) {
              categorySet.add(c.trim());
            }
          }
        }
      } catch {
        // skip malformed JSON
      }
    }

    const categories = Array.from(categorySet).sort((a, b) =>
      a.localeCompare(b)
    );

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("[GET /api/public/categories]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

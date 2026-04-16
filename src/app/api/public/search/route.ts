import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/public/search?service=roof+repair&category=Roofing&location=Austin
// Returns matched orgs with their slug so customers can be routed to the booking page
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const service = searchParams.get("service")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";

  if (!service && !category) {
    return NextResponse.json({ error: "Provide at least a service or category" }, { status: 400 });
  }

  // Build OR conditions for service matching
  const serviceOR = [] as { name?: { contains: string; mode: "insensitive" }; description?: { contains: string; mode: "insensitive" }; category?: { equals: string; mode: "insensitive" } }[];
  if (service) {
    serviceOR.push(
      { name: { contains: service, mode: "insensitive" } },
      { description: { contains: service, mode: "insensitive" } }
    );
  }
  if (category) {
    serviceOR.push({ category: { equals: category, mode: "insensitive" } });
  }

  // Match orgs by business name OR by their services OR by their org-level categories
  const whereCondition = service
    ? {
        OR: [
          { name: { contains: service, mode: "insensitive" as const } },
          ...(serviceOR.length > 0
            ? [{ services: { some: { isActive: true, OR: serviceOR } } }]
            : []),
          ...(category ? [{ categories: { contains: `"${category}"` } }] : []),
        ],
      }
    : {
        OR: [
          { services: { some: { isActive: true as const, OR: serviceOR } } },
          ...(category ? [{ categories: { contains: `"${category}"` } }] : []),
        ],
      };

  const orgs = await db.organization.findMany({
    where: whereCondition,
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      email: true,
      website: true,
      address: true,
      categories: true,
      services: {
        where: { isActive: true },
        select: { id: true, name: true, category: true, price: true },
      },
    },
  });

  // Score results
  const scored = orgs
    .map((org) => {
      let score = 0;
      const matchingServices: typeof org.services = [];

      // Boost score if the org name itself matches the search, and include all its services
      const orgNameMatch = service && org.name.toLowerCase().includes(service.toLowerCase());
      if (orgNameMatch) {
        score += 20;
        matchingServices.push(...org.services);
      }

      // Boost score if the org's business categories match the searched category
      if (category) {
        try {
          const orgCategories: string[] = JSON.parse(org.categories ?? "[]");
          if (orgCategories.some((c) => c.toLowerCase() === category.toLowerCase())) {
            score += 15;
            matchingServices.push(...org.services.filter((s) => !matchingServices.find((m) => m.id === s.id)));
          }
        } catch {
          // ignore malformed JSON
        }
      }

      org.services.forEach((svc) => {
        const nameMatch = service && svc.name.toLowerCase().includes(service.toLowerCase());
        const catMatch = category && svc.category?.toLowerCase() === category.toLowerCase();
        if (nameMatch) {
          score += 10;
          if (!matchingServices.find((m) => m.id === svc.id)) matchingServices.push(svc);
        } else if (catMatch) {
          score += 5;
          if (!matchingServices.find((m) => m.id === svc.id)) matchingServices.push(svc);
        }
      });

      return { ...org, score, matchingServices };
    })
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ id: _id, score: _score, services: _all, categories: _cats, ...rest }) => rest);

  return NextResponse.json({ results: scored });
}

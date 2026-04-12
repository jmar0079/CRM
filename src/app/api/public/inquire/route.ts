import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// Validation schema
const inquirySchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  serviceName: z.string().min(1, "Service name is required"),
  category: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL")
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = inquirySchema.parse(body);

    // Create the inquiry
    const inquiry = await db.serviceInquiry.create({
      data: validatedData
    });

    // Find matching organizations
    const matchingOrgs = await findMatchingOrganizations(validatedData);

    // Create matches
    if (matchingOrgs.length > 0) {
      await db.serviceInquiryMatch.createMany({
        data: matchingOrgs.map(org => ({
          inquiryId: inquiry.id,
          orgId: org.id,
          matchScore: org.score
        }))
      });

      // Update inquiry status to matched
      await db.serviceInquiry.update({
        where: { id: inquiry.id },
        data: { status: "MATCHED" }
      });

      // TODO: Send notifications to matched organizations
      // This could be done via email, SMS, or in-app notifications
    }

    return NextResponse.json({
      success: true,
      message: "Inquiry submitted successfully",
      inquiryId: inquiry.id,
      matchesFound: matchingOrgs.length
    });

  } catch (error) {
    console.error("Inquiry submission error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit inquiry" },
      { status: 500 }
    );
  }
}

async function findMatchingOrganizations(inquiryData: z.infer<typeof inquirySchema>) {
  const { serviceName, category, location } = inquiryData;

  // Build search conditions
  const whereConditions: any = {
    services: {
      some: {
        isActive: true,
        OR: [
          // Match by service name (fuzzy)
          { name: { contains: serviceName, mode: "insensitive" } },
          // Match by description
          { description: { contains: serviceName, mode: "insensitive" } }
        ]
      }
    }
  };

  // Add category filter if provided
  if (category) {
    whereConditions.services.some.OR.push(
      { category: { equals: category, mode: "insensitive" } }
    );
  }

  // Find organizations with matching services
  const organizations = await db.organization.findMany({
    where: whereConditions,
    include: {
      services: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          category: true,
          description: true
        }
      }
    }
  });

  // Calculate match scores
  const scoredOrgs = organizations.map(org => {
    let score = 0;
    let maxScore = 0;

    org.services.forEach(service => {
      maxScore += 1;

      // Exact service name match
      if (service.name.toLowerCase().includes(serviceName.toLowerCase())) {
        score += 0.8;
      }
      // Service description match
      else if (service.description?.toLowerCase().includes(serviceName.toLowerCase())) {
        score += 0.6;
      }
      // Category match
      else if (category && service.category?.toLowerCase() === category.toLowerCase()) {
        score += 0.4;
      }
    });

    return {
      id: org.id,
      name: org.name,
      score: maxScore > 0 ? score / maxScore : 0
    };
  });

  // Filter organizations with score > 0 and sort by score
  return scoredOrgs
    .filter(org => org.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Limit to top 10 matches
}
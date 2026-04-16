import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.orgId;

    const matches = await db.serviceInquiryMatch.findMany({
      where: { orgId },
      include: {
        inquiry: true
      },
      orderBy: { createdAt: "desc" }
    });

    const inquiries = matches.map(match => ({
      id: match.inquiry.id,
      firstName: match.inquiry.firstName,
      lastName: match.inquiry.lastName,
      email: match.inquiry.email,
      phone: match.inquiry.phone,
      serviceName: match.inquiry.serviceName,
      category: match.inquiry.category,
      description: match.inquiry.description,
      location: match.inquiry.location,
      urgency: match.inquiry.urgency,
      status: match.inquiry.status,
      createdAt: match.inquiry.createdAt,
      matchScore: match.matchScore,
      contactedAt: match.contactedAt,
      respondedAt: match.respondedAt,
      leadId: match.leadId
    }));

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}
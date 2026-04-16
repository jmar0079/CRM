import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  action: z.enum(["contact", "create_lead", "respond"]),
  leadId: z.string().optional()
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orgId = session.user.orgId;
    const body = await req.json();
    const { action, leadId } = updateSchema.parse(body);

    // Find the match
    const match = await db.serviceInquiryMatch.findFirst({
      where: {
        inquiryId: id,
        orgId
      },
      include: { inquiry: true }
    });

    if (!match) {
      return NextResponse.json({ error: "Inquiry match not found" }, { status: 404 });
    }

    const updateData: any = {};

    switch (action) {
      case "contact":
        updateData.contactedAt = new Date();
        break;
      case "respond":
        updateData.respondedAt = new Date();
        break;
      case "create_lead":
        if (!leadId) {
          return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
        }
        updateData.leadId = leadId;
        updateData.respondedAt = new Date();
        break;
    }

    // Update the match
    const updatedMatch = await db.serviceInquiryMatch.update({
      where: { id: match.id },
      data: updateData,
      include: { inquiry: true }
    });

    // If this was the last organization to respond, update inquiry status
    if (action === "respond" || action === "create_lead") {
      const remainingMatches = await db.serviceInquiryMatch.count({
        where: {
          inquiryId: id,
          respondedAt: null
        }
      });

      if (remainingMatches === 0) {
        await db.serviceInquiry.update({
          where: { id },
          data: { status: "CONTACTED" }
        });
      }
    }

    return NextResponse.json({
      success: true,
      match: {
        id: updatedMatch.inquiry.id,
        contactedAt: updatedMatch.contactedAt,
        respondedAt: updatedMatch.respondedAt,
        leadId: updatedMatch.leadId
      }
    });
  } catch (error) {
    console.error("Error updating inquiry:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
  }
}
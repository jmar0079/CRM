import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const sendPublicMessageSchema = z.object({
  customerId: z.string(),
  orgId: z.string(),
  body: z.string().min(1, "Message is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = sendPublicMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { customerId, orgId, body: messageBody } = parsed.data;

    // Verify customer exists and belongs to org
    const customer = await db.customer.findFirst({
      where: { id: customerId, orgId },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Find or create thread for this customer
    let thread = await db.messageThread.findFirst({
      where: { orgId, customerId, leadId: null },
    });

    if (!thread) {
      thread = await db.messageThread.create({
        data: {
          orgId,
          customerId,
          channel: "EMAIL", // Using EMAIL for web messages
        },
      });
    }

    // Create the message
    const message = await db.message.create({
      data: {
        threadId: thread.id,
        direction: "INBOUND",
        channel: "EMAIL",
        body: messageBody,
        status: "DELIVERED", // Since it's direct to DB
      },
    });

    // Update thread timestamp
    await db.messageThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date(), lastMessageAt: new Date() },
    });

    return NextResponse.json({ message: "Message sent successfully" }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/public/messages]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
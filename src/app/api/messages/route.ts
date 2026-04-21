import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendMessageSchema } from "@/lib/validations";
import { sendSMS } from "@/lib/twilio";
import { sendEmail } from "@/lib/email";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.orgId;

  const threads = await db.messageThread.findMany({
    where: { orgId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      customer: { select: { id: true, firstName: true, lastName: true } },
      lead: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ threads });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { threadId, leadId, customerId, channel, body: messageBody, subject } = parsed.data;

    // Find or create thread
    let thread = threadId
      ? await db.messageThread.findFirst({ where: { id: threadId, orgId: session.user.orgId } })
      : null;

    if (!thread) {
      thread = await db.messageThread.create({
        data: {
          orgId: session.user.orgId,
          channel: channel as never,
          leadId,
          customerId,
        },
      });
    }

    const message = await db.message.create({
      data: {
        threadId: thread.id,
        direction: "OUTBOUND",
        channel: channel as never,
        body: messageBody,
        status: "SENT",
        senderId: session.user.id,
      },
    });

    // Get recipient phone/email
    const contact = customerId
      ? await db.customer.findUnique({ where: { id: customerId } })
      : leadId
      ? await db.lead.findUnique({ where: { id: leadId } })
      : null;

    // Dispatch (errors non-blocking to preserve message record)
    if (channel === "SMS") {
      if (!process.env.TWILIO_ACCOUNT_SID) {
        await db.message.update({ where: { id: message.id }, data: { status: "FAILED" } });
        return NextResponse.json({ error: "SMS is not configured." }, { status: 400 });
      }
    }
    if (channel === "SMS" && contact?.phone) {
      await sendSMS(contact.phone, messageBody)
        .then(() => db.message.update({ where: { id: message.id }, data: { status: "SENT" } }))
        .catch((err: unknown) => {
          console.error("SMS send failed:", err);
          db.message.update({ where: { id: message.id }, data: { status: "FAILED" } }).catch(() => {});
        });
    } else if (channel === "EMAIL" && contact?.email) {
      await sendEmail({ to: contact.email, subject: subject ?? "Message from your service provider", html: `<p>${messageBody}</p>` })
        .then(() => db.message.update({ where: { id: message.id }, data: { status: "SENT" } }))
        .catch((err: unknown) => {
          console.error("Email send failed:", err);
          db.message.update({ where: { id: message.id }, data: { status: "FAILED" } }).catch(() => {});
        });
    }

    await db.messageThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });

    return NextResponse.json({ message, threadId: thread.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/messages]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

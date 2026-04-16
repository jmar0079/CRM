import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateWebhookSignature } from "@/lib/twilio";

export async function POST(req: Request) {
  const body = await req.text();
  const url = req.url;
  const sig = req.headers.get("x-twilio-signature") ?? "";

  const params = new URLSearchParams(body);

  try {
    validateWebhookSignature(body, sig, url);
  } catch {
    return NextResponse.json({ error: "Invalid Twilio signature" }, { status: 403 });
  }

  const toNumber = params.get("To") ?? "";
  const fromNumber = params.get("From") ?? "";
  const messageBody = params.get("Body") ?? "";
  const messageSid = params.get("MessageSid") ?? "";

  // Find org by Twilio phone number
  const org = await db.organization.findFirst({
    where: { twilioPhoneNumber: toNumber },
  });
  if (!org) {
    return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
  }

  // Find or create contact
  const customer = await db.customer.findFirst({
    where: { orgId: org.id, phone: fromNumber },
  });
  const lead = !customer
    ? await db.lead.findFirst({ where: { orgId: org.id, phone: fromNumber } })
    : null;

  // Find or create thread
  let thread = await db.messageThread.findFirst({
    where: {
      orgId: org.id,
      channel: "SMS",
      OR: [
        customer ? { customerId: customer.id } : {},
        lead ? { leadId: lead.id } : {},
      ],
    },
  });

  if (!thread) {
    thread = await db.messageThread.create({
      data: {
        orgId: org.id,
        channel: "SMS",
        customerId: customer?.id,
        leadId: lead?.id,
      },
    });
  }

  await db.message.create({
    data: {
      threadId: thread.id,
      direction: "INBOUND",
      channel: "SMS",
      body: messageBody,
      externalId: messageSid,
      status: "PENDING",
    },
  });

  await db.messageThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });

  return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
}

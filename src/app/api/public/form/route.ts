import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicLeadFormSchema } from "@/lib/validations";
import { logActivity, detectDuplicate, createAutoTasks, createDraftQuote } from "@/lib/crm";
import { sendEmail } from "@/lib/email";

// POST /api/public/form?orgSlug=xxx
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgSlug = searchParams.get("orgSlug");

  if (!orgSlug) {
    return NextResponse.json({ error: "Missing orgSlug" }, { status: 400 });
  }

  const org = await db.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = publicLeadFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Duplicate check
    const dupId = await detectDuplicate(org.id, parsed.data.phone, parsed.data.email);
    if (dupId) {
      return NextResponse.json({ success: true, duplicate: true }, { status: 200 });
    }

    const { orgSlug: _slug, preferredDate: _date, ...leadData } = parsed.data;
    const lead = await db.lead.create({
      data: {
        ...leadData,
        orgId: org.id,
        source: "WEBSITE",
        status: "NEW",
      },
    });

    await db.formSubmission.create({
      data: {
        orgId: org.id,
        leadId: lead.id,
        data: JSON.stringify(body),
      },
    });

    await logActivity({ orgId: org.id, type: "LEAD_CREATED", description: `Lead submitted via public form`, leadId: lead.id });
    await createAutoTasks({ orgId: org.id, trigger: "LEAD_CREATED", leadId: lead.id });
    await createDraftQuote(org.id, lead.id, leadData.serviceInterest);

    // Send confirmation to the customer
    const customerName = `${lead.firstName} ${lead.lastName}`;
    if (lead.email) {
      sendEmail({
        to: lead.email,
        subject: `We received your request — ${org.name}`,
        html: `<p>Hi ${lead.firstName},</p><p>Thanks for reaching out to <strong>${org.name}</strong>! We've received your service request and will be in touch shortly to go over the details and provide a quote.</p><p>— The ${org.name} Team</p>`,
      }).catch(() => {}); // non-blocking
    }

    void customerName;

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/public/form]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

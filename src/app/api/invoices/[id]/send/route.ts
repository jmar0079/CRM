import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCustomerPortalToken } from "@/lib/crm";
import { NextResponse } from "next/server";
import { sendEmail, buildInvoiceEmailHtml } from "@/lib/email";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const invoice = await db.invoice.findFirst({
      where: { id, orgId: session.user.orgId },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, portalToken: true } },
        organization: { select: { name: true } },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!invoice.customer.email) {
      return NextResponse.json({ error: "Customer has no email address" }, { status: 400 });
    }
    let portalToken = invoice.customer.portalToken;
    if (!portalToken) {
      portalToken = await generateCustomerPortalToken(invoice.customer.id);
    }

    const paymentUrl = `${process.env.NEXTAUTH_URL}/portal?token=${portalToken}`;
    const customerName = `${invoice.customer.firstName} ${invoice.customer.lastName}`;

    const html = buildInvoiceEmailHtml({
      orgName: invoice.organization.name,
      customerName,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      amountDue: invoice.amountDue,
      paymentUrl,
      dueDate: invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : undefined,
    });

    await sendEmail({
      to: invoice.customer.email,
      subject: `Invoice ${invoice.invoiceNumber} – Payment Request from ${invoice.organization.name}`,
      html,
    });

    await db.invoice.update({
      where: { id },
      data: { sentAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/invoices/:id/send]", err);
    return NextResponse.json({ error: "Failed to send invoice email" }, { status: 500 });
  }
}

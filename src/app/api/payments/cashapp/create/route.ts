import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createCashAppPaymentLink } from "@/lib/cashapp";

export async function POST(req: Request) {
  try {
    const { invoiceId } = await req.json();

    if (!invoiceId || typeof invoiceId !== "string") {
      return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID" || invoice.amountDue <= 0) {
      return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
    }

    const description = `Invoice ${invoice.invoiceNumber}`;
    const { paymentLinkId, checkoutUrl } = await createCashAppPaymentLink(
      invoice.id,
      invoice.amountDue,
      description
    );

    // Persist the pending payment record
    await db.payment.create({
      data: {
        orgId: invoice.orgId,
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        amount: invoice.amountDue,
        method: "CASH_APP",
        status: "PENDING",
        cashAppPaymentId: paymentLinkId,
      } as never,
    });

    return NextResponse.json({ paymentLinkId, checkoutUrl });
  } catch (err) {
    console.error("[POST /api/payments/cashapp/create]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

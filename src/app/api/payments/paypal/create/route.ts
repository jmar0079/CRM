import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createPayPalOrder } from "@/lib/paypal";

export async function POST(req: Request) {
  try {
    const { invoiceId } = await req.json();

    if (!invoiceId || typeof invoiceId !== "string") {
      return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, organization: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID" || invoice.amountDue <= 0) {
      return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
    }

    const description = `Invoice ${invoice.invoiceNumber}`;
    const { orderId, approveUrl } = await createPayPalOrder(
      invoice.orgId,
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
        method: "PAYPAL",
        status: "PENDING",
        paypalOrderId: orderId,
      } as never,
    });

    return NextResponse.json({ orderId, approveUrl });
  } catch (err) {
    console.error("[POST /api/payments/paypal/create]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

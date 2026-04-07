import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { capturePayPalOrder } from "@/lib/paypal";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    // Find the pending payment for this order
    const payment = await db.payment.findFirst({
      where: { paypalOrderId: orderId } as never,
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    const { status, amount } = await capturePayPalOrder(payment.orgId, orderId);

    if (status !== "COMPLETED") {
      await db.payment.updateMany({
        where: { paypalOrderId: orderId } as never,
        data: { status: "FAILED" },
      });
      return NextResponse.json({ error: "Payment not completed", status }, { status: 400 });
    }

    // Mark payment and invoice as paid
    await Promise.all([
      db.payment.updateMany({
        where: { paypalOrderId: orderId } as never,
        data: { status: "COMPLETED", paidAt: new Date(), amount },
      }),
      db.invoice.update({
        where: { id: payment.invoiceId! },
        data: { status: "PAID", amountDue: 0, paidAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/payments/paypal/capture]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { verifySquareWebhookSignature, getSquarePayment } from "@/lib/cashapp";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headersList = await headers();
  const signature = headersList.get("x-square-hmacsha256-signature") ?? "";

  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!;
  const notificationUrl = process.env.SQUARE_WEBHOOK_URL!;

  const isValid = verifySquareWebhookSignature(
    signatureKey,
    notificationUrl,
    rawBody,
    signature
  );

  if (!isValid) {
    console.error("[Square/CashApp Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment.completed": {
        const squarePayment = event.data.object.payment as Record<string, unknown>;
        const paymentId = squarePayment.id as string;
        const referenceId = squarePayment.reference_id as string | undefined;

        // Look up by cashAppPaymentId (stored as Square payment link ID or payment ID)
        const payment = await db.payment.findFirst({
          where: {
            OR: [
              { cashAppPaymentId: paymentId } as never,
              { cashAppPaymentId: referenceId } as never,
            ],
          },
        });

        if (payment) {
          const { amount } = await getSquarePayment(paymentId);
          await Promise.all([
            db.payment.update({
              where: { id: (payment as { id: string }).id },
              data: {
                status: "COMPLETED",
                paidAt: new Date(),
                amount,
                cashAppPaymentId: paymentId,
              } as never,
            }),
            db.invoice.update({
              where: { id: (payment as { invoiceId: string }).invoiceId! },
              data: { status: "PAID", amountDue: 0, paidAt: new Date() },
            }),
          ]);
        }
        break;
      }

      case "payment.failed": {
        const squarePayment = event.data.object.payment as Record<string, unknown>;
        const paymentId = squarePayment.id as string;

        await db.payment.updateMany({
          where: { cashAppPaymentId: paymentId } as never,
          data: { status: "FAILED" },
        });
        break;
      }

      default:
        // Unhandled event — ignore
        break;
    }
  } catch (err) {
    console.error("[Square/CashApp Webhook] Handler error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

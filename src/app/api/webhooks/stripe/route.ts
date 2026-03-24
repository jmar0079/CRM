import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" as never });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoiceId = pi.metadata?.invoiceId;
        if (invoiceId) {
          const invoice = await db.invoice.findUnique({
            where: { id: invoiceId },
            select: { customerId: true },
          });
          await db.invoice.update({
            where: { id: invoiceId },
            data: {
              status: "PAID",
              amountDue: 0,
              paidAt: new Date(),
              payments: {
                create: {
                  orgId: pi.metadata.orgId,
                  customerId: invoice?.customerId ?? "",
                  amount: pi.amount_received / 100,
                  method: "STRIPE",
                  status: "COMPLETED",
                  stripePaymentId: pi.id,
                  paidAt: new Date(),
                } as never,
              },
            },
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoiceId = pi.metadata?.invoiceId;
        if (invoiceId) {
          await db.payment.updateMany({
            where: { stripePaymentId: pi.id },
            data: { status: "FAILED" },
          });
        }
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

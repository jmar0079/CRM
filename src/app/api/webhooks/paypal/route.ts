import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { capturePayPalOrder } from "@/lib/paypal";

// Lightweight webhook signature verification using env-level credentials
// (webhook events are not org-specific so we use global env vars here)
async function verifyPayPalWebhook(
  webhookId: string,
  paypalHeaders: Record<string, string>,
  rawBody: string
): Promise<boolean> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const env = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
  const base =
    env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

  // If no global credentials are set, skip verification (trusts the webhook)
  if (!clientId || !secret) return true;

  const credentials = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!tokenRes.ok) return false;
  const { access_token } = await tokenRes.json() as { access_token: string };

  const verifyRes = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: paypalHeaders["paypal-auth-algo"],
      cert_url: paypalHeaders["paypal-cert-url"],
      transmission_id: paypalHeaders["paypal-transmission-id"],
      transmission_sig: paypalHeaders["paypal-transmission-sig"],
      transmission_time: paypalHeaders["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });
  if (!verifyRes.ok) return false;
  const { verification_status } = await verifyRes.json() as { verification_status: string };
  return verification_status === "SUCCESS";
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headersList = await headers();

  const paypalHeaders: Record<string, string> = {
    "paypal-auth-algo": headersList.get("paypal-auth-algo") ?? "",
    "paypal-cert-url": headersList.get("paypal-cert-url") ?? "",
    "paypal-transmission-id": headersList.get("paypal-transmission-id") ?? "",
    "paypal-transmission-sig": headersList.get("paypal-transmission-sig") ?? "",
    "paypal-transmission-time": headersList.get("paypal-transmission-time") ?? "",
  };

  const webhookId = process.env.PAYPAL_WEBHOOK_ID!;

  const isValid = await verifyPayPalWebhook(webhookId, paypalHeaders, rawBody);
  if (!isValid) {
    console.error("[PayPal Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event_type: string; resource: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (event.event_type) {
      case "CHECKOUT.ORDER.APPROVED": {
        const orderId = event.resource.id as string;

        const payment = await db.payment.findFirst({
          where: { paypalOrderId: orderId } as never,
        });

        if (payment && (payment as { status: string }).status === "PENDING") {
          try {
            const { status, amount } = await capturePayPalOrder(payment.orgId, orderId);
            if (status === "COMPLETED") {
              await Promise.all([
                db.payment.updateMany({
                  where: { paypalOrderId: orderId } as never,
                  data: { status: "COMPLETED", paidAt: new Date(), amount },
                }),
                db.invoice.update({
                  where: { id: (payment as { invoiceId: string }).invoiceId! },
                  data: { status: "PAID", amountDue: 0, paidAt: new Date() },
                }),
              ]);
            }
          } catch (captureErr) {
            console.error("[PayPal Webhook] Capture error:", captureErr);
          }
        }
        break;
      }

      case "PAYMENT.CAPTURE.COMPLETED": {
        const orderId = (event.resource.supplementary_data as Record<string, unknown>)
          ?.related_ids
          ? ((event.resource.supplementary_data as Record<string, unknown>)
              .related_ids as Record<string, string>)?.order_id
          : undefined;

        if (orderId) {
          const amountValue = (event.resource.amount as Record<string, string>)?.value;
          await db.payment.updateMany({
            where: { paypalOrderId: orderId } as never,
            data: {
              status: "COMPLETED",
              paidAt: new Date(),
              ...(amountValue ? { amount: parseFloat(amountValue) } : {}),
            },
          });
        }
        break;
      }

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REVERSED": {
        const orderId = (event.resource.supplementary_data as Record<string, unknown>)
          ?.related_ids
          ? ((event.resource.supplementary_data as Record<string, unknown>)
              .related_ids as Record<string, string>)?.order_id
          : undefined;

        if (orderId) {
          await db.payment.updateMany({
            where: { paypalOrderId: orderId } as never,
            data: { status: "FAILED" },
          });
        }
        break;
      }

      default:
        // Unhandled event — ignore
        break;
    }
  } catch (err) {
    console.error("[PayPal Webhook] Handler error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

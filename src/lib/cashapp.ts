// Cash App Pay is powered by Square's Payments API.
// Docs: https://developer.squareup.com/docs/cash-app-pay/overview
import crypto from "crypto";

const SQUARE_BASE_URL =
  process.env.SQUARE_ENV === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

function squareHeaders() {
  return {
    Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN!}`,
    "Content-Type": "application/json",
    "Square-Version": "2024-11-20",
  };
}

export async function createCashAppPaymentLink(
  invoiceId: string,
  amount: number,
  description: string
): Promise<{ paymentLinkId: string; checkoutUrl: string }> {
  const res = await fetch(`${SQUARE_BASE_URL}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: squareHeaders(),
    body: JSON.stringify({
      idempotency_key: `cashapp-${invoiceId}-${Date.now()}`,
      quick_pay: {
        name: description,
        price_money: {
          amount: Math.round(amount * 100),
          currency: "USD",
        },
        location_id: process.env.SQUARE_LOCATION_ID!,
      },
      checkout_options: {
        accepted_payment_methods: {
          cash_app_pay: true,
          apple_pay: false,
          google_pay: false,
        },
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/success?method=cashapp&invoiceId=${invoiceId}`,
      },
      pre_populated_data: {
        buyer_reference: invoiceId,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Square create payment link failed: ${text}`);
  }

  const data = await res.json();
  const link = data.payment_link;

  return {
    paymentLinkId: link.id as string,
    checkoutUrl: link.url as string,
  };
}

export async function getSquarePayment(paymentId: string): Promise<{
  status: string;
  amount: number;
  sourceType: string;
}> {
  const res = await fetch(`${SQUARE_BASE_URL}/v2/payments/${paymentId}`, {
    headers: squareHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Square get payment failed: ${text}`);
  }

  const data = await res.json();
  const payment = data.payment;

  return {
    status: payment.status as string,
    amount: (payment.amount_money?.amount ?? 0) / 100,
    sourceType: payment.source_type as string,
  };
}

export function verifySquareWebhookSignature(
  signatureKey: string,
  notificationUrl: string,
  rawBody: string,
  signature: string
): boolean {
  const hmac = crypto.createHmac("sha256", signatureKey);
  hmac.update(notificationUrl + rawBody);
  const expected = hmac.digest("base64");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

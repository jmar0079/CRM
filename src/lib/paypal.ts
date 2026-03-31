import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

const BASE = {
  SANDBOX: "https://api-m.sandbox.paypal.com",
  LIVE: "https://api-m.paypal.com",
};

async function getAccessToken(orgId: string): Promise<{ token: string; base: string }> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { paypalClientId: true, paypalClientSecret: true, paypalMode: true, paypalEnabled: true },
  });
  if (!org?.paypalEnabled || !org.paypalClientId || !org.paypalClientSecret) {
    throw new Error("PayPal is not configured for this organization.");
  }
  const clientId = org.paypalClientId;
  const clientSecret = decrypt(org.paypalClientSecret);
  const base = BASE[(org.paypalMode ?? "SANDBOX") as "SANDBOX" | "LIVE"];
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${await res.text()}`);
  const data = await res.json() as { access_token: string };
  return { token: data.access_token, base };
}

export async function createPayPalOrder(
  orgId: string,
  invoiceId: string,
  amountDue: number,
  description: string
): Promise<{ orderId: string; approveUrl: string }> {
  const { token, base } = await getAccessToken(orgId);
  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "PayPal-Request-Id": invoiceId },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ reference_id: invoiceId, description, amount: { currency_code: "USD", value: amountDue.toFixed(2) } }],
    }),
  });
  if (!res.ok) throw new Error(`PayPal create order failed: ${await res.text()}`);
  const data = await res.json() as { id: string; links: { rel: string; href: string }[] };
  const approveLink = data.links.find((l) => l.rel === "payer-action" || l.rel === "approve");
  if (!approveLink) throw new Error("No approval URL returned by PayPal");
  return { orderId: data.id, approveUrl: approveLink.href };
}

export async function capturePayPalOrder(
  orgId: string,
  orderId: string
): Promise<{ status: string; amount: number }> {
  const { token, base } = await getAccessToken(orgId);
  const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`PayPal capture failed: ${await res.text()}`);
  const data = await res.json() as { status: string; purchase_units: { payments: { captures: { amount: { value: string } }[] } }[] };
  const amount = parseFloat(data.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? "0");
  return { status: data.status, amount };
}

/** Returns the public client ID for a given org (safe to send to browser) */
export async function getPayPalClientId(orgId: string): Promise<string | null> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { paypalClientId: true, paypalEnabled: true },
  });
  return org?.paypalEnabled ? (org.paypalClientId ?? null) : null;
}

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover" as never,
  typescript: true,
});

export async function createPaymentLink(
  invoiceId: string,
  amount: number,
  customerEmail: string,
  description: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: description },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: customerEmail,
    metadata: { invoiceId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/cancel`,
  });

  return session.url!;
}

export async function createConnectedAccount(email: string): Promise<string> {
  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  return account.id;
}

export async function createAccountLink(accountId: string): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?stripe=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?stripe=success`,
    type: "account_onboarding",
  });
  return link.url;
}

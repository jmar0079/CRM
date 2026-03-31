import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "@/lib/utils";
import { ReviewForm } from "./ReviewForm";
import { getPayPalClientId } from "@/lib/paypal";
import { PayNowButton } from "@/components/PayNowButton";

export const metadata: Metadata = { title: "Customer Portal" };

export default async function PortalPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  if (!searchParams.token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Customer Portal</h1>
          <p className="mt-2 text-slate-500">
            Please use the link from your email to access your portal.
          </p>
        </div>
      </div>
    );
  }

  const customer = await db.customer.findFirst({
    where: { portalToken: searchParams.token },
    include: {
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { items: true },
      },
      jobs: {
        orderBy: { scheduledAt: "desc" },
        take: 5,
        where: { status: { not: "CANCELED" } },
      },
    },
  });

  if (!customer) notFound();

  // Fetch the org's PayPal client ID (safe to expose to frontend)
  const paypalClientId = await getPayPalClientId(customer.orgId);

  const pendingInvoices = customer.invoices.filter((inv) =>
    ["SENT", "OVERDUE"].includes(inv.status)
  );

  return (
    <div className="min-h-screen p-4 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Hello, {customer.firstName}!
          </h1>
          <p className="mt-1 text-slate-500">Here&apos;s an overview of your account.</p>
        </div>

        {/* Pending invoices CTA */}
        {pendingInvoices.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-medium text-amber-800">
              You have {pendingInvoices.length} unpaid invoice
              {pendingInvoices.length > 1 ? "s" : ""} totaling{" "}
              {formatCurrency(pendingInvoices.reduce((s, i) => s + i.amountDue, 0))}.
            </p>
          </div>
        )}

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.invoices.length === 0 ? (
              <p className="text-sm text-slate-400">No invoices yet.</p>
            ) : (
              <ul className="space-y-4">
                {customer.invoices.map((inv) => (
                  <li
                    key={inv.id}
                    className="rounded-lg border border-slate-100 px-4 py-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{inv.invoiceNumber}</p>
                        <p className="text-xs text-slate-500">Due {formatDate(inv.dueAt ?? inv.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={INVOICE_STATUS_COLORS[inv.status as keyof typeof INVOICE_STATUS_COLORS] ?? ""}>
                          {INVOICE_STATUS_LABELS[inv.status as keyof typeof INVOICE_STATUS_LABELS] ?? inv.status}
                        </Badge>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(inv.total)}
                        </span>
                      </div>
                    </div>
                    {/* PayPal Pay Now button for unpaid invoices */}
                    {paypalClientId && ["SENT", "OVERDUE"].includes(inv.status) && inv.amountDue > 0 && (
                      <PayNowButton
                        invoiceId={inv.id}
                        amountDue={inv.amountDue}
                        paypalClientId={paypalClientId}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Service history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service History</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.jobs.length === 0 ? (
              <p className="text-sm text-slate-400">No service history yet.</p>
            ) : (
              <ul className="space-y-2">
                {customer.jobs.map((job) => (
                  <li
                    key={job.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{job.title}</p>
                      {job.scheduledAt && (
                        <p className="text-xs text-slate-500">{formatDate(job.scheduledAt)}</p>
                      )}
                    </div>
                    {job.price != null && (
                      <span className="text-sm font-medium text-slate-700">
                        {formatCurrency(job.price)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Leave a review */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leave a Review</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm customerId={customer.id} portal />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from "@/lib/utils";
import { InvoiceActions } from "./InvoiceActions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id },
    select: { invoiceNumber: true },
  });
  return { title: invoice ? `Invoice ${invoice.invoiceNumber}` : "Invoice" };
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const orgId = session!.user.orgId;

  const invoice = await db.invoice.findFirst({
    where: { id, orgId },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, address: true, portalToken: true } },
      items: { orderBy: { position: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      quote: { select: { id: true, quoteNumber: true } },
    },
  });

  if (!invoice) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/invoices">
            <Button variant="ghost" size="icon" className="mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {invoice.invoiceNumber}
              </h1>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  INVOICE_STATUS_COLORS[invoice.status]
                }`}
              >
                {INVOICE_STATUS_LABELS[invoice.status]}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Created {formatDate(invoice.createdAt)}
              {invoice.dueAt && ` · Due ${formatDate(invoice.dueAt)}`}
            </p>
          </div>
        </div>

        <InvoiceActions invoice={{ id: invoice.id, status: invoice.status, amountDue: invoice.amountDue }} portalToken={invoice.customer.portalToken ?? null} customerEmail={invoice.customer.email ?? null} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — customer + details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Link
                href={`/customers/${invoice.customerId}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {invoice.customer.firstName} {invoice.customer.lastName}
              </Link>
              {invoice.customer.email && (
                <p className="text-slate-500">{invoice.customer.email}</p>
              )}
              {invoice.customer.phone && (
                <p className="text-slate-500">{invoice.customer.phone}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmt > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span>- {formatCurrency(invoice.discountAmt)}</span>
                </div>
              )}
              {invoice.taxAmt > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(invoice.taxAmt)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-100 pt-2">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Paid</span>
                  <span>- {formatCurrency(invoice.amountPaid)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-2">
                <span>Amount Due</span>
                <span>{formatCurrency(invoice.amountDue)}</span>
              </div>
            </CardContent>
          </Card>

          {invoice.quote && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Linked Quote</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/quotes/${invoice.quote.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {invoice.quote.quoteNumber}
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — line items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Line Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoice.items.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-400">No items yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-2 text-left font-medium text-slate-500">
                        Description
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-slate-500">
                        Qty
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-slate-500">
                        Unit Price
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-slate-500">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-slate-800">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {item.qty}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-800">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Payments</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100">
                {invoice.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between py-2 text-sm"
                  >
                    <span className="text-slate-500">
                      {formatDate(p.createdAt)}
                    </span>
                    <span className="font-medium text-green-700">
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

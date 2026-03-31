import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS } from "@/lib/utils";
import { QuoteActions } from "./QuoteActions";
import { ServiceDateEditor } from "./ServiceDateEditor";

type QuoteStatus = "DRAFT" | "SENT" | "APPROVED" | "DECLINED" | "EXPIRED" | "CONVERTED";

const STATUS_COLORS: Record<QuoteStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
  CONVERTED: "bg-purple-100 text-purple-700",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const quote = await db.quote.findUnique({
    where: { id },
    select: { quoteNumber: true },
  });
  return { title: quote ? `Quote ${quote.quoteNumber}` : "Quote" };
}

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const orgId = session!.user.orgId;

  const quote = await db.quote.findFirst({
    where: { id, orgId },
    include: {
      customer: true,
      lead: true,
      items: { orderBy: { position: "asc" } },
      invoice: { select: { id: true, invoiceNumber: true } },
    },
  });

  if (!quote) notFound();

  const contact = quote.customer ?? quote.lead;
  const contactName = contact ? `${contact.firstName} ${contact.lastName}` : null;
  const contactHref = quote.customerId
    ? `/customers/${quote.customerId}`
    : quote.leadId
    ? `/leads/${quote.leadId}`
    : null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/quotes">
            <Button variant="ghost" size="icon" className="mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{quote.quoteNumber}</h1>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_COLORS[quote.status as QuoteStatus] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Created {formatDate(quote.createdAt)}
              {quote.validUntil && ` · Expires ${formatDate(quote.validUntil)}`}
            </p>
          </div>
        </div>
        <QuoteActions
          quote={{
            id: quote.id,
            status: quote.status,
            approvalToken: quote.approvalToken,
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4">
          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {quote.customerId ? "Customer" : "Lead"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {contactName && contactHref ? (
                <Link href={contactHref} className="font-medium text-blue-600 hover:underline">
                  {contactName}
                </Link>
              ) : (
                <p className="text-slate-400">No contact linked</p>
              )}
              {"email" in (contact ?? {}) && (contact as { email?: string })?.email && (
                <p className="text-slate-500">{(contact as { email: string }).email}</p>
              )}
              {"phone" in (contact ?? {}) && (contact as { phone?: string })?.phone && (
                <p className="text-slate-500">{(contact as { phone: string }).phone}</p>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span>Service Date</span>
                <ServiceDateEditor
                  quoteId={quote.id}
                  serviceDate={quote.serviceDate ? quote.serviceDate.toISOString() : null}
                />
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.discountAmt > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span>- {formatCurrency(quote.discountAmt)}</span>
                </div>
              )}
              {quote.taxAmt > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({quote.taxRate}%)</span>
                  <span>{formatCurrency(quote.taxAmt)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-100 pt-2">
                <span>Total</span>
                <span>{formatCurrency(quote.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Linked invoice */}
          {quote.invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Linked Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/invoices/${quote.invoice.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {quote.invoice.invoiceNumber}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — line items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Line Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {quote.items.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-400">No items on this quote.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-2 text-left font-medium text-slate-500">Description</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-500">Qty</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-500">Unit Price</th>
                      <th className="px-4 py-2 text-right font-medium text-slate-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quote.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-slate-800">{item.description}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{item.qty}</td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-800">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <td colSpan={3} className="px-4 py-3 text-right font-semibold text-slate-700">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(quote.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

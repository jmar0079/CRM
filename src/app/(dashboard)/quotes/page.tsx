import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS } from "@/lib/utils";
type QuoteStatus = "DRAFT" | "SENT" | "APPROVED" | "DECLINED" | "EXPIRED" | "CONVERTED";

export const metadata: Metadata = { title: "Quotes" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function QuotesPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const orgId = session!.user.orgId;

  const where = {
    orgId,
    ...(params.status && { status: params.status as QuoteStatus }),
  };

  const quotes = await db.quote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      customer: { select: { firstName: true, lastName: true } },
      lead: { select: { firstName: true, lastName: true } },
    },
  });

  const STATUS_BADGE: Record<QuoteStatus, string> = {
    DRAFT: "bg-slate-100 text-slate-600",
    SENT: "bg-blue-100 text-blue-700",
    APPROVED: "bg-green-100 text-green-700",
    DECLINED: "bg-red-100 text-red-700",
    EXPIRED: "bg-orange-100 text-orange-700",
    CONVERTED: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Quotes</h1>
        <Link href="/quotes/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Quote
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-500">Quote #</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Customer / Lead</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Total</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 hidden lg:table-cell">Created</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 hidden xl:table-cell">Expires</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  No quotes yet.
                </td>
              </tr>
            ) : (
              quotes.map((quote) => {
                const contact = quote.customer ?? quote.lead;
                const name = contact
                  ? `${contact.firstName} ${contact.lastName}`
                  : "—";

                return (
                  <tr key={quote.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600"
                      >
                        {quote.quoteNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[quote.status]}`}
                      >
                        {QUOTE_STATUS_LABELS[quote.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {formatCurrency(quote.total)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-400">
                      {formatDate(quote.createdAt)}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-slate-400">
                      {quote.validUntil ? formatDate(quote.validUntil) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

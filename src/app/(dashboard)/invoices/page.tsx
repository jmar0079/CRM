import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatCurrency, formatDate, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "@/lib/utils";
type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

export const metadata: Metadata = { title: "Invoices" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const orgId = session!.user.orgId;

  const invoices = await db.invoice.findMany({
    where: {
      orgId,
      ...(params.status ? { status: params.status as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      customer: { select: { firstName: true, lastName: true } },
      payments: { select: { amount: true, status: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <Link href="/invoices/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {["", "UNPAID", "PARTIAL", "PAID", "OVERDUE"].map((s) => (
          <Link
            key={s}
            href={s ? `?status=${s}` : "?"}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              (params.status ?? "") === s
                ? "bg-slate-800 border-slate-800 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s ? INVOICE_STATUS_LABELS[s as InvoiceStatus] : "All"}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-500">Invoice #</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Total</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Due</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 hidden lg:table-cell">Amount Due</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {invoice.customer.firstName} {invoice.customer.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_STATUS_COLORS[invoice.status]}`}
                    >
                      {INVOICE_STATUS_LABELS[invoice.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {invoice.dueAt ? formatDate(invoice.dueAt) : "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell font-medium text-slate-700">
                    {invoice.amountDue > 0 ? formatCurrency(invoice.amountDue) : "Paid"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

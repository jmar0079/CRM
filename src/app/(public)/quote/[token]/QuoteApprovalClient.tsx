"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  subtotal: number;
  taxRate: number | null;
  discount: number | null;
  total: number;
  validUntil: Date | null;
  notes: string | null;
  items: QuoteItem[];
  organization: { name: string; phone: string | null; email: string | null };
}

export function QuoteApprovalClient({ quote }: { quote: Quote }) {
  const [status, setStatus] = useState<"idle" | "loading" | "approved" | "declined">("idle");
  const [error, setError] = useState("");

  const isAlreadyActioned = quote.status === "APPROVED" || quote.status === "DECLINED";

  async function respond(action: "approve" | "decline") {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`/api/public/quote/${quote.id}/${action}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setStatus(action === "approve" ? "approved" : "declined");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("idle");
    }
  }

  if (status === "approved") {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold text-slate-900">Quote Approved!</h2>
        <p className="text-slate-500">We&apos;ll be in touch to schedule your service.</p>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <XCircle className="h-16 w-16 text-red-400" />
        <h2 className="text-2xl font-bold text-slate-900">Quote Declined</h2>
        <p className="text-slate-500">Got it. You can contact us if you change your mind.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center p-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">{quote.organization.name}</h1>
          <p className="mt-1 text-slate-500">Your Quote is Ready</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Quote {quote.quoteNumber}</CardTitle>
            <div className="flex items-center gap-3">
              {quote.validUntil && (
                <span className="text-sm text-slate-500">
                  Valid until {formatDate(quote.validUntil)}
                </span>
              )}
              {isAlreadyActioned && (
                <Badge variant={quote.status === "APPROVED" ? "success" : "destructive"}>
                  {quote.status}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 text-slate-700">{item.description}</td>
                    <td className="py-2 text-right text-slate-500">{item.quantity}</td>
                    <td className="py-2 text-right text-slate-500">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2 text-right font-medium text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1.5 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.taxRate && quote.taxRate > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Tax ({quote.taxRate}%)</span>
                  <span>{formatCurrency((quote.subtotal * quote.taxRate) / 100)}</span>
                </div>
              )}
              {quote.discount && quote.discount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Discount</span>
                  <span>-{formatCurrency(quote.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(quote.total)}</span>
              </div>
            </div>

            {quote.notes && (
              <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {quote.notes}
              </p>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            {!isAlreadyActioned && (
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => respond("approve")}
                  disabled={status === "loading"}
                >
                  {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Accept Quote
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => respond("decline")}
                  disabled={status === "loading"}
                >
                  Decline
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-400">
          Questions?{" "}
          {quote.organization.phone && (
            <a href={`tel:${quote.organization.phone}`} className="text-blue-600 hover:underline">
              Call {quote.organization.phone}
            </a>
          )}
          {quote.organization.phone && quote.organization.email && " · "}
          {quote.organization.email && (
            <a href={`mailto:${quote.organization.email}`} className="text-blue-600 hover:underline">
              {quote.organization.email}
            </a>
          )}
        </p>
      </div>
    </div>
  );
}

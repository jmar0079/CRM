"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { Suspense } from "react";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId") ?? "";
  const jobId = searchParams.get("jobId") ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [form, setForm] = useState({
    customerId,
    jobId,
    dueDate: "",
    taxRate: "0",
    discount: "0",
    notes: "",
  });

  function updateForm(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function updateItem(idx: number, field: keyof LineItem, val: string) {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: field === "description" ? val : parseFloat(val) || 0 };
      return next;
    });
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = subtotal * (parseFloat(form.taxRate) / 100);
  const total = subtotal + tax - (parseFloat(form.discount) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.some((i) => !i.description.trim())) {
      setError("All line items need a description.");
      return;
    }
    if (!form.dueDate) {
      setError("Due date is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId || undefined,
          jobId: form.jobId || undefined,
          dueAt: new Date(form.dueDate).toISOString(),
          taxRate: parseFloat(form.taxRate) || 0,
          discountAmt: parseFloat(form.discount) || 0,
          notes: form.notes || undefined,
          items: items.map((i) => ({ description: i.description, qty: i.quantity, unitPrice: i.unitPrice })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create invoice");
      router.push("/invoices");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="customerId">Customer ID</Label>
          <Input id="customerId" value={form.customerId} onChange={updateForm("customerId")} disabled={loading} placeholder="cus_…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jobId">Job ID</Label>
          <Input id="jobId" value={form.jobId} onChange={updateForm("jobId")} disabled={loading} placeholder="job_…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input id="dueDate" type="date" value={form.dueDate} onChange={updateForm("dueDate")} required disabled={loading} />
        </div>
      </div>

      {/* Line items */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Line Items</p>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-6">
                <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} disabled={loading} />
              </div>
              <div className="col-span-2">
                <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} disabled={loading} />
              </div>
              <div className="col-span-3">
                <Input type="number" min="0" step="0.01" placeholder="Unit price" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} disabled={loading} />
              </div>
              <div className="col-span-1 pt-2">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" disabled={items.length === 1 || loading} onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setItems((p) => [...p, { description: "", quantity: 1, unitPrice: 0 }])} disabled={loading}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Item
        </Button>
      </div>

      {/* Totals */}
      <div className="space-y-2 border-t border-slate-200 pt-4 text-sm">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="taxRate">Tax Rate (%)</Label>
          <div className="w-24">
            <Input id="taxRate" type="number" min="0" max="100" step="0.1" value={form.taxRate} onChange={updateForm("taxRate")} disabled={loading} className="text-right" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="discount">Discount ($)</Label>
          <div className="w-24">
            <Input id="discount" type="number" min="0" step="0.01" value={form.discount} onChange={updateForm("discount")} disabled={loading} className="text-right" />
          </div>
        </div>
        <div className="flex justify-between font-bold text-slate-900">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <textarea id="notes" rows={2} value={form.notes} onChange={updateForm("notes")} disabled={loading} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50" />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Invoice
        </Button>
        <Link href="/invoices">
          <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
        </Link>
      </div>
    </form>
  );
}

export default function NewInvoicePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/invoices">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Invoice</h1>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
        <CardContent>
          <Suspense>
            <NewInvoiceForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

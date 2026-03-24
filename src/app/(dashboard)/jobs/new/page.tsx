"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Suspense } from "react";

function NewJobForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledCustomerId = searchParams.get("customerId") ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    customerId: prefilledCustomerId,
    scheduledAt: "",
    address: "",
    notes: "",
    totalCost: "",
  });

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
          totalCost: form.totalCost ? parseFloat(form.totalCost) : undefined,
          customerId: form.customerId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create job");
      router.push(`/jobs/${data.job.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Job Title *</Label>
        <Input id="title" value={form.title} onChange={update("title")} required disabled={loading} placeholder="Full Detail - Interior & Exterior" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          rows={2}
          value={form.description}
          onChange={update("description")}
          disabled={loading}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="customerId">Customer ID</Label>
          <Input id="customerId" value={form.customerId} onChange={update("customerId")} disabled={loading} placeholder="cus_…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
          <Input id="scheduledAt" type="datetime-local" value={form.scheduledAt} onChange={update("scheduledAt")} disabled={loading} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Service Address</Label>
        <Input id="address" value={form.address} onChange={update("address")} disabled={loading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="totalCost">Total Cost ($)</Label>
        <Input id="totalCost" type="number" min="0" step="0.01" value={form.totalCost} onChange={update("totalCost")} disabled={loading} placeholder="0.00" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          rows={2}
          value={form.notes}
          onChange={update("notes")}
          disabled={loading}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
        />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Job
        </Button>
        <Link href="/jobs">
          <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
        </Link>
      </div>
    </form>
  );
}

export default function NewJobPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/jobs">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Job</h1>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Job Details</CardTitle></CardHeader>
        <CardContent>
          <Suspense>
            <NewJobForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

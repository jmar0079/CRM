"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BookingForm() {
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("org") ?? "";

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    serviceInterest: "",
    preferredDate: "",
    notes: "",
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
      const res = await fetch(`/api/public/form?orgSlug=${orgSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, orgSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold text-slate-900">Request Received!</h2>
        <p className="text-slate-500 max-w-sm">
          Thanks! We&apos;ll be in touch shortly to confirm your booking.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" value={form.firstName} onChange={update("firstName")} required disabled={loading} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input id="lastName" value={form.lastName} onChange={update("lastName")} required disabled={loading} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" value={form.email} onChange={update("email")} required disabled={loading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone *</Label>
        <Input id="phone" type="tel" value={form.phone} onChange={update("phone")} required disabled={loading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Street Address</Label>
        <Input id="address" value={form.address} onChange={update("address")} disabled={loading} placeholder="123 Main St" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={form.city} onChange={update("city")} disabled={loading} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <Input id="state" value={form.state} onChange={update("state")} disabled={loading} placeholder="TX" maxLength={2} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zip">ZIP Code</Label>
          <Input id="zip" value={form.zip} onChange={update("zip")} disabled={loading} maxLength={10} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="serviceInterest">Service Interested In</Label>
        <Input id="serviceInterest" value={form.serviceInterest} onChange={update("serviceInterest")} disabled={loading} placeholder="e.g. Roof repair, Painting..." />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="preferredDate">Preferred Date</Label>
        <Input id="preferredDate" type="date" value={form.preferredDate} onChange={update("preferredDate")} disabled={loading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Additional Notes</Label>
        <textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={update("notes")}
          disabled={loading}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
          placeholder="Any details that would help us prepare..."
        />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Request Appointment
      </Button>
    </form>
  );
}

export default function BookPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Book an Appointment</h1>
          <p className="mt-2 text-slate-500">Fill out the form and we&apos;ll get back to you shortly.</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Suspense>
              <BookingForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

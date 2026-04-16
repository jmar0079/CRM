"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Labels that change depending on whether the business sells services or products
const CONFIG = {
  SERVICE: {
    pageTitle: "Book an Appointment",
    pageSubtitle: "Fill out the form and we'll get back to you shortly.",
    interestLabel: "Service You're Interested In",
    interestPlaceholder: "e.g. Roof repair, Painting, Cleaning…",
    submitLabel: "Request Appointment",
    successTitle: "Request Received!",
    successMessage: "Thanks! We'll be in touch shortly to confirm your appointment.",
  },
  PRODUCT: {
    pageTitle: "Place an Order",
    pageSubtitle: "Tell us what you need and we'll get back to you with a quote.",
    interestLabel: "Product You're Interested In",
    interestPlaceholder: "e.g. Custom t-shirt, 12\" widget, Bulk order…",
    submitLabel: "Request a Quote",
    successTitle: "Order Request Received!",
    successMessage: "Thanks! We'll be in touch shortly to go over the details.",
  },
} as const;

type FormType = keyof typeof CONFIG;

interface CatalogService {
  id: string;
  name: string;
  price: number | null;
  category: string | null;
}

interface BookingFormProps {
  orgSlug: string;
  formType: FormType;
}

function BookingForm({ orgSlug, formType }: BookingFormProps) {
  const cfg = CONFIG[formType];

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [services, setServices] = useState<CatalogService[]>([]);
  // "catalog" = user chose a catalog service; "custom" = user chose Custom/Other or no services
  const [servicePickMode, setServicePickMode] = useState<"catalog" | "custom">("catalog");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    serviceId: "",
    serviceInterest: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });

  // Fetch catalog services for SERVICE mode
  useEffect(() => {
    if (!orgSlug || formType !== "SERVICE") return;
    fetch(`/api/public/services?orgSlug=${encodeURIComponent(orgSlug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.services)) setServices(data.services);
      })
      .catch(() => {}); // silent — falls back to plain text input
  }, [orgSlug, formType]);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleServiceSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === "custom" || val === "") {
      setServicePickMode("custom");
      setForm((f) => ({ ...f, serviceId: "", serviceInterest: "" }));
    } else {
      setServicePickMode("catalog");
      setForm((f) => ({ ...f, serviceId: val, serviceInterest: "" }));
    }
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
        <h2 className="text-2xl font-bold text-slate-900">{cfg.successTitle}</h2>
        <p className="text-slate-500 max-w-sm">{cfg.successMessage}</p>
      </div>
    );
  }

  // Service interest section — dropdown when catalog services exist (SERVICE mode only)
  const showCatalogDropdown = formType === "SERVICE" && services.length > 0;
  const showCustomTextInput =
    formType !== "SERVICE" || services.length === 0 || servicePickMode === "custom";

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

      {/* Service interest — dropdown + optional custom input */}
      <div className="space-y-1.5">
        <Label htmlFor="serviceSelect">{cfg.interestLabel}</Label>
        {showCatalogDropdown && (
          <select
            id="serviceSelect"
            disabled={loading}
            onChange={handleServiceSelect}
            defaultValue=""
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="" disabled>Select a service…</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.name}
                {svc.price != null
                  ? ` — $${svc.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : ""}
              </option>
            ))}
            <option value="custom">Custom / Other…</option>
          </select>
        )}
        {showCustomTextInput && (
          <Input
            id="serviceInterest"
            value={form.serviceInterest}
            onChange={update("serviceInterest")}
            disabled={loading}
            placeholder={cfg.interestPlaceholder}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="preferredDate">Preferred Date</Label>
        <Input id="preferredDate" type="date" value={form.preferredDate} onChange={update("preferredDate")} disabled={loading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="preferredTime">Preferred Time of Day</Label>
        <select
          id="preferredTime"
          value={form.preferredTime}
          onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))}
          disabled={loading}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
        >
          <option value="">Any time</option>
          <option value="morning">Morning (9 AM - 12 PM)</option>
          <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
          <option value="evening">Evening (5 PM - 8 PM)</option>
        </select>
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
        {cfg.submitLabel}
      </Button>
    </form>
  );
}

// Inner component that reads searchParams (needs Suspense)
function BookPageContent() {
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("org") ?? "";
  const rawType = (searchParams.get("type") ?? "SERVICE").toUpperCase();
  const formType: FormType = rawType === "PRODUCT" ? "PRODUCT" : "SERVICE";
  const cfg = CONFIG[formType];

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">{cfg.pageTitle}</h1>
          <p className="mt-2 text-slate-500">{cfg.pageSubtitle}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <BookingForm orgSlug={orgSlug} formType={formType} />
            <div className="mt-6 border-t pt-4 text-center text-sm text-gray-500">
              <p>
                Don't have a specific provider in mind?{" "}
                <a href="/inquire" className="text-blue-600 hover:text-blue-800 font-medium">
                  Find services through our marketplace
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense>
      <BookPageContent />
    </Suspense>
  );
}

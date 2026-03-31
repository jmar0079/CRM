"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Globe, LayoutList, Wrench, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface OrgFormProps {
  org: {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    website: string | null;
    timezone: string | null;
    bookingMode: string;
    customBookingUrl: string | null;
    bookingFormType: string;
  };
}

export function OrgSettingsForm({ org }: OrgFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [form, setForm] = useState({
    name: org.name,
    phone: org.phone ?? "",
    email: org.email ?? "",
    address: org.address ?? "",
    website: org.website ?? "",
    timezone: org.timezone ?? "America/New_York",
    bookingMode: org.bookingMode ?? "BUILT_IN",
    customBookingUrl: org.customBookingUrl ?? "",
    bookingFormType: org.bookingFormType ?? "SERVICE",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function saveBookingMode() {
    if (form.bookingMode === "CUSTOM_WEBSITE" && !form.customBookingUrl.trim()) {
      setBookingError("Please enter your website URL.");
      return;
    }
    setBookingLoading(true);
    setBookingError("");
    try {
      const res = await fetch("/api/settings/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingMode: form.bookingMode,
          customBookingUrl: form.bookingMode === "CUSTOM_WEBSITE" ? form.customBookingUrl.trim() : null,
          bookingFormType: form.bookingFormType,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      router.refresh();
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={form.timezone}
                  onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                  placeholder="America/New_York"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Booking & Lead Capture */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking &amp; Lead Capture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500">
            Choose where leads go when you share your booking link. Use the
            built-in form or redirect them to your own website.
          </p>

          {/* Business type */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">What are you selling?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, bookingFormType: "SERVICE" }))}
                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                  form.bookingFormType === "SERVICE"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Wrench className={`mt-0.5 h-5 w-5 shrink-0 ${form.bookingFormType === "SERVICE" ? "text-blue-600" : "text-slate-400"}`} />
                <div>
                  <p className={`text-sm font-medium ${form.bookingFormType === "SERVICE" ? "text-blue-700" : "text-slate-700"}`}>
                    Service
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Cleaning, repair, consulting, etc. Shows appointment booking copy.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, bookingFormType: "PRODUCT" }))}
                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                  form.bookingFormType === "PRODUCT"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <ShoppingBag className={`mt-0.5 h-5 w-5 shrink-0 ${form.bookingFormType === "PRODUCT" ? "text-blue-600" : "text-slate-400"}`} />
                <div>
                  <p className={`text-sm font-medium ${form.bookingFormType === "PRODUCT" ? "text-blue-700" : "text-slate-700"}`}>
                    Product
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Physical or digital products. Shows order request copy.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Link destination */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Where should the form link go?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, bookingMode: "BUILT_IN" }))}
                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                  form.bookingMode === "BUILT_IN"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <LayoutList className={`mt-0.5 h-5 w-5 shrink-0 ${form.bookingMode === "BUILT_IN" ? "text-blue-600" : "text-slate-400"}`} />
                <div>
                  <p className={`text-sm font-medium ${form.bookingMode === "BUILT_IN" ? "text-blue-700" : "text-slate-700"}`}>
                    Built-in Form
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    CRM-hosted form at{" "}
                    <span className="font-mono">/book?org={org.slug}</span>
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, bookingMode: "CUSTOM_WEBSITE" }))}
                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                  form.bookingMode === "CUSTOM_WEBSITE"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Globe className={`mt-0.5 h-5 w-5 shrink-0 ${form.bookingMode === "CUSTOM_WEBSITE" ? "text-blue-600" : "text-slate-400"}`} />
                <div>
                  <p className={`text-sm font-medium ${form.bookingMode === "CUSTOM_WEBSITE" ? "text-blue-700" : "text-slate-700"}`}>
                    Your Own Website
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Redirect leads to a page on your existing site.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {form.bookingMode === "CUSTOM_WEBSITE" && (
            <div className="space-y-1.5">
              <Label htmlFor="customBookingUrl">Your Website Form URL</Label>
              <Input
                id="customBookingUrl"
                type="url"
                placeholder="https://yourwebsite.com/contact"
                value={form.customBookingUrl}
                onChange={(e) => setForm((f) => ({ ...f, customBookingUrl: e.target.value }))}
              />
              <p className="text-xs text-slate-400">
                This URL will be shared with leads instead of the built-in booking form.
              </p>
            </div>
          )}

          {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}
          <Button
            type="button"
            variant="outline"
            disabled={bookingLoading}
            onClick={saveBookingMode}
          >
            {bookingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Booking Preference
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

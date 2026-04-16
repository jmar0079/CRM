"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";

interface BookingLinkCardProps {
  bookingMode: string;
  customBookingUrl: string | null;
  orgSlug: string;
  appUrl: string;
  bookingFormType: string;
}

export function BookingLinkCard({ bookingMode, customBookingUrl, orgSlug, appUrl, bookingFormType }: BookingLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const typeParam = bookingFormType === "PRODUCT" ? "&type=PRODUCT" : "";
  const link =
    bookingMode === "CUSTOM_WEBSITE" && customBookingUrl
      ? customBookingUrl
      : `${appUrl}/book?org=${orgSlug}${typeParam}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          {bookingMode === "CUSTOM_WEBSITE" ? "Website Form Link" : "Booking Form Link"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-slate-500">
          {bookingMode === "CUSTOM_WEBSITE"
            ? "Share your website's contact form with this lead."
            : "Share this link with the lead so they can fill out the booking form."}
        </p>
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="flex-1 truncate text-xs font-mono text-slate-700">{link}</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copyLink} className="flex-1">
            {copied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy Link
              </>
            )}
          </Button>
          <a href={link} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

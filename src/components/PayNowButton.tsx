"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface PayNowButtonProps {
  invoiceId: string;
  amountDue: number;
  paypalClientId: string;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paypal?: any;
  }
}

export function PayNowButton({ invoiceId, amountDue, paypalClientId, onSuccess }: PayNowButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!paypalClientId) return;

    // Avoid loading the SDK twice
    const existingScript = document.getElementById("paypal-sdk");
    if (existingScript) {
      renderButton();
      return;
    }

    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`;
    script.onload = () => renderButton();
    script.onerror = () => setError("Failed to load PayPal. Please refresh the page.");
    document.head.appendChild(script);

    function renderButton() {
      if (!window.paypal || !containerRef.current) return;
      // Clear any previous render
      containerRef.current.innerHTML = "";
      setLoading(false);

      window.paypal
        .Buttons({
          style: { layout: "vertical", color: "blue", shape: "rect", label: "pay" },

          // Create a PayPal order via our server
          createOrder: async () => {
            const res = await fetch("/api/payments/paypal/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ invoiceId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Could not create order");
            return data.orderId;
          },

          // Capture on approval
          onApprove: async (data: { orderID: string }) => {
            const res = await fetch("/api/payments/paypal/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error ?? "Payment capture failed");
            setPaid(true);
            onSuccess?.();
          },

          onError: (err: unknown) => {
            console.error("[PayPal error]", err);
            setError("Payment failed. Please try again.");
          },
        })
        .render(containerRef.current);
    }

    return () => {
      // Clean up rendered buttons on unmount
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, paypalClientId]);

  if (paid) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm font-medium text-green-700">
        ✅ Payment received! Thank you.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">
        Amount due: <span className="font-semibold text-slate-800">${amountDue.toFixed(2)}</span>
      </p>
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</p>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading payment options…
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}

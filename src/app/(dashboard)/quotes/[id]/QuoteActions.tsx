"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle, XCircle, Trash2, Loader2 } from "lucide-react";

interface QuoteActionsProps {
  quote: { id: string; status: string; approvalToken: string | null };
}

export function QuoteActions({ quote }: QuoteActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function patch(data: Record<string, unknown>, label: string) {
    setBusy(label);
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      // If approving created a new invoice, offer to navigate to it
      if (json.invoiceId) {
        const go = confirm(`Invoice created successfully! Go to invoice now?`);
        if (go) {
          router.push(`/invoices/${json.invoiceId}`);
          return;
        }
      }
      router.refresh();
    } catch {
      alert(`Failed to ${label.toLowerCase()}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this quote? This cannot be undone.")) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      router.push("/quotes");
    } catch {
      alert("Failed to delete quote");
      setBusy(null);
    }
  }

  const isDraft = quote.status === "DRAFT";
  const isSent = quote.status === "SENT";

  return (
    <div className="flex gap-2 flex-wrap">
      {isDraft && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => patch({ status: "SENT", sentAt: new Date().toISOString() }, "send")}
          className="text-blue-700 border-blue-300 hover:bg-blue-50"
        >
          {busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Mark as Sent
        </Button>
      )}
      {isSent && (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => patch({ status: "APPROVED", approvedAt: new Date().toISOString() }, "approve")}
            className="text-green-700 border-green-300 hover:bg-green-50"
          >
            {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Mark Approved
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => patch({ status: "DECLINED", declinedAt: new Date().toISOString() }, "decline")}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            {busy === "decline" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Mark Declined
          </Button>
        </>
      )}
      {quote.approvalToken && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const url = `${window.location.origin}/quote/${quote.approvalToken}`;
            navigator.clipboard.writeText(url);
            alert("Customer quote link copied!");
          }}
        >
          Copy Customer Link
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        disabled={busy !== null}
        onClick={handleDelete}
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Delete
      </Button>
    </div>
  );
}

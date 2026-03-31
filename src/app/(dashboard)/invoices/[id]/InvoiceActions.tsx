"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle, Trash2, Loader2, Link as LinkIcon } from "lucide-react";

interface InvoiceActionsProps {
  invoice: { id: string; status: string };
  portalToken: string | null;
}

export function InvoiceActions({ invoice, portalToken }: InvoiceActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function patch(data: Record<string, unknown>, label: string) {
    setBusy(label);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      alert(`Failed to ${label}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      router.push("/invoices");
    } catch {
      alert("Failed to delete invoice");
      setBusy(null);
    }
  }

  const isDraft = invoice.status === "DRAFT";
  const isUnpaid = !["PAID", "VOID", "CANCELLED"].includes(invoice.status);

  return (
    <div className="flex gap-2 flex-wrap">
      {isDraft && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => patch({ status: "SENT", sentAt: new Date().toISOString() }, "mark as sent")}
          className="text-blue-700 border-blue-300 hover:bg-blue-50"
        >
          {busy === "mark as sent" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Mark as Sent
        </Button>
      )}
      {isUnpaid && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => patch({ status: "PAID", paidAt: new Date().toISOString() }, "mark as paid")}
          className="text-green-700 border-green-300 hover:bg-green-50"
        >
          {busy === "mark as paid" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Mark Paid
        </Button>
      )}
      {portalToken && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const url = `${window.location.origin}/portal?token=${portalToken}`;
            navigator.clipboard.writeText(url);
            alert("Customer portal link copied!");
          }}
        >
          <LinkIcon className="h-4 w-4" />
          Copy Portal Link
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Trash2, Loader2 } from "lucide-react";

interface InvoiceActionsProps {
  invoice: { id: string; status: string };
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const router = useRouter();
  const [markingPaid, setMarkingPaid] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleMarkPaid() {
    if (!confirm("Mark this invoice as paid?")) return;
    setMarkingPaid(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      alert("Failed to mark as paid");
    } finally {
      setMarkingPaid(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      router.push("/invoices");
    } catch {
      alert("Failed to delete invoice");
      setDeleting(false);
    }
  }

  return (
    <div className="flex gap-2">
      {invoice.status !== "PAID" && invoice.status !== "VOID" && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleMarkPaid}
          disabled={markingPaid}
          className="text-green-700 border-green-300 hover:bg-green-50"
        >
          {markingPaid ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Mark Paid
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={handleDelete}
        disabled={deleting}
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        Delete
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteButtonProps {
  apiPath: string;
  redirectTo: string;
  confirmMessage?: string;
  /** "icon" = styled Button with trash icon; "text" = plain small text link */
  variant?: "icon" | "text";
  label?: string;
}

export function DeleteButton({
  apiPath,
  redirectTo,
  confirmMessage = "Are you sure you want to delete this? This cannot be undone.",
  variant = "icon",
  label,
}: DeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const res = await fetch(apiPath, { method: "DELETE" });
      if (res.ok) {
        router.push(redirectTo);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete.");
        setLoading(false);
      }
    } catch {
      alert("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (variant === "text") {
    return (
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
      >
        {loading ? "Deleting…" : label ?? "Delete"}
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
    >
      <Trash2 className="h-4 w-4" />
      {label && <span className="ml-1">{label}</span>}
    </Button>
  );
}

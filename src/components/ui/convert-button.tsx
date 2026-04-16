"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserCheck, Loader2 } from "lucide-react";

interface ConvertButtonProps {
  leadId: string;
}

export function ConvertButton({ leadId }: ConvertButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleConvert() {
    if (!confirm("Convert this lead to a customer?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/convert`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to convert");
      router.push(`/customers/${data.customer.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to convert lead");
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handleConvert} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserCheck className="h-4 w-4" />
      )}
      Convert to Customer
    </Button>
  );
}

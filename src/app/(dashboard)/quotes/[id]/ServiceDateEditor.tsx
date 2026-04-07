"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, Loader2 } from "lucide-react";

interface ServiceDateEditorProps {
  quoteId: string;
  serviceDate: string | null; // ISO string or null
}

export function ServiceDateEditor({ quoteId, serviceDate }: ServiceDateEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  // Convert ISO → "YYYY-MM-DD" for the date input
  const toInputValue = (iso: string | null) =>
    iso ? new Date(iso).toISOString().slice(0, 10) : "";

  const [value, setValue] = useState(toInputValue(serviceDate));

  const displayDate = serviceDate
    ? new Date(serviceDate).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceDate: value ? new Date(value + "T12:00:00").toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
      setEditing(false);
    } catch {
      alert("Failed to save date");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-7 text-sm py-0 w-36"
          disabled={saving}
          autoFocus
        />
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-green-600" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setValue(toInputValue(serviceDate)); setEditing(false); }} disabled={saving}>
          <X className="h-3 w-3 text-slate-400" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={displayDate ? "text-slate-800" : "text-slate-400 italic"}>
        {displayDate ?? "Not set"}
      </span>
      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditing(true)}>
        <Pencil className="h-3 w-3 text-slate-400" />
      </Button>
    </div>
  );
}

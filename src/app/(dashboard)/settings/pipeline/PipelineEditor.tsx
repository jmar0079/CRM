"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, GripVertical, Loader2 } from "lucide-react";
interface PipelineStage { id: string; name: string; position: number; color: string | null; _count?: { leads: number }; }

interface PipelineEditorProps {
  stages: PipelineStage[];
}

export function PipelineEditor({ stages: initialStages }: PipelineEditorProps) {
  const [stages, setStages] = useState(initialStages);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function addStage() {
    if (!newName.trim()) return;
    setLoading("add");
    setError("");
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setStages((prev) => [...prev, data.stage]);
      setNewName("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add stage");
    } finally {
      setLoading(null);
    }
  }

  async function deleteStage(id: string) {
    setLoading(id);
    setError("");
    try {
      const res = await fetch(`/api/pipeline/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed");
      }
      setStages((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete stage");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="space-y-2">
        {stages.map((stage) => (
          <li
            key={stage.id}
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <GripVertical className="h-4 w-4 text-slate-300" />
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: stage.color ?? "#6366f1" }}
            />
            <span className="flex-1 text-sm font-medium text-slate-800">{stage.name}</span>
            <Badge variant="secondary" className="text-xs">
              pos {stage.position}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-red-600"
              onClick={() => deleteStage(stage.id)}
              disabled={loading === stage.id}
            >
              {loading === stage.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <Input
          placeholder="New stage name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addStage()}
        />
        <Button onClick={addStage} disabled={loading === "add" || !newName.trim()}>
          {loading === "add" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add
        </Button>
      </div>
    </div>
  );
}

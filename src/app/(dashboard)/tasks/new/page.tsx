"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Suspense } from "react";

function NewTaskForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") ?? "";
  const customerId = searchParams.get("customerId") ?? "";
  const leadId = searchParams.get("leadId") ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    jobId,
    customerId,
    leadId,
  });

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
          jobId: form.jobId || undefined,
          customerId: form.customerId || undefined,
          leadId: form.leadId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create task");
      router.push("/tasks");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Task Title *</Label>
        <Input id="title" value={form.title} onChange={update("title")} required disabled={loading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          rows={2}
          value={form.description}
          onChange={update("description")}
          disabled={loading}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            value={form.priority}
            onChange={update("priority")}
            disabled={loading}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input id="dueDate" type="datetime-local" value={form.dueDate} onChange={update("dueDate")} disabled={loading} />
        </div>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Task
        </Button>
        <Link href="/tasks">
          <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
        </Link>
      </div>
    </form>
  );
}

export default function NewTaskPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tasks">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Task</h1>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Task Details</CardTitle></CardHeader>
        <CardContent>
          <Suspense>
            <NewTaskForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

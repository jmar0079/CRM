"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Pencil, Trash2, X, Check } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  durationMinutes: number | null;
  category: string | null;
  hasColorOption: boolean;
}

interface ServiceManagerProps {
  initialServices: Service[];
}

const emptyForm = { name: "", description: "", price: "", durationMinutes: "", category: "", hasColorOption: false };

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function ServiceManager({ initialServices }: ServiceManagerProps) {
  const [services, setServices] = useState(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function openAddForm() {
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  }

  function cancelAdd() {
    setShowForm(false);
    setError("");
  }

  async function handleAdd() {
    if (!form.name.trim()) { setError("Service name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          price: form.price !== "" ? parseFloat(form.price) : undefined,
          durationMinutes: form.durationMinutes !== "" ? parseInt(form.durationMinutes) : undefined,
          category: form.category || undefined,
          hasColorOption: form.hasColorOption,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add service");
      setServices((prev) => [...prev, data.service].sort((a, b) => a.name.localeCompare(b.name)));
      setShowForm(false);
      setForm(emptyForm);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(svc: Service) {
    setEditingId(svc.id);
    setEditForm({
      name: svc.name,
      description: svc.description ?? "",
      price: svc.price != null ? String(svc.price) : "",
      durationMinutes: svc.durationMinutes != null ? String(svc.durationMinutes) : "",
      category: svc.category ?? "",
      hasColorOption: svc.hasColorOption,
    });
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setError("");
  }

  async function handleSaveEdit(id: string) {
    if (!editForm.name.trim()) { setError("Service name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description || null,
          price: editForm.price !== "" ? parseFloat(editForm.price) : null,
          durationMinutes: editForm.durationMinutes !== "" ? parseInt(editForm.durationMinutes) : null,
          category: editForm.category || null,
          hasColorOption: editForm.hasColorOption,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setServices((prev) =>
        prev.map((s) => (s.id === id ? data.service : s)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this service?")) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed");
      }
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Service Catalog</CardTitle>
        {!showForm && (
          <Button size="sm" onClick={openAddForm}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Service
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {showForm && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
            <p className="text-sm font-medium text-slate-800">New Service</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Service Name *</Label>
                <Input
                  placeholder="e.g. Lawn Mowing"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duration (minutes)</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="60"
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Input
                  placeholder="e.g. Landscaping"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea
                  placeholder="Optional description..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="text-sm min-h-[60px]"
                  rows={2}
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="add-has-color"
                  checked={form.hasColorOption}
                  onChange={(e) => setForm((f) => ({ ...f, hasColorOption: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <Label htmlFor="add-has-color" className="text-xs cursor-pointer">
                  Allow customers to pick a color when booking this service
                </Label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={cancelAdd} disabled={saving}>
                <X className="mr-1 h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={saving}>
                {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </div>
        )}

        {services.length === 0 && !showForm ? (
          <p className="text-sm text-slate-400">No services yet. Click &quot;Add Service&quot; to get started.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {services.map((svc) =>
              editingId === svc.id ? (
                <li key={svc.id} className="py-3 space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs">Service Name *</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.price}
                        onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Duration (min)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={editForm.durationMinutes}
                        onChange={(e) => setEditForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Category</Label>
                      <Input
                        value={editForm.category}
                        onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        className="text-sm min-h-[60px]"
                        rows={2}
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={`edit-has-color-${svc.id}`}
                        checked={editForm.hasColorOption}
                        onChange={(e) => setEditForm((f) => ({ ...f, hasColorOption: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                      <Label htmlFor={`edit-has-color-${svc.id}`} className="text-xs cursor-pointer">
                        Allow customers to pick a color when booking this service
                      </Label>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>
                      <X className="mr-1 h-3.5 w-3.5" /> Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleSaveEdit(svc.id)} disabled={saving}>
                      {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                      Save
                    </Button>
                  </div>
                </li>
              ) : (
                <li key={svc.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{svc.name}</p>
                    {svc.category && (
                      <p className="text-xs text-slate-400 mt-0.5">{svc.category}</p>
                    )}
                    {svc.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{svc.description}</p>
                    )}
                    {svc.hasColorOption && (
                      <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700 border border-purple-200">
                        🎨 Color picker enabled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {svc.price != null && (
                      <span className="text-sm font-semibold text-slate-700">
                        {formatCurrency(svc.price)}
                      </span>
                    )}
                    {svc.durationMinutes != null && (
                      <span className="text-xs text-slate-400">{svc.durationMinutes}m</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-blue-600"
                      onClick={() => startEdit(svc)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-600"
                      onClick={() => handleDelete(svc.id)}
                      disabled={deletingId === svc.id}
                    >
                      {deletingId === svc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  description: string;
  metadata: any;
  createdAt: string;
  isNew: boolean;
}

export function NotificationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // When opening, mark notifications as viewed (remove red dot)
    fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
  }, [open]);

  return (
    <div
      className={`fixed right-0 top-0 h-full w-96 bg-white shadow-lg transform transition-transform z-50 ${open ? "translate-x-0" : "translate-x-full"}`}
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {!loading && notifications && notifications.length === 0 && (
          <p className="text-sm text-slate-500">No notifications</p>
        )}
        {!loading && notifications && notifications.length > 0 && (
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li key={n.id} className={`rounded-lg border p-3 ${n.isNew ? "bg-blue-50" : "bg-white"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{n.type.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-slate-600">{n.description}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

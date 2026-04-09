"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const checkUnread = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        const unread = data.notifications?.some((n: any) => n.isNew) ?? false;
        setHasUnread(unread);
      } catch (err) {
        console.error("Failed to check unread notifications", err);
      }
    };
    checkUnread();
    // Poll every 30 seconds
    const interval = setInterval(checkUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        {title && (
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        )}
        <div className="ml-auto flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" onClick={() => setDrawerOpen(true)}>
            <Bell className="h-4 w-4" />
            {hasUnread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
          </Button>
        </div>
      </header>
      <NotificationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

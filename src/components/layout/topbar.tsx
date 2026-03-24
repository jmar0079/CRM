"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  return (
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </Button>
      </div>
    </header>
  );
}

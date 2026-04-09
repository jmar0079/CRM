"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface NotifToggle {
  key: string;
  label: string;
  description: string;
}

const EMAIL_NOTIFS: NotifToggle[] = [
  { key: "email_new_lead", label: "New lead captured", description: "Receive an email when a new lead is created via the public form or manually." },
  { key: "email_message_received", label: "Return message from customer or lead", description: "Get notified when a customer or lead sends a message." },
  { key: "email_new_task", label: "New task", description: "Notification when a new task is created." },
];

const SMS_NOTIFS: NotifToggle[] = [
  { key: "sms_new_lead", label: "New lead captured", description: "Receive an SMS for every new inbound lead." },
  { key: "sms_message_received", label: "Return message from customer or lead", description: "SMS alert when a customer or lead sends a message." },
  { key: "sms_new_task", label: "New task", description: "SMS notification for new tasks." },
];

const DEFAULT_STATE: Record<string, boolean> = {
  email_new_lead: true,
  email_message_received: true,
  email_new_task: true,
  sms_new_lead: false,
  sms_message_received: false,
  sms_new_task: false,
};

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? "bg-blue-600" : "bg-slate-200"}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(DEFAULT_STATE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(key: string, val: boolean) {
    setPrefs((p) => ({ ...p, [key]: val }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    // In a full implementation this would PATCH /api/settings/notifications
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500 mt-1">Control which events trigger email or SMS alerts for your team.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Email Notifications</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {EMAIL_NOTIFS.map((n) => (
              <div key={n.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="pr-4">
                  <p className="text-sm font-medium text-slate-800">{n.label}</p>
                  <p className="text-xs text-slate-500">{n.description}</p>
                </div>
                <Toggle enabled={prefs[n.key] ?? false} onChange={(v) => toggle(n.key, v)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SMS Notifications</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {SMS_NOTIFS.map((n) => (
              <div key={n.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="pr-4">
                  <p className="text-sm font-medium text-slate-800">{n.label}</p>
                  <p className="text-xs text-slate-500">{n.description}</p>
                </div>
                <Toggle enabled={prefs[n.key] ?? false} onChange={(v) => toggle(n.key, v)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
      </div>
    </div>
  );
}

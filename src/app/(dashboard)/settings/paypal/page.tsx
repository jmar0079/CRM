"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Lock, ExternalLink, Loader2, AlertTriangle, ShieldCheck, Trash2 } from "lucide-react";

type Mode = "idle" | "setup" | "pin-gate" | "manage" | "disable";

interface PayPalStatus {
  enabled: boolean;
  mode: string;
  hasClientId: boolean;
  hasPin: boolean;
  clientIdHint: string | null;
}

const STEPS = [
  {
    num: 1,
    title: "Go to the PayPal Developer Dashboard",
    body: (
      <span>
        Visit{" "}
        <a
          href="https://developer.paypal.com/dashboard/applications"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 inline-flex items-center gap-1"
        >
          developer.paypal.com/dashboard/applications
          <ExternalLink className="h-3 w-3" />
        </a>{" "}
        and sign in with your PayPal business account.
      </span>
    ),
  },
  {
    num: 2,
    title: 'Create an App',
    body: 'Click "Create App", give it any name (e.g. "My CRM Payments"), and select "Merchant" as the app type. Click Create.',
  },
  {
    num: 3,
    title: "Copy your Client ID and Secret",
    body: 'Under your new app you\'ll see "Client ID" and "Secret". Copy both — you\'ll need them below. Start with Sandbox for testing, then switch to Live when ready to accept real payments.',
  },
  {
    num: 4,
    title: "Set a 4-digit security PIN",
    body: "Your Client Secret is encrypted in our database. You'll set a 4-digit PIN below — this PIN is required to view or change your credentials at any time.",
  },
];

export default function PayPalSettingsPage() {
  const [status, setStatus] = useState<PayPalStatus | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [pin, setPin] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [paypalMode, setPaypalMode] = useState<"SANDBOX" | "LIVE">("SANDBOX");

  // After PIN verification
  const [verifiedClientId, setVerifiedClientId] = useState("");
  const [verifiedMode, setVerifiedMode] = useState("");

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/paypal");
      const data = await res.json();
      setStatus(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStatus(); }, []);

  function reset() {
    setMode("idle");
    setPin("");
    setClientId("");
    setClientSecret("");
    setError("");
    setSuccess("");
    setVerifiedClientId("");
    setVerifiedMode("");
  }

  async function handleSave() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/settings/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, clientId, clientSecret, mode: paypalMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSuccess("PayPal credentials saved successfully!");
      await loadStatus();
      reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyPin() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/settings/paypal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Incorrect PIN");
      setVerifiedClientId(data.clientId ?? "");
      setVerifiedMode(data.mode ?? "");
      setClientId(data.clientId ?? "");
      setPaypalMode(data.mode === "LIVE" ? "LIVE" : "SANDBOX");
      setMode("manage");
      setPin("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/settings/paypal", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSuccess("PayPal has been disconnected.");
      await loadStatus();
      reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">PayPal Payments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connect your PayPal account so customers can pay their invoices directly from their portal.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* ── Current status banner ── */}
      {status?.enabled && mode === "idle" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">PayPal is connected</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Mode: <span className="font-semibold">{status.mode}</span>
                    {status.clientIdHint && ` · Client ID: ${status.clientIdHint}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setMode("pin-gate"); setError(""); }}>
                  <Lock className="h-3.5 w-3.5" />
                  Update Credentials
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setMode("disable"); setError(""); }}
                  className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                  Disconnect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Not yet set up ── */}
      {!status?.enabled && mode === "idle" && (
        <Card className="border-slate-200">
          <CardContent className="p-6 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                <path d="M7 12C7 8.686 9.686 6 13 6h1c2.761 0 5 2.239 5 5s-2.239 5-5 5H9l-2 5H5l2-9z" fill="#003087" />
                <path d="M5 12C5 8.134 8.134 5 12 5h1c3.314 0 6 2.686 6 6s-2.686 6-6 6H9.5L7 22H4.5L7 12z" fill="#009cde" opacity=".7" />
              </svg>
            </div>
            <p className="font-medium text-slate-800">PayPal is not connected</p>
            <p className="text-sm text-slate-500">Follow the steps below, then enter your credentials to enable payments.</p>
            <Button onClick={() => setMode("setup")}>Connect PayPal</Button>
          </CardContent>
        </Card>
      )}

      {/* ── Step-by-step instructions ── */}
      {(mode === "setup" || mode === "manage") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">How to get your PayPal API credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {STEPS.map((step) => (
              <div key={step.num} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {step.num}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{step.body}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Setup / Edit form ── */}
      {(mode === "setup" || mode === "manage") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {mode === "manage" ? "Update PayPal Credentials" : "Enter Your PayPal Credentials"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "manage" && verifiedClientId && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">
                Currently using Client ID: <span className="font-mono text-slate-700">{verifiedClientId}</span>
                {" "}· Mode: <span className="font-semibold">{verifiedMode}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="clientId">PayPal Client ID</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="AaBbCcDd..."
                className="font-mono text-sm"
                disabled={busy}
              />
              <p className="text-xs text-slate-400">Found on your app page in the PayPal Developer Dashboard.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clientSecret">PayPal Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="••••••••••••••••"
                className="font-mono text-sm"
                disabled={busy}
              />
              <p className="text-xs text-slate-400">Encrypted and stored securely. Never visible after saving.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Mode</Label>
              <div className="flex gap-3">
                {(["SANDBOX", "LIVE"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaypalMode(m)}
                    disabled={busy}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      paypalMode === m
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {m === "SANDBOX" ? "🧪 Sandbox (Testing)" : "✅ Live (Real Payments)"}
                  </button>
                ))}
              </div>
              {paypalMode === "LIVE" && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 mt-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">Live mode will charge real money. Make sure you&apos;ve tested in Sandbox first.</p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pin">
                {mode === "manage" ? "New 4-Digit Security PIN" : "Set a 4-Digit Security PIN"}
              </Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="w-24 text-center tracking-widest font-mono"
                disabled={busy}
              />
              <p className="text-xs text-slate-400">
                {mode === "manage"
                  ? "Enter a new PIN to replace the existing one, or your existing PIN to keep it."
                  : "You'll need this PIN to view or update your credentials in the future."}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button onClick={handleSave} disabled={busy || pin.length !== 4 || !clientId || !clientSecret}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Credentials
              </Button>
              <Button variant="outline" onClick={reset} disabled={busy}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── PIN gate (to update or view existing credentials) ── */}
      {mode === "pin-gate" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Lock className="h-4 w-4" /> Enter your security PIN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">
              Enter your 4-digit PIN to access your PayPal credentials.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="pinVerify">4-Digit PIN</Label>
              <Input
                id="pinVerify"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="w-24 text-center tracking-widest font-mono"
                disabled={busy}
                onKeyDown={(e) => { if (e.key === "Enter" && pin.length === 4) handleVerifyPin(); }}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <Button onClick={handleVerifyPin} disabled={busy || pin.length !== 4}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Unlock
              </Button>
              <Button variant="outline" onClick={reset} disabled={busy}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Disable / disconnect gate ── */}
      {mode === "disable" && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Disconnect PayPal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              This will remove your PayPal credentials and disable the Pay Now button for customers.
              Enter your 4-digit PIN to confirm.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="pinDisable">4-Digit PIN</Label>
              <Input
                id="pinDisable"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="w-24 text-center tracking-widest font-mono"
                disabled={busy}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <Button
                onClick={handleDisable}
                disabled={busy || pin.length !== 4}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Yes, Disconnect PayPal
              </Button>
              <Button variant="outline" onClick={reset} disabled={busy}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Building2, User } from "lucide-react";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [mode, setMode] = useState<"business" | "customer">("business");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBusinessSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  function handleCustomerSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/inquire");
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
          <span className="text-xl font-bold text-white">C</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Choose how you&apos;d like to sign in</p>
      </div>

      {/* Mode toggle */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => { setMode("business"); setError(""); }}
          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
            mode === "business"
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
          }`}
        >
          <Building2 className="h-6 w-6" />
          <span className="text-sm font-semibold">I&apos;m a Business</span>
          <span className="text-xs text-center leading-tight opacity-70">Access your CRM dashboard</span>
        </button>
        <button
          type="button"
          onClick={() => { setMode("customer"); setError(""); }}
          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
            mode === "customer"
              ? "border-green-600 bg-green-50 text-green-700"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
          }`}
        >
          <User className="h-6 w-6" />
          <span className="text-sm font-semibold">I&apos;m a Customer</span>
          <span className="text-xs text-center leading-tight opacity-70">Find & book services</span>
        </button>
      </div>

      {/* Business login */}
      {mode === "business" && (
        <>
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleBusinessSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="you@business.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••"
                  />
                </div>
                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In to Dashboard
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className="mt-4 text-center text-sm text-slate-500">
            Don&apos;t have a business account?{" "}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Create one free
            </Link>
          </p>
        </>
      )}

      {/* Customer portal */}
      {mode === "customer" && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                  As a customer you can search for local service providers and book appointments directly — no account required.
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => router.push("/inquire")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Find Service Providers
                </Button>
              </div>
            </CardContent>
          </Card>
          <p className="mt-4 text-center text-sm text-slate-500">
            Want to save your searches?{" "}
            <Link href="/customer/register" className="text-green-600 hover:underline font-medium">
              Create a customer account
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, X, ExternalLink } from "lucide-react";

interface OnboardingChecklist {
  hasOrg: boolean;
  hasService: boolean;
  hasLead: boolean;
  orgSlug: string;
}

export function OnboardingChecklist({ hasOrg, hasService, hasLead, orgSlug }: OnboardingChecklist) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("onboarding-dismissed") === "true") {
      setDismissed(true);
    }
  }, []);

  const allDone = hasOrg && hasService && hasLead;

  // Don't show if dismissed or everything is already done
  if (dismissed || allDone) return null;

  const steps = [
    {
      done: hasOrg,
      label: "Set up your organization info",
      href: "/settings/organization",
      desc: "Add your business name, phone, and address",
    },
    {
      done: hasService,
      label: "Add your first service",
      href: "/settings/services",
      desc: "Build your service catalog with prices",
    },
    {
      done: hasLead,
      label: "Get your first lead or customer",
      href: `/book?org=${orgSlug}`,
      desc: "Share your booking link or add one manually",
      external: true,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  function dismiss() {
    localStorage.setItem("onboarding-dismissed", "true");
    setDismissed(true);
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 relative">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 rounded p-1 text-blue-400 hover:text-blue-700 hover:bg-blue-100"
        title="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mb-3">
        <p className="font-semibold text-slate-900">
          🚀 Get started — {doneCount}/{steps.length} complete
        </p>
        <p className="text-sm text-slate-500 mt-0.5">
          Complete these steps to start using your CRM.
        </p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-blue-200">
          <div
            className="h-1.5 rounded-full bg-blue-500 transition-all"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-start gap-3">
            {step.done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-blue-300 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              {step.done ? (
                <p className="text-sm font-medium text-slate-400 line-through">{step.label}</p>
              ) : (
                <Link
                  href={step.href}
                  target={step.external ? "_blank" : undefined}
                  className="flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
                >
                  {step.label}
                  {step.external && <ExternalLink className="h-3 w-3" />}
                </Link>
              )}
              {!step.done && (
                <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, type Step } from "react-joyride";

const steps: Step[] = [
  {
    target: "body",
    content: (
      <div>
        <h3 className="font-bold text-slate-900 mb-1">Welcome to your CRM! 👋</h3>
        <p className="text-sm text-slate-600">
          Let&apos;s take a quick tour so you know where everything is.
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: "[data-tour='leads']",
    content: (
      <div>
        <p className="font-semibold text-slate-900 mb-1">Leads</p>
        <p className="text-sm text-slate-600">
          When a potential customer fills out your booking form, they appear here as a lead. You can track them through the sales process.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: "[data-tour='customers']",
    content: (
      <div>
        <p className="font-semibold text-slate-900 mb-1">Customers</p>
        <p className="text-sm text-slate-600">
          Once a lead is converted, they become a customer. You can view their full history, quotes, and invoices here.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: "[data-tour='quotes']",
    content: (
      <div>
        <p className="font-semibold text-slate-900 mb-1">Quotes</p>
        <p className="text-sm text-slate-600">
          Quotes are automatically created when a lead comes in. Set the price and send it to your customer.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: "[data-tour='invoices']",
    content: (
      <div>
        <p className="font-semibold text-slate-900 mb-1">Invoices</p>
        <p className="text-sm text-slate-600">
          Invoices are created when a lead is converted to a customer. Mark them as paid once you&apos;ve received payment.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: "[data-tour='settings']",
    content: (
      <div>
        <p className="font-semibold text-slate-900 mb-1">Settings</p>
        <p className="text-sm text-slate-600">
          Start here! Add your services &amp; pricing, set up your organization info, and get your booking link to share with customers.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
];

export function AppTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("tour-completed");
    if (!seen) {
      // slight delay so sidebar renders first
      setTimeout(() => setRun(true), 800);
    }
  }, []);

  function handleCallback(data: CallBackProps) {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem("tour-completed", "true");
      setRun(false);
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: "#2563eb",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "0.75rem",
          padding: "1rem",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Done",
        next: "Next",
        skip: "Skip tour",
      }}
    />
  );
}

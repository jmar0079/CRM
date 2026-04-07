import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCopyLink } from "./HelpCopyLink";
import {
  BookOpen,
  Users,
  UserCheck,
  FileText,
  Receipt,
  Settings,
  Link2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Help & Quick Start" };

const steps = [
  {
    icon: Settings,
    title: "1. Set up your organization",
    desc: "Go to Settings → Organization to add your business name, phone, address, and working hours.",
    href: "/settings/organization",
  },
  {
    icon: FileText,
    title: "2. Add your services & pricing",
    desc: "Go to Settings → Services & Pricing to create your service catalog. These will be available when creating quotes.",
    href: "/settings/services",
  },
  {
    icon: Link2,
    title: "3. Share your booking link",
    desc: "Copy your booking link below and share it on your website, social media, or with customers directly. Bookings fill your Leads automatically.",
    href: null,
  },
  {
    icon: Users,
    title: "4. Work your leads",
    desc: "New bookings appear in Leads. Review the auto-created quote, update the price if needed, and reach out to the customer.",
    href: "/leads",
  },
  {
    icon: UserCheck,
    title: "5. Convert leads to customers",
    desc: "When a lead is ready to proceed, click 'Convert to Customer' on their lead page. This creates a customer record and a draft invoice.",
    href: "/leads",
  },
  {
    icon: Receipt,
    title: "6. Manage invoices",
    desc: "Invoices are created automatically on conversion. Mark them as paid once you receive payment.",
    href: "/invoices",
  },
];

const faqs = [
  {
    q: "Where does my booking link come from?",
    a: "Your booking link uses your organization's unique slug, set when you registered. You can see it in Settings → Organization.",
  },
  {
    q: "How do I change the price on a quote?",
    a: "Go to Quotes, open the quote, and edit the total or line items. Quotes start as drafts with $0 until you set a price.",
  },
  {
    q: "What happens when I convert a lead?",
    a: "A customer record is created with all their info, the draft quote is linked to them, and a draft invoice is automatically created.",
  },
  {
    q: "How do I mark an invoice as paid?",
    a: "Open the invoice from the Invoices page and click the green 'Mark Paid' button.",
  },
  {
    q: "Can I add a customer manually?",
    a: "Yes — go to Customers and click 'New Customer' to add someone without them going through the booking form.",
  },
  {
    q: "How do I sign out?",
    a: "Click the logout icon (↩) next to your name at the bottom of the left sidebar.",
  },
];

export default async function HelpPage() {
  const session = await auth();
  const org = await db.organization.findUnique({
    where: { id: session!.user.orgId },
    select: { slug: true },
  });

  const bookingUrl = org
    ? `${process.env.NEXTAUTH_URL ?? "https://crm1-gules.vercel.app"}/book?org=${org.slug}`
    : "";

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" /> Help & Quick Start
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Everything you need to get up and running.
        </p>
      </div>

      {/* Booking Link */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Your Booking Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-blue-600 mb-2">
            Share this link with customers so they can book a service. Submissions automatically appear in your Leads.
          </p>
          <HelpCopyLink url={bookingUrl} />
        </CardContent>
      </Card>

      {/* Quick Start */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Quick Start Guide</h2>
        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="rounded-lg bg-blue-50 p-2 shrink-0">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 text-sm">{step.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{step.desc}</p>
                </div>
                {step.href && (
                  <Link href={step.href} className="shrink-0 mt-0.5">
                    <ChevronRight className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-900 text-sm">{faq.q}</p>
              <p className="text-sm text-slate-500 mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

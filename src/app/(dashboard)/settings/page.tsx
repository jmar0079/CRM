import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Layers, Users, Wrench, Bell } from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

const settingsSections = [
  {
    href: "/settings/organization",
    icon: Building2,
    title: "Organization",
    description: "Name, logo, address, timezone, and default preferences.",
  },
  {
    href: "/settings/pipeline",
    icon: Layers,
    title: "Pipeline Stages",
    description: "Add, rename, reorder, or remove pipeline stages.",
  },
  {
    href: "/settings/team",
    icon: Users,
    title: "Team Members",
    description: "Invite users and manage roles.",
  },
  {
    href: "/settings/services",
    icon: Wrench,
    title: "Services & Pricing",
    description: "Build your service catalog with default prices.",
  },
  {
    href: "/settings/notifications",
    icon: Bell,
    title: "Notifications",
    description: "Configure email and SMS notification triggers.",
  },
];

export default async function SettingsPage() {
  const session = await auth();
  const orgId = session!.user.orgId;

  const org = await db.organization.findUnique({ where: { id: orgId } });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account, organization, and preferences.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-blue-50 p-2.5">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{section.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{section.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Name</span>
            <span className="font-medium text-slate-900">{org?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Slug</span>
            <span className="font-mono text-slate-700">{org?.slug}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Plan</span>
            <span className="capitalize text-slate-700">Free</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Created</span>
            <span className="text-slate-700">
              {org?.createdAt.toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ServiceManager } from "./ServiceManager";

export const metadata: Metadata = { title: "Services & Pricing" };

export default async function ServicesSettingsPage() {
  const session = await auth();
  const orgId = session!.user.orgId;

  const services = await db.service.findMany({
    where: { orgId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Services & Pricing</h1>
      </div>

      <ServiceManager initialServices={services} />
    </div>
  );
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Services & Pricing</h1>
        </div>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-slate-400">No services yet. Add your first service.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {services.map((svc) => (
                <li key={svc.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{svc.name}</p>
                    {svc.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{svc.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {svc.price != null && (
                      <span className="text-sm font-medium text-slate-700">
                        {formatCurrency(svc.price)}
                      </span>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Edit
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

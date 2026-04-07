import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { PipelineEditor } from "./PipelineEditor";

export const metadata: Metadata = { title: "Pipeline Stages" };

export default async function PipelineSettingsPage() {
  const session = await auth();
  const orgId = session!.user.orgId;

  const stages = await db.pipelineStage.findMany({
    where: { orgId },
    orderBy: { position: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Pipeline Stages</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage Stages</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineEditor stages={stages} />
        </CardContent>
      </Card>
    </div>
  );
}

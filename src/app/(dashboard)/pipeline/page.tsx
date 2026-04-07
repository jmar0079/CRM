import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const session = await auth();
  const orgId = session!.user.orgId;

  const stages = await db.pipelineStage.findMany({
    where: { orgId },
    orderBy: { position: "asc" },
    include: {
      leads: {
        where: { isArchived: false },
        orderBy: { updatedAt: "desc" },
        include: {
          tags: { include: { tag: true } },
        },
      },
    },
  });

  if (stages.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
          <p className="text-slate-500 mb-4">No pipeline stages configured yet.</p>
          <Link href="/settings/pipeline">
            <Button>Set up pipeline stages</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
        <div className="flex gap-2">
          <Link href="/settings/pipeline">
            <Button variant="outline" size="sm">Edit stages</Button>
          </Link>
          <Link href="/leads/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const totalValue = stage.leads.reduce(
            (sum, lead) => sum + (lead.estimatedValue ?? 0),
            0
          );

          return (
            <div
              key={stage.id}
              className="flex w-72 shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-50"
            >
              {/* Column header */}
              <div className="flex items-center justify-between rounded-t-xl border-b border-slate-200 bg-white px-3 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    {stage.name}
                  </span>
                  <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
                    {stage.leads.length}
                  </span>
                </div>
                {totalValue > 0 && (
                  <span className="text-xs text-slate-400">
                    {formatCurrency(totalValue)}
                  </span>
                )}
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 220px)" }}>
                {stage.leads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                  >
                    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <p className="text-sm font-medium text-slate-900">
                        {lead.firstName} {lead.lastName}
                      </p>
                      {lead.serviceInterest && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {lead.serviceInterest}
                        </p>
                      )}
                      {lead.estimatedValue && lead.estimatedValue > 0 && (
                        <p className="mt-1 text-xs font-semibold text-blue-600">
                          {formatCurrency(lead.estimatedValue)}
                        </p>
                      )}
                      {lead.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {lead.tags.slice(0, 3).map(({ tag }) => (
                            <span
                              key={tag.id}
                              className="rounded-full px-1.5 py-0.5 text-xs text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}

                {stage.leads.length === 0 && (
                  <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-8 text-xs text-slate-400">
                    Drop leads here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

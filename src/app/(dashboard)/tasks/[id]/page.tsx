import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, User, Briefcase } from "lucide-react";
import { formatDate, TASK_PRIORITY_COLORS } from "@/lib/utils";
import TaskActions from "./TaskActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const orgId = session!.user.orgId;

  const task = await db.task.findFirst({
    where: { id, orgId },
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      customer: { select: { id: true, firstName: true, lastName: true } },
      job: { select: { id: true, title: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  if (!task) notFound();

  const priorityColor = TASK_PRIORITY_COLORS[task.priority] ?? "text-slate-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/tasks">
          <Button variant="ghost" size="icon" className="mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className={`font-medium ${priorityColor}`}>
              {task.priority} priority
            </span>
            <span className="capitalize">{task.status.replace("_", " ").toLowerCase()}</span>
            {task.dueAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Due {formatDate(task.dueAt)}
              </span>
            )}
          </div>
        </div>
        <TaskActions taskId={task.id} currentStatus={task.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{task.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {task.assignedTo && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Assigned to</span>
                  <span className="font-medium text-slate-700">{task.assignedTo.name}</span>
                </div>
              )}
              {task.lead && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Lead:</span>
                  <Link href={`/leads/${task.lead.id}`} className="font-medium text-blue-600 hover:underline">
                    {task.lead.firstName} {task.lead.lastName}
                  </Link>
                </div>
              )}
              {task.customer && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Customer:</span>
                  <Link href={`/customers/${task.customer.id}`} className="font-medium text-blue-600 hover:underline">
                    {task.customer.firstName} {task.customer.lastName}
                  </Link>
                </div>
              )}
              {task.job && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Job:</span>
                  <Link href={`/jobs/${task.job.id}`} className="font-medium text-blue-600 hover:underline">
                    {task.job.title}
                  </Link>
                </div>
              )}
              <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                Created {formatDate(task.createdAt)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  formatCurrency,
  formatDateTime,
  formatDate,
} from "@/lib/utils";
import { ArrowLeft, MapPin, Calendar, DollarSign, FileText, CheckSquare, Activity } from "lucide-react";

export const metadata: Metadata = { title: "Job Detail" };

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const orgId = session!.user.orgId;

  const job = await db.job.findFirst({
    where: { id: params.id, orgId },
    include: {
      customer: true,
      tasks: { orderBy: { dueAt: "asc" } },
      invoices: { include: { items: true } },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!job) notFound();

  const contactName = job.customer
    ? `${job.customer.firstName} ${job.customer.lastName}`
    : "—";

  const contactHref = job.customer ? `/customers/${job.customer.id}` : "#";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/jobs">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
              <Badge className={JOB_STATUS_COLORS[job.status]}>
                {JOB_STATUS_LABELS[job.status]}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Contact:{" "}
              <Link href={contactHref} className="text-blue-600 hover:underline">
                {contactName}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job info card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {job.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Address</p>
                    <p className="text-sm text-slate-800">{job.address}</p>
                  </div>
                </div>
              )}
              {job.scheduledAt && (
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Scheduled</p>
                    <p className="text-sm text-slate-800">{formatDateTime(job.scheduledAt)}</p>
                  </div>
                </div>
              )}
              {job.completedAt && (
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Completed</p>
                    <p className="text-sm text-slate-800">{formatDateTime(job.completedAt)}</p>
                  </div>
                </div>
              )}
              {job.price != null && (
                <div className="flex items-start gap-2">
                  <DollarSign className="mt-0.5 h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Price</p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatCurrency(job.price)}
                    </p>
                  </div>
                </div>
              )}
              {job.description && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-1">Description</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{job.description}</p>
                </div>
              )}
              {job.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-1">Notes</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{job.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                Invoices
              </CardTitle>
              <Link href={`/invoices/new?jobId=${job.id}`}>
                <Button variant="outline" size="sm">
                  New Invoice
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {job.invoices.length === 0 ? (
                <p className="text-sm text-slate-400">No invoices yet.</p>
              ) : (
                <ul className="space-y-2">
                  {job.invoices.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                    >
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{formatDate(inv.dueAt ?? inv.createdAt)}</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(inv.total)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-slate-400" />
                Tasks
              </CardTitle>
              <Link href={`/tasks/new?jobId=${job.id}`}>
                <Button variant="outline" size="sm">
                  Add Task
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {job.tasks.length === 0 ? (
                <p className="text-sm text-slate-400">No tasks.</p>
              ) : (
                <ul className="space-y-2">
                  {job.tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={task.status === "COMPLETED"}
                        readOnly
                        className="rounded"
                      />
                      <span
                        className={
                          task.status === "COMPLETED"
                            ? "line-through text-slate-400"
                            : "text-slate-700"
                        }
                      >
                        {task.title}
                      </span>
                      {task.dueAt && (
                        <span className="ml-auto text-xs text-slate-400">
                          Due {formatDate(task.dueAt)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-400" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {job.activities.length === 0 ? (
                <p className="text-sm text-slate-400">No activity yet.</p>
              ) : (
                <ol className="relative border-l border-slate-200 space-y-4 pl-4">
                  {job.activities.map((act) => (
                    <li key={act.id} className="relative">
                      <span className="absolute -left-[17px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-white" />
                      <p className="text-xs text-slate-500">
                        {formatDateTime(act.createdAt)}
                      </p>
                      <p className="text-sm text-slate-700 mt-0.5">{act.description}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

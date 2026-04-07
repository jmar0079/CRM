import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS, formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Wrench } from "lucide-react";
type JobStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export const metadata: Metadata = { title: "Jobs" };

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await auth();
  const orgId = session!.user.orgId;
  const { page: pageParam, status } = await searchParams;
  const page = parseInt(pageParam ?? "1");
  const pageSize = 25;
  const statusFilter = status as JobStatus | undefined;

  const where = {
    orgId,
    ...(statusFilter ? { status: statusFilter as never } : {}),
  };

  const [jobs, total, counts] = await Promise.all([
    db.job.findMany({
      where,
      include: { customer: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { scheduledAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.job.count({ where }),
    db.job.groupBy({
      by: ["status"],
      where: { orgId },
      _count: { id: true },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const statusCounts = Object.fromEntries(counts.map((c) => [c.status, c._count.id]));

  const statuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as JobStatus[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
        <Link href="/jobs/new">
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/jobs"
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            !statusFilter
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All ({total})
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/jobs?status=${s}`}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {JOB_STATUS_LABELS[s]} ({statusCounts[s] ?? 0})
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="rounded-full bg-slate-100 p-4">
              <Wrench className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-500">No jobs found</p>
            <Link href="/jobs/new">
              <Button size="sm" variant="outline">
                Create first job
              </Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Customer / Lead</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => {
                const contactName = job.customer
                  ? `${job.customer.firstName} ${job.customer.lastName}`
                  : "—";
                return (
                  <tr
                    key={job.id}
                    className="group cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-medium text-slate-900 group-hover:text-blue-600"
                      >
                        {job.title}
                      </Link>
                      {job.address && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                          {job.address}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{contactName}</td>
                    <td className="px-4 py-3">
                      <Badge className={JOB_STATUS_COLORS[job.status]}>
                        {JOB_STATUS_LABELS[job.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {job.scheduledAt ? formatDate(job.scheduledAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {job.price != null ? formatCurrency(job.price) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/jobs?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
              >
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/jobs?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
              >
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, CheckSquare, Clock, AlertCircle } from "lucide-react";
import { formatDate, TASK_PRIORITY_COLORS } from "@/lib/utils";
type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";

type TaskWithRelations = Awaited<ReturnType<typeof db.task.findMany<{
  include: {
    lead: { select: { id: true; firstName: true; lastName: true } };
    customer: { select: { id: true; firstName: true; lastName: true } };
    job: { select: { id: true; title: true } };
    assignedTo: { select: { id: true; name: true } };
  };
}>>>[number];

export const metadata: Metadata = { title: "Tasks" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const orgId = session!.user.orgId;

  const status = (params.status as TaskStatus) ?? "PENDING";

  const tasks: TaskWithRelations[] = await db.task.findMany({
    where: { orgId, status: status as never },
    orderBy: [{ priority: "asc" }, { dueAt: "asc" }],
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      customer: { select: { id: true, firstName: true, lastName: true } },
      job: { select: { id: true, title: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.dueAt && new Date(t.dueAt) < now && t.status === "PENDING"
  );
  const todayTasks = tasks.filter(
    (t) =>
      t.dueAt &&
      new Date(t.dueAt).toDateString() === now.toDateString()
  );

  const tabs: { label: string; status: TaskStatus | "ALL" }[] = [
    { label: "Pending", status: "PENDING" },
    { label: "In Progress", status: "IN_PROGRESS" },
    { label: "Completed", status: "COMPLETED" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          {overdueTasks.length > 0 && (
            <p className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {overdueTasks.length} overdue
            </p>
          )}
        </div>
        <Link href="/tasks/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
        {tabs.map((tab) => (
          <Link
            key={tab.status}
            href={`?status=${tab.status}`}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              status === tab.status
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Today section */}
      {status === "PENDING" && todayTasks.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Due Today
          </h2>
          <TaskList tasks={todayTasks} highlight />
        </div>
      )}

      {/* All tasks */}
      <div>
        {status === "PENDING" && todayTasks.length > 0 && (
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            All Pending
          </h2>
        )}
        <TaskList tasks={tasks} />
      </div>
    </div>
  );
}

function TaskList({
  tasks,
  highlight = false,
}: {
  tasks: TaskWithRelations[];
  highlight?: boolean;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        No tasks here.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
      {tasks.map((task) => {
        const now = new Date();
        const isOverdue =
          task.dueAt && new Date(task.dueAt) < now && task.status === "PENDING";

        return (
          <li
            key={task.id}
            className={`flex items-start gap-4 px-4 py-3 hover:bg-slate-50 ${
              highlight ? "bg-blue-50/50" : ""
            }`}
          >
            <div className="mt-0.5">
              {task.status === "COMPLETED" ? (
                <CheckSquare className="h-5 w-5 text-green-500" />
              ) : (
                <Clock
                  className={`h-5 w-5 ${isOverdue ? "text-red-400" : "text-slate-300"}`}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <Link
                href={`/tasks/${task.id}`}
                className="text-sm font-medium text-slate-900 hover:text-blue-600"
              >
                {task.title}
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                {task.dueAt && (
                  <span className={isOverdue ? "text-red-500" : ""}>
                    {isOverdue ? "Overdue · " : "Due "}
                    {formatDate(task.dueAt)}
                  </span>
                )}
                {task.lead && (
                  <Link
                    href={`/leads/${task.lead.id}`}
                    className="text-blue-500 hover:underline"
                  >
                    Lead: {task.lead.firstName} {task.lead.lastName}
                  </Link>
                )}
                {task.customer && (
                  <Link
                    href={`/customers/${task.customer.id}`}
                    className="text-blue-500 hover:underline"
                  >
                    {task.customer.firstName} {task.customer.lastName}
                  </Link>
                )}
                {task.assignedTo && (
                  <span>Assigned to {task.assignedTo.name}</span>
                )}
              </div>
            </div>

            <span
              className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                TASK_PRIORITY_COLORS[task.priority]
              }`}
            >
              {task.priority}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

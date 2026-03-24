import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import { JOB_STATUS_COLORS } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendar" };

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const orgId = session!.user.orgId;

  const now = new Date();
  const year = Number(params.year ?? now.getFullYear());
  const month = Number(params.month ?? now.getMonth());
  const currentDate = new Date(year, month, 1);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const jobs = await db.job.findMany({
    where: {
      orgId,
      scheduledAt: { gte: calendarStart, lte: calendarEnd },
    },
    include: {
      customer: { select: { firstName: true, lastName: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const prevMonth = subMonths(currentDate, 1);
  const nextMonth = addMonths(currentDate, 1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        <Link href="/jobs/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <Link
            href={`?month=${prevMonth.getMonth()}&year=${prevMonth.getFullYear()}`}
          >
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-base font-semibold text-slate-900">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <Link
            href={`?month=${nextMonth.getMonth()}&year=${nextMonth.getFullYear()}`}
          >
            <Button variant="ghost" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="px-3 py-2 text-center text-xs font-medium text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayJobs = jobs.filter(
              (job) => job.scheduledAt && isSameDay(new Date(job.scheduledAt), day)
            );
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, now);

            return (
              <div
                key={idx}
                className={`min-h-[100px] border-b border-r border-slate-100 p-2 ${
                  !isCurrentMonth ? "bg-slate-50/50" : ""
                }`}
              >
                <div
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday
                      ? "bg-blue-600 text-white"
                      : isCurrentMonth
                      ? "text-slate-700"
                      : "text-slate-300"
                  }`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayJobs.slice(0, 3).map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className={`block truncate rounded px-1.5 py-0.5 text-xs font-medium ${
                        JOB_STATUS_COLORS[job.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {job.scheduledAt &&
                        format(new Date(job.scheduledAt), "h:mm a")}{" "}
                      {job.customer.firstName}
                    </Link>
                  ))}
                  {dayJobs.length > 3 && (
                    <p className="text-xs text-slate-400 pl-1">
                      +{dayJobs.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

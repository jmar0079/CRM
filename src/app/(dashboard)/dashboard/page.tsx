import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  Briefcase,
  DollarSign,
  CheckSquare,
  TrendingUp,
  AlertCircle,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { OnboardingChecklist } from "@/components/ui/onboarding-checklist";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardStats(orgId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalLeads,
    newLeadsThisWeek,
    totalCustomers,
    activeJobs,
    jobsThisWeek,
    revenueThisMonth,
    revenueLastMonth,
    pendingTasks,
    overdueInvoices,
    recentLeads,
    upcomingJobs,
  ] = await Promise.all([
    db.lead.count({ where: { orgId, isArchived: false } }),
    db.lead.count({ where: { orgId, createdAt: { gte: weekAgo } } }),
    db.customer.count({ where: { orgId } }),
    db.job.count({ where: { orgId, status: { in: ["SCHEDULED", "IN_PROGRESS"] } } }),
    db.job.count({ where: { orgId, scheduledAt: { gte: weekAgo } } }),
    db.payment.aggregate({
      where: { orgId, status: "COMPLETED", paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: {
        orgId,
        status: "COMPLETED",
        paidAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true },
    }),
    db.task.count({ where: { orgId, status: "PENDING" } }),
    db.invoice.count({ where: { orgId, status: "OVERDUE" } }),
    db.lead.findMany({
      where: { orgId, isArchived: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        source: true,
        status: true,
        createdAt: true,
      },
    }),
    db.job.findMany({
      where: { orgId, status: "SCHEDULED", scheduledAt: { gte: now } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      include: { customer: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const thisMonthRevenue = revenueThisMonth._sum.amount ?? 0;
  const lastMonthRevenue = revenueLastMonth._sum.amount ?? 0;
  const revenueGrowth =
    lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

  return {
    totalLeads,
    newLeadsThisWeek,
    totalCustomers,
    activeJobs,
    jobsThisWeek,
    thisMonthRevenue,
    revenueGrowth,
    pendingTasks,
    overdueInvoices,
    recentLeads,
    upcomingJobs,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats(session!.user.orgId);

  // Onboarding data
  const [org, serviceCount, leadCount, customerCount] = await Promise.all([
    db.organization.findUnique({ where: { id: session!.user.orgId }, select: { phone: true, slug: true, address: true } }),
    db.service.count({ where: { orgId: session!.user.orgId } }),
    db.lead.count({ where: { orgId: session!.user.orgId } }),
    db.customer.count({ where: { orgId: session!.user.orgId } }),
  ]);

  const hasOrg = !!(org?.phone || org?.address);
  const hasService = serviceCount > 0;
  const hasLead = leadCount > 0 || customerCount > 0;

  const statCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
      sub: `+${stats.newLeadsThisWeek} this week`,
      icon: Users,
      href: "/leads",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Customers",
      value: stats.totalCustomers,
      sub: "Active customers",
      icon: UserCheck,
      href: "/customers",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      sub: `${stats.jobsThisWeek} scheduled this week`,
      icon: Briefcase,
      href: "/jobs",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Revenue (Month)",
      value: formatCurrency(stats.thisMonthRevenue),
      sub:
        stats.revenueGrowth >= 0
          ? `+${stats.revenueGrowth.toFixed(1)}% vs last month`
          : `${stats.revenueGrowth.toFixed(1)}% vs last month`,
      icon: DollarSign,
      href: "/analytics",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Good {getGreeting()}, {session!.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-slate-500">Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist
        hasOrg={hasOrg}
        hasService={hasService}
        hasLead={hasLead}
        orgSlug={org?.slug ?? ""}
      />

      {/* Alert banners */}
      {(stats.overdueInvoices > 0 || stats.pendingTasks > 0) && (
        <div className="flex flex-wrap gap-3">
          {stats.overdueInvoices > 0 && (
            <Link
              href="/invoices?status=OVERDUE"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
            >
              <AlertCircle className="h-4 w-4" />
              {stats.overdueInvoices} overdue invoice
              {stats.overdueInvoices > 1 ? "s" : ""}
            </Link>
          )}
          {stats.pendingTasks > 0 && (
            <Link
              href="/tasks"
              className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-100"
            >
              <Clock className="h-4 w-4" />
              {stats.pendingTasks} pending task
              {stats.pendingTasks > 1 ? "s" : ""}
            </Link>
          )}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {card.title}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {card.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Two column grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Leads</CardTitle>
            <Link
              href="/leads"
              className="text-xs text-blue-600 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentLeads.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-slate-400">
                No leads yet. Share your intake form to start capturing leads.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.recentLeads.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{lead.source}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          lead.status === "NEW"
                            ? "bg-blue-100 text-blue-700"
                            : lead.status === "CONTACTED"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {lead.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Upcoming Jobs</CardTitle>
            <Link
              href="/calendar"
              className="text-xs text-blue-600 hover:underline"
            >
              View calendar
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.upcomingJobs.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-slate-400">
                No upcoming jobs scheduled.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.upcomingJobs.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {job.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {job.customer.firstName} {job.customer.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-600">
                          {job.scheduledAt
                            ? new Date(job.scheduledAt).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )
                            : "Unscheduled"}
                        </p>
                        {job.price && (
                          <p className="text-xs text-slate-400">
                            {formatCurrency(job.price)}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

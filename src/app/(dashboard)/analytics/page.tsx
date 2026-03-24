import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Users, Briefcase, DollarSign } from "lucide-react";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const session = await auth();
  const orgId = session!.user.orgId;

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      label: d.toLocaleString("default", { month: "short", year: "2-digit" }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    };
  }).reverse();

  const [
    leadsBySource,
    conversionStats,
    revenueByMonth,
    topServices,
    avgTicket,
    repeatCustomers,
  ] = await Promise.all([
    db.lead.groupBy({
      by: ["source"],
      where: { orgId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    db.$queryRaw<{ total: number; converted: number }[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE "convertedToId" IS NOT NULL)::int AS converted
      FROM "Lead"
      WHERE "orgId" = ${orgId}
    `,
    Promise.all(
      months.map(async (m) => ({
        label: m.label,
        revenue: (
          await db.payment.aggregate({
            where: {
              orgId,
              status: "COMPLETED",
              paidAt: { gte: m.start, lte: m.end },
            },
            _sum: { amount: true },
          })
        )._sum.amount ?? 0,
        jobs: await db.job.count({
          where: { orgId, completedAt: { gte: m.start, lte: m.end } },
        }),
      }))
    ),
    db.invoiceItem.groupBy({
      by: ["description"],
      where: { invoice: { orgId } },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    db.invoice.aggregate({
      where: { orgId, status: "PAID" },
      _avg: { total: true },
    }),
    db.$queryRaw<{ repeat_customers: number; total_customers: number }[]>`
      SELECT
        COUNT(*) FILTER (WHERE "jobCount" > 1)::int AS repeat_customers,
        COUNT(*)::int AS total_customers
      FROM "Customer"
      WHERE "orgId" = ${orgId}
    `,
  ]);

  const conversionRate =
    conversionStats[0]?.total > 0
      ? (conversionStats[0].converted / conversionStats[0].total) * 100
      : 0;

  const repeatRate =
    repeatCustomers[0]?.total_customers > 0
      ? (repeatCustomers[0].repeat_customers / repeatCustomers[0].total_customers) * 100
      : 0;

  const maxRevenue = Math.max(...revenueByMonth.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Conversion Rate</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {conversionRate.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Lead → Customer
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-2.5">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg Ticket</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatCurrency(avgTicket._avg.total ?? 0)}
                </p>
                <p className="mt-1 text-xs text-slate-400">Per invoice</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2.5">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Repeat Customers</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {repeatRate.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {repeatCustomers[0]?.repeat_customers ?? 0} of{" "}
                  {repeatCustomers[0]?.total_customers ?? 0}
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 p-2.5">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Leads</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {conversionStats[0]?.total ?? 0}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {conversionStats[0]?.converted ?? 0} converted
                </p>
              </div>
              <div className="rounded-lg bg-orange-50 p-2.5">
                <Briefcase className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue chart (simple bar chart) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-40">
              {revenueByMonth.map((m) => (
                <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                  <p className="text-xs font-medium text-slate-600">
                    {formatCurrency(m.revenue, "USD").replace("$", "$").split(".")[0]}
                  </p>
                  <div
                    className="w-full rounded-t-md bg-blue-500 transition-all"
                    style={{ height: `${(m.revenue / maxRevenue) * 120}px`, minHeight: "4px" }}
                  />
                  <p className="text-xs text-slate-400">{m.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lead sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {leadsBySource.length === 0 ? (
              <p className="text-sm text-slate-400">No data yet.</p>
            ) : (
              <ul className="space-y-3">
                {leadsBySource.map((source) => {
                  const total = leadsBySource.reduce(
                    (sum, s) => sum + s._count.id,
                    0
                  );
                  const pct = ((source._count.id / total) * 100).toFixed(0);
                  return (
                    <li key={source.source} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">
                          {source.source.replace("_", " ")}
                        </span>
                        <span className="font-medium text-slate-900">
                          {source._count.id} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-blue-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Services by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <p className="text-sm text-slate-400">No data yet.</p>
            ) : (
              <ul className="space-y-2">
                {topServices.map((service, idx) => (
                  <li
                    key={service.description}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700">{service.description}</span>
                    </div>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(service._sum.total ?? 0)}
                    </span>
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

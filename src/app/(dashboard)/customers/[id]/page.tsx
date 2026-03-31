import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowLeft, Mail, Phone, MapPin, Plus, FileText, Briefcase } from "lucide-react";
import { DeleteButton } from "@/components/ui/delete-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.orgId) return notFound();

  const customer = await db.customer.findFirst({
    where: { id, orgId: session.user.orgId },
    include: {
      jobs: {
        orderBy: { scheduledAt: "desc" },
        take: 10,
        include: { invoices: { select: { id: true, total: true, status: true } } },
      },
      invoices: { orderBy: { createdAt: "desc" }, take: 10 },
      quotes: { orderBy: { createdAt: "desc" }, take: 5 },
      vehicles: true,
      activities: { orderBy: { createdAt: "desc" }, take: 15 },
    },
  });

  if (!customer) return notFound();

  const fullName = `${customer.firstName} ${customer.lastName}`;
  const totalSpend = (customer.invoices as Array<{ status: string; total: number }>)
    .filter((i) => i.status === "PAID")
    .reduce((sum: number, i) => sum + i.total, 0);

  const statusColors: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    PAID: "bg-green-100 text-green-700",
    SENT: "bg-blue-100 text-blue-800",
    OVERDUE: "bg-red-100 text-red-700",
    DRAFT: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="space-y-6">
      {/* Topbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/customers">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Avatar name={fullName} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{fullName}</h1>
            <p className="text-sm text-slate-500">Customer since {new Date(customer.createdAt).getFullYear()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/messages?customerId=${customer.id}`}>
            <Button variant="outline" size="sm"><Mail className="mr-1 h-4 w-4" /> Message</Button>
          </Link>
          <Link href={`/jobs/new?customerId=${customer.id}`}>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Job</Button>
          </Link>
          <DeleteButton
            apiPath={`/api/customers/${customer.id}`}
            redirectTo="/customers"
            confirmMessage={`Delete ${fullName}? All their jobs, invoices, and quotes will also be deleted. This cannot be undone.`}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column — contact info + vehicles */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {customer.email && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a>
                </div>
              )}
              {(customer.address || customer.city) && (
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    {[customer.address, customer.city, customer.state, customer.zip]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
              {customer.notes && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-slate-700">{customer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Total Spend</p>
                <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalSpend)}</p>
              </div>
              <div>
                <p className="text-slate-500">Jobs</p>
                <p className="text-lg font-semibold text-slate-900">{customer.jobs.length}</p>
              </div>
              <div>
                <p className="text-slate-500">Invoices</p>
                <p className="text-lg font-semibold text-slate-900">{customer.invoices.length}</p>
              </div>
              <div>
                <p className="text-slate-500">Quotes</p>
                <p className="text-lg font-semibold text-slate-900">{customer.quotes.length}</p>
              </div>
            </CardContent>
          </Card>

          {customer.vehicles.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Vehicles</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {customer.vehicles.map((v) => (
                  <div key={v.id} className="text-sm text-slate-700">
                    {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                    {v.plate && <span className="ml-2 text-xs text-slate-400">#{v.plate}</span>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Middle column — jobs + invoices */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Jobs</CardTitle>
              <Link href={`/jobs/new?customerId=${customer.id}`}>
                <Button variant="ghost" size="sm"><Plus className="h-4 w-4" /></Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {customer.jobs.length === 0 && <p className="text-sm text-slate-400">No jobs yet.</p>}
              {customer.jobs.map((job) => (
                <Link href={`/jobs/${job.id}`} key={job.id} className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-800">{job.title}</span>
                    </div>
                    <Badge className={statusColors[job.status] ?? "bg-slate-100 text-slate-700"}>{job.status}</Badge>
                  </div>
                  {job.scheduledAt && (
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(job.scheduledAt)}</p>
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invoices</CardTitle>
              <Link href={`/invoices/new?customerId=${customer.id}`}>
                <Button variant="ghost" size="sm"><Plus className="h-4 w-4" /></Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {customer.invoices.length === 0 && <p className="text-sm text-slate-400">No invoices yet.</p>}
              {customer.invoices.map((inv) => (
                <Link href={`/invoices/${inv.id}`} key={inv.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-800">{inv.invoiceNumber ?? inv.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatCurrency(inv.total)}</span>
                    <Badge className={statusColors[inv.status] ?? "bg-slate-100 text-slate-700"}>{inv.status}</Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column — activity */}
        <div>
          <Card>
            <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
            <CardContent>
              {customer.activities.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
              <div className="space-y-3">
                {customer.activities.map((log) => (
                  <div key={log.id} className="flex gap-2">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                    <div>
                      <p className="text-sm text-slate-800">{log.description}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

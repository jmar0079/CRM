import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Phone,
  Mail,
  ArrowLeft,
  UserCheck,
  MapPin,
  Tag,
  Clock,
} from "lucide-react";
import { formatDate, formatCurrency, timeAgo, LEAD_SOURCE_LABELS } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lead = await db.lead.findUnique({ where: { id }, select: { firstName: true, lastName: true } });
  return { title: lead ? `${lead.firstName} ${lead.lastName}` : "Lead" };
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const orgId = session!.user.orgId;

  const lead = await db.lead.findUnique({
    where: { id, orgId },
    include: {
      stage: true,
      tags: { include: { tag: true } },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
      tasks: { where: { status: "PENDING" }, orderBy: { dueAt: "asc" } },
      quotes: { orderBy: { createdAt: "desc" }, take: 5 },
      messageThreads: {
        include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { lastMessageAt: "desc" },
        take: 3,
      },
    },
  });

  if (!lead) notFound();

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/leads">
            <Button variant="ghost" size="icon" className="mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {lead.firstName} {lead.lastName}
              </h1>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  lead.status === "NEW"
                    ? "bg-blue-100 text-blue-700"
                    : lead.status === "LOST"
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {lead.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Added {timeAgo(lead.createdAt)} ·{" "}
              {LEAD_SOURCE_LABELS[lead.source] ?? lead.source}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {lead.phone && (
            <a href={`tel:${lead.phone}`}>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4" />
                Call
              </Button>
            </a>
          )}
          {!lead.convertedToId && (
            <form action={`/api/leads/${lead.id}/convert`} method="POST">
              <Button size="sm">
                <UserCheck className="h-4 w-4" />
                Convert to Customer
              </Button>
            </form>
          )}
          <DeleteButton
            apiPath={`/api/leads/${lead.id}`}
            redirectTo="/leads"
            confirmMessage={`Delete ${lead.firstName} ${lead.lastName}? This cannot be undone.`}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — contact info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <a href={`tel:${lead.phone}`} className="text-slate-700 hover:text-blue-600">
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a href={`mailto:${lead.email}`} className="text-slate-700 hover:text-blue-600">
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.serviceInterest && (
                <div className="flex items-start gap-2 text-sm">
                  <Tag className="h-4 w-4 text-slate-400 mt-0.5" />
                  <span className="text-slate-700">{lead.serviceInterest}</span>
                </div>
              )}
              {lead.estimatedValue && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">Est. Value:</span>
                  <span className="font-medium text-slate-700">
                    {formatCurrency(lead.estimatedValue)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {lead.stage && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Pipeline Stage
                </p>
                <span
                  className="inline-flex rounded-full px-3 py-1 text-sm font-medium text-white"
                  style={{ backgroundColor: lead.stage.color }}
                >
                  {lead.stage.name}
                </span>
              </CardContent>
            </Card>
          )}

          {lead.tags.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Middle column — notes + tasks */}
        <div className="space-y-4">
          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {lead.notes}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">Open Tasks</CardTitle>
              <Link
                href={`/tasks/new?leadId=${lead.id}`}
                className="text-xs text-blue-600 hover:underline"
              >
                + Add
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {lead.tasks.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-slate-400">No open tasks.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {lead.tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 px-6 py-3"
                    >
                      <Clock className="h-4 w-4 shrink-0 text-slate-300" />
                      <div>
                        <p className="text-sm text-slate-700">{task.title}</p>
                        {task.dueAt && (
                          <p className="text-xs text-slate-400">
                            Due {formatDate(task.dueAt)}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {lead.quotes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quotes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-slate-100">
                  {lead.quotes.map((quote) => (
                    <li key={quote.id}>
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="flex items-center justify-between px-6 py-3 hover:bg-slate-50"
                      >
                        <span className="text-sm text-slate-700">
                          {quote.quoteNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatCurrency(quote.total)}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              quote.status === "APPROVED"
                                ? "bg-green-100 text-green-700"
                                : quote.status === "DECLINED"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {quote.status}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — activity timeline */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {lead.activities.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-slate-400">
                  No activity yet.
                </p>
              ) : (
                <ol className="relative px-6 pb-6">
                  {lead.activities.map((activity, idx) => (
                    <li key={activity.id} className="relative pl-5 pb-4">
                      {idx < lead.activities.length - 1 && (
                        <span className="absolute left-1.5 top-2 bottom-0 w-px bg-slate-200" />
                      )}
                      <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-400" />
                      <p className="text-sm text-slate-700">
                        {activity.description}
                      </p>
                      <p className="text-xs text-slate-400">
                        {timeAgo(activity.createdAt)}
                      </p>
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

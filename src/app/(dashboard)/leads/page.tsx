import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Mail, Filter } from "lucide-react";
import { DeleteButton } from "@/components/ui/delete-button";
import { LEAD_SOURCE_LABELS } from "@/lib/utils";
type LeadSource = "WEBSITE" | "REFERRAL" | "GOOGLE" | "FACEBOOK" | "INSTAGRAM" | "YELP" | "NEXTDOOR" | "DIRECT_MAIL" | "OTHER";
type LeadStatus = "NEW" | "CONTACTED" | "QUOTE_SENT" | "SCHEDULED" | "COMPLETED" | "LOST";

export const metadata: Metadata = { title: "Leads" };

interface PageProps {
  searchParams: Promise<{
    status?: string;
    source?: string;
    search?: string;
    page?: string;
  }>;
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  QUOTE_SENT: "bg-purple-100 text-purple-700",
  SCHEDULED: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

export default async function LeadsPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const orgId = session!.user.orgId;
  const page = Number(params.page ?? 1);
  const pageSize = 25;

  const where = {
    orgId,
    isArchived: false,
    ...(params.status && { status: params.status as LeadStatus }),
    ...(params.source && { source: params.source as LeadSource }),
    ...(params.search && {
      OR: [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search } },
      ],
    }),
  };

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        stage: { select: { name: true, color: true } },
        tags: { include: { tag: true } },
      },
    }),
    db.lead.count({ where: where as never }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500">
            {total} total lead{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Link href="/leads/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 hidden md:table-cell">
                Contact
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 hidden lg:table-cell">
                Source
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 hidden xl:table-cell">
                Stage
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 hidden xl:table-cell">
                Added
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center"
                >
                  <p className="text-slate-500 font-medium">No leads yet</p>
                  <p className="text-sm text-slate-400 mt-1 mb-3">Leads appear here when someone fills out your booking form, or you can add one manually.</p>
                  <div className="flex justify-center gap-3">
                    <Link href="/leads/new" className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Add a lead</Link>
                    <Link href="/help" className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Get your booking link</Link>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600"
                    >
                      {lead.firstName} {lead.lastName}
                    </Link>
                    {lead.serviceInterest && (
                      <p className="text-xs text-slate-400">
                        {lead.serviceInterest}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-col gap-0.5">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600"
                        >
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600"
                        >
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">
                    {LEAD_SOURCE_LABELS[lead.source] ?? lead.source}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.status]}`}
                    >
                      {lead.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {lead.stage ? (
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: lead.stage.color }}
                      >
                        {lead.stage.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-xs text-slate-400">
                    {new Date(lead.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                      <DeleteButton
                        apiPath={`/api/leads/${lead.id}`}
                        redirectTo="/leads"
                        confirmMessage={`Delete ${lead.firstName} ${lead.lastName}? This cannot be undone.`}
                        variant="text"
                        label="Delete"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`?page=${page - 1}`}
                  className="rounded-md border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?page=${page + 1}`}
                  className="rounded-md border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

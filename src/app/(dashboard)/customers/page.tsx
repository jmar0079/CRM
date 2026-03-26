import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Phone, Mail } from "lucide-react";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Customers" };

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const orgId = session!.user.orgId;
  const page = Number(params.page ?? 1);
  const pageSize = 25;

  const where = {
    orgId,
    ...(params.search && {
      OR: [
        { firstName: { contains: params.search, mode: "insensitive" as const } },
        { lastName: { contains: params.search, mode: "insensitive" as const } },
        { email: { contains: params.search, mode: "insensitive" as const } },
        { phone: { contains: params.search } },
      ],
    }),
  };

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.customer.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">{total} total customers</p>
        </div>
        <Link href="/customers/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Customer
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 hidden md:table-cell">Contact</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 hidden lg:table-cell">Jobs</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 hidden lg:table-cell">Lifetime Value</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 hidden xl:table-cell">Last Job</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-slate-500 font-medium">No customers yet</p>
                  <p className="text-sm text-slate-400 mt-1 mb-3">Customers are created when you convert a lead, or you can add one manually.</p>
                  <div className="flex justify-center gap-3">
                    <Link href="/customers/new" className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Add a customer</Link>
                    <Link href="/leads" className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">View leads to convert</Link>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600"
                    >
                      {customer.firstName} {customer.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-col gap-0.5">
                      {customer.phone && (
                        <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-xs text-slate-600">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </a>
                      )}
                      {customer.email && (
                        <a href={`mailto:${customer.email}`} className="flex items-center gap-1 text-xs text-slate-400">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-slate-600">
                    {customer.jobCount}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm font-medium text-slate-700">
                    {customer.totalSpent > 0 ? formatCurrency(customer.totalSpent) : "—"}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-xs text-slate-400">
                    {customer.lastJobDate
                      ? new Date(customer.lastJobDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/customers/${customer.id}`} className="text-xs text-blue-600 hover:underline">
                        View
                      </Link>
                      <DeleteButton
                        apiPath={`/api/customers/${customer.id}`}
                        redirectTo="/customers"
                        confirmMessage={`Delete ${customer.firstName} ${customer.lastName}? This cannot be undone.`}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`?page=${page - 1}`} className="rounded-md border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={`?page=${page + 1}`} className="rounded-md border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50">
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

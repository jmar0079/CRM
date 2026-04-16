import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const session = await auth();
  const orgId = session!.user.orgId;

  const threads = await db.messageThread.findMany({
    where: { orgId },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      lead: { select: { id: true, firstName: true, lastName: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, direction: true, createdAt: true },
      },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <Link href="/messages/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Message
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-slate-500">No conversations yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {threads.map((thread) => {
              const contact = thread.customer ?? thread.lead;
              const contactName = contact
                ? `${contact.firstName} ${contact.lastName}`
                : "Unknown";
              const contactHref = thread.customer
                ? `/customers/${thread.customer.id}`
                : thread.lead
                ? `/leads/${thread.lead.id}`
                : "#";
              const lastMessage = thread.messages[0];

              return (
                <li key={thread.id}>
                  <Link
                    href={`/messages/${thread.id}`}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                      {contactName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">
                          {contactName}
                        </p>
                        {lastMessage && (
                          <p className="text-xs text-slate-400">
                            {timeAgo(lastMessage.createdAt)}
                          </p>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {lastMessage.direction === "OUTBOUND" ? "You: " : ""}
                          {lastMessage.body}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-400">
                        via {thread.channel}
                      </p>
                    </div>
                    {!thread.isResolved && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ArrowLeft, UserPlus } from "lucide-react";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = { title: "Team Members" };

export default async function TeamSettingsPage() {
  const session = await auth();
  const orgId = session!.user.orgId;

  const members = await db.user.findMany({
    where: { orgId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Team Members</h1>
        </div>
        <Button size="sm">
          <UserPlus className="mr-1.5 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{members.length} Members</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-slate-100">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name ?? member.email} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {member.name ?? "—"}
                      {member.id === session!.user.id && (
                        <span className="ml-1.5 text-xs text-slate-400">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={member.role === "OWNER" ? "default" : "secondary"}
                    className="text-xs capitalize"
                  >
                    {member.role.toLowerCase()}
                  </Badge>
                  {member.id !== session!.user.id && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Edit
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { OrgSettingsForm } from "./OrgSettingsForm";

export const metadata: Metadata = { title: "Organization Settings" };

export default async function OrganizationSettingsPage() {
  const session = await auth();
  const orgId = session!.user.orgId;

  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org) notFound();

  return <OrgSettingsForm org={org} />;
}

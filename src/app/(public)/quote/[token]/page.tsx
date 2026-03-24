import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { QuoteApprovalClient } from "./QuoteApprovalClient";

export const metadata: Metadata = { title: "Review Your Quote" };

export default async function QuoteApprovalPage({
  params,
}: {
  params: { token: string };
}) {
  const quote = await db.quote.findUnique({
    where: { approvalToken: params.token },
    include: {
      items: true,
      organization: { select: { name: true, phone: true, email: true } },
    },
  });

  if (!quote || quote.status === "EXPIRED") notFound();

  return <QuoteApprovalClient quote={quote as never} />;
}

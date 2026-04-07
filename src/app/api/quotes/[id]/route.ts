import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { generateInvoiceNumber } from "@/lib/crm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quote = await db.quote.findFirst({
    where: { id: id, orgId: session.user.orgId },
    include: {
      items: true,
      customer: true,
      lead: true,
    },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ quote });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quote = await db.quote.findFirst({
    where: { id: id, orgId: session.user.orgId },
  });
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const updated = await db.quote.update({ where: { id: id }, data: body });

    // When a quote is approved manually, auto-create an invoice if one doesn't exist yet
    if (body.status === "APPROVED") {
      const quoteWithDetails = await db.quote.findUnique({
        where: { id },
        include: {
          items: true,
          invoice: { select: { id: true } },
          lead: { select: { convertedToId: true } },
        },
      });

      const customerId = quoteWithDetails?.customerId ?? quoteWithDetails?.lead?.convertedToId ?? null;

      if (customerId && !quoteWithDetails?.invoice && quoteWithDetails) {
        const invoiceNumber = await generateInvoiceNumber(session.user.orgId);

        const newInvoice = await db.invoice.create({
          data: {
            orgId: session.user.orgId,
            customerId,
            invoiceNumber,
            quoteId: id,
            subtotal: quoteWithDetails.subtotal,
            discountAmt: quoteWithDetails.discountAmt,
            taxRate: quoteWithDetails.taxRate,
            taxAmt: quoteWithDetails.taxAmt,
            total: quoteWithDetails.total,
            amountDue: quoteWithDetails.total,
            ...(quoteWithDetails.notes ? { notes: quoteWithDetails.notes } : {}),
            items: {
              create: quoteWithDetails.items.map((item) => ({
                serviceId: item.serviceId ?? undefined,
                description: item.description,
                qty: item.qty,
                unitPrice: item.unitPrice,
                total: item.total,
                position: item.position,
              })),
            },
          },
        });

        // Mark quote as CONVERTED now that an invoice exists
        await db.quote.update({ where: { id }, data: { status: "CONVERTED" } });

        return NextResponse.json({ quote: { ...updated, status: "CONVERTED" }, invoiceId: newInvoice.id });
      }
    }

    return NextResponse.json({ quote: updated });
  } catch (err) {
    console.error("[PATCH /api/quotes/:id]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quote = await db.quote.findFirst({ where: { id: id, orgId: session.user.orgId } });
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.quote.delete({ where: { id: id } });
  return NextResponse.json({ success: true });
}

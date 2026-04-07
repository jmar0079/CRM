import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { createQuoteSchema } from "@/lib/validations";
import { generateQuoteNumber } from "@/lib/crm";
import { sendEmail, buildQuoteEmailHtml } from "@/lib/email";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.orgId;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = 25;

  const where = {
    orgId,
    ...(status ? { status: status as never } : {}),
  };

  const [quotes, total] = await Promise.all([
    db.quote.findMany({
      where,
      include: {
        items: true,
        customer: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.quote.count({ where }),
  ]);

  return NextResponse.json({ quotes, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { items, ...quoteData } = parsed.data;
    const quoteNumber = await generateQuoteNumber(session.user.orgId);
    const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
    const total = subtotal * (1 + (quoteData.taxRate ?? 0) / 100) - (quoteData.discountAmt ?? 0);

    const quote = await db.quote.create({
      data: {
        ...quoteData,
        orgId: session.user.orgId,
        quoteNumber,
        subtotal,
        total,
        items: {
          create: items.map((it) => ({
            ...it,
            total: it.qty * it.unitPrice,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    // Send email if customer has email
    const recipientEmail = quote.customer?.email;
    if (recipientEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const contactName = quote.customer
        ? `${quote.customer.firstName} ${quote.customer.lastName}`
        : "Customer";
      await sendEmail({
        to: recipientEmail,
        subject: `Quote ${quote.quoteNumber} Ready for Review`,
        html: buildQuoteEmailHtml({
          orgName: session.user.orgName,
          customerName: contactName,
          quoteNumber: quote.quoteNumber,
          total: quote.total,
          approvalUrl: `${appUrl}/quote/${quote.approvalToken ?? ""}`,
          items: quote.items.map((i) => ({
            description: i.description,
            qty: i.qty,
            unitPrice: i.unitPrice,
            total: i.total,
          })),
        }),
      }).catch(console.error); // Non-blocking
    }

    return NextResponse.json({ quote }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/quotes]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

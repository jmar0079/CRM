import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { createInvoiceSchema } from "@/lib/validations";
import { generateInvoiceNumber } from "@/lib/crm";
import { sendEmail, buildInvoiceEmailHtml } from "@/lib/email";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.orgId;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = 25;

  const where = { orgId, ...(status ? { status: status as never } : {}) };

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where,
      include: {
        items: true,
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.invoice.count({ where }),
  ]);

  return NextResponse.json({ invoices, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { items, ...invoiceData } = parsed.data;
    const invoiceNumber = await generateInvoiceNumber(session.user.orgId);
    const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
    const total = subtotal * (1 + (invoiceData.taxRate ?? 0) / 100) - (invoiceData.discountAmt ?? 0);
    const amountDue = total;

    const invoice = await db.invoice.create({
      data: {
        ...invoiceData,
        orgId: session.user.orgId,
        invoiceNumber,
        subtotal,
        total,
        amountDue,
        items: {
          create: items.map((it) => ({
            ...it,
            total: it.qty * it.unitPrice,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    // Send email non-blocking
    const recipientEmail = invoice.customer?.email;
    if (recipientEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const customerName = invoice.customer
        ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
        : "Customer";
      await sendEmail({
        to: recipientEmail,
        subject: `Invoice ${invoice.invoiceNumber} from ${session.user.orgName}`,
        html: buildInvoiceEmailHtml({
          orgName: session.user.orgName,
          customerName,
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.total,
          amountDue: invoice.amountDue,
          paymentUrl: invoice.paymentLink ?? `${appUrl}/portal`,
        }),
      }).catch(console.error);
    }

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/invoices]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

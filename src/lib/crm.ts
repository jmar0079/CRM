import { db } from "@/lib/db";
import { generateToken } from "@/lib/utils";

type ActivityType = "LEAD_CREATED" | "LEAD_UPDATED" | "LEAD_STAGE_CHANGED" | "LEAD_CONVERTED" | "CUSTOMER_CREATED" | "CUSTOMER_UPDATED" | "JOB_CREATED" | "JOB_UPDATED" | "JOB_STATUS_CHANGED" | "JOB_SCHEDULED" | "JOB_COMPLETED" | "MESSAGE_SENT" | "MESSAGE_RECEIVED" | "QUOTE_CREATED" | "QUOTE_SENT" | "QUOTE_APPROVED" | "QUOTE_DECLINED" | "INVOICE_CREATED" | "INVOICE_SENT" | "PAYMENT_RECEIVED" | "TASK_CREATED" | "TASK_COMPLETED" | "REVIEW_RECEIVED" | "NOTE_ADDED";

export async function logActivity({
  orgId,
  type,
  description,
  metadata,
  leadId,
  customerId,
  jobId,
  userId,
}: {
  orgId: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  leadId?: string;
  customerId?: string;
  jobId?: string;
  userId?: string;
}) {
  return db.activity.create({
    data: {
      orgId,
      type,
      description,
      metadata: metadata ? (metadata as never) : undefined,
      leadId,
      customerId,
      jobId,
      userId,
    },
  });
}

export async function generateQuoteNumber(orgId: string): Promise<string> {
  const count = await db.quote.count({ where: { orgId } });
  return `Q-${String(count + 1).padStart(4, "0")}`;
}

export async function generateInvoiceNumber(orgId: string): Promise<string> {
  const count = await db.invoice.count({ where: { orgId } });
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

export async function detectDuplicate(
  orgId: string,
  phone?: string,
  email?: string
): Promise<{ type: "lead" | "customer"; id: string } | null> {
  if (phone) {
    const lead = await db.lead.findFirst({
      where: { orgId, phone, isArchived: false },
      select: { id: true },
    });
    if (lead) return { type: "lead", id: lead.id };

    const customer = await db.customer.findFirst({
      where: { orgId, phone },
      select: { id: true },
    });
    if (customer) return { type: "customer", id: customer.id };
  }

  if (email) {
    const lead = await db.lead.findFirst({
      where: { orgId, email, isArchived: false },
      select: { id: true },
    });
    if (lead) return { type: "lead", id: lead.id };

    const customer = await db.customer.findFirst({
      where: { orgId, email },
      select: { id: true },
    });
    if (customer) return { type: "customer", id: customer.id };
  }

  return null;
}

export async function convertLeadToCustomer(leadId: string, orgId: string) {
  const lead = await db.lead.findUniqueOrThrow({
    where: { id: leadId, orgId },
  });

  const customer = await db.customer.create({
    data: {
      orgId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email ?? undefined,
      phone: lead.phone ?? undefined,
      notes: lead.notes ?? undefined,
      address: (lead as never as { address?: string }).address ?? undefined,
      city: (lead as never as { city?: string }).city ?? undefined,
      state: (lead as never as { state?: string }).state ?? undefined,
      zip: (lead as never as { zip?: string }).zip ?? undefined,
    },
  });

  await db.lead.update({
    where: { id: leadId },
    data: {
      convertedAt: new Date(),
      convertedToId: customer.id,
      status: "COMPLETED",
    },
  });

  await logActivity({
    orgId,
    type: "LEAD_CONVERTED",
    description: `Lead ${lead.firstName} ${lead.lastName} converted to customer`,
    leadId,
    customerId: customer.id,
  });

  // Auto-create a draft invoice, linked to any existing draft quote for this lead
  const existingQuote = await db.quote.findFirst({
    where: { leadId, orgId, status: "DRAFT" },
  });

  if (existingQuote) {
    await db.quote.update({
      where: { id: existingQuote.id },
      data: { customerId: customer.id },
    });
  }

  const invoiceNumber = await generateInvoiceNumber(orgId);
  await db.invoice.create({
    data: {
      orgId,
      customerId: customer.id,
      invoiceNumber,
      ...(existingQuote ? { quoteId: existingQuote.id } : {}),
      subtotal: existingQuote?.subtotal ?? 0,
      total: existingQuote?.total ?? 0,
      amountDue: existingQuote?.total ?? 0,
      ...(existingQuote?.notes ? { notes: existingQuote.notes } : {}),
    },
  });

  await logActivity({
    orgId,
    type: "INVOICE_CREATED",
    description: `Draft invoice ${invoiceNumber} created on lead conversion`,
    leadId,
    customerId: customer.id,
  });

  return customer;
}

export async function createAutoTasks(params: {
  orgId: string;
  trigger: "LEAD_CREATED" | "JOB_COMPLETED";
  leadId?: string;
  customerId?: string;
  jobId?: string;
}) {
  const tasks = [];

  if (params.trigger === "LEAD_CREATED") {
    tasks.push({
      orgId: params.orgId,
      title: "Contact this lead within 1 hour",
      dueAt: new Date(Date.now() + 60 * 60 * 1000),
      priority: "HIGH" as const,
      leadId: params.leadId,
      customerId: params.customerId,
      isAutomatic: true,
    });
  }

  if (params.trigger === "JOB_COMPLETED") {
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    tasks.push({
      orgId: params.orgId,
      title: "Follow up with customer",
      dueAt: threeMonths,
      priority: "MEDIUM" as const,
      customerId: params.customerId,
      jobId: params.jobId,
      isAutomatic: true,
    });
  }

  if (tasks.length > 0) {
    await db.task.createMany({ data: tasks });
  }
}

export async function createDraftQuote(
  orgId: string,
  leadId: string,
  notes?: string | null,
  serviceId?: string | null
) {
  const quoteNumber = await generateQuoteNumber(orgId);
  const approvalToken = generateToken();

  // Look up service price if a catalog service was selected
  let service: { id: string; name: string; price: number | null } | null = null;
  if (serviceId) {
    service = await db.service.findFirst({
      where: { id: serviceId, orgId },
      select: { id: true, name: true, price: true },
    });
  }

  const serviceTotal = service?.price ?? 0;

  const quote = await db.quote.create({
    data: {
      orgId,
      leadId,
      quoteNumber,
      approvalToken,
      ...(notes ? { notes } : {}),
      ...(service
        ? {
            subtotal: serviceTotal,
            total: serviceTotal,
            items: {
              create: {
                description: service.name,
                qty: 1,
                unitPrice: serviceTotal,
                total: serviceTotal,
                position: 0,
                ...(service.id ? { serviceId: service.id } : {}),
              },
            },
          }
        : {}),
    },
  });
  await logActivity({
    orgId,
    type: "QUOTE_CREATED",
    description: `Draft quote ${quoteNumber} created for lead`,
    leadId,
  });
  return quote;
}

export async function generateCustomerPortalToken(
  customerId: string
): Promise<string> {
  const token = generateToken(48);
  await db.customer.update({
    where: { id: customerId },
    data: { portalToken: token },
  });
  return token;
}

export async function generateReviewToken(customerId: string): Promise<string> {
  const token = generateToken(32);
  // The review record is created when the customer submits; token is pre-generated
  return token;
}

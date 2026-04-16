import { z } from "zod";

// ─── Auth ───────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerOrgSchema = z.object({
  orgName: z.string().min(2, "Organization name is required"),
  ownerName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ─── Lead ───────────────────────────────────────
export const createLeadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  source: z.string().optional(),
  sourceDetail: z.string().optional(),
  serviceInterest: z.string().optional(),
  notes: z.string().optional(),
  estimatedValue: z.number().positive().optional(),
  stageId: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.enum(["NEW", "CONTACTED", "QUOTE_SENT", "SCHEDULED", "COMPLETED", "LOST"]).optional(),
  stageId: z.string().nullable().optional(),
  lostReason: z.enum(["PRICE", "TIMING", "COMPETITOR", "NO_RESPONSE", "OTHER"]).nullable().optional(),
  lostNote: z.string().optional(),
  isArchived: z.boolean().optional(),
});

// ─── Customer ───────────────────────────────────
export const createCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ─── Job ────────────────────────────────────────
export const createJobSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  vehicleId: z.string().optional(),
  serviceId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELED", "NO_SHOW"]).optional(),
  stageId: z.string().optional(),
  completedAt: z.string().datetime().nullable().optional(),
});

// ─── Task ───────────────────────────────────────
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assignedToId: z.string().optional(),
  leadId: z.string().optional(),
  customerId: z.string().optional(),
  jobId: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELED"]).optional(),
});

// ─── Quote ──────────────────────────────────────
export const quoteItemSchema = z.object({
  serviceId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  qty: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

export const createQuoteSchema = z.object({
  leadId: z.string().optional(),
  customerId: z.string().optional(),
  jobId: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, "At least one item is required"),
  discountAmt: z.number().nonnegative().default(0),
  taxRate: z.number().nonnegative().max(100).default(0),
  notes: z.string().optional(),
  validUntil: z.string().datetime().optional(),
});

// ─── Invoice ────────────────────────────────────
export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  jobId: z.string().optional(),
  quoteId: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, "At least one item is required"),
  discountAmt: z.number().nonnegative().default(0),
  taxRate: z.number().nonnegative().max(100).default(0),
  notes: z.string().optional(),
  dueAt: z.string().datetime().optional(),
});

// ─── Message ────────────────────────────────────
export const sendMessageSchema = z.object({
  threadId: z.string().optional(),
  leadId: z.string().optional(),
  customerId: z.string().optional(),
  channel: z.enum(["SMS", "EMAIL", "WHATSAPP"]),
  subject: z.string().optional(),
  body: z.string().min(1, "Message is required"),
});

// ─── Service ────────────────────────────────────
export const createServiceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
  durationMinutes: z.number().int().positive().optional(),
  category: z.string().optional(),
});

// ─── Pipeline Stage ─────────────────────────────
export const createPipelineStageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional(),
  position: z.number().int().nonnegative(),
});

// ─── Public Form ────────────────────────────────
export const publicLeadFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  serviceId: z.string().optional(),      // catalog service selection
  serviceInterest: z.string().optional(), // free-text / custom
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  notes: z.string().optional(),
  colorChoice: z.string().optional(),
  orgSlug: z.string().min(1),
});

// ─── Review ─────────────────────────────────────
export const submitReviewSchema = z.object({
  token: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// ─── Org Settings ───────────────────────────────
export const updateOrgSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  timezone: z.string().optional(),
  workingHoursStart: z.string().optional(),
  workingHoursEnd: z.string().optional(),
  bufferMinutes: z.number().int().nonnegative().optional(),
  depositRequired: z.boolean().optional(),
  depositPercent: z.number().int().min(1).max(100).optional(),
  reminderHoursBefore: z.number().int().positive().optional(),
  autoReplyEnabled: z.boolean().optional(),
  autoReplyMessage: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterOrgInput = z.infer<typeof registerOrgSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type PublicLeadFormInput = z.infer<typeof publicLeadFormSchema>;
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

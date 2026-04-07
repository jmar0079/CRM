// Re-export Prisma types for use throughout the app
export type {
  Organization,
  OrgSettings,
  User,
  Lead,
  Customer,
  Vehicle,
  Job,
  Service,
  PipelineStage,
  Task,
  MessageThread,
  Message,
  MessageTemplate,
  Quote,
  QuoteItem,
  Invoice,
  InvoiceItem,
  Payment,
  Review,
  Tag,
  Activity,
  AutomationRule,
  FormSubmission,
  UserRole,
  LeadSource,
  LeadStatus,
  LostReason,
  JobStatus,
  TaskPriority,
  TaskStatus,
  Channel,
  Direction,
  MessageStatus,
  QuoteStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  ActivityType,
  AutomationTrigger,
} from "@prisma/client";

// ─── API Response types ──────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Extended types with relations ──────────────────────────────────────────

export type LeadWithRelations = import("@prisma/client").Lead & {
  stage?: import("@prisma/client").PipelineStage | null;
  tags?: Array<{ tag: import("@prisma/client").Tag }>;
  activities?: import("@prisma/client").Activity[];
};

export type CustomerWithStats = import("@prisma/client").Customer & {
  jobs?: import("@prisma/client").Job[];
  tags?: Array<{ tag: import("@prisma/client").Tag }>;
};

export type JobWithRelations = import("@prisma/client").Job & {
  customer: import("@prisma/client").Customer;
  vehicle?: import("@prisma/client").Vehicle | null;
  assignedTo?: import("@prisma/client").User | null;
  service?: import("@prisma/client").Service | null;
  stage?: import("@prisma/client").PipelineStage | null;
};

export type QuoteWithItems = import("@prisma/client").Quote & {
  items: import("@prisma/client").QuoteItem[];
  customer?: import("@prisma/client").Customer | null;
  lead?: import("@prisma/client").Lead | null;
};

export type InvoiceWithItems = import("@prisma/client").Invoice & {
  items: import("@prisma/client").InvoiceItem[];
  customer: import("@prisma/client").Customer;
  payments: import("@prisma/client").Payment[];
};

export type ThreadWithMessages = import("@prisma/client").MessageThread & {
  messages: import("@prisma/client").Message[];
  customer?: import("@prisma/client").Customer | null;
  lead?: import("@prisma/client").Lead | null;
};

// ─── Dashboard / Analytics types ────────────────────────────────────────────

export interface DashboardStats {
  totalLeads: number;
  newLeadsThisWeek: number;
  totalCustomers: number;
  activeJobs: number;
  jobsThisWeek: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  pendingTasks: number;
  overdueInvoices: number;
  averageTicket: number;
  conversionRate: number;
}

export interface PipelineColumn {
  stage: import("@prisma/client").PipelineStage;
  leads: LeadWithRelations[];
  count: number;
  totalValue: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  color: string;
  status: string;
  customerId: string;
  customerName: string;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  jobs: number;
}

export interface LeadSourceBreakdown {
  source: string;
  count: number;
  revenue: number;
  conversionRate: number;
}

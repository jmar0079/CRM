-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "primaryColor" TEXT DEFAULT '#2563eb',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripeAccountId" TEXT,
    "twilioPhoneNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OrgSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "workingHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '17:00',
    "workingDays" JSONB NOT NULL DEFAULT [1,2,3,4,5],
    "bufferMinutes" INTEGER NOT NULL DEFAULT 15,
    "cancellationPolicy" TEXT,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "depositPercent" INTEGER NOT NULL DEFAULT 25,
    "reminderHoursBefore" INTEGER NOT NULL DEFAULT 24,
    "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoReplyMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrgSettings_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "passwordHash" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT NOT NULL DEFAULT 'OTHER',
    "sourceDetail" TEXT,
    "serviceInterest" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "stageId" TEXT,
    "estimatedValue" REAL,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "convertedAt" DATETIME,
    "convertedToId" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "lostReason" TEXT,
    "lostNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lead_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_convertedToId_fkey" FOREIGN KEY ("convertedToId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalSpent" REAL NOT NULL DEFAULT 0,
    "jobCount" INTEGER NOT NULL DEFAULT 0,
    "lastJobDate" DATETIME,
    "nextFollowUp" DATETIME,
    "portalToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "year" TEXT,
    "make" TEXT,
    "model" TEXT,
    "color" TEXT,
    "plate" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "position" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "autoSendType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PipelineStage_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "stageId" TEXT,
    "assignedToId" TEXT,
    "serviceId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "lat" REAL,
    "lng" REAL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" DATETIME,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "canceledAt" DATETIME,
    "estimatedMinutes" INTEGER,
    "price" REAL,
    "notes" TEXT,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Job_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL,
    "durationMinutes" INTEGER,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Service_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedToId" TEXT,
    "leadId" TEXT,
    "customerId" TEXT,
    "jobId" TEXT,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT,
    "jobId" TEXT,
    "subject" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'SMS',
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MessageThread_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageThread_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MessageThread_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MessageThread_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "channel" TEXT NOT NULL DEFAULT 'SMS',
    "body" TEXT NOT NULL,
    "externalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'SMS',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT [],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT,
    "jobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" REAL NOT NULL DEFAULT 0,
    "discountAmt" REAL NOT NULL DEFAULT 0,
    "taxRate" REAL NOT NULL DEFAULT 0,
    "taxAmt" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "validUntil" DATETIME,
    "approvalToken" TEXT,
    "approvedAt" DATETIME,
    "declinedAt" DATETIME,
    "declineNote" TEXT,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quote_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "serviceId" TEXT,
    "description" TEXT NOT NULL,
    "qty" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL,
    "total" REAL NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "jobId" TEXT,
    "quoteId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "subtotal" REAL NOT NULL DEFAULT 0,
    "discountAmt" REAL NOT NULL DEFAULT 0,
    "taxRate" REAL NOT NULL DEFAULT 0,
    "taxAmt" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "amountDue" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "dueAt" DATETIME,
    "paidAt" DATETIME,
    "stripeInvoiceId" TEXT,
    "paymentLink" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "serviceId" TEXT,
    "description" TEXT NOT NULL,
    "qty" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL,
    "total" REAL NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvoiceItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" REAL NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'CARD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripePaymentId" TEXT,
    "stripeRefundId" TEXT,
    "notes" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "jobId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "reviewToken" TEXT,
    "pushedToGoogle" BOOLEAN NOT NULL DEFAULT false,
    "pushedToYelp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LeadTag" (
    "leadId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("leadId", "tagId"),
    CONSTRAINT "LeadTag_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeadTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerTag" (
    "customerId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("customerId", "tagId"),
    CONSTRAINT "CustomerTag_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "leadId" TEXT,
    "customerId" TEXT,
    "jobId" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Activity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Activity_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT {},
    "actions" JSONB NOT NULL DEFAULT [],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AutomationRule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "leadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrgSettings_orgId_key" ON "OrgSettings"("orgId");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_orgId_key" ON "User"("email", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Lead_orgId_idx" ON "Lead"("orgId");

-- CreateIndex
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_stageId_idx" ON "Lead"("stageId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_portalToken_key" ON "Customer"("portalToken");

-- CreateIndex
CREATE INDEX "Customer_orgId_idx" ON "Customer"("orgId");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "PipelineStage_orgId_position_idx" ON "PipelineStage"("orgId", "position");

-- CreateIndex
CREATE INDEX "Job_orgId_idx" ON "Job"("orgId");

-- CreateIndex
CREATE INDEX "Job_customerId_idx" ON "Job"("customerId");

-- CreateIndex
CREATE INDEX "Job_scheduledAt_idx" ON "Job"("scheduledAt");

-- CreateIndex
CREATE INDEX "Job_assignedToId_idx" ON "Job"("assignedToId");

-- CreateIndex
CREATE INDEX "Service_orgId_idx" ON "Service"("orgId");

-- CreateIndex
CREATE INDEX "Task_orgId_idx" ON "Task"("orgId");

-- CreateIndex
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");

-- CreateIndex
CREATE INDEX "Task_dueAt_idx" ON "Task"("dueAt");

-- CreateIndex
CREATE INDEX "MessageThread_orgId_idx" ON "MessageThread"("orgId");

-- CreateIndex
CREATE INDEX "MessageThread_customerId_idx" ON "MessageThread"("customerId");

-- CreateIndex
CREATE INDEX "MessageThread_leadId_idx" ON "MessageThread"("leadId");

-- CreateIndex
CREATE INDEX "Message_threadId_idx" ON "Message"("threadId");

-- CreateIndex
CREATE INDEX "MessageTemplate_orgId_idx" ON "MessageTemplate"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_approvalToken_key" ON "Quote"("approvalToken");

-- CreateIndex
CREATE INDEX "Quote_orgId_idx" ON "Quote"("orgId");

-- CreateIndex
CREATE INDEX "Quote_approvalToken_idx" ON "Quote"("approvalToken");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_quoteId_key" ON "Invoice"("quoteId");

-- CreateIndex
CREATE INDEX "Invoice_orgId_idx" ON "Invoice"("orgId");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Payment_orgId_idx" ON "Payment"("orgId");

-- CreateIndex
CREATE INDEX "Payment_customerId_idx" ON "Payment"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_reviewToken_key" ON "Review"("reviewToken");

-- CreateIndex
CREATE INDEX "Review_orgId_idx" ON "Review"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_orgId_name_key" ON "Tag"("orgId", "name");

-- CreateIndex
CREATE INDEX "Activity_orgId_idx" ON "Activity"("orgId");

-- CreateIndex
CREATE INDEX "Activity_leadId_idx" ON "Activity"("leadId");

-- CreateIndex
CREATE INDEX "Activity_customerId_idx" ON "Activity"("customerId");

-- CreateIndex
CREATE INDEX "Activity_jobId_idx" ON "Activity"("jobId");

-- CreateIndex
CREATE INDEX "AutomationRule_orgId_idx" ON "AutomationRule"("orgId");

-- CreateIndex
CREATE INDEX "FormSubmission_orgId_idx" ON "FormSubmission"("orgId");

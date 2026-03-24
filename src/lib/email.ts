import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<string> {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo,
  });

  if (error) throw new Error(error.message);
  return data!.id;
}

export function buildQuoteEmailHtml(params: {
  orgName: string;
  customerName: string;
  quoteNumber: string;
  total: number;
  approvalUrl: string;
  items: Array<{ description: string; qty: number; unitPrice: number; total: number }>;
}): string {
  const itemRows = params.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${item.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">${item.qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">$${item.total.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#1e293b;">${params.orgName}</h2>
      <p>Hi ${params.customerName},</p>
      <p>Please review your quote #${params.quoteNumber} below.</p>
      
      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 12px;text-align:left;">Service</th>
            <th style="padding:10px 12px;text-align:center;">Qty</th>
            <th style="padding:10px 12px;text-align:right;">Unit Price</th>
            <th style="padding:10px 12px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:12px;text-align:right;font-weight:600;">Total:</td>
            <td style="padding:12px;text-align:right;font-weight:700;color:#2563eb;">$${params.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="text-align:center;margin:32px 0;">
        <a href="${params.approvalUrl}"
           style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
          Approve Quote
        </a>
      </div>
      <p style="color:#64748b;font-size:14px;">This link will expire in 7 days.</p>
    </div>
  `;
}

export function buildInvoiceEmailHtml(params: {
  orgName: string;
  customerName: string;
  invoiceNumber: string;
  total: number;
  amountDue: number;
  paymentUrl: string;
  dueDate?: string;
}): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#1e293b;">${params.orgName}</h2>
      <p>Hi ${params.customerName},</p>
      <p>Your invoice #${params.invoiceNumber} is ready.</p>
      
      <div style="background:#f8fafc;padding:20px;border-radius:8px;margin:24px 0;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span>Invoice Total:</span>
          <strong>$${params.total.toFixed(2)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;color:#2563eb;">
          <span>Amount Due:</span>
          <strong>$${params.amountDue.toFixed(2)}</strong>
        </div>
        ${params.dueDate ? `<div style="margin-top:8px;color:#64748b;font-size:14px;">Due: ${params.dueDate}</div>` : ""}
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="${params.paymentUrl}"
           style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
          Pay Now
        </a>
      </div>
    </div>
  `;
}

export function buildReminderEmailHtml(params: {
  orgName: string;
  customerName: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  address?: string;
}): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#1e293b;">${params.orgName}</h2>
      <p>Hi ${params.customerName},</p>
      <p>This is a reminder for your upcoming appointment:</p>
      
      <div style="background:#f8fafc;padding:20px;border-radius:8px;margin:24px 0;">
        <div style="margin-bottom:8px;"><strong>Service:</strong> ${params.serviceName}</div>
        <div style="margin-bottom:8px;"><strong>Date:</strong> ${params.scheduledDate}</div>
        <div style="margin-bottom:8px;"><strong>Time:</strong> ${params.scheduledTime}</div>
        ${params.address ? `<div><strong>Location:</strong> ${params.address}</div>` : ""}
      </div>

      <p>See you then! If you need to reschedule, please contact us as soon as possible.</p>
    </div>
  `;
}

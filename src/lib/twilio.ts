import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSMS(to: string, body: string): Promise<string> {
  const message = await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
    body,
  });
  return message.sid;
}

export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] ?? `{{${key}}}`;
  });
}

export function validateWebhookSignature(
  body: string,
  signature: string,
  url: string
): boolean {
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    {}
  );
}

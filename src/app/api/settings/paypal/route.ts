import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import bcrypt from "bcryptjs";

// GET /api/settings/paypal — return non-sensitive status for the current org
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.orgId;

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: {
      paypalEnabled: true,
      paypalMode: true,
      paypalClientId: true,
      paypalPin: true,
    },
  });

  return NextResponse.json({
    enabled: org?.paypalEnabled ?? false,
    mode: org?.paypalMode ?? "SANDBOX",
    hasClientId: !!org?.paypalClientId,
    hasPin: !!org?.paypalPin,
    // Last 6 chars of client ID so the user can confirm which account is set
    clientIdHint: org?.paypalClientId
      ? `...${org.paypalClientId.slice(-6)}`
      : null,
  });
}

// POST /api/settings/paypal — save credentials (first-time setup or PIN-authenticated update)
// Body: { pin, clientId, clientSecret, mode }
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.orgId;

  const body = await req.json() as {
    pin?: string;
    clientId?: string;
    clientSecret?: string;
    mode?: string;
  };

  const { pin, clientId, clientSecret, mode } = body;

  // Validate PIN format
  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be exactly 4 digits." }, { status: 400 });
  }
  if (!clientId?.trim()) {
    return NextResponse.json({ error: "Client ID is required." }, { status: 400 });
  }
  if (!clientSecret?.trim()) {
    return NextResponse.json({ error: "Client Secret is required." }, { status: 400 });
  }

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { paypalPin: true },
  });

  // If a PIN already exists, verify the submitted PIN matches
  if (org?.paypalPin) {
    const valid = await bcrypt.compare(pin, org.paypalPin);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 403 });
    }
  }

  // Hash the PIN and encrypt the secret
  const hashedPin = await bcrypt.hash(pin, 12);
  const encryptedSecret = encrypt(clientSecret.trim());

  await db.organization.update({
    where: { id: orgId },
    data: {
      paypalClientId: clientId.trim(),
      paypalClientSecret: encryptedSecret,
      paypalMode: mode === "LIVE" ? "LIVE" : "SANDBOX",
      paypalPin: hashedPin,
      paypalEnabled: true,
    },
  });

  return NextResponse.json({ success: true });
}

// PUT /api/settings/paypal — verify PIN and return the masked credentials for display
// Body: { pin }
export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.orgId;

  const body = await req.json() as { pin?: string };
  const { pin } = body;

  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4 digits." }, { status: 400 });
  }

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { paypalPin: true, paypalClientId: true, paypalMode: true },
  });

  if (!org?.paypalPin) {
    return NextResponse.json({ error: "No PIN set." }, { status: 404 });
  }

  const valid = await bcrypt.compare(pin, org.paypalPin);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 403 });
  }

  // Return the client ID (never the secret) so the user can confirm it
  return NextResponse.json({
    verified: true,
    clientId: org.paypalClientId,
    mode: org.paypalMode,
  });
}

// DELETE /api/settings/paypal — disable PayPal (requires PIN)
// Body: { pin }
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.orgId;

  const body = await req.json() as { pin?: string };
  const { pin } = body;

  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4 digits." }, { status: 400 });
  }

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { paypalPin: true },
  });

  if (org?.paypalPin) {
    const valid = await bcrypt.compare(pin, org.paypalPin);
    if (!valid) return NextResponse.json({ error: "Incorrect PIN." }, { status: 403 });
  }

  await db.organization.update({
    where: { id: orgId },
    data: {
      paypalEnabled: false,
      paypalClientId: null,
      paypalClientSecret: null,
      paypalPin: null,
    },
  });

  return NextResponse.json({ success: true });
}

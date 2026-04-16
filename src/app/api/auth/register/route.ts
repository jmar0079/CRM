import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { registerOrgSchema } from "@/lib/validations";
import { slugify, generateToken } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { orgName, ownerName, email, password } = parsed.data;

    const existing = await db.user.findFirst({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const baseSlug = slugify(orgName);
    // Ensure slug uniqueness
    const orgCount = await db.organization.count({ where: { slug: { startsWith: baseSlug } } });
    const slug = orgCount === 0 ? baseSlug : `${baseSlug}-${orgCount}`;

    const org = await db.organization.create({
      data: {
        name: orgName,
        slug,
        users: {
          create: {
            name: ownerName,
            email,
            passwordHash: hashedPassword,
            role: "OWNER",
          },
        },
        settings: { create: {} },
      },
    });

    return NextResponse.json({ orgId: org.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

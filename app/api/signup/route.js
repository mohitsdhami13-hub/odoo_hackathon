import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  // role is intentionally hardcoded — never read from the request body.
  // This is what enforces "no self-assigned admin roles."
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: "EMPLOYEE",
    },
  });

  return NextResponse.json(
    { id: user.id, email: user.email, role: user.role },
    { status: 201 }
  );
}
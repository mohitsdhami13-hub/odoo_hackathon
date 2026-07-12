import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const departmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  headId: z.string().optional(),
});

export async function GET(req) {
  const activeOnly = req.nextUrl.searchParams.get("active") === "true";
  const departments = await prisma.department.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    include: { head: { select: { id: true, name: true, email: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ data: departments });
}

export async function POST(req) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = departmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.department.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return NextResponse.json({ error: "A department with this name already exists" }, { status: 409 });
  }

  const department = await prisma.department.create({ data: parsed.data });
  return NextResponse.json({ data: department }, { status: 201 });
}
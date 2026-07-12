import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const READ_ROLES = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"];
const WRITE_ROLES = ["ADMIN"];

const createSchema = z.object({
  name: z.string().min(2).max(100),
  headId: z.string().cuid().optional().nullable(),
});

export async function GET(req) {
  const session = await auth();
  if (!session || !READ_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const activeOnly = searchParams.get("active") === "true";

  const departments = await prisma.department.findMany({
    where: activeOnly ? { isActive: true } : {},
    select: {
      id: true,
      name: true,
      isActive: true,
      createdAt: true,
      head: { select: { id: true, name: true } },
      _count: { select: { employees: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: departments });
}

export async function POST(req) {
  const session = await auth();
  if (!session || !WRITE_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const department = await prisma.department.create({
    data: {
      name: parsed.data.name,
      headId: parsed.data.headId ?? null,
    },
  });

  return NextResponse.json({ data: department }, { status: 201 });
}
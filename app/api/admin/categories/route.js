import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

export async function GET() {
  const categories = await prisma.assetCategory.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ data: categories });
}

export async function POST(req) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.assetCategory.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });
  }

  const category = await prisma.assetCategory.create({ data: parsed.data });
  return NextResponse.json({ data: category }, { status: 201 });
}
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.assetCategory.findUnique({ where: { name: parsed.data.name } });
  if (existing && existing.id !== id) {
    return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
  }

  const updated = await prisma.assetCategory.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const inUse = await prisma.asset.count({ where: { categoryId: id } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${inUse} asset(s) still use this category` },
      { status: 409 }
    );
  }

  await prisma.assetCategory.delete({ where: { id } });
  return NextResponse.json({ data: { id } });
}
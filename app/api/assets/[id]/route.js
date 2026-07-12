import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { assetUpdateSchema } from "@/lib/validations/asset";

const WRITE_ROLES = ["ADMIN", "ASSET_MANAGER"];

export async function GET(req, { params }) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      allocations: {
        orderBy: { allocatedAt: "desc" },
        include: {
          employee: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.json({ data: asset });
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !WRITE_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = assetUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.categoryId) {
    const category = await prisma.assetCategory.findUnique({ where: { id: parsed.data.categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
  }

  const { serialNumber, condition, location, ...rest } = parsed.data;

  const updated = await prisma.asset.update({
    where: { id },
    data: {
      ...rest,
      ...(serialNumber !== undefined ? { serialNumber: serialNumber || null } : {}),
      ...(condition !== undefined ? { condition: condition || null } : {}),
      ...(location !== undefined ? { location: location || null } : {}),
    },
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ data: updated });
}
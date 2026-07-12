import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { assetSchema } from "@/lib/validations/asset";

const WRITE_ROLES = ["ADMIN", "ASSET_MANAGER"];

async function generateAssetTag(tx) {
  const last = await tx.asset.findFirst({
    where: { assetTag: { startsWith: "AF-" } },
    orderBy: { assetTag: "desc" },
  });
  const lastNum = last ? parseInt(last.assetTag.split("-")[1], 10) || 0 : 0;
  return `AF-${String(lastNum + 1).padStart(4, "0")}`;
}

export async function GET(req) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const categoryId = searchParams.get("category");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const assets = await prisma.asset.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { assetTag: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      category: { select: { id: true, name: true } },
      allocations: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          employee: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          allocatedAt: true,
          expectedReturnDate: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: assets });
}

export async function POST(req) {
  const session = await auth();
  if (!session || !WRITE_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = assetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const category = await prisma.assetCategory.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const { serialNumber, condition, location, ...rest } = parsed.data;

  // assetTag = highest existing tag + 1. Under concurrent creates this can
  // theoretically collide (read-committed isolation doesn't lock the read);
  // the @unique constraint on assetTag catches that instead of silently
  // duplicating, so we retry once on conflict. Fine for a single-admin demo —
  // a real deployment would use a DB sequence instead.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const asset = await prisma.$transaction(async (tx) => {
        const assetTag = await generateAssetTag(tx);
        const newAsset = await tx.asset.create({
          data: {
            ...rest,
            assetTag,
            serialNumber: serialNumber || null,
            condition: condition || null,
            location: location || null,
          },
          include: { category: { select: { id: true, name: true } } },
        });

        await tx.activityLog.create({
          data: {
            action: 'ASSET_REGISTERED',
            assetId: newAsset.id,
            userId: session.user.id,
            details: `Registered new asset: ${newAsset.name}`
          }
        });

        return newAsset;
      });
      return NextResponse.json({ data: asset }, { status: 201 });
    } catch (err) {
      if (err.code === "P2002" && attempt < 2) continue;
      throw err;
    }
  }
}
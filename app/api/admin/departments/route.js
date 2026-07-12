import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  headId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { headId } = parsed.data;

  // Assigning a head: validate the user, and sync role + department so
  // "head of X" and "role: DEPARTMENT_HEAD" don't drift apart.
  if (headId) {
    const headUser = await prisma.user.findUnique({ where: { id: headId } });
    if (!headUser) {
      return NextResponse.json({ error: "Selected head not found" }, { status: 404 });
    }
    if (headUser.role === "ADMIN") {
      return NextResponse.json(
        { error: "An admin can't be set as a department head" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const department = await tx.department.update({
      where: { id: params.id },
      data: parsed.data,
    });

    if (headId) {
      await tx.user.update({
        where: { id: headId },
        data: { role: "DEPARTMENT_HEAD", departmentId: department.id },
      });
    }

    return department;
  });

  return NextResponse.json({ data: updated });
}
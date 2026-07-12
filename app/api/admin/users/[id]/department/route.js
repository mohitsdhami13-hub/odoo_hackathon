import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const assignDepartmentSchema = z.object({
  departmentId: z.string().nullable(),
});

export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = assignDepartmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (targetUser.role === "ADMIN") {
    return NextResponse.json({ error: "Admins aren't assigned to a department" }, { status: 400 });
  }

  if (parsed.data.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: parsed.data.departmentId } });
    if (!dept) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { departmentId: parsed.data.departmentId },
    select: { id: true, name: true, email: true, role: true, departmentId: true },
  });

  return NextResponse.json({ data: updated });
}
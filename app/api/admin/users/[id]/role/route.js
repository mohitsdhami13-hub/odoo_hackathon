import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

// Only these are assignable through this endpoint — ADMIN is never
// grantable via the API, closing off privilege-escalation entirely.
const roleSchema = z.object({
  role: z.enum(["EMPLOYEE", "DEPARTMENT_HEAD", "ASSET_MANAGER"]),
  departmentId: z.string().optional(),
});

export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent an admin from accidentally demoting themselves via this route
  if (targetUser.id === session.user.id) {
    return NextResponse.json(
      { error: "Cannot change your own role through this endpoint" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      role: parsed.data.role,
      ...(parsed.data.departmentId ? { departmentId: parsed.data.departmentId } : {}),
    },
  });

  return NextResponse.json({
    data: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
  });
}
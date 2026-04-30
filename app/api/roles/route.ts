import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { roleService } from "@/modules/role/role.service";
import { roleSchema } from "@/modules/role/role.validation";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("role.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const data = await roleService.getRoles();
  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (request: Request) => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("role.create")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const validated = roleSchema.parse(body);
  await roleService.addRole(validated);
  return NextResponse.json({ message: "Role berhasil ditambahkan" });
});

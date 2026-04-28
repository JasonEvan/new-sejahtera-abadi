import { withErrorHandler } from "@/lib/withErrorHandler";
import { roleService } from "@/modules/role/role.service";
import { roleSchema } from "@/modules/role/role.validation";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const data = await roleService.getRoles();
  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const validated = roleSchema.parse(body);
  await roleService.addRole(validated);
  return NextResponse.json({ message: "Role berhasil ditambahkan" });
});

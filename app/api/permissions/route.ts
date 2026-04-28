import { withErrorHandler } from "@/lib/withErrorHandler";
import { roleService } from "@/modules/role/role.service";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const data = await roleService.getAllPermissions();
  return NextResponse.json({ data });
});

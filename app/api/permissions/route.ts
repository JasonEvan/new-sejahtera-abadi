import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { roleService } from "@/modules/role/role.service";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(async () => {
  const session = await getSession();

  if (!session || !session.permissions?.includes("permission.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const data = await roleService.getAllPermissions();
  return NextResponse.json({ data });
});

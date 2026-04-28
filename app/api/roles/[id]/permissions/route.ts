import { withErrorHandler } from "@/lib/withErrorHandler";
import { roleService } from "@/modules/role/role.service";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const data = await roleService.getRolePermissions(id);
    return NextResponse.json({ data });
  },
);

export const PUT = withErrorHandler(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();
    const { permissionIds } = body;
    await roleService.updateRolePermissions(id, permissionIds);
    return NextResponse.json({
      message: "Permission role berhasil diperbarui",
    });
  },
);

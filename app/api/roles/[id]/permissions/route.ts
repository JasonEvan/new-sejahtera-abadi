import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { roleService } from "@/modules/role/role.service";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const session = await getSession();

    if (!session || !session.permissions?.includes("role.view")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const data = await roleService.getRolePermissions(id);
    return NextResponse.json({ data });
  },
);

export const PUT = withErrorHandler(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getSession();

    if (!session || !session.permissions?.includes("role.update")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

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

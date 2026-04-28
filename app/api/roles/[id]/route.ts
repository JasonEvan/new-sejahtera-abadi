import { withErrorHandler } from "@/lib/withErrorHandler";
import { roleService } from "@/modules/role/role.service";
import { roleSchema } from "@/modules/role/role.validation";
import { NextResponse } from "next/server";

export const PUT = withErrorHandler(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = await request.json();
    const validated = roleSchema.parse(body);
    await roleService.updateRole(Number(id), validated);
    return NextResponse.json({ message: "Role berhasil diperbarui" });
  },
);

export const DELETE = withErrorHandler(
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    await roleService.deleteRole(Number(id));
    return NextResponse.json({ message: "Role berhasil dihapus" });
  },
);

import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { userService } from "@/modules/user/user.service";
import { userSchema } from "@/modules/user/user.validation";
import { InsertUser } from "@/modules/user/user.types";
import { NextRequest, NextResponse } from "next/server";

export const PUT = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const session = await getSession();

    if (!session || !session.permissions?.includes("user.update")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedBody = validate(body, userSchema);

    await userService.updateUser(
      Number(id),
      validatedBody as unknown as InsertUser,
    );
    return NextResponse.json({ message: "User berhasil diperbarui" });
  },
);

export const DELETE = withErrorHandler(
  async (_: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getSession();

    if (!session || !session.permissions?.includes("user.delete")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await userService.deleteUser(Number(id));
    return NextResponse.json({ message: "User berhasil dihapus" });
  },
);

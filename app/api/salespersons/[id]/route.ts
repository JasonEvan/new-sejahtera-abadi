import { getSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { salespersonService } from "@/modules/salesperson/salesperson.service";
import { editSalespersonValidation } from "@/modules/salesperson/salesperson.validation";
import { NextRequest, NextResponse } from "next/server";

export const PUT = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const salespersonId = (await params).id;
    if (isNaN(Number(salespersonId))) {
      throw new AppError("ID salesman tidak valid", 400);
    }

    const session = await getSession();
    if (!session || !session.permissions?.includes("salesman.update")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedBody = validate(body, editSalespersonValidation);

    await salespersonService.updateSalesperson(
      Number(salespersonId),
      validatedBody,
    );
    return NextResponse.json({ message: "Salesman berhasil diperbarui" });
  },
);

export const DELETE = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const salespersonId = (await params).id;
    if (isNaN(Number(salespersonId))) {
      throw new AppError("ID salesman tidak valid", 400);
    }

    const session = await getSession();
    if (!session || !session.permissions?.includes("salesman.delete")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await salespersonService.deleteSalesperson(Number(salespersonId));
    return NextResponse.json({ message: "Salesman berhasil dihapus" });
  },
);

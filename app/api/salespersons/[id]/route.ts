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

    const body = await request.json();
    const validatedBody = validate(body, editSalespersonValidation);

    await salespersonService.updateSalesperson(
      Number(salespersonId),
      validatedBody,
    );
    return NextResponse.json({ message: "Salesman berhasil diperbarui" });
  },
);

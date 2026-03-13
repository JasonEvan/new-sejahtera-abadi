import { withErrorHandler } from "@/lib/withErrorHandler";
import { validate } from "@/lib/zod";
import { salesReturnService } from "@/modules/sales-return/sales-return.service";
import { backendSaleReturnValidation } from "@/modules/sales-return/sales-return.validation";
import { NextRequest, NextResponse } from "next/server";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validatedBody = validate(body, backendSaleReturnValidation);

  await salesReturnService.createSalesReturn(validatedBody);

  return NextResponse.json(
    { message: "Sale return created successfully" },
    { status: 201 },
  );
});
